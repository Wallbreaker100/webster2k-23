import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import ACTIONS from '../Actions';
import Client from '../components/Client';
import { initSocket } from '../socket';
import Drawingboard from '../components/Drawingboard';
import logo from "./../images/scribble.png"
import { useAuth0 } from "@auth0/auth0-react";

import {
    useLocation,
    useNavigate,
    Navigate,
    useParams,
} from 'react-router-dom';


//list of words--------------------------------------------------------------------------------------
const words=[
    "apple",
    "basketball",
    "candle",
    "dolphin",
    "envelope",
    "fireworks",
    "giraffe",
    "hamburger",
    "island",
    "jigsaw",
    "kangaroo",
    "lighthouse",
    "magnet",
    "notebook",
    "octopus",
    "penguin",
    "quilt",
    "robot",
    "sailboat",
    "tiger",
    "umbrella",
    "violin",
    "watermelon",
    "xylophone",
    "yoga",
    "zeppelin",
    "astronaut",
    "butterfly",
    "compass",
    "diamond",
    "eagle",
    "flamingo",
    "globe",
    "hockey",
    "igloo",
    "jellyfish",
    "koala",
    "lemonade",
    "mermaid",
    "ninja",
    "puzzle",
    "rhinoceros",
    "spaceship",
    "tornado",
    "unicorn",
    "volcano",
    "waffle",
    "xylograph",
    "yacht",
    "zebra"
      
]




