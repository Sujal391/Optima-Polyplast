
// import React, { useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// // import Navbar from "./Navbar";


// // Create an Axios instance with a base URL and request interceptor for auth token.
// const api = axios.create({
//   baseURL: "https://rewa-project.onrender.com/api",
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("token");
//     if (token) {
//       config.headers.Authorization = token.startsWith("Bearer ")
//         ? token
//         : `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const Attendance = () => {
//   // --- State for Check-In ---
//   const [selectedDateCheckIn, setSelectedDateCheckIn] = useState("");
//   const [checkInImage, setCheckInImage] = useState(null);
//   const [errorCheckIn, setErrorCheckIn] = useState("");
//   const [successMessageCheckIn, setSuccessMessageCheckIn] = useState("");
//   const [loadingCheckIn, setLoadingCheckIn] = useState(false);

//   // --- State for Check-Out ---
//   const [selectedDateCheckOut, setSelectedDateCheckOut] = useState("");
//   const [errorCheckOut, setErrorCheckOut] = useState("");
//   const [successMessageCheckOut, setSuccessMessageCheckOut] = useState("");
//   const [loadingCheckOut, setLoadingCheckOut] = useState(false);

//   // --- Handle Check-In Submission ---
//   const handleCheckIn = async (e) => {
//     e.preventDefault();
//     setLoadingCheckIn(true);
//     setErrorCheckIn("");

//     // Validate date and file input
//     if (!selectedDateCheckIn) {
//       setErrorCheckIn("Please select a date for check-in");
//       setLoadingCheckIn(false);
//       return;
//     }
//     if (!checkInImage) {
//       setErrorCheckIn("Please upload a check-in image");
//       setLoadingCheckIn(false);
//       return;
//     }

//     // Validate the file type
//     const fileType = checkInImage.type.split("/")[0];
//     if (fileType !== "image") {
//       setErrorCheckIn("Uploaded file is not an image");
//       setLoadingCheckIn(false);
//       return;
//     }

//     // Prepare form data for the check-in endpoint.
//     const formData = new FormData();
//     formData.append("selectedDate", selectedDateCheckIn);
//     formData.append("checkInImage", checkInImage);

//     try {
//       const response = await api.post("/reception/check-in", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });
//       setSuccessMessageCheckIn(response.data.message);
//       setErrorCheckIn("");
//       setCheckInImage(null);
//     } catch (err) {
//       setErrorCheckIn(
//         err.response?.data?.error || "Error during check-in"
//       );
//     } finally {
//       setLoadingCheckIn(false);
//     }
//   };

//   // --- Handle Check-Out Submission ---
//   const handleCheckOut = async (e) => {
//     e.preventDefault();
//     setLoadingCheckOut(true);
//     setErrorCheckOut("");

//     // Validate check-out date input
//     if (!selectedDateCheckOut) {
//       setErrorCheckOut("Please select a date for check-out");
//       setLoadingCheckOut(false);
//       return;
//     }

//     try {
//       const response = await api.post("/reception/check-out", {
//         selectedDate: selectedDateCheckOut,
//       });
//       setSuccessMessageCheckOut(response.data.message);
//       setErrorCheckOut("");
//     } catch (err) {
//       setErrorCheckOut(
//         err.response?.data?.error || "Error during check-out"
//       );
//     } finally {
//       setLoadingCheckOut(false);
//     }
//   };

//   // --- When Check-In date is selected, automatically set Check-Out date to same value ---
//   const handleCheckInDateChange = (e) => {
//     const selectedDate = e.target.value;
//     setSelectedDateCheckIn(selectedDate);
//     setSelectedDateCheckOut(selectedDate);
//   };

//   return (

//     <>
//     {/* <Navbar /> */}
//     <div className="container mx-auto p-6">
//       {/* Title */}
//       <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
//         Attendance Management
//       </h1>

