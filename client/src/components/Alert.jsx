import React, { useState, useEffect } from 'react';

const Alert = ({ activated }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (activated) {
      setVisible(true);
    } else if (!activated && visible) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activated, visible]);

  if (!visible && !activated) {
    return null;
  }

  return (
    <p id='alert' className={activated ? 'alert-visible' : 'alert-hidden'}>
      <b>Alert: detected one or more objects matching selected filters.</b>
    </p>
  );
};

export default Alert;