const Whiteboard = () => {
    const {isAuthenticated,user} = useAuth0();
    const [Chatval,setChatval]=useState("");
    const [Chathistory,setChathistory]=useState([]);
    const [gamestarted,setgamestarted]=useState(0);
    const [isDrawer,setisDrawer]=useState(0);
    const [chosenwords,setchosenwords]=useState([]);
    const [shouldishow,setshouldishow]=useState(0);
    const [drawer,setdrawer]=useState("sarthak");
    const [mysocketid,setmysocketid]=useState(0);

    const reactNavigator = useNavigate();
    if(isAuthenticated!=true){
        reactNavigator('/');
    }
    const socketRef = useRef(null);
    const location = useLocation();
    const { roomId } = useParams();
    // const reactNavigator = useNavigate();
    const [clients, setClients] = useState([]);
    const name=location.state?.username;
    const isHost=location.state.isHost;
    // console.log("am i the host "+isHost);
    //initilising timer for game-----------------------------------------------------------------------------

    var choosewordTimer=10;
    var gameTimer=30;

    //iniitialising socket using useeffect----------------------------------------------------------------------
    useEffect(() => {
        const init = async () => {
            socketRef.current = await initSocket();
            socketRef.current.on('connect_error', (err) => handleErrors(err));
            socketRef.current.on('connect_failed', (err) => handleErrors(err));
            

            //handling errors
            function handleErrors(e) {
                console.log('socket error', e);
                toast.error('Socket connection failed, try again later.');
                reactNavigator('/');
            }
            
            //joining socket
            socketRef.current.emit(ACTIONS.JOIN, {
                roomId,
                username: location.state?.username,
            });

            // Listening for joined event
            socketRef.current.on(
                ACTIONS.JOINED,
                ({ clients, username, socketId }) => {
                    if (username !== location.state?.username) {
                        toast.success(`${username} joined the room.`);
                        console.log(`${username} joined`);
                    }
                    setClients(clients);
                }
            );

            //handling sentchat response coming from backend
            // socketRef.current.on("sentchat",(payload)=>{
            //     console.log("chat recievd");
            //     console.log(payload.name +" "+payload.chat);
            //     console.log("the history is "+Chathistory);
            //     setChathistory([...Chathistory,payload]);
            // });

            // Listening for disconnected
            socketRef.current.on(
                ACTIONS.DISCONNECTED,
                ({ socketId, username }) => {
                    toast.success(`${username} left the room.`);
                    setClients((prev) => {
                        return prev.filter(
                            (client) => client.socketId !== socketId
                        );
                    });
                }
            );
            
        };
        init();
        return () => {
            //disconnecting events of socket
            socketRef.current.disconnect();
            socketRef.current.off(ACTIONS.JOINED);
            socketRef.current.off(ACTIONS.DISCONNECTED);
        };
    },[]);

    useEffect(()=>{
        if(socketRef.current==null) return;
        socketRef.current.on("sentchat",(payload)=>{
            console.log(payload.name +" "+payload.chat);
            setChathistory([...Chathistory,payload]);
        })
    },[Chathistory,socketRef.current]);

    //copying to clipboard code--------------------------------------------------------------------------
    async function copyRoomId() {
        try {
            console.log(roomId);
            await navigator.clipboard.writeText(roomId);
            toast.success('Room ID has been copied to your clipboard');
        } catch (err) {
            toast.error('Could not copy the Room ID');
            console.error(err);
        }
    }

    //handling change in input box------------------------------------------------------

    async function inputchange(e){
        let val=e.target.value;
        setChatval(val);
        console.log(Chatval);
    }

    //sending chat button function---------------------------------------------------------
    
    async function sendChatFunc(){
        if(Chatval=="") return;
        console.log("sendchat clicked");
        console.log(socketRef.current);
        socketRef.current.emit("sendchat",{
            roomId,
            Chatval,
            name,
        });
        setChatval("");
    };


    //start game function for host----------------------------------------------------------------

    async function chooseDrawer(){
        setgamestarted(1);
        socketRef.current.emit("choosedrawer",{
            roomId,
        });
    }

    useEffect(()=>{
        if(socketRef.current==null) return;
        socketRef.current.on("drawerchosen",({chosensocketid,socketId,drawername})=>{
            if(chosensocketid==socketId){
                var rand1=Math.floor(Math.random() *10);
                var rand2=10+Math.floor(Math.random() *10);
                var rand3=20+Math.floor(Math.random() *10);
                console.log("the word is: "+words[rand1]);
                setisDrawer(1);
                setshouldishow(1);
                setchosenwords([rand1,rand2,rand3]);
            }
            else setshouldishow(1);
            setdrawer(drawername);
            setmysocketid(socketId);
            // console.log("drawer: "+drawername);
        })
        
    },[socketRef.current,drawer,isDrawer,mysocketid])
    
    //function called when the drawer chooses the word he has to draw

    async function wordSelected(){
        
    }
    

    //leaving room button 
    function leaveRoom() {
        reactNavigator('/');
    }

    if (!location.state) {
        return <Navigate to="/" />;
    }

    //html code for drawing board
    return (
        <div className="mainWrap">
            {
                isDrawer && shouldishow ? <div className='choosewordmaindiv'>
                    <p>Choose The Word:</p>
                    <div className='chooseworddiv'>
                        <button onClick={wordSelected} value={words[chosenwords[0]]} className='wordsbtn'>{words[chosenwords[0]]}</button>
                        <button onClick={wordSelected} value={words[chosenwords[1]]} className='wordsbtn'>{words[chosenwords[1]]}</button>
                        <button onClick={wordSelected} value={words[chosenwords[2]]} className='wordsbtn'>{words[chosenwords[2]]}</button>
                    </div>
                </div>:
                <div></div>
            }

            {
                !isDrawer && shouldishow ? <div className='whoisdrawingdiv'><p>{drawer} is choosing the word!!</p></div>:<div></div>
            }


            <div className="aside">
                <div className="asideInner">
                    <div className="logo">
                        <img
                            className="logoImage"
                            src={logo}
                            alt="logo"
                        />
                        <h2>Picasso</h2>
                    </div>
                    <h3>Connected</h3>
                    <div className="clientsList">
                        {clients.map((client) => (
                            <Client
                                key={client.socketId}
                                username={client.username}
                            />
                        ))}
                    </div>
                </div>
                {
                    isHost && !gamestarted ?(<button onClick={chooseDrawer} className='start_game_btn'>Start Game</button>):(<div></div>)
                }
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div className="leftaside">
                <Drawingboard socketRef={socketRef} roomId={roomId} name={name} isDrawer={isDrawer}/>
            </div>

            <div className='chat-div'>
                <h3 className='chatheading'>Chat Box</h3>
                <div className='chat_topdiv'>
                    {/* <Chat chatval={Chathistory}/> */}
                    {Chathistory.map((payload,index)=>{
                        return(
                            <>
                                {
                                    index%2 ? (<div className='onechatdiv'>
                                        <div className='chatusernamediv'>
                                            <p className='chatusername'>{payload.name}:  </p>
                                        </div>
                                        <div className='chatmsgdiv'>
                                            <p className="chatmsg" key={index}>{payload.chat}</p>
                                        </div>
                                    
                                    </div>):
                                    (<div className='onechatdiv1'>
                                        <div className='chatusernamediv'>
                                            <p className='chatusername'>{payload.name}:  </p>
                                        </div>
                                        <div className='chatmsgdiv'>
                                            <p className="chatmsg" key={index}>{payload.chat}</p>
                                        </div>
                                    
                                    </div>)
                                }
                                
                            </>
                        )
                    })}
                </div>  
                <div className='chat_bottomdiv'>
                    <input value={Chatval}  name="chat" onChange={inputchange} placeholder="Chat/Guess" className='inputchat'></input>
                    <button onClick={sendChatFunc} className='sendchat'>send</button>
                </div>
            </div>
                     
        </div>
    );
};

export default React.memo(Whiteboard);
