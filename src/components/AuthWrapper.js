import React, { useState } from 'react';
import Login from './Login';
import SignUp from './SignUp';

const AuthWrapper = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
  };

  return isLoginMode ? (
    <Login onToggleMode={toggleMode} />
  ) : (
    <SignUp onToggleMode={toggleMode} />
  );
};

export default AuthWrapper; 