import './App.css';
import { BrowserRouter,Routes,Route } from 'react-router-dom';
import Home from './pages/Home.js';
import Whiteboard from './pages/Whiteboard.js';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <div>
        <Toaster position="top-right" toastOptions={
          {success:{
            theme:{
              primary:"#4aed88",
            }
          }}
        }>
        </Toaster>
      </div>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home/>}></Route>
          <Route path="/room/:roomId" element={<Whiteboard/>}></Route>
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
