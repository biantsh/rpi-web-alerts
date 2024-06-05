import { useState } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const AlertPage = () => {
  const location = useLocation();
  const [connected, setConnected] = useState(false);
  const socket = io();

  socket.emit('watch-room', location.state.deviceSn);

  socket.on('device-paired', isPaired => {
    setConnected(isPaired);
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
