require("dotenv").config();

const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const ACTIONS = require('./src/Actions');
const bodyParser = require('body-parser');
const server = http.createServer(app);
const io = new Server(server);
const cors = require('cors');

//setting cors error-------------------------------------------------------------------------------------------------------
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    optionsSuccessStatus: 204,
};
  
app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(bodyParser.json({ extended: true }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

//including data models---------------------------------------------------------------------------------------------------
const userDetail=require("./models/userDetail.js");
const gameHistory=require("./models/gameHistory.js");
const favouriteImages=require("./models/favouriteImages.js");


//creating map for socektid's and their cooresponding data--------------------------------------------------------------

const userSocketMap = {};
const numberofroundsMap={};
var wordMap={};
var gameStarted={};
var drawerselectedforroom={};
var currentroundscoresMap={};
var timerMap={};
var countdownMap={};
var ctMap={};
//using routes for handling post and get requests-----------------------------------------------------




//function to get all connected clients in a particular room-----------------------------------------------
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username:userSocketMap[socketId][0],
                points:userSocketMap[socketId][1],
            };
        }
    );
}

function getdataforcurrentround(roomId){
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            if(currentroundscoresMap[socketId]!=null){
                return {
                    socketId,
                    roundpoints:currentroundscoresMap[socketId],
                    username:userSocketMap[socketId][0]
                };
            }
            else{
                return {
                    socketId,
                    roundpoints:0,
                    username:userSocketMap[socketId][0]
                };
            }
            
        }
    );
}

//post request to return that the person is the presenter or not--------------------------------------------
app.post("/findRooms",async (req,res)=>{
    try{
        const roomId=req.body.roomId;
        const clients=getAllConnectedClients(roomId);
        var ishost=1;
        if(clients.length >=1){
            ishost=0;
        }
        return (res.status(200).json({success:true,ishost:ishost}));
    }
    catch(e){
        console.log("error at findrooms post request: "+e);
        return res.status(400).json({success:true});
    }
    
    // return (res.json({req}));
});



//establishing socket connection for backend--------------------------------------------------------------

