import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";

const AlertPage = () => {
  const [paired, setPaired] = useState(false);
  const [filters, setFilters] = useState({
    person: false, 
    bike: false, 
    car: false, 
    numSelected: 1
  });

  const latestFilters = useRef(filters);
  const location = useLocation();
  const socket = io();

  useEffect(() => {
    latestFilters.current = filters
  }, [filters]);

  useEffect(() => {
    socket.emit('pair-user', location.state.deviceSn);
  }, []);

  socket.on('pair-device', isPaired => {
    setPaired(isPaired);
  });

  socket.on('ai-detections', detections => {
    if ((latestFilters.person && detections.person >= latestFilters.numSelected) 
      || (latestFilters.bike && detections.bike >= latestFilters.numSelected)
      || (latestFilters.car && detections.car >= latestFilters.numSelected)) {
      console.log('ALERT!');
    }
  });

  const togglePerson = () => {
    setFilters({ ...filters, person: !person });
  }

  const toggleBike = () => {
    setFilters({ ...filters, bike: !bike })
  }

  const toggleCar = () => {
    setFilters({ ...filters, car: !car });
  }

  const handleNumberChange = event => {
    setFilters({ ...filters, numSelected: event.target.value });
  }

  if (paired) {
    return (
      <>
        <h1>Alert Page</h1>
        <p>Monitoring for alerts...</p>
        <div>
          <label><input type='checkbox' onClick={togglePerson}/>Person</label>
          <label><input type='checkbox' onClick={toggleBike}/>Bike</label>
          <label><input type='checkbox' onClick={toggleCar}/>Car</label>
        </div>
        <label>Number:<input type='number' min='1' max='5' 
          value={numSelected} onChange={handleNumberChange}/>
        </label>
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
