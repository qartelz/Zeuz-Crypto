import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, XCircle } from 'lucide-react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [loginResponse, setLoginResponse] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('🔐 Auth Tokens Updated:', authTokens);
  }, [authTokens]);

  useEffect(() => {
    console.log('👤 User Updated:', user);
  }, [user]);

  // ✅ LOGIN
  const loginUser = async (email, password) => {
    try {
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

        // ✅ Modern success toast
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Welcome back!
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), { position: 'top-right', duration: 2000 });

        return { success: true, user: data.user };
      } else {
        const errorMessage = data.non_field_errors ? data.non_field_errors[0] : 'Login failed';

        // ❌ Modern error toast
        toast.custom((t) => (
          <div
            className={`${
              t.visible ? 'animate-enter' : 'animate-leave'
            } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
          >
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <XCircle className="h-6 w-6 text-red-500" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {errorMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ), { position: 'top-right', duration: 2000 });

        return { success: false, message: errorMessage };
      }
    } catch (error) {
      toast.error('Something went wrong during login', { position: 'top-right' });
      return { success: false, message: 'Something went wrong during login' };
    }
  };

  // ✅ LOGOUT
  const logoutUser = () => {
    setAuthTokens(null);
    setUser(null);
    setLoginResponse(null);
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');

    // 🚪 Modern logout toast
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <LogOut className="h-6 w-6 text-red-500" />
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Logged out successfully!
              </p>
            </div>
          </div>
        </div>
      </div>
    ), { position: 'top-right', duration: 2000 });

    // navigate('/login');
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
