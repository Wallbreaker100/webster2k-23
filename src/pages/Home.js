import React from 'react';
import Navbar from './../components/homecomponents/Navbar.js';
import Description from '../components/homecomponents/Description.js';

const Home = () => {
  return (
    <>
      <Navbar/> 
      <Description/>
    </>
  )
}

export default React.memo(Home);