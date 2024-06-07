import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

import Alert from "./Alert";

const AlertPage = () => {
  const [paired, setPaired] = useState(false);
  const [filters, setFilters] = useState({
    person: false, 
    bike: false, 
    car: false, 
    numSelected: 1
  });
  const [alertActivated, setAlertActivated] = useState(false);

  const latestFilters = useRef(filters);
  const location = useLocation();
  const socket = io();
  var peerConnection = null;

  let timeoutId;

  useEffect(() => {
    latestFilters.current = filters
  }, [filters]);

  useEffect(() => {
    socket.emit('pair-user', location.state.deviceSn);
  }, []);

  socket.on('pair-device', isPaired => {
    setPaired(isPaired);
    
    if (isPaired && !peerConnection) {
      peerConnection = new RTCPeerConnection({
        sdpSemantics: 'unified-plan',
        iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }]
      });

      peerConnection.addEventListener('track', event => {
        document.getElementById('video').srcObject = event.streams[0];;
      });

      negotiateRTC();
    }
  });

  socket.on('ai-detections', detections => {
    const person = latestFilters.current.person;
    const bike = latestFilters.current.bike;
    const car = latestFilters.current.car;
    const numSelected = latestFilters.current.numSelected

    if ((person && detections.person >= numSelected) 
      || (bike && detections.bike >= numSelected)
      || (car && detections.car >= numSelected)) {
      activateAlert();
    }
  });

  socket.on('rtcAnswer', answer => {
    peerConnection.setRemoteDescription(answer);
  });

  const togglePerson = () => {
    setFilters({ ...filters, person: !filters.person });
  }

  const toggleBike = () => {
    setFilters({ ...filters, bike: !filters.bike })
  }

  const toggleCar = () => {
    setFilters({ ...filters, car: !filters.car });
  }

  const handleNumberChange = event => {
    setFilters({ ...filters, numSelected: event.target.value });
  }

  const activateAlert = () => {
    setAlertActivated(true);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      setAlertActivated(false);
      timeoutId = null;
    }, 5000);
  }

  const negotiateRTC = () => {
    if (!peerConnection) return;

    peerConnection.addTransceiver('video', { direction: 'recvonly' });

    return peerConnection.createOffer().then(offer => {
      return peerConnection.setLocalDescription(offer);
    }).then(() => {
      // wait for ICE gathering to complete
      return new Promise(resolve => {
        if (peerConnection.iceGatheringState === 'complete') {
          resolve();
        } else {
          const checkState = () => {
            if (peerConnection.iceGatheringState === 'complete') {
              peerConnection.removeEventListener('icegatheringstatechange', checkState);
              resolve();
            }
          };
          peerConnection.addEventListener('icegatheringstatechange', checkState);
        }
      });
    }).then(() => {
      const offer = peerConnection.localDescription;
      socket.emit('rtcOffer', {
        room: location.state.deviceSn,
        offer: {
          sdp: offer.sdp,
          type: offer.type
        }
      });
    }).catch(error => {
      alert(error);
    });
  }

  if (paired) {
    return (
      <>
        <h1>Alert Page</h1>
        <p>Monitoring for alerts...</p>
        <div>
          <div>
            <label><input type='checkbox' onClick={togglePerson}/>Person</label>
            <label><input type='checkbox' onClick={toggleBike}/>Bike</label>
            <label><input type='checkbox' onClick={toggleCar}/>Car</label>
          </div>
          <label>Number:<input type='number' min='1' max='5' 
            value={filters.numSelected} onChange={handleNumberChange}/>
          </label>
        </div>
        <video id="video" autoPlay playsInline></video>
        <Alert activated={alertActivated} />
      </>
    );
  }

  return (
    <>
      <h1>Alert Page</h1>
      <p>No device has been detected...</p>
    </>
  );
};

export default AlertPage;
