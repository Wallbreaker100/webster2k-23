import React from 'react';
import Avatar from 'react-avatar';


//client avatar component
const Client = ({key, username ,points}) => {
    return (
        <div value={key} className="client">
            <Avatar name={username} size={50} round="14px" />
            <span className="userName">{username}</span>
            <span>{points}</span>
        </div>
    );
};

export default Client;
