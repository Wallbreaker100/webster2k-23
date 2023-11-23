const livegames=require("./../models/currentlivegames.js");


async function gameNotStartedThusDeletingRoom(roomId){
    console.log("deleting room without playing");
    try{
        const res=await livegames.findOne({roomId:roomId});
        var mem=res.members;
        if(res==null) return;
        if(res.members==1){
            var deleteroom=await livegames.deleteOne({roomId:roomId});
        }
        else var updatemembers =await livegames.findOneAndUpdate({roomId:roomId},{
            members:mem-1,
        });
        
    }
    catch(e){
        console.log("error at gameNotStartedThusDeletingRoom "+e);
    }
    
}

module.exports=gameNotStartedThusDeletingRoom;

