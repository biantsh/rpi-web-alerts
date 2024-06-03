const LoginForm = ({ newSn, onSnChange, onSubmit, onSubmitDevice }) => {
  return (
    <form onSubmit={onSubmit} id='loginForm'>
      <div>
        <p>Enter your Raspberry PI's Serial Number:</p>
        <input value={newSn} onChange={onSnChange} id='snField'></input>
      </div>
      <div>
        <button type='submit' id='humanButton'>I'm a human</button>
        <button onClick={onSubmitDevice} id='deviceButton'>I'm a device</button>
      </div>
    </form>
  );
};

export default LoginForm;
