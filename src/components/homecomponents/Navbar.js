import React from 'react'
import './../../css/navbar.css'
import logo from './../../images/scribble.png'
import { useAuth0 } from "@auth0/auth0-react"


//html code for navbar
const Navbar = () => {

  //using auth0 feature for shwoing logout button on authentication
  const { logout,isAuthenticated } = useAuth0();
  
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
          {
            isAuthenticated && <button className="logoutbtn" onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}>Log Out</button>
          }
        </div>
      </div>
    </>
  )
}

export default Navbar;