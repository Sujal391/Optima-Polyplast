import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Menu, X, ChevronDown, LogOut, Home, Users, ShoppingCart,
  ClipboardList, CreditCard, History,
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
  { to: "/reception/dashboard", label: "Home",         icon: Home },
  { to: "/total-users",         label: "Total Users",  icon: Users },
  { to: "/create-order",        label: "Create Order", icon: ShoppingCart },
];

const ordersDropdown = [
  { to: "/pending-orders",             label: "Pending Orders",   icon: ClipboardList },
  { to: "/reception/pending-payments", label: "Pending Payments", icon: CreditCard },
  { to: "/total-orders",               label: "Order History",    icon: History },
];

const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen]   = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileData, setProfileData]       = useState(null);
  const dropdownRef  = useRef(null);
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

  // Close dropdown / profile on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsDropdownOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setIsProfileOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsDropdownOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    cookies.remove("token");
    window.location.href = "/";
  };

  const isActive = (to) => location.pathname === to;
  const linkBase = "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200";
  const activeLink = "bg-teal-500 text-white";
  const inactiveLink = "text-teal-100 hover:bg-teal-700/60 hover:text-white";

  return (
    <>
      {/* ─── Top Navbar ─────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-cyan-900 shadow-lg">
        <div className="max-w-screen-xl mx-auto px-3 sm:px-5">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <Link to="/reception/dashboard" className="shrink-0 flex items-center">
              <img src={img} alt="Reception" className="h-9 w-auto object-contain" />
            </Link>

            {/* ── Desktop nav (md+) ── */}
            <nav className="hidden md:flex items-center gap-1">
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

              {/* Orders dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen((v) => !v)}
                  className={`${linkBase} ${inactiveLink} min-w-max`}
                >
                  <ClipboardList className="h-4 w-4 shrink-0" />
                  Total Orders
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isDropdownOpen && (
                  <div className="absolute top-full mt-1 left-0 w-48 bg-white text-gray-800 rounded-xl
                                  shadow-xl border border-gray-100 py-1 z-50">
                    {ordersDropdown.map(({ to, label, icon: Icon }) => (
                      <Link
                        key={to}
                        to={to}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-teal-50
                                   hover:text-teal-700 transition-colors first:rounded-t-xl last:rounded-b-xl"
                      >
                        <Icon className="h-4 w-4 text-teal-500 shrink-0" />
                        {label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* ── Right: profile + logout (desktop), hamburger (mobile) ── */}
            <div className="flex items-center gap-2">
              {/* Profile avatar */}
              <div className="relative hidden sm:block" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-teal-700/50 transition-colors"
                >
                  <img
                    src={profileData?.image || profile}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border-2 border-teal-400 object-cover"
                  />
                  <div className="hidden lg:block text-left leading-tight">
                    <p className="text-sm font-semibold text-white line-clamp-1">
                      {profileData?.name || "User"}
                    </p>
                    <p className="text-xs text-teal-300">{profileData?.role || ""}</p>
                  </div>
                </button>
              </div>

              {/* Logout — desktop */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500
                           text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">Logout</span>
              </button>

              {/* Mobile hamburger */}
              <button
                className="md:hidden p-2 rounded-lg text-teal-200 hover:bg-teal-700/50 hover:text-white transition-colors"
                onClick={() => setIsMobileMenuOpen((v) => !v)}
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Menu ─────────────────────────────────────────────── */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-teal-700/60 bg-cyan-900 px-4 py-3 space-y-1">
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

            {/* Orders group */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-400 px-3 pt-2 pb-1">
                Orders
              </p>
              {ordersDropdown.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`${linkBase} w-full ${isActive(to) ? activeLink : inactiveLink}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </div>

            {/* Profile + logout row */}
            <div className="flex items-center justify-between pt-3 border-t border-teal-700/40">
              <div className="flex items-center gap-2">
                <img
                  src={profileData?.image || profile}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-teal-400 object-cover"
                />
                <div className="text-left leading-tight">
                  <p className="text-sm font-semibold text-white">{profileData?.name || "User"}</p>
                  <p className="text-xs text-teal-300">{profileData?.role || ""}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500
                           text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Dashboard welcome screen ─────────────────────────────────── */}
      {location.pathname === "/reception/dashboard" && (
        <motion.div
          className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)]
                     bg-gradient-to-br from-green-50 via-teal-50 to-cyan-50 px-4 text-center"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-800 mb-3">
            Welcome to Reception
          </h1>
          <p className="text-base sm:text-2xl text-slate-600 mb-6 max-w-xl">
            Manage your reception operations with ease.
          </p>
          <Link
            to="/total-users"
            className="px-6 py-2.5 bg-teal-500 text-white rounded-xl font-medium
                       hover:bg-teal-600 transition-colors shadow-md"
          >
            View Customers →
          </Link>
        </motion.div>
      )}

      {/* Profile Modal */}
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
                className="w-20 h-20 rounded-full border-2 border-teal-400 object-cover"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-700">
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
                  <span className="font-medium text-gray-500 w-14 shrink-0">{label}:</span>
                  <span className="text-gray-800 break-all">{value}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => setIsProfileOpen(false)}
              className="mt-5 w-full py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-colors"
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
