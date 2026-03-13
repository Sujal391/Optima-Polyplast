import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import profile from '../../assets/profiles.jpg';
import img from '../../assets/logo1.png';
import cookies from 'js-cookie';

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const dropdownRef = useRef(null);
  const profileRef = useRef(null);
  const location = useLocation();

  // const api = axios.create({
  //   baseURL: 'https://rewa-project.onrender.com/api',
  // });

  const api = axios.create({
    baseURL: process.env.REACT_APP_API,
  });

  api.interceptors.request.use(
    (config) => {
      // const token = localStorage.getItem('token');
      const token = cookies.get("token");
      if (token) {
        config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // const token = localStorage.getItem('token');
      const token = cookies.get("token");
        if (!token) {
          window.location.href = '/login';
          return;
        }
        const response = await api.get('/auth/profile');
        setProfileData(response.data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };
    fetchProfileData();
  }, []);

  // Click outside handler for dropdown and profile modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    cookies.remove('token');
    window.location.href = '/';
  };

  return (
    <>
      {/* Navbar */}
      <header className="bg-blue-600 text-white p-6 flex justify-between items-center shadow-lg">
        <Link to="/dispatch/dashboard" className="w-40 h-26">
          <img src={img} alt="Dispatch Panel Logo" />
        </Link>

        <div className="flex space-x-4 items-center">
        <Link to="/dispatch/dashboard" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
            Home
          </Link>
          <Link to="/dispatch/processing-orders" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
            Processing Orders
          </Link>
          <Link to="/dispatch/dispatch-history" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
            Dispatch History
          </Link>
          <Link Link to="/dispatch/challan-history" className="bg-blue-500 px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-300">
            Challan History
          </Link>
                 

          {/* Profile Section */}
          <div className="relative flex items-center space-x-3" ref={profileRef}>
            <div className="text-right">
              <p className="font-semibold">{profileData?.name || 'N/A'}</p>
              <p className="text-sm text-gray-200">{profileData?.role || 'N/A'}</p>
            </div>
            {/* Clickable Profile Image */}
            <img
              src={profileData?.image || profile}
              alt="Profile"
              className="w-10 h-10 rounded-full border cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
            />
          </div>

          {/* Logout Button */}
          <button onClick={handleLogout} className="bg-red-500 px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300">
            Logout
          </button>
        </div>
      </header>

      {/* Welcome Message Centered */}
      {location.pathname === '/dispatch/dashboard' && (
        <motion.div
          className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-blue-500 to-indigo-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Welcome to Dispatch Dashboard
          </h1>
          <p className="text-xl md:text-3xl text-white">
            Manage your Dispatch operations with ease.
          </p>
          <Link to="/dispatch/attandance" className="mt-4 px-6 py-2 bg-white text-blue-500 rounded-lg hover:bg-gray-200 transition duration-300">
            Explore Features
          </Link>
        </motion.div>
      )}

      {/* Profile Modal */}
      {isProfileOpen && profileData && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white text-black rounded-lg p-6 max-w-sm w-full shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-center">User Profile</h2>
            <div className="flex justify-center mb-4">
              <img
                src={profileData?.image || profile}
                alt="Profile"
                className="w-40 h-40 rounded-full border-2 border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <p><strong>Name:</strong> {profileData?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {profileData?.email || 'N/A'}</p>
              <p><strong>Phone No:</strong> {profileData?.phoneNumber || 'N/A'}</p>
              <p><strong>Role:</strong> {profileData?.role || 'N/A'}</p>
              <p><strong>Joined:</strong> {new Date(profileData?.createdAt).toLocaleDateString() || 'N/A'}</p>
            </div>
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsProfileOpen(false)}
                className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
