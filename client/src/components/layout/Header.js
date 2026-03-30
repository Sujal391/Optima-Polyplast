import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LogOut, UserCircle, X, Menu } from 'lucide-react';
import profile from '../../assets/profiles.jpg';
import cookies from 'js-cookie';

const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Header = () => {
  const [profileData, setProfileData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = cookies.get("token");
        if (!token) { navigate('/'); return; }
        const res = await api.get('/admin/profile');
        setProfileData(res.data.profile);
      } catch {
        // silently fail — token may belong to another role
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = () => {
    cookies.remove('token');
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6">

        {/* Left: spacer for the sidebar hamburger on mobile */}
        <div className="w-10 lg:hidden" aria-hidden="true" />

        {/* Center / Left title */}
        <h1 className="text-base sm:text-lg font-bold text-blue-700 truncate">
          Admin Dashboard
        </h1>

        {/* Right: profile + logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Profile */}
          {!loading && (
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-100 transition-colors"
              aria-label="Open profile"
            >
              <img
                src={profile}
                alt="Admin"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-blue-400 object-cover"
              />
              <div className="hidden sm:block text-left leading-tight">
                <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                  {profileData?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500">{profileData?.role || 'Admin'}</p>
              </div>
            </button>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm
                       font-medium hover:bg-red-600 transition-colors focus:outline-none focus:ring-2
                       focus:ring-red-400 focus:ring-offset-1"
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700
                         hover:bg-gray-100 transition-colors"
              onClick={() => setIsProfileModalOpen(false)}
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-lg font-semibold text-center text-gray-800 mb-4">Admin Profile</h2>

            <div className="flex justify-center mb-4">
              <img
                src={profile}
                alt="Admin"
                className="w-20 h-20 rounded-full border-2 border-blue-400 object-cover"
              />
            </div>

            <div className="space-y-2 text-sm text-gray-700">
              {[
                { label: "Name",     value: profileData?.name       },
                { label: "Email",    value: profileData?.email      },
                { label: "Phone",    value: profileData?.phoneNumber },
                { label: "Role",     value: profileData?.role       },
                { label: "Joined",   value: profileData?.createdAt
                    ? new Date(profileData.createdAt).toLocaleDateString("en-IN")
                    : undefined },
              ].map(({ label, value }) => value && (
                <div key={label} className="flex gap-2">
                  <span className="font-medium text-gray-500 w-16 shrink-0">{label}:</span>
                  <span className="text-gray-800 break-all">{value}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="mt-5 w-full py-2 bg-blue-600 text-white rounded-xl font-medium
                         hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
