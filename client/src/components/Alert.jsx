const Alert = ({ activated }) => {
  if (activated) {
    return (
      <p>Alert!</p>
    );
  }
  
  return null;
}

export default Alert;
