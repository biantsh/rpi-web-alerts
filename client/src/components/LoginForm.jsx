const LoginForm = ({ newSn, onSnChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div>
        <p>Enter your Raspberry PI's Serial Number:</p>
        <input value={newSn} onChange={onSnChange}></input>
      </div>
      <div>
        <button type='submit'>Go</button>
      </div>
    </form>
  );
};

export default LoginForm;
