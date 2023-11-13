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

const Whiteboard = () => {
    const {isAuthenticated,user} = useAuth0();
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
    //iniitialising socket using useeffect
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
    }, []);

    //copying to clipboard code
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
                <button className="btn copyBtn" onClick={copyRoomId}>
                    Copy ROOM ID
                </button>
                <button className="btn leaveBtn" onClick={leaveRoom}>
                    Leave
                </button>
            </div>
            <div class="leftaside">
                <Drawingboard socketRef={socketRef} roomId={roomId} name={name}/>
            </div>           
            
        </div>
    );
};

export default React.memo(Whiteboard);
