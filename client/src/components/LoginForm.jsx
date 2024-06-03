const LoginForm = ({ newSn, onSnChange, onSubmit, onSubmitDevice }) => {
  return (
    <form onSubmit={onSubmit}>
      <div>
        <p>Enter your Raspberry PI's Serial Number:</p>
        <input value={newSn} onChange={onSnChange}></input>
      </div>
      <div>
        <button type='submit'>I'm a human</button>
        <button onClick={onSubmitDevice}>I'm a device</button>
      </div>
    </form>
  );
};

export default LoginForm;
