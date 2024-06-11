import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Alert from './Alert';
import useWebRTC from '../hooks/useWebRTC';

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
    console.log(detections);
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
        <h1 id='alert-page-title'>Connected to room!</h1>
        <p id='alert-page-subtitle'>Monitoring for alerts...</p>
        <div id='live-feed'>
          <div id='filter-buttons'>
            <label className={`button-style ${filters.person ? 'active' : ''}`}>
              <input 
                type='checkbox' 
                className='hidden-checkbox' 
                onClick={togglePerson}
                checked={filters.person}
                readOnly
              />
              Person
            </label>
            <label className={`button-style ${filters.bike? 'active' : ''}`}>
              <input 
                type='checkbox' 
                className='hidden-checkbox' 
                onClick={toggleBike}
                checked={filters.bike}
                readOnly
              />
              Bike
            </label>
            <label className={`button-style ${filters.car ? 'active' : ''}`}>
              <input 
                type='checkbox' 
                className='hidden-checkbox' 
                onClick={toggleCar}
                checked={filters.car}
                readOnly
              />
              Car
            </label>
          </div>
          <label>Number:<input type='number' min='1' max='5' 
            value={filters.numSelected} onChange={handleNumberChange}/>
          </label>
          <video id='video' autoPlay playsInline></video>
        </div>
        <Alert activated={alertActivated} />
      </>
    );
  }

  return (
    <div id="waiting-div">
      <h1>Just a moment...</h1>
      <p>Waiting for your Raspberry Pi device to be detected...</p>
      <div id="spinner"></div>
    </div>
  );
};

export default AlertPage;
