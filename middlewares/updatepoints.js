const usermodel=require("./../models/userDetail");
const gameHistory=require("./../models/gameHistory");


var date = new Date(); 


async function updatepoints(socketId,rank){
    // console.log("upate: "+socketId+" "+rank);
    var res=await usermodel.findOne({socketId:socketId});
    var useremail=res.email;
    var add=0;
    if(rank==1){
        add=10;
    }
    else if(rank==2){
        add=7;
    }
    else if(rank==3){
        add=5;
    }
    else{
        add=-5;
    }
    const find=await gameHistory.find({email:useremail});
    if(find.length==0){
        try{
            var totalmatch=1;
            var first=(rank==1);
            var second=(rank==2);
            var third=(rank==3);
            var totalpoints=add;
            if(totalpoints<0) totalpoints=0;
            var level=totalpoints/10;
            var pastmatches=[{
                date:date.getDate(),
                hour:date.getHours(),
                min:date.getMinutes(),
                add}
            ];
            const data=new gameHistory({
                email:useremail,
                totalMatch:totalmatch,
                first:first,
                second:second,
                third:third,
                totalpoints:totalpoints,
                level:level,
                pastmatches:pastmatches
            })
            data.save();

        }
        catch(e){
            console.log("error at storing points on first time"+ e);
        }
    }
    else{
        try{
            var totalmatch=res.totalmatch+1;
            var first=res.first+(rank==1);
            var second=res.second+(rank==2);
            var third=res.third+(rank==3);
            var totalpoints=res.totalpoints+add;
            if(totalpoints<0) totalpoints=0;
            var level=totalpoints/10;
            var matchdata=[{
                date:date.getDate(),
                hour:date.getHours(),
                min:date.getMinutes(),
                add}
            ];
            var pastmatches=res.pastmatches.push(matchdata);
            const data=new gameHistory({
                email:useremail,
                totalMatch:totalmatch,
                first:first,
                second:second,
                third:third,
                totalpoints:totalpoints,
                level:level,
                pastmatches:pastmatches
            })
            data.save();
        }
        catch(e){
            console.log("error at storing points after first time"+ e);
        }
    }
}

module.exports=updatepoints;