import React,{useState} from 'react';
import './../../css/carousel.css'
import {FaAngleRight,FaAngleLeft} from "react-icons/fa6";
//main page to be shown after authentication
const Mainpage = () => {
  const [ct,setct]=useState(0);

  //slider data for changing states
  const arr=[
    {
      headingData:"Play With ",
      headingspan:"Randoms!",
      "paragraphData":"Doodle, guess, and compete with strangers globally in Picasso's 'Play with Randoms' feature for endless artistic fun!",
      "imageurl":require("./../../images/play_with_randoms_3.png"),
      buttonData:"Play Now"
    },
    {
      headingData:"Play With ",
      headingspan:"Friends!",
      paragraphData:"Sketch and guess alongside your friends in real-time challenges using Picasso's Play with Friends feature, making every match an art-filled adventure!",
      "imageurl":require("./../../images/play_with_friends_1.png"),
      buttonData:"Play Now"
    },
    {
      headingData:"Create Your Own ",
      headingspan:"Lobby!",
      paragraphData:"Take the lead and create your artistic showdowns by hosting personalized games with friends through Picasso's 'Host Your Own Game' feature, setting the canvas for creative fun!",
      "imageurl":require("./../../images/create_your_game_1.png"),
      buttonData:"Create Now"
    },
  ];


  //slide for outer slider div
  const background_image_styles={
    width:"100vw",
    height:"100%",
    backgroundImage:`url(${arr[ct].imageurl})`,
    backgroundSize:"cover",
  }

  const gotonext=()=>{
    if(ct==2){
      setct(0);
    }
    else setct(ct+1);
  }
  const gotoprev=()=>{
    if(ct==0){
      setct(2);
    }
    else setct(ct-1);
  }

  return (
    <>
      <div className='slider_div'>
        <div onClick={gotoprev} className='left'><FaAngleLeft/></div>
        <div onClick={gotonext} className='right'><FaAngleRight/></div>
        <div  style={background_image_styles} className='mainpage_outerdiv'>
          <div  className='mainpage_innerdiv1'>
            <div className='mainpage_innerdiv11'>
              <h1>{arr[ct].headingData}<span>{arr[ct].headingspan}</span></h1>
              <p>{arr[ct].paragraphData}</p>
              <button className='loginbtn'>{arr[ct].buttonData}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Mainpage;