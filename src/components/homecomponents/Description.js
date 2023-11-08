import React from 'react'
import './../../css/navbar.css'

const Description = () => {
  return (
    <div className='outerdesdiv'>
      <div className='innerdesdiv'>
        <div className='innerdesdiv1'>
          <h1>Draw Your <span>Imagination,</span><br/>Guess the <span>Creation!</span></h1>
          <p>"Picasso is a fun and creative drawing and guessing game that challenges players to communicate without words."</p>
          <button>LOG IN</button>
        </div>
        <div className='innerdesdiv2'>
          <img className="desimg" src="https://app.svgator.com/assets/svgator.webapp/log-in-girl.svg"/>
        </div>
      </div>
    </div>
  )
}

export default Description