io.on('connection', (socket) => {
    console.log('socket connected', socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
        var timer;
        timerMap[roomId]=timer;
        userSocketMap[socket.id] = [username,0];
        socket.join(roomId);
        wordMap[roomId]=["",""];
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit(ACTIONS.JOINED, {
                clients,
                username,
                socketId: socket.id,
            });
        });
        // console.log(clients);
    });
    

    // mouse move socket request -----------------------------------------------------------------------------
    socket.on("whiteboardData", ({canvasImage,roomId}) => {
        let imgUrl = canvasImage;
        // console.log("updated image->")
        socket.broadcast.to(roomId).emit("whiteBoardDataResponse", {
          imgUrl,
        });
    });

    //game logic begins----------------------------------------------------------------------------------------

    socket.on("choosedrawer",({roomId})=>{
        console.log("choosing");
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        ctMap[roomId]=0;
        const clients= getAllConnectedClients(roomId);
        if(clients.length==0) return;
        var rand=Math.floor((Math.random() * clients.length) + 1);
        var chosensocketid=clients[rand-1].socketId;
        var drawername=userSocketMap[chosensocketid];
        drawerselectedforroom[roomId]=chosensocketid;
        gameStarted[roomId]=1;
        
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("drawerchosen",{
                chosensocketid,
                socketId,
                drawername,
            });
        });
        countdownMap[roomId]=21;
        starchoosingtime(roomId,chosensocketid);
        
        
        // console.log(drawername);
    })

    async function starchoosingtime(roomId,chosensocketid){
        console.log("choose time called");
        countdownMap[roomId]=20;
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        timerMap[roomId]=setInterval(()=>{
            console.log("countdown: "+countdownMap[roomId]);
            if(countdownMap[roomId]<=0){
                clearInterval(timerMap[roomId]);
                var timer;
                timerMap[roomId]=timer;
                return;
            }
            countdownMap[roomId]= countdownMap[roomId]-1
            io.to(chosensocketid).emit("showtimetochooser",{
                countdown:countdownMap[roomId],
                chosensocketid,
            })
        },1000);
        return () => clearInterval(timerMap[roomId])
    }
    //word chosen by drawer is coming from client sidde--------------------------------------------------------

    socket.on("storeChosenWordInBackend",({roomId,word,mysocketid})=>{
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        if(word==null) return;
        wordMap[roomId]=[word,mysocketid];
        const clients=getAllConnectedClients(roomId);
        var coded="";
        for(let i=0;i<word.length;i++){
            coded=coded+"*  ";
        }
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("wordchosenChanges",{
                word,
                mysocketid,
                coded,
                socketId
            });
        });
        countdownMap[roomId]=60;
        startguesstime(roomId,wordMap[roomId][1],roomId,clients);
    })

    async function startguesstime(roomId,chosensocketid,roomId,clients){
        console.log("startguess time called");
        timerMap[roomId]=setInterval(()=>{
            console.log("Guesscountdown: "+countdownMap[roomId]);
            if(countdownMap[roomId]<=0){
                countdownMap[roomId]=10;
                clearInterval(timerMap[roomId]);
                var timer;
                timerMap[roomId]=timer;
                return;
            }
            countdownMap[roomId]=countdownMap[roomId]-1;
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit("showtimetoguessers",{
                    countdown:countdownMap[roomId],
                    chosensocketid,
                    socketId
                });
            });
            
        },1000);
        return () => clearInterval(timerMap[roomId])
    }

    //making socket fucntion for chat section------------------------------------------------------------------
    
    socket.on("sendchat",({roomId,Chatval,name,mysocketid,gtime})=>{
        // console.log("sending");
        
        var isguesscorrect=0;
        if(gameStarted[roomId]){
            if(Chatval.toLowerCase()==wordMap[roomId][0] && mysocketid==drawerselectedforroom[roomId]) return;
            if(Chatval.toLowerCase()==wordMap[roomId][0]){
                isguesscorrect=1;
                userSocketMap[drawerselectedforroom[roomId]][1]+=5;
                if(currentroundscoresMap[drawerselectedforroom[roomId]]==null) currentroundscoresMap[drawerselectedforroom[roomId]]=5;
                else currentroundscoresMap[drawerselectedforroom[roomId]]+=5;
                
                userSocketMap[mysocketid][1]+=gtime;
                if(currentroundscoresMap[mysocketid]==null) currentroundscoresMap[mysocketid]=gtime;
                else currentroundscoresMap[mysocketid]=gtime;
            }
            else currentroundscoresMap[mysocketid]=0;
        }
        const clients = getAllConnectedClients(roomId);
        console.log(Chatval+" "+wordMap[roomId]);
        // console.log("isguess: "+isguesscorrect);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("sentchat", {
                name:name,
                chat:Chatval,
                isguesscorrect,
                mysocketid,
                socketId,
                clients
            });
        });
        
    });

    

    //next round socket request-------------------------------------------------------------------------

    socket.on("endround",({roomId,mysocketid,countdown})=>{
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        console.log("ending the round "+roomId+" "+mysocketid+" "+countdown);

        gameStarted[roomId]=0;
        const clients = getAllConnectedClients(roomId);
        const rounddata=getdataforcurrentround(roomId);
        if(numberofroundsMap[roomId]==null) numberofroundsMap[roomId]=1;
        else numberofroundsMap[roomId]++;
        if(wordMap[roomId][0]==null || wordMap[roomId][1]==null) return;
        var word=wordMap[roomId][0];
        var drawersocket=wordMap[roomId][1];
        console.log("current round: "+numberofroundsMap[roomId]);
        // console.log("round: "+rounddata[mysocketid]);
        if(numberofroundsMap[roomId]>=3){
            clearInterval(timerMap[roomId]);
            console.log("game ended");
            // clients.forEach(({ socketId }) => {
            //     io.to(socketId).emit("endgame", {
                    
            //     });
            // });
            return;
        }
        else{
            if(numberofroundsMap[roomId]>=3) return;
            countdownMap[roomId]=20;
            startresulttime(roomId,drawersocket,clients);
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit("movetonextround", {
                    socketId,
                    rounddata,
                    word,
                });
            });
            delete currentroundscoresMap;
        }
        
        
    });
    // socket.off("endround");

    function startresulttime(roomId,drawersocket,clients){
        // clients.forEach(({ socketId }) => {
        //     io.to(socketId).emit("stopres", {
        //         roomId,
        //         drawersocket,
        //         socketId
        //     });
        // });
        clearInterval(timerMap[roomId]);
        var timer=0;
        timerMap[roomId]=timer;
        timer=setTimeout(()=>{
            console.log("result time running+ "+timerMap[roomId]);
            console.log(ctMap[roomId]);
            if(ctMap[roomId]>0){
                console.log("dont show");
                clearTimeout(timerMap[roomId]);
                cleartimer(roomId);
                var timer;
                timerMap[roomId]=timer;
                return;
            }
            console.log("stopping result time");
            ctMap[roomId]=1;
            console.log("about to release");
            clients.forEach(({ socketId }) => {
                io.to(socketId).emit("stopres", {
                    roomId,
                    drawersocket,
                    socketId
                });
            });
        },3000);
        return () => clearInterval(timerMap[roomId])
    }

    async function cleartimer(roomId){
        console.log("timer removing");
        clearTimeout(timerMap[roomId]);
    }

    socket.on('disconnecting', () => {
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
