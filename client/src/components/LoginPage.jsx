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

  return (
    <>
      <h1 style={{textAlign:'center', fontSize:'50px', color:"green"}}>Welcome!</h1>
      <LoginForm newSn={newSn} onSnChange={handleSnChange} onSubmit={handleSubmit} />
    </>
  );
};

export default LoginPage;