//       {/* Flex container for both forms; centered on the page */}
//       <div className="flex flex-col md:flex-row justify-center items-start md:space-x-6 space-y-6 md:space-y-0">
//         {/* --- Check-In Form --- */}
//         <div className="bg-white shadow-xl rounded-lg p-8 w-full md:w-96">
//           <h2 className="text-2xl font-semibold text-center mb-6">Check-In</h2>
//           {errorCheckIn && (
//             <p className="text-red-500 text-center mb-4">{errorCheckIn}</p>
//           )}
//           {successMessageCheckIn && (
//             <p className="text-green-500 text-center mb-4">
//               {successMessageCheckIn}
//             </p>
//           )}
//           <form onSubmit={handleCheckIn}>
//             {/* Date Picker */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-600 mb-2">
//                 Select Check-In Date
//               </label>
//               <input
//                 type="date"
//                 value={selectedDateCheckIn}
//                 onChange={handleCheckInDateChange}
//                 className="w-full p-3 border border-gray-300 rounded-lg"
//                 required
//               />
//             </div>
//             {/* File Input */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-600 mb-2">
//                 Upload Check-In Image
//               </label>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={(e) => setCheckInImage(e.target.files[0])}
//                 className="w-full p-3 border border-gray-300 rounded-lg"
//                 required
//               />
//             </div>
//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loadingCheckIn}
//               className={`w-full bg-blue-500 text-white py-3 rounded-lg transition duration-300 ${
//                 loadingCheckIn
//                   ? "opacity-50 cursor-not-allowed"
//                   : "hover:bg-blue-600"
//               }`}
//             >
//               {loadingCheckIn ? "Processing..." : "Complete Check-In"}
//             </button>
//           </form>
//         </div>

//         {/* --- Check-Out Form --- */}
//         <div className="bg-white shadow-xl rounded-lg p-8 w-full md:w-96">
//           <h2 className="text-2xl font-semibold text-center mb-6">
//             Check-Out
//           </h2>
//           {errorCheckOut && (
//             <p className="text-red-500 text-center mb-4">{errorCheckOut}</p>
//           )}
//           {successMessageCheckOut && (
//             <p className="text-green-500 text-center mb-4">
//               {successMessageCheckOut}
//             </p>
//           )}
//           <form onSubmit={handleCheckOut}>
//             {/* Date Picker */}
//             <div className="mb-6">
//               <label className="block text-sm font-medium text-gray-600 mb-2">
//                 Select Check-Out Date
//               </label>
//               <input
//                 type="date"
//                 value={selectedDateCheckOut}
//                 onChange={(e) => setSelectedDateCheckOut(e.target.value)}
//                 className="w-full p-3 border border-gray-300 rounded-lg"
//                 required
//               />
//             </div>
//             {/* Submit Button */}
//             <button
//               type="submit"
//               disabled={loadingCheckOut}
//               className={`w-full bg-green-500 text-white py-3 rounded-lg transition duration-300 ${
//                 loadingCheckOut
//                   ? "opacity-50 cursor-not-allowed"
//                   : "hover:bg-green-600"
//               }`}
//             >
//               {loadingCheckOut ? "Processing..." : "Complete Check-Out"}
//             </button>
//           </form>
//         </div>
//       </div>

//     </div>
//     </>
//   );
// };

// export default Attendance;





import React, { useState } from "react";
import axios from "axios";
import cookies from 'js-cookie';

// Create an Axios instance with a base URL and request interceptor for auth token.
// const api = axios.create({
//   baseURL: "https://rewa-project.onrender.com/api",
// });

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

