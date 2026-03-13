

// import React, { useState } from "react";
// import {
//   FaBars,
//   FaTimes,
//   FaHome,
//   FaUser,
//   FaProductHunt,
//   FaDollarSign,
//   FaBullhorn,
//   FaShoppingCart,
//   FaUserPlus,
//   FaCalendarCheck,
//   FaThList,
//   FaBox
// } from "react-icons/fa";
// import { Link, useLocation } from "react-router-dom"; // Added useLocation
// import logo from "../../assets/logo1.png";

// const Sidebar = () => {
//   const [openSidebar, setOpenSidebar] = useState(false);
//   const [openDropdown, setOpenDropdown] = useState("");
//   const location = useLocation(); // Get current location

//   const toggleSidebar = () => setOpenSidebar(!openSidebar);
//   const toggleDropdown = (name) =>
//     setOpenDropdown(openDropdown === name ? "" : name);

//   // Function to check if a link is active
//   const isActive = (path) => location.pathname === path;

//   return (
//     <div className="relative h-screen">
//       {/* Mobile Toggle Button */}
//       <button
//         className="lg:hidden p-4 text-white bg-gray-800 fixed z-20 top-2 left-2"
//         onClick={toggleSidebar}
//         aria-label="Toggle Sidebar"
//       >
//         {openSidebar ? <FaTimes size={24} /> : <FaBars size={24} />}
//       </button>

//       {/* Sidebar */}
//       <div
//         className={`
//           fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-10 transition-transform duration-300
//           ${openSidebar ? "translate-x-0" : "-translate-x-full"}
//           lg:translate-x-0 lg:flex lg:flex-col
//         `}
//       >
//         {/* Logo */}
//         <div className="p-4 flex justify-center">
//           <img
//             src={logo}
//             alt="Optima Polyplast Logo"
//             className="w-55 h-35"
//           />
//         </div>

//         {/* Navigation */}
//         <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
//           <ul className="space-y-4 p-4">
//             {/* Dashboard */}
//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/admin/dashboard") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/admin/dashboard"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaHome />
//                 <span>Dashboard</span>
//               </Link>
//             </li>
//             {/* Order */}
//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/order") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/order"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaShoppingCart />
//                 <span>Order</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/users") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/users"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaUser />
//                 <span>Users</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/product") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/product"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaProductHunt />
//                 <span>Product</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/stock") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/stock"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaBox />
//                 <span>Stock</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/attandance") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/attandance"
//                 className="flex items-center space-x-3 text-white"
//               >
                // {/* <FaCalendarCheck /> */}
//                 <FaBox />
//                 <span>Attandance</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/marketing") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/marketing"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaBullhorn />
//                 <span>Marketing</span>
//               </Link>
//             </li>

//             <li className={`hover:bg-gray-700 p-2 rounded-lg ${isActive("/createUser") ? "bg-gray-700" : ""}`}>
//               <Link
//                 to="/createUser"
//                 className="flex items-center space-x-3 text-white"
//               >
//                 <FaUserPlus />
//                 <span>Create Panels</span>
//               </Link>
//             </li>
//           </ul>
//         </nav>
//       </div>

//       {/* Background Overlay for Mobile */}
//       {openSidebar && (
//         <div
//           className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
//           onClick={toggleSidebar}
//         />
//       )}
//     </div>
//   );
// };

// export default Sidebar;


import React, { useState } from "react";
import { FaBars, FaTimes, FaHome, FaUser, FaProductHunt,FaCalendarCheck, FaFileInvoiceDollar, FaBullhorn, FaShoppingCart, FaUserPlus, FaBox, FaChevronDown, FaThList, FaDownload } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";
import logo from "../../assets/logo1.png";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStockDropdownOpen, setIsStockDropdownOpen] = useState(false);
  const { pathname } = useLocation();

  const toggleSidebar = () => setIsOpen(prev => !prev);
  const toggleStockDropdown = () => setIsStockDropdownOpen(prev => !prev);

  // Navigation items array for better maintainability
  const navItems = [
    { path: "/admin/dashboard", icon: FaHome, label: "Dashboard" },
    { path: "/product", icon: FaProductHunt, label: "Product" },
    { path: "/order", icon: FaShoppingCart, label: "Order" },
    { path: "/users", icon: FaUser, label: "Users" },
    { path: "/PaymentReport", icon: FaFileInvoiceDollar, label: "Payment Report" },
    { path: "/marketing", icon: FaBullhorn, label: "Marketing" },
    { path: "/createUser", icon: FaUserPlus, label: "Create Panels" },
    { path: "/upload-banner", icon: FaUserPlus, label: "Upload Banner" },
    // { path: "/categories", icon: FaThList, label: "Categories" },
    // { path: "/formulas", icon: FaBox, label: "Formulas" },
    // { path: "/export-reports", icon: FaDownload, label: "Export Reports" },
  ];

  // Stock dropdown items
  // const stockDropdownItems = [
  //   { path: "/stock", label: "Stock History" },
  //   { path: "/raw-material-summary", label: "Raw Material Summary" },
  // ];

  // Common classes
  const sidebarClasses = `
    fixed top-0 left-0 h-full w-64 bg-gray-800 text-white z-10 
    transition-transform duration-300
    ${isOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0 lg:flex lg:flex-col
  `;

  const navItemClasses = (isActive) => `
    hover:bg-gray-700 p-2 rounded-lg 
    ${isActive ? "bg-gray-700" : ""}
  `;

  return (
    <div className="relative h-screen">
      {/* Mobile Toggle Button */}
      <button
        className="lg:hidden p-4 text-white bg-gray-800 fixed z-20 top-2 left-2"
        onClick={toggleSidebar}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar */}
      <div className={sidebarClasses}>
        {/* Logo */}
        <div className="p-4 flex justify-center">
          <img
            src={logo}
            alt="Optima Polyplast Logo"
            className="w-[13.75rem] h-[8.75rem]" // Converted 55/35 to rem (assuming 16px base)
            loading="lazy" // Added for performance
          />
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
          <ul className="space-y-4 p-4">
            {navItems.slice(0, 4).map(({ path, icon: Icon, label }) => (
              <li key={path} className={navItemClasses(pathname === path)}>
                <Link to={path} className="flex items-center space-x-3 text-white">
                  <Icon />
                  <span>{label}</span>
                </Link>
              </li>
            ))}

            {/* Stock Dropdown - placed after Product */}
            {/* <li className="hover:bg-gray-700 p-2 rounded-lg">
              <button
                onClick={toggleStockDropdown}
                className="flex items-center space-x-3 text-white w-full"
              >
                <FaBox />
                <span>Stock</span>
                <FaChevronDown
                  size={12}
                  className={`ml-auto transition-transform ${
                    isStockDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isStockDropdownOpen && (
                <ul className="mt-2 ml-4 space-y-2 border-l border-gray-600 pl-4">
                  {stockDropdownItems.map(({ path, label }) => (
                    <li key={path}>
                      <Link
                        to={path}
                        className={`text-sm text-white hover:text-gray-300 block ${
                          pathname === path ? "font-bold text-blue-400" : ""
                        }`}
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li> */}

            {/* Remaining items after Stock */}
            {navItems.slice(4).map(({ path, icon: Icon, label }) => (
              <li key={path} className={navItemClasses(pathname === path)}>
                <Link to={path} className="flex items-center space-x-3 text-white">
                  <Icon />
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Background Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
};

export default Sidebar;