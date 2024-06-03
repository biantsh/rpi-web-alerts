import { useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const AlertPage = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(false);
  const socket = io('http://localhost:3001', { transports: ['websocket'] });

  socket.emit('watch-room', location.state.deviceSn);

  socket.on('user-count-change', function (userCount) {
    if (userCount > 0) {
      setConnected(true);
    } else {
      setConnected(false);
    }
  });

  if (connected) {
    return (
      <>
        <h1>Alert Page</h1>
        <p>Monitoring for alerts...</p>
      </>
    );
  } else {
    return (
      <>
        <h1>Alert Page</h1>
        <p>No device has been detected...</p>
      </>
    );
  }
};

export default AlertPage;
