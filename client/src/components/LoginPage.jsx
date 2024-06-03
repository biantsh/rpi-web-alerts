import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from './LoginForm';

const LoginPage = () => {
  const [newSn, setNewSn] = useState('');
  const navigate = useNavigate();

  const handleSnChange = event => {
    setNewSn(event.target.value);
  }
  
  const handleSubmit = event => {
    event.preventDefault();
    navigate(`/sn/${newSn}`, {
      state: {
        deviceSn: newSn
      }
    });
  }

  const handleSubmitDevice = event => {
    event.preventDefault();
    navigate(`/device/${newSn}`, {
      state: {
        deviceSn: newSn
      }
    });
  }

  return (
    <>
      <h1>Welcome!</h1>
      <LoginForm newSn={newSn} onSnChange={handleSnChange} onSubmit={handleSubmit} onSubmitDevice={handleSubmitDevice} />
    </>
  );
};

export default LoginPage;
