import { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Alert from "./Alert";
import useWebRTC from "../hooks/useWebRTC";

const AlertPage = () => {
  const [filters, setFilters] = useState({
    person: false,
    bike: false,
    car: false,
    numSelected: 1
  });
  const [alertActivated, setAlertActivated] = useState(false);
  const latestFilters = useRef(filters);
  const location = useLocation();
  const { paired, socket } = useWebRTC(location.state.deviceSn);

  let timeoutId;

  useEffect(() => {
    latestFilters.current = filters;
  }, [filters]);

  socket.on('ai-detections', detections => {
    const { person, bike, car, numSelected } = latestFilters.current;

    if ((person && detections.person >= numSelected) ||
        (bike && detections.bike >= numSelected) ||
        (car && detections.car >= numSelected)) {
      activateAlert();
    }
  });

  const togglePerson = () => {
    setFilters({ ...filters, person: !filters.person });
  };

  const toggleBike = () => {
    setFilters({ ...filters, bike: !filters.bike });
  };

  const toggleCar = () => {
    setFilters({ ...filters, car: !filters.car });
  };

  const handleNumberChange = event => {
    setFilters({ ...filters, numSelected: event.target.value });
  };

  const activateAlert = () => {
    setAlertActivated(true);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      setAlertActivated(false);
      timeoutId = null;
    }, 5000);
  };

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
