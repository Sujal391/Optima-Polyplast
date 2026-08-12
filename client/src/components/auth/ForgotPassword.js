import React, { useState } from "react";
import bg from '../../assets/bg.jpg'
import logo from '../../assets/logo1.png'
import { Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle password recovery logic here
    console.log("Password reset email sent to: ", email);
  };

  return (
    <div
      className="h-screen bg-cover bg-center flex justify-start items-center pl-4"
      style={{
        backgroundImage: `url(${bg})`, // Use your background image
        backgroundSize: "cover", // Ensures the image covers the full container
      }}
    >
      {/* Form Container */}
      <div className="bg-white bg-opacity-100 rounded-2xl shadow-lg p-8 w-11/12 sm:w-10/12 md:w-8/12 lg:w-6/12 xl:w-4/12 mx-auto lg:ml-16">
        {/* Logo */}
        <div className="flex justify-center mb-5">
          <img
            src={logo} // Replace with your logo URL
            alt="Optima Polyplast Logo"
            className="w-44 h-32 sm:w-48 sm:h-36 md:w-56 md:h-40"
          />
        </div>
        <h1 className="text-3xl font-bold mb-2 text-gray-700 text-center">
          Forgot Password?
        </h1>
        <p className="text-gray-800 mb-5 text-center">
          Reset your password
        </p>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-gray-700 font-medium mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border rounded-md shadow-sm focus:ring focus:ring-yellow-300 focus:outline-none"
              required
            />
          </div>
          <div className="flex justify-center mb-6">
            <button
              type="submit"
              className="px-12 py-3 text-blue-900 text-lg font-bold bg-gradient-to-b from-gray-100 to-orange-600 rounded-xl shadow-md hover:shadow-lg transition duration-300"
            >
              Send Reset Link
            </button>
          </div>
          <div className="flex justify-center">
            <Link to="/" className="text-lg font-bold text-orange-500 hover:underline">
              Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
