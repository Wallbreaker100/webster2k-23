import React from 'react';
import Navbar from './../components/homecomponents/Navbar.js';
import Description from '../components/homecomponents/Description.js';
import { useAuth0 } from "@auth0/auth0-react";
import Mainpage from '../components/homecomponents/Mainpage.js';

const Home = () => {
  const {isAuthenticated } = useAuth0();
  
  return (
    <>
      <Navbar/> 
      {
        isAuthenticated?<Mainpage/>:<Description/>
      }
    </>
  )
}

export default React.memo(Home);