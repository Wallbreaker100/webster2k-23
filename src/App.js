import './App.css';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Room from './pages/Room.js';
import Whiteboard from './pages/Whiteboard.js';
import Home from './pages/Home.js';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <div>
        <Toaster position="top-middle" toastOptions={
          
          {success:{
            style: {
              display:'flex',
              alignItems:'center',
              justifyContent:'center',
              padding: '16px',
            },
            theme:{
              primary:"hsl(0, 0%, 78%)",
            }
          }}
        }>
        </Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/room" element={<Room/>}></Route>
          <Route path="/room/:roomId" element={<Whiteboard/>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
