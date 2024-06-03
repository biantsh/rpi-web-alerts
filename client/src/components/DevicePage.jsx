import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const DevicePage = () => {
  const location = useLocation();
  const socket = io('http://localhost:3001', { transports: ['websocket'] });
  
  socket.emit('join-room', location.state.deviceSn);


  return (
    <button>Send Alert</button>
  );
};

export default DevicePage;
