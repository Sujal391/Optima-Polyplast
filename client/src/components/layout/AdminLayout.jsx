import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import cookies from "js-cookie";
import {
  Home,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Megaphone,
  UserPlus,
  Image,
  LogOut,
  X,
  Menu,
  ChevronRight,
  History,
  Filter,
  Truck,
  Activity,
} from "lucide-react";
import logo from "../../assets/logo1.png";
import profile from "../../assets/profiles.jpg";

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

const navItems = [
  { path: "/admin/dashboard", icon: Home, label: "Dashboard" },
  { path: "/product", icon: Package, label: "Products" },
  { path: "/order", icon: ShoppingCart, label: "Orders" },
  { path: "/users", icon: Users, label: "Users" },
  { path: "/PaymentReport", icon: FileText, label: "Payment Report" },
  { path: "/admin/payments/history", icon: History, label: "Payment History" },
  { path: "/admin/orders/filter", icon: Filter, label: "Order Filter" },
  { path: "/admin/challans", icon: Truck, label: "Challan Report" },
  { path: "/admin/stock/activities", icon: Activity, label: "Stock Activities" },
  { path: "/marketing", icon: Megaphone, label: "Marketing" },
  { path: "/createUser", icon: UserPlus, label: "Create Panels" },
  { path: "/upload-banner", icon: Image, label: "Upload Banner" },
];

const AdminLayout = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = cookies.get("token");
        if (!token) return;
        const res = await api.get("/admin/profile");
        setProfileData(res.data.profile);
      } catch {
        // silently fail
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    cookies.remove("token");
    navigate("/");
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="h-screen overflow-hidden bg-gray-50">
      {/* ─── Mobile Backdrop ────────────────────────────────────────────── */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* ─── Sidebar (Fixed Full Height) ───────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-60 bg-gray-900 text-white z-50 flex flex-col
          transition-transform duration-300 ease-in-out shadow-xl
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Close button (mobile) */}
        <button
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          onClick={closeSidebar}
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-5 border-b border-gray-700/60 shrink-0">
          <img src={logo} alt="Optima Polyplast" className="w-36 h-auto object-contain" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path || pathname.startsWith(path + "/");
            return (
              <Link
                key={path}
                to={path}
                onClick={closeSidebar}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                  ${active ? "bg-teal-600 text-white shadow-md" : "text-gray-300 hover:bg-gray-700/60 hover:text-white"}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "text-white" : "text-gray-400 group-hover:text-teal-400"}`} />
                <span className="truncate">{label}</span>
                {active && <ChevronRight className="ml-auto h-3 w-3 text-teal-200" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700/60 shrink-0">
          <p className="text-xs text-gray-500 text-center">Optima Polyplast Admin</p>
        </div>
      </aside>

      {/* ─── Right Side (Header + Content) ──────────────────────────────── */}
      <div className="h-screen flex flex-col lg:ml-60">
        {/* ─── Header (Fixed at top of content area) ───────────────────── */}
        <header className="h-14 bg-white border-b border-gray-200 shadow-sm shrink-0 z-30">
          <div className="flex items-center justify-between h-full px-4">
            {/* Left: Mobile menu button + Title */}
            <div className="flex items-center gap-3">
              <button
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-bold text-blue-700">Admin Dashboard</h1>
            </div>

            {/* Right: Profile + Logout */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-gray-100 transition-colors"
              >
                <img
                  src={profileData?.image || profile}
                  alt="Admin"
                  className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover"
                />
                <div className="hidden sm:block text-left leading-tight">
                  <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                    {profileData?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-500">{profileData?.role || "admin"}</p>
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* ─── Main Content Area (Only this scrolls) ───────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          {children}
        </main>
      </div>

      {/* ─── Profile Modal ──────────────────────────────────────────────── */}
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
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsProfileModalOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-4">Admin Profile</h2>
            <div className="flex justify-center mb-4">
              <img
                src={profileData?.image || profile}
                alt="Admin"
                className="w-20 h-20 rounded-full border-2 border-blue-400 object-cover"
              />
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              {[
                { label: "Name", value: profileData?.name },
                { label: "Email", value: profileData?.email },
                { label: "Phone", value: profileData?.phoneNumber },
                { label: "Role", value: profileData?.role },
                { label: "Joined", value: profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString("en-IN") : undefined },
              ].map(
                ({ label, value }) =>
                  value && (
                    <div key={label} className="flex gap-2">
                      <span className="font-medium text-gray-500 w-16 shrink-0">{label}:</span>
                      <span className="text-gray-800 break-all">{value}</span>
                    </div>
                  )
              )}
            </div>
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="mt-5 w-full py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;

