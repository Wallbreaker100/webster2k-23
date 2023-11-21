import React from 'react';

//client avatar component
const Friend = ({name}) => {
    return (
        <div className="friend_div">
            <div>
                <p>{name}</p>
            </div>
            <button>Remove</button>
        </div>
    );
};

export default Friend;
