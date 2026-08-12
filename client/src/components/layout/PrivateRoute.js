
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import cookies from 'js-cookie';

const PrivateRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  
  // Get user role from localStorage
  // const userRole = localStorage.getItem('userRole');
      const userRole = cookies.get("userRole");
  // const token = localStorage.getItem('token');
      const token = cookies.get("token");

  // Debug logs
  console.log('Current user role:', userRole);
  console.log('Allowed roles:', allowedRoles);
  console.log('Current path:', location.pathname);

  // Check if user is authenticated
  if (!token) {
    // Redirect to login page if not authenticated
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(userRole)) {
    console.log('Access denied: User role not in allowed roles');
    // Redirect to appropriate dashboard based on user's role
    const dashboardRoutes = {
      admin: '/admin/dashboard',
      reception: '/reception/dashboard',
      stock: '/stock/dashboard',
      dispatch: '/dispatch/dashboard',
      // marketing: '/marketing/dashboard',
      // user: '/user/dashboard'
    };

    const redirectPath = dashboardRoutes[userRole] || '/';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If everything is ok, render the protected component
  return children;
};

export default PrivateRoute;