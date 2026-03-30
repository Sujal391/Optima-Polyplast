import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Menu, X, LogOut, Home, ClipboardList, History, FileText
} from "lucide-react";
import profile from "../../assets/profiles.jpg";
import img from "../../assets/logo1.png";
import cookies from "js-cookie";

const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Navigation structure
const navLinks = [
  { to: "/dispatch/dashboard", label: "Home", icon: Home },
  { to: "/dispatch/processing-orders", label: "Processing Orders", icon: ClipboardList },
  { to: "/dispatch/challans", label: "All Challans", icon: FileText },
  { to: "/dispatch/dispatch-history", label: "Dispatch History", icon: History },
  { to: "/dispatch/challan-history", label: "Challan History", icon: FileText },
];

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData]       = useState(null);
  const profileRef   = useRef(null);
  const location     = useLocation();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = cookies.get("token");
        if (!token) { window.location.href = "/"; return; }
        const res = await api.get("/auth/profile");
        setProfileData(res.data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    };
    fetchProfile();
  }, []);

  // Close profile on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    cookies.remove("token");
    window.location.href = "/";
  };

  const isActive = (to) => location.pathname === to;
  const linkBase = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200";
  const activeLink = "bg-blue-600 text-white";
  const inactiveLink = "text-blue-100 hover:bg-blue-700/60 hover:text-white";

  return (
    <>
      <header className="sticky top-0 z-40 bg-blue-800 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between h-16">

            <Link to="/dispatch/dashboard" className="shrink-0 flex items-center bg-white p-1 rounded">
              <img src={img} alt="Dispatch" className="h-8 w-auto object-contain" />
            </Link>

            <nav className="hidden md:flex items-center gap-2 ml-6">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`${linkBase} ${isActive(to) ? activeLink : inactiveLink}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-blue-700/50 transition-colors"
                >
                  <img
                    src={profileData?.image || profile}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover"
                  />
                  <div className="hidden lg:block text-left leading-tight">
                    <p className="text-sm font-semibold text-white line-clamp-1">
                      {profileData?.name || "User"}
                    </p>
                    <p className="text-xs text-blue-300">{profileData?.role || ""}</p>
                  </div>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500
                           text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </button>

              <button
                className="md:hidden p-2 rounded-lg text-blue-200 hover:bg-blue-700/50 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-blue-700/60 bg-blue-800 px-4 py-3 space-y-2">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`${linkBase} w-full ${isActive(to) ? activeLink : inactiveLink}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            ))}

            <div className="flex items-center justify-between pt-4 border-t border-blue-700/40">
              <div className="flex items-center gap-3">
                <img
                  src={profileData?.image || profile}
                  alt="Profile"
                  className="w-10 h-10 rounded-full border-2 border-blue-400 object-cover"
                />
                <div className="text-left leading-tight">
                  <p className="text-base font-semibold text-white">{profileData?.name || "User"}</p>
                  <p className="text-sm text-blue-300">{profileData?.role || ""}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500
                           text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {location.pathname === "/dispatch/dashboard" && (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]
                     bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-4 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-blue-900 mb-6 drop-shadow-sm">
            Welcome to Dispatch Dashboard
          </h1>
          <p className="text-lg md:text-2xl text-slate-600 mb-8 max-w-2xl">
            Streamline your processing and logistics efficiently.
          </p>
          <Link
            to="/dispatch/processing-orders"
            className="px-8 py-3.5 bg-blue-600 text-white rounded-xl font-bold text-lg
                       hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            Explore Features
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      )}

      {isProfileOpen && profileData && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setIsProfileOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700
                         hover:bg-gray-100 transition-colors"
              onClick={() => setIsProfileOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-4">User Profile</h2>
            <div className="flex justify-center mb-4">
              <img
                src={profileData?.image || profile}
                alt="Profile"
                className="w-24 h-24 rounded-full border-2 border-blue-400 object-cover"
              />
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              {[
                { label: "Name",    value: profileData?.name },
                { label: "Email",   value: profileData?.email },
                { label: "Phone",   value: profileData?.phoneNumber },
                { label: "Role",    value: profileData?.role },
                { label: "Joined",  value: profileData?.createdAt
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
              onClick={() => setIsProfileOpen(false)}
              className="mt-6 w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
