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
// app.use(express.static('build'));
// app.use((req, res, next) => {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

const userDetail=require("./models/userDetail.js");
const gameHistory=require("./models/gameHistory.js");
const favouriteImages=require("./models/favouriteImages.js");


//creating map for socektid's and their cooresponding username--------------------------------------------------------------

const userSocketMap = {};

//using routes for handling post and get requests-----------------------------------------------------




//function to get all connected clients in a particular room-----------------------------------------------
function getAllConnectedClients(roomId) {
    // Map
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => {
            return {
                socketId,
                username: userSocketMap[socketId],
            };
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
        userSocketMap[socket.id] = username;
        socket.join(roomId);
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


    //making socket fucntion for chat section------------------------------------------------------------------
    
    socket.on("sendchat",({roomId,Chatval,name})=>{
        // console.log("sending");
        const clients = getAllConnectedClients(roomId);
        clients.forEach(({ socketId }) => {
            io.to(socketId).emit("sentchat", {
                name:name,
                chat:Chatval,
            });
        });
    })

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
