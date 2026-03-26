import React, { useState } from "react";
import {
  FaBars, FaTimes, FaHome, FaUser, FaProductHunt,
  FaFileInvoiceDollar, FaBullhorn, FaShoppingCart,
  FaUserPlus, FaChevronRight,
} from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo1.png";

const navItems = [
  { path: "/admin/dashboard",  icon: FaHome,              label: "Dashboard"     },
  { path: "/product",          icon: FaProductHunt,       label: "Products"      },
  { path: "/order",            icon: FaShoppingCart,      label: "Orders"        },
  { path: "/users",            icon: FaUser,              label: "Users"         },
  { path: "/PaymentReport",    icon: FaFileInvoiceDollar, label: "Payment Report"},
  { path: "/marketing",        icon: FaBullhorn,          label: "Marketing"     },
  { path: "/createUser",       icon: FaUserPlus,          label: "Create Panels" },
  { path: "/upload-banner",    icon: FaUserPlus,          label: "Upload Banner" },
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { pathname } = useLocation();

  const close = () => setIsOpen(false);

  return (
    <>
      {/* ── Mobile hamburger button ──────────────────────────────── */}
      <button
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-gray-800 text-white shadow-lg
                   hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
        onClick={() => setIsOpen(true)}
        aria-label="Open sidebar"
      >
        <FaBars size={20} />
      </button>

      {/* ── Backdrop (mobile only) ────────────────────────────────── */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar panel ─────────────────────────────────────────── */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-60 bg-gray-900 text-white z-50 flex flex-col
          transition-transform duration-300 ease-in-out shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:static lg:z-auto lg:shadow-none lg:shrink-0
        `}
      >
        {/* Close button (mobile) */}
        <button
          className="lg:hidden absolute top-3 right-3 p-1.5 rounded-md text-gray-400
                     hover:text-white hover:bg-gray-700 transition-colors"
          onClick={close}
          aria-label="Close sidebar"
        >
          <FaTimes size={18} />
        </button>

        {/* Logo */}
        <div className="flex items-center justify-center px-4 pt-6 pb-4 border-b border-gray-700/60 shrink-0">
          <img
            src={logo}
            alt="Optima Polyplast"
            className="w-36 h-auto object-contain"
            loading="lazy"
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = pathname === path;
            return (
              <Link
                key={path}
                to={path}
                onClick={close}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200 group
                  ${active
                    ? "bg-teal-600 text-white shadow-md shadow-teal-900/40"
                    : "text-gray-300 hover:bg-gray-700/60 hover:text-white"
                  }
                `}
              >
                <Icon
                  className={`shrink-0 text-base transition-colors
                    ${active ? "text-white" : "text-gray-400 group-hover:text-teal-400"}`}
                />
                <span className="truncate">{label}</span>
                {active && (
                  <FaChevronRight className="ml-auto text-xs text-teal-200 shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-700/60 shrink-0">
          <p className="text-xs text-gray-500 text-center">Optima Polyplast Admin</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;