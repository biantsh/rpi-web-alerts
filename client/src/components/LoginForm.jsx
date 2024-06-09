import './LoginForm.scss'

const LoginForm = ({ newSn, onSnChange, onSubmit }) => {
  return (
    <form onSubmit={onSubmit}>
      <div className='login-wrapper'>
        <div>
          <p>Enter your Raspberry PI's Serial Number:</p>
          <input value={newSn} onChange={onSnChange}></input>
        </div>
        <div>
          <button type='submit'>Go</button>
        </div>
      </div>
    </form>
  );
};

export default LoginForm;
