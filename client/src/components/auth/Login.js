import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AiOutlineEyeInvisible, AiOutlineEye } from "react-icons/ai";
import bg from "../../assets/bg.jpg"; // Background image
import logo from "../../assets/logo1.png"; // Logo
import cookies from 'js-cookie';

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Use the environment variable from .env
  const API_URL = process.env.REACT_APP_API;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: identifier,
          userCode: identifier,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid credentials. Please try again.");
      }

      const userData = data.user || data;
      if (!userData) throw new Error("No user data received");

      const token = data.token || userData.token;
      if (!token) throw new Error("No authentication token received");

      const role = userData.role;
      if (!role) throw new Error("User role not found");

      // localStorage.setItem("token", `Bearer ${token}`);
      cookies.set("token", `Bearer ${token}`);
      // localStorage.setItem("userRole", role);
      cookies.set("userRole",role);

      const userCode = userData.customerDetails?.userCode || userData.userCode;
      if (userCode) {
        // localStorage.setItem("userCode", userCode);
        cookies.set("userCode", userCode);
      }

      navigate(getDashboardPath(role));
    } catch (error) {
      console.error("Login error details:", error);
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role) => {
    const dashboardRoutes = {
      admin: "/admin/dashboard",
      reception: "/reception/dashboard",
      stock: "/stock/dashboard",
      dispatch: "/dispatch/dashboard",
      sales: "/sales/dashboard",
      // marketing: "/marketing/dashboard",
      // user: "/user/dashboard",
      // miscellaneous: "/miscellaneous/dashboard",
    };
    return dashboardRoutes[role] || "/";
  };

  return (
    <div
      className="h-screen bg-cover bg-center flex items-center justify-center"
      style={{
        backgroundImage: `url(${bg})`,
      }}
    >
      <div className="bg-white bg-opacity-100 rounded-2xl shadow-lg p-8 w-11/12 sm:w-10/12 md:w-8/12 lg:w-6/12 xl:w-4/12 mx-auto lg:ml-16">
        <div className="flex justify-center mb-2">
          <img
            src={logo}
            alt="Optima Polyplast Logo"
            className="w-75 h-40"
          />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-gray-700 text-center">
          Welcome Back!
        </h1>
        <p className="text-gray-800 mb-4 text-center">Please Log In to Your Account</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-center">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="identifier" className="block text-gray-700 font-medium mb-2">
              Email or User Code
            </label>
            <input
              id="identifier"
              type="text"
              placeholder="Enter your email or user code"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-orange-300 focus:outline-none"
              disabled={isLoading}
              required
            />
          </div>

          <div className="mb-4 relative">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type={passwordVisible ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-orange-300 focus:outline-none"
              disabled={isLoading}
              required
            />
            <span
              className="absolute right-4 top-1/2 transform -translate-y-1/7 cursor-pointer"
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? (
                <AiOutlineEye size={24} className="text-gray-600" />
              ) : (
                <AiOutlineEyeInvisible size={24} className="text-gray-600" />
              )}
            </span>
          </div>

          {/* <div className="flex justify-end mb-6">
            <Link to="/ForgotPassword" className="text-sm sm:text-md text-orange-500 hover:underline">
              Forgot Password?
            </Link>
          </div> */}

          <div className="flex justify-center">
            <button
              type="submit"
              className="px-12 py-3 text-white text-lg font-bold bg-gradient-to-b from-orange-500 to-orange-700 rounded-lg shadow-md hover:shadow-lg transition duration-300 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;