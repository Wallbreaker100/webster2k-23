import React from 'react';
import Avatar from 'react-avatar';


//client avatar component
const Client = ({ username ,points}) => {
    return (
        <div className="client">
            <Avatar name={username} size={50} round="14px" />
            <span className="userName">{username}</span>
            <span>{points}</span>
        </div>
    );
};

export default Client;
