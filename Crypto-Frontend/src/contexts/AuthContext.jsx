import React, { createContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );

  console.log(user,"the user type")
  const [loginResponse, setLoginResponse] = useState(null); // NEW STATE

  const loginUser = async (email, password) => {
    const response = await fetch('http://127.0.0.1:8000/api/v1/account/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  
    const data = await response.json();
  
    if (response.ok) {
      setAuthTokens({ access: data.access, refresh: data.refresh });
      setUser(data.user);
      setLoginResponse(data);
      localStorage.setItem('authTokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
      localStorage.setItem('user', JSON.stringify(data.user));
      return { success: true, user: data.user };
    } else {
      // Return the error message from API if available, fallback generic message
      const errorMessage = data.non_field_errors ? data.non_field_errors[0] : 'Login failed';
      return { success: false, message: errorMessage };
    }
  };
  
  

  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    setLoginResponse(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');
  };

  const contextData = {
    user,
    authTokens,
    loginUser,
    logoutUser,
    isLoggedIn: !!user,
    role: user?.role,
    loginResponse, 
  };

  return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
};

export default AuthContext;