api.interceptors.request.use(
  (config) => {
    // const token = localStorage.getItem("token");
      const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const Attendance = () => {
  // Get today's date in the format YYYY-MM-DD
  const today = new Date().toISOString().split("T")[0];

  // --- State for Check-In ---
  const [checkInImage, setCheckInImage] = useState(null);
  const [errorCheckIn, setErrorCheckIn] = useState("");
  const [successMessageCheckIn, setSuccessMessageCheckIn] = useState("");
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);

  // --- State for Check-Out ---
  const [errorCheckOut, setErrorCheckOut] = useState("");
  const [successMessageCheckOut, setSuccessMessageCheckOut] = useState("");
  const [loadingCheckOut, setLoadingCheckOut] = useState(false);

  // --- Handle Check-In Submission ---
  const handleCheckIn = async (e) => {
    e.preventDefault();
    setLoadingCheckIn(true);
    setErrorCheckIn("");

    // Validate file input
    if (!checkInImage) {
      setErrorCheckIn("Please upload a check-in image");
      setLoadingCheckIn(false);
      return;
    }

    // Validate the file type
    const fileType = checkInImage.type.split("/")[0];
    if (fileType !== "image") {
      setErrorCheckIn("Uploaded file is not an image");
      setLoadingCheckIn(false);
      return;
    }

    // Prepare form data for the check-in endpoint.
    const formData = new FormData();
    formData.append("selectedDate", today);
    formData.append("checkInImage", checkInImage);

    console.log('Check-in request data:', { selectedDate: today, hasImage: !!checkInImage });

    try {
      const response = await api.post("/reception/check-in", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log('Check-in success response:', response.data);
      setSuccessMessageCheckIn(response.data.message);
      setErrorCheckIn("");
      setCheckInImage(null);
    } catch (err) {
      console.error('Check-in error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
      setErrorCheckIn(
        err.response?.data?.error || "Error during check-in"
      );
    } finally {
      setLoadingCheckIn(false);
    }
  };

  // --- Handle Check-Out Submission ---
  const handleCheckOut = async (e) => {
    e.preventDefault();
    setLoadingCheckOut(true);
    setErrorCheckOut("");

    console.log('Check-out request data:', { selectedDate: today });
    console.log('Today value:', today);

    try {
      const response = await api.post("/reception/check-out", {
        selectedDate: today,
      });
      console.log('Check-out success response:', response.data);
      setSuccessMessageCheckOut(response.data.message);
      setErrorCheckOut("");
    } catch (err) {
      console.error('Check-out error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      setErrorCheckOut(
        err.response?.data?.error || "Error during check-out"
      );
    } finally {
      setLoadingCheckOut(false);
    }
  };

  return (
   <div className="bg-green-100 min-h-screen"> 
    <div className="container mx-auto p-6">
      {/* Title */}
      <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
        Attendance Management
      </h1>

      {/* Flex container for both forms */}
      <div className="flex flex-col md:flex-row justify-center items-start md:space-x-6 space-y-6 md:space-y-0">
        {/* --- Check-In Form --- */}
        <div className="bg-stone-200 shadow-xl rounded-lg p-8 w-full md:w-96">
          <h2 className="text-2xl font-semibold text-center mb-6">Check-In</h2>
          {errorCheckIn && (
            <p className="text-red-500 text-center mb-4">{errorCheckIn}</p>
          )}
          {successMessageCheckIn && (
            <p className="text-green-500 text-center mb-4">
              {successMessageCheckIn}
            </p>
          )}
          <form onSubmit={handleCheckIn}>
            {/* Date Picker (Fixed to Today) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Check-In Date (Fixed to Today)
              </label>
              <input
                type="date"
                value={today}
                min={today}
                max={today}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            {/* File Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Upload Check-In Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                    if (!validTypes.includes(file.type) || file.size > 1024 * 1024) {
                      setErrorCheckIn("upload valid image less than 1 mb");
                      e.target.value = "";
                      return;
                    }
                    setCheckInImage(file);
                  }
                }}
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg"
                required
              />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingCheckIn}
              className={`w-full bg-blue-500 text-white py-3 rounded-lg transition duration-300 ${
                loadingCheckIn
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-blue-600"
              }`}
            >
              {loadingCheckIn ? "Processing..." : "Complete Check-In"}
            </button>
          </form>
        </div>

        {/* --- Check-Out Form --- */}
        <div className="bg-stone-200 shadow-xl rounded-lg p-8 w-full md:w-96">
          <h2 className="text-2xl font-semibold text-center mb-6">
            Check-Out
          </h2>
          {errorCheckOut && (
            <p className="text-red-500 text-center mb-4">{errorCheckOut}</p>
          )}
          {successMessageCheckOut && (
            <p className="text-green-500 text-center mb-4">
              {successMessageCheckOut}
            </p>
          )}
          <form onSubmit={handleCheckOut}>
            {/* Date Picker (Fixed to Today) */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Check-Out Date (Fixed to Today)
              </label>
              <input
                type="date"
                value={today}
                min={today}
                max={today}
                className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loadingCheckOut}
              className={`w-full bg-green-500 text-white py-3 rounded-lg transition duration-300 ${
                loadingCheckOut
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-green-600"
              }`}
            >
              {loadingCheckOut ? "Processing..." : "Complete Check-Out"}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
  );
};

export default Attendance;
