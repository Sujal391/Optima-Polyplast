import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from './AdminLayout';

// Routes that use the admin layout (header + sidebar)
const ADMIN_ROUTES = [
  '/admin/dashboard', '/users', '/orders', '/PaymentReport', '/attandance',
  '/createUser', '/upload-banner', '/categories', '/formulas',
  '/export-reports', '/order', '/product', '/stock', '/raw-material-summary',
  '/marketing',
];

const AuthLayout = ({ children }) => {
  const { pathname } = useLocation();
  const isAdminRoute = ADMIN_ROUTES.some((r) => pathname === r || pathname === `${r}/`);

  if (isAdminRoute) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  // Reception / stock / dispatch routes: no sidebar, just a full-width content area
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
};

export default AuthLayout;
