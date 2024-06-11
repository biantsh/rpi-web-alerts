import { useState } from 'react';
import '../styles/styles.css';

const LoginForm = ({ newSn, onSnChange, onSubmit }) => {
  const [placeholder, setPlaceholder] = useState('Serial number');

  return (
    <form onSubmit={onSubmit}>
      <div>
        <h2>Authentication</h2>
        <p>Enter your Raspberry PI's Serial Number:</p>
        <input 
          value={newSn} 
          onChange={onSnChange}
          placeholder={placeholder}
          onFocus={() => setPlaceholder('')}
          onBlur={(event) => {if (!event.target.value) {
            setPlaceholder('Serial number');
          }}}
          required>
        </input>
      </div>
      <div>
        <button type='submit'>Join room</button>
      </div>
    </form>
  );
};

export default LoginForm;
