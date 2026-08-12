import { useState, useEffect } from 'react';
import { ROLES } from '../services/utils/constants';
import cookies from 'js-cookie';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // const token = localStorage.getItem('token');
      const token = cookies.get("token");
    // const userRole = localStorage.getItem('userRole');
      const userRole = cookies.get("userRole");
    
    if (token && userRole) {
      setUser({ token, role: userRole });
    }
    setLoading(false);
  }, []);

  const login = (token, role) => {
    // localStorage.setItem('token', token);
    cookies.set('token', token);
    // localStorage.setItem('userRole', role);
    cookies.set('userRole', role);
    setUser({ token, role });
  };

  const logout = () => {
    cookies.remove('token');
    cookies.remove('userRole');
    setUser(null);
  };

  const hasRole = (allowedRoles) => {
    return user && allowedRoles.includes(user.role);
  };

  return { user, loading, login, logout, hasRole };
}; 