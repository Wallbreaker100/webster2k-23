import React from 'react'
import './../../css/navbar.css'
import logo from './../../images/scribble.png'

const Navbar = () => {
  return (
    <>
      <div className='outernav'>
        <div className='innerdiv1'>
          <img className="logoimg" src={logo}></img>
          <h3>PICASSO</h3>
        </div>
        <div className='innerdiv2'> 
          <a href="/mainpage">Home</a>
          <a>Play</a>
          <a>Create</a>
        </div>
      </div>
    </>
  )
}

export default Navbar;