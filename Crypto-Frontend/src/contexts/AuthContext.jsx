import React, { createContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { LogOut, CheckCircle, XCircle } from 'lucide-react';

const baseURL = import.meta.env.VITE_API_BASE_URL;
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() =>
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  const [user, setUser] = useState(() =>
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null
  );
  const [loginResponse, setLoginResponse] = useState(null);

  console.log(loginResponse,"yeeeeeeeeeeeeeee")
  const navigate = useNavigate();
  const refreshTimerRef = useRef(null);

  useEffect(() => {
    console.log('🔐 Auth Tokens Updated:', authTokens);
  }, [authTokens]);

  useEffect(() => {
    console.log('👤 User Updated:', user);
  }, [user]);

  // 🔄 REFRESH TOKEN
  const refreshToken = async () => {
    if (!authTokens?.refresh) {
      console.log('❌ No refresh token available');
      logoutUser();
      return null;
    }
    console.log(loginResponse,"the login response")

    try {
      console.log('🔄 Refreshing access token...');
      const response = await fetch(`${baseURL}account/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: authTokens.refresh }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Token refreshed successfully');
        const newTokens = { access: data.access, refresh: data.refresh };
        
        setAuthTokens(newTokens);
        localStorage.setItem('authTokens', JSON.stringify(newTokens));
        
        return data.access;
      } else {
        console.log('❌ Token refresh failed:', data);
        logoutUser();
        toast.error('Session expired. Please login again.', { position: 'top-right' });
        return null;
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      logoutUser();
      return null;
    }
  };

  // ⏰ Setup automatic token refresh (refresh 1 minute before expiry)
  useEffect(() => {
    if (!authTokens?.access) {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
      return;
    }

    try {
      // Decode JWT to get expiration time
      const tokenParts = authTokens.access.split('.');
      const payload = JSON.parse(atob(tokenParts[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
    
      const refreshTime = expiresAt - now - 60000;

  

      if (refreshTime > 0) {
        refreshTimerRef.current = setTimeout(() => {
        
          refreshToken();
        }, refreshTime);
      } else {
        // Token already expired or about to expire, refresh immediately
        console.log('⚠️ Token expired or about to expire, refreshing now...');
        refreshToken();
      }
    } catch (error) {
      console.error('❌ Error parsing token:', error);
    }

    // Cleanup timer on unmount or when authTokens change
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [authTokens]);

  // ✅ LOGIN
  // const loginUser = async (email, password) => {
  //   try {
  //     const response = await fetch(`${baseURL}account/login/`, {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ email, password }),
  //     });

  //     const data = await response.json();

  //     if (response.ok) {
  //       setAuthTokens({ access: data.access, refresh: data.refresh });
  //       setUser(data.user);
  //       setLoginResponse(data);

  //       localStorage.setItem('authTokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
  //       localStorage.setItem('user', JSON.stringify(data.user));

  //       // ✅ Modern success toast
  //       toast.custom((t) => (
  //         <div
  //           className={`${
  //             t.visible ? 'animate-enter' : 'animate-leave'
  //           } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
  //         >
  //           <div className="flex-1 w-0 p-4">
  //             <div className="flex items-start">
  //               <div className="flex-shrink-0 pt-0.5">
  //                 <CheckCircle className="h-6 w-6 text-green-500" />
  //               </div>
  //               <div className="ml-3 flex-1">
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   Welcome back!
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       ), { position: 'top-right', duration: 2000 });

  //       return { success: true, user: data.user };
  //     } else {
  //       const errorMessage = data.non_field_errors ? data.non_field_errors[0] : 'Login failed';

  //       // ❌ Modern error toast
  //       toast.custom((t) => (
  //         <div
  //           className={`${
  //             t.visible ? 'animate-enter' : 'animate-leave'
  //           } max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
  //         >
  //           <div className="flex-1 w-0 p-4">
  //             <div className="flex items-start">
  //               <div className="flex-shrink-0 pt-0.5">
  //                 <XCircle className="h-6 w-6 text-red-500" />
  //               </div>
  //               <div className="ml-3 flex-1">
  //                 <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
  //                   {errorMessage}
  //                 </p>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       ), { position: 'top-right', duration: 2000 });

  //       return { success: false, message: errorMessage };
  //     }
  //   } catch (error) {
  //     toast.error('Something went wrong during login', { position: 'top-right' });
  //     return { success: false, message: 'Something went wrong during login' };
  //   }
  // };

  const loginUser = async (email, password) => {
    try {
      const response = await fetch(`${baseURL}account/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
  
      const data = await response.json();

      console.log(data,"thhhhhhhhhhhhhhhhhhhh")


  
      if (response.ok) {
        const userRole = data.user?.role;
        const currentPath = window.location.pathname; // get the current URL path
  
        setAuthTokens({ access: data.access, refresh: data.refresh });
        setUser(data.user);
        setLoginResponse(data);
  
        localStorage.setItem('authTokens', JSON.stringify({ access: data.access, refresh: data.refresh }));
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('subscription', JSON.stringify(data.subscription));
  
        // ✅ Only show success toast if role matches the login route
        const showToast =
          (userRole === 'admin' && currentPath === '/admin-login') ||
          (userRole === 'b2b_admin' && currentPath === '/b2badmin-login') ||
          ((userRole === 'b2c_user' || userRole === 'b2b_user') && currentPath === '/login');
  
        if (showToast) {
          toast.custom(
            (t) => (
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
                        Welcome back, {userRole === 'admin' ? 'Admin' : data.user?.full_name || 'User'}!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ),
            { position: 'top-right', duration: 2000 }
          );
        }
  
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.non_field_errors ? data.non_field_errors[0] : 'Login failed';
  
        toast.custom(
          (t) => (
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
          ),
          { position: 'top-right', duration: 2000 }
        );
  
        return { success: false, message: errorMessage };
      }
    } catch (error) {
      toast.error('Something went wrong during login', { position: 'top-right' });
      return { success: false, message: 'Something went wrong during login' };
    }
  };
  

  // ✅ LOGOUT
  const logoutUser = () => {
    // Clear the refresh timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

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
    refreshToken, // Expose refreshToken for manual use if needed
    isLoggedIn: !!user,
    role: user?.role,
    loginResponse,
  };

  return <AuthContext.Provider value={contextData}>{children}</AuthContext.Provider>;
};