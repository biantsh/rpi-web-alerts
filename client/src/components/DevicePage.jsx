import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const DevicePage = () => {
  const location = useLocation();
  const socket = io();
  
  socket.emit('join-room', location.state.deviceSn);

  return (
    <button id='alertButton'>Send Alert</button>
  );
};

export default DevicePage;
