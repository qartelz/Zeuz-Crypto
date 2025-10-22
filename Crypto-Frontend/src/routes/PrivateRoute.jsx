
import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import {AuthContext} from '../contexts/AuthContext';

const PrivateRoute = ({ allowedRoles }) => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    const path = location.pathname;

    if (path.startsWith('/admin')) return <Navigate to="/admin-login" replace />;
    if (path.startsWith('/b2b')) return <Navigate to="/b2badmin-login" replace />;
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
