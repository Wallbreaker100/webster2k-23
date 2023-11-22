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
var Filter = require('bad-words'),
filter = new Filter();

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
const livegames=require("./models/currentlivegames.js");

//creating map for socektid's and their cooresponding data--------------------------------------------------------------

const userSocketMap = {};
const numberofroundsMap={};
var wordMap={};
var codedMap={};
var gameStarted={};
var drawerselectedforroom={};
var currentroundscoresMap={};
var timerMap={};
var countdownMap={};
var ctMap={};
var flagcountMap={};
//using routes for handling post and get requests-----------------------------------------------------

const storeuser=require("./routes/storeuser");
const offline=require("./routes/offline");
const findfriends=require("./routes/findfriends")
const storesocketid=require("./middlewares/storesocketid.js");
const storeGameinDb=require("./middlewares/storeGameinDb.js");
const deleteLiveGames=require("./middlewares/deleteLiveGames.js");
const updatepoints=require("./middlewares/updatepoints");
const checkBeforeCreatingRoom=require("./routes/checkBeforeCreatingRoom");
const checkBeforeJoiningRoom=require("./routes/checkBeforeJoiningRoom");
//using the routes created-----------------------------------------------------------------
app.use(storeuser);
app.use(offline);
app.use(findfriends);
app.use(checkBeforeCreatingRoom);
app.use(checkBeforeJoiningRoom);
//function to get all connected clients in a particular room-----------------------------------------------
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                points:userSocketMap[socketId][1],
                socketId,
                username:userSocketMap[socketId][0],
            };
        }
    );
}

//function to get data for current ongoing round---------------------------------------------------------------
function getdataforcurrentround(roomId){
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            if(currentroundscoresMap[socketId]!=null){
                return {
                    roundpoints:currentroundscoresMap[socketId],
                    socketId,
                    username:userSocketMap[socketId][0]
                };
            }
            else{
                return {
                    roundpoints:0,
                    socketId,
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
    
    socket.on(ACTIONS.JOIN, ({ roomId, username,email,Private }) => {
        console.log("private: ",Private);
        storeGameinDb(roomId,Private);
        storesocketid(socket.id,email);
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
        var drawername=userSocketMap[chosensocketid][0];
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

    //function for choosing the word--------------------------------------------------------------
    async function starchoosingtime(roomId,chosensocketid){
        // console.log("choose time called");
        countdownMap[roomId]=20;
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        timerMap[roomId]=setInterval(()=>{
            // console.log("countdown: "+countdownMap[roomId]);
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
    //word chosen by drawer is coming from client side--------------------------------------------------------

    socket.on("storeChosenWordInBackend",({roomId,word,mysocketid})=>{
        // console.log("choosing without click");
        clearInterval(timerMap[roomId]);
        var timer;
        timerMap[roomId]=timer;
        if(word==null){
            // console.log("stuck");
            return;
        }
        wordMap[roomId]=[word,mysocketid];
        const clients=getAllConnectedClients(roomId);
        var coded="";
        for(let i=0;i<word.length;i++){
            coded=coded+"__   ";
        }
        
        
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("wordchosenChanges",{
                word,
                mysocketid,
                coded,
                socketId
            });
        });

        //this is the time given to guesser--------------------------------------------------------
        countdownMap[roomId]=60;
        startguesstime(roomId,wordMap[roomId][1],roomId,clients);
    })

    //function to start guess time to guess the chosen word-------------------------------------------------
    async function startguesstime(roomId,chosensocketid,roomId,clients){
        console.log("startguess time called");
        timerMap[roomId]=setInterval(()=>{
            // console.log("Guesscountdown: "+countdownMap[roomId]);
            if(countdownMap[roomId]<=0){
                countdownMap[roomId]=10;
                clearInterval(timerMap[roomId]);
                var timer;
                timerMap[roomId]=timer;
                return;
            }
            countdownMap[roomId]=countdownMap[roomId]-1;
            if(countdownMap[roomId]>=30 && countdownMap[roomId]<=50){
                clients.forEach(({ socketId }) => {
                    io.to(socketId).emit("showtimetoguessers",{
                        countdown:countdownMap[roomId],
                        chosensocketid,
                        socketId,
                    });
                });
            }
            else{
                clients.forEach(({ socketId }) => {
                    io.to(socketId).emit("showtimetoguessers",{
                        countdown:countdownMap[roomId],
                        chosensocketid,
                        socketId,
                        codeWord:codedMap[2]
                    });
                });
            }
            
            
        },1000);
        return () => clearInterval(timerMap[roomId])
    }

    //making socket fucntion for chat section------------------------------------------------------------------
    
    socket.on("sendchat",({roomId,Chatval,name,mysocketid,gtime})=>{
        // console.log("sending");
        var filteredword=filter.clean(Chatval);
        if(filteredword!=Chatval){
            if(flagcountMap[mysocketid]==null){
                flagcountMap[mysocketid]=1;
            }
            else flagcountMap[mysocketid]++;
            io.to(mysocketid).emit("warning",{
                roomId,
                ct:flagcountMap[mysocketid]
            })
            return;
        }
        if(flagcountMap[mysocketid]>=3){
            return;
        }
        var isguesscorrect=0;
        if(gameStarted[roomId]){
            if(Chatval.toLowerCase()==wordMap[roomId][0] && mysocketid==drawerselectedforroom[roomId]) return;
            if(Chatval.toLowerCase()==wordMap[roomId][0] && currentroundscoresMap[mysocketid]!=null) return;
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
        // console.log(Chatval+" "+wordMap[roomId]);
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
        deleteLiveGames(roomId);
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
        if(numberofroundsMap[roomId]>=1){
            clearInterval(timerMap[roomId]);
            
            console.log("end round emit function called (round ended)");
            var rank=1;
            clients.forEach(({ socketId }) => {
                updatepoints(socketId,rank,userSocketMap[socketId][1]);
                io.to(socketId).emit("showfinalres", {
                    clients,
                    roomId,
                    socketId
                });
                // console.log("server: "+socketId);
                
                rank++;
            });
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

    //function to start showing result time after the end of round-----------------------------------------------------

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
                // console.log("dont show");
                clearTimeout(timerMap[roomId]);
                cleartimer(roomId);
                var timer;
                timerMap[roomId]=timer;
                return;
            }
            // console.log("stopping result time");
            ctMap[roomId]=1;
            // console.log("about to release");
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
        // console.log("timer removing");
        clearTimeout(timerMap[roomId]);
    }


    //moving the mouse pointer----------------------------------------------------------------------------------------
    socket.on("showpointertoothers",({roomId,clientX,clientY,name})=>{
        socket.broadcast.to(roomId).emit("movingpointer", {
            roomId,
            clientX,
            clientY,
            name
        });
    })

    socket.on('disconnecting', () => {
        userDetail.updateOne({socketId:socket.id},{
            $set:{
                isOnline:"no",
            }
        });
        const rooms = [...socket.rooms];
        rooms.forEach((roomId) => {
            socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
                socketId: socket.id,
                username: userSocketMap[socket.id],
            });
        });
        delete userSocketMap[socket.id];
        delete flagcountMap[socket.id];
        socket.leave();
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
