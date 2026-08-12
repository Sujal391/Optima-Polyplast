// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Sidebar from "../../admin/components/sidebar";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API,
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

// const StockHistory = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [stockHistory, setStockHistory] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [error, setError] = useState(null);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   useEffect(() => {
//     fetchStockHistory();
//   }, []);

//   const fetchStockHistory = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No authentication token found');

//       const params = {};
//       if (startDate) params.startDate = startDate.toISOString();
//       if (endDate) params.endDate = endDate.toISOString();

//       const response = await api.get('https://rewa-project.onrender.com/api/admin/stock/full-history', { params });
//       if (response.data.success) {
//         const sortedHistory = response.data.history.map(stock => ({
//           ...stock,
//           updateHistory: [...stock.updateHistory].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
//         }));
//         setStockHistory(sortedHistory);
//         setSummary(response.data.summary);
//         setError(null);
//       }
//     } catch (error) {
//       console.error('Error fetching stock history:', error);
//       setError(error.response?.data?.details || error.message);
//       setStockHistory([]);
//       setSummary(null);
//       if (error.response?.status === 401 || error.message === 'No authentication token found') {
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//       }
//     }
//   };

//   const handleFilter = () => fetchStockHistory();

//   const handleDownload = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No authentication token found');

//       const params = {};
//       if (startDate) params.startDate = startDate.toISOString();
//       if (endDate) params.endDate = endDate.toISOString();

//       const response = await api.get(
//         '/admin/stock/full-history/download',
//         {
//           params,
//           responseType: 'blob',
//         }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'Full_Stock_History.xlsx');
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       setError(null);
//     } catch (error) {
//       console.error('Error downloading stock history:', error);
//       setError(error.response?.data?.details || error.message || 'Error downloading file');
//       if (error.response?.status === 401 || error.message === 'No authentication token found') {
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//       }
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       <Sidebar isOpen={isSidebarOpen} />

//       <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} p-6`}>
//         <header className="flex justify-between items-center bg-white px-6 py-4 shadow-lg rounded-lg mb-6">
//           <div className="flex items-center gap-4">
//             <button
//               className="lg:hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
//               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             >
//               ☰
//             </button>
//             <h1 className="text-3xl font-bold text-gray-800">Stock History</h1>
//           </div>
//           <button
//             onClick={handleDownload}
//             className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-lg shadow-md hover:from-green-600 hover:to-teal-700 transition-all"
//           >
//             Download History
//           </button>
//         </header>

//         <main>
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-md border border-red-200">
//               {error}
//             </div>
//           )}

//           <section className="bg-white rounded-xl shadow-xl p-6">
//             <div className="mb-8 flex items-end gap-4">
//               <div className="flex gap-2">
//                 <div>
//                   <label className="block mb-2 font-medium text-gray-800">Start Date</label>
//                   <DatePicker
//                     selected={startDate}
//                     onChange={(date) => setStartDate(date)}
//                     className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     dateFormat="dd/MM/yyyy"
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-2 font-medium text-gray-700">End Date</label>
//                   <DatePicker
//                     selected={endDate}
//                     onChange={(date) => setEndDate(date)}
//                     className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     dateFormat="dd/MM/yyyy"
//                   />
//                 </div>
//               </div>
//               <button
//                 onClick={handleFilter}
//                 className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
//               >
//                 Filter
//               </button>
//             </div>

//             {summary && (
//               <div className="mb-8 grid grid-cols-1 sm:grid-cols-3 gap-6">
//                 <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-blue-700">Total Records</p>
//                   <p className="text-3xl font-bold text-blue-900">{summary.totalRecords}</p>
//                 </div>
//                 <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-green-700">Total Updates</p>
//                   <p className="text-3xl font-bold text-green-900">{summary.totalUpdates}</p>
//                 </div>
//                 <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-purple-700">Products Tracked</p>
//                   <p className="text-3xl font-bold text-purple-900">{summary.productsTracked}</p>
//                 </div>
//               </div>
//             )}

//             <div className="overflow-x-auto rounded-lg shadow-md">
//               <table className="w-full border-collapse bg-white">
//                 <thead>
//                   <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
//                     <th className="p-4 text-left text-gray-700 font-semibold">Product</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Current Quantity</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Last Updated</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Update History</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stockHistory.map((stock) => (
//                     <tr key={stock.productId} className="border-b hover:bg-gray-50 transition-colors">
//                       <td className="p-4">
//                         <p className="font-semibold text-gray-800">{stock.productName}</p>
//                         <p className="text-sm text-gray-600">{stock.productDescription}</p>
//                       </td>
//                       <td className="p-4 text-gray-700">{stock.currentQuantity}</td>
//                       <td className="p-4 text-gray-700">
//                         {new Date(stock.lastUpdated).toLocaleString()}
//                         <p className="text-sm text-gray-600">
//                           By: {stock.lastUpdatedBy?.name} ({stock.lastUpdatedBy?.email})
//                         </p>
//                       </td>
//                       <td className="p-4">
//                         <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                           {stock.updateHistory.map((update, index) => (
//                             <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg shadow-sm">
//                               <p className="text-sm font-medium text-gray-800">
//                                 {new Date(update.updatedAt).toLocaleString()}
//                               </p>
//                               <p className="text-sm text-gray-700">
//                                 {update.changeType}: <span className="font-medium">{update.quantity}</span>
//                               </p>
//                               <p className="text-sm text-gray-600">
//                                 By: {update.updatedBy?.name} ({update.updatedBy?.email})
//                               </p>
//                               {update.notes && (
//                                 <p className="text-sm text-gray-500 italic">Notes: {update.notes}</p>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </main>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 3px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #888;
//           border-radius: 3px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #555;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default StockHistory;

// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import Sidebar from "../../admin/components/sidebar";
// import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API,
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

// const StockHistory = () => {
//   const [isSidebarOpen, setIsSidebarOpen] = useState(true);
//   const [stockHistory, setStockHistory] = useState([]);
//   const [summary, setSummary] = useState(null);
//   const [error, setError] = useState(null);
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   useEffect(() => {
//     fetchStockHistory();
//   }, []);

//   const fetchStockHistory = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No authentication token found');

//       const params = {};
//       if (startDate) params.startDate = startDate.toISOString();
//       if (endDate) params.endDate = endDate.toISOString();

//       const response = await api.get('https://rewa-project.onrender.com/api/admin/stock/full-history', { params });
//       if (response.data.success) {
//         setStockHistory(response.data.history);
//         setSummary(response.data.summary);
//         setError(null);
//       }
//     } catch (error) {
//       console.error('Error fetching stock history:', error);
//       setError(error.response?.data?.details || error.message);
//       setStockHistory([]);
//       setSummary(null);
//       if (error.response?.status === 401 || error.message === 'No authentication token found') {
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//       }
//     }
//   };

//   const handleFilter = () => fetchStockHistory();

//   const handleDownload = async () => {
//     try {
//       const token = localStorage.getItem('token');
//       if (!token) throw new Error('No authentication token found');

//       const params = {};
//       if (startDate) params.startDate = startDate.toISOString();
//       if (endDate) params.endDate = endDate.toISOString();

//       const response = await api.get(
//         '/admin/stock/full-history/download',
//         {
//           params,
//           responseType: 'blob',
//         }
//       );

//       const url = window.URL.createObjectURL(new Blob([response.data]));
//       const link = document.createElement('a');
//       link.href = url;
//       link.setAttribute('download', 'Full_Stock_History.xlsx');
//       document.body.appendChild(link);
//       link.click();
//       link.remove();
//       window.URL.revokeObjectURL(url);

//       setError(null);
//     } catch (error) {
//       console.error('Error downloading stock history:', error);
//       setError(error.response?.data?.details || error.message || 'Error downloading file');
//       if (error.response?.status === 401 || error.message === 'No authentication token found') {
//         localStorage.removeItem('token');
//         window.location.href = '/login';
//       }
//     }
//   };

//   return (
//     <div className="flex min-h-screen bg-gray-100">
//       <Sidebar isOpen={isSidebarOpen} />

//       <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} p-6`}>
//         <header className="flex justify-between items-center bg-white px-6 py-4 shadow-lg rounded-lg mb-6">
//           <div className="flex items-center gap-4">
//             <button
//               className="lg:hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
//               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//             >
//               ☰
//             </button>
//             <h1 className="text-3xl font-bold text-gray-800">Stock History</h1>
//           </div>
//           <button
//             onClick={handleDownload}
//             className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-lg shadow-md hover:from-green-600 hover:to-teal-700 transition-all"
//           >
//             Download History
//           </button>
//         </header>

//         <main>
//           {error && (
//             <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-md border border-red-200">
//               {error}
//             </div>
//           )}

//           <section className="bg-white rounded-xl shadow-xl p-6">
//             <div className="mb-8 flex items-end gap-4">
//               <div className="flex gap-2">
//                 <div>
//                   <label className="block mb-2 font-medium text-gray-800">Start Date</label>
//                   <DatePicker
//                     selected={startDate}
//                     onChange={(date) => setStartDate(date)}
//                     className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     dateFormat="dd/MM/yyyy"
//                   />
//                 </div>
//                 <div>
//                   <label className="block mb-2 font-medium text-gray-700">End Date</label>
//                   <DatePicker
//                     selected={endDate}
//                     onChange={(date) => setEndDate(date)}
//                     className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
//                     dateFormat="dd/MM/yyyy"
//                   />
//                 </div>
//               </div>
//               <button
//                 onClick={handleFilter}
//                 className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
//               >
//                 Filter
//               </button>
//             </div>

//             {summary && (
//               <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//                 <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-blue-700">Total Records</p>
//                   <p className="text-3xl font-bold text-blue-900">{summary.totalRecords}</p>
//                 </div>
//                 <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-green-700">Total Updates</p>
//                   <p className="text-3xl font-bold text-green-900">{summary.totalUpdates}</p>
//                 </div>
//                 <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-purple-700">Products Tracked</p>
//                   <p className="text-3xl font-bold text-purple-900">{summary.productsTracked}</p>
//                 </div>
//                 <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-md">
//                   <p className="font-semibold text-orange-700">Total Added by Stock</p>
//                   <p className="text-3xl font-bold text-orange-900">{summary.totalAddedByStock}</p>
//                 </div>
//               </div>
//             )}

//             <div className="overflow-x-auto rounded-lg shadow-md">
//               <table className="w-full border-collapse bg-white">
//                 <thead>
//                   <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
//                     <th className="p-4 text-left text-gray-700 font-semibold">Last Updated</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Product</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Current Quantity</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Total Added by Stock</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Stock Additions</th>
//                     <th className="p-4 text-left text-gray-700 font-semibold">Update History</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {stockHistory.map((stock) => (
//                     <tr key={stock.productId} className="border-b hover:bg-gray-50 transition-colors">
//                       <td className="p-4 text-gray-700">
//                         {new Date(stock.lastUpdated).toLocaleString()}
//                         <p className="text-sm text-gray-600">
//                           By: {stock.lastUpdatedBy?.name} ({stock.lastUpdatedBy?.email})
//                           <span className="ml-1">[{stock.lastUpdatedBy?.role}]</span>
//                         </p>
//                       </td>
//                       <td className="p-4">
//                         <p className="font-semibold text-gray-800">{stock.productName}</p>
//                         <p className="text-sm text-gray-600">{stock.productDescription}</p>
//                       </td>
//                       <td className="p-4 text-gray-700">{stock.currentQuantity}</td>
//                       <td className="p-4 text-gray-700">{stock.totalAddedByStock}</td>
//                       <td className="p-4">
//                         <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                           {[...stock.stockAdditionHistory].reverse().map((addition, index) => (
//                             <div key={index} className="mb-2 p-2 bg-orange-100 rounded-lg shadow-sm">
//                               <p className="text-sm text-orange-700">
//                                 {new Date(addition.date).toLocaleString()}
//                               </p>
//                               <p className="text-sm text-orange-600">
//                                 Added: <span className="font-medium">{addition.quantity}</span>
//                               </p>
//                               <p className="text-sm text-orange-500">
//                                 By: {addition.updatedBy?.name} ({addition.updatedBy?.email})
//                               </p>
//                             </div>
//                           ))}
//                         </div>
//                       </td>
//                       <td className="p-4">
//                         <div className="max-h-48 overflow-y-auto custom-scrollbar">
//                           {[...stock.updateHistory].reverse().map((update, index) => (
//                             <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg shadow-sm">
//                               <p className="text-sm font-medium text-gray-800">
//                                 {new Date(update.updatedAt).toLocaleString()}
//                               </p>
//                               <p className="text-sm text-gray-700">
//                                 {update.changeType}: <span className="font-medium">{update.quantity}</span>
//                               </p>
//                               <p className="text-sm text-gray-600">
//                                 By: {update.updatedBy?.name} ({update.updatedBy?.email})
//                                 <span className="ml-1">[{update.updatedBy?.role}]</span>
//                               </p>
//                               {update.notes && (
//                                 <p className="text-sm text-gray-500 italic">Notes: {update.notes}</p>
//                               )}
//                             </div>
//                           ))}
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </section>
//         </main>
//       </div>

//       <style jsx>{`
//         .custom-scrollbar::-webkit-scrollbar {
//           width: 6px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-track {
//           background: #f1f1f1;
//           border-radius: 3px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb {
//           background: #888;
//           border-radius: 3px;
//         }
//         .custom-scrollbar::-webkit-scrollbar-thumb:hover {
//           background: #555;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default StockHistory;

import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cookies from "js-cookie";
import Paginator from "../shared/Paginator";

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

const StockHistory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stockHistory, setStockHistory] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchStockHistory();
  }, []);

  const fetchStockHistory = async () => {
    try {
      // const token = localStorage.getItem('token');
      const token = cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await api.get("/admin/stock/full-history", { params });
      if (response.data.success) {
        setStockHistory(response.data.history);
        setSummary(response.data.summary);
        setError(null);
      }
    } catch (error) {
      console.error("Error fetching stock history:", error);
      setError(error.response?.data?.details || error.message);
      setStockHistory([]);
      setSummary(null);
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found"
      ) {
        cookies.remove("token");
        window.location.href = "/login";
      }
    }
  };

  const handleFilter = () => fetchStockHistory();

  const handleDownload = async () => {
    try {
      // const token = localStorage.getItem('token');
      const token = cookies.get("token");
      if (!token) throw new Error("No authentication token found");

      const params = {};
      if (startDate) params.startDate = startDate.toISOString();
      if (endDate) params.endDate = endDate.toISOString();

      const response = await api.get("/admin/stock/full-history/download", {
        params,
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Full_Stock_History.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setError(null);
    } catch (error) {
      console.error("Error downloading stock history:", error);
      setError(
        error.response?.data?.details ||
          error.message ||
          "Error downloading file"
      );
      if (
        error.response?.status === 401 ||
        error.message === "No authentication token found"
      ) {
        cookies.remove("token");
        window.location.href = "/login";
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={isSidebarOpen} />

      <div
        className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} p-6`}
      >
        <header className="flex justify-between items-center bg-white px-6 py-4 shadow-lg rounded-lg mb-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              ☰
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Stock History</h1>
          </div>
          <button
            onClick={handleDownload}
            className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-2 rounded-lg shadow-md hover:from-green-600 hover:to-teal-700 transition-all"
          >
            Download History
          </button>
        </header>

        <main>
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg shadow-md border border-red-200">
              {error}
            </div>
          )}

          <section className="bg-white rounded-xl shadow-xl p-6">
            <div className="mb-8 flex items-end gap-4">
              <div className="flex gap-2">
                <div>
                  <label className="block mb-2 font-medium text-gray-800">
                    Start Date
                  </label>
                  <DatePicker
                    selected={startDate}
                    onChange={(date) => setStartDate(date)}
                    placeholderText="DD/MM/YYYY"
                    className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium text-gray-700">
                    End Date
                  </label>
                  <DatePicker
                    selected={endDate}
                    onChange={(date) => setEndDate(date)}
                    placeholderText="DD/MM/YYYY"
                    className="w-32 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    dateFormat="dd/MM/yyyy"
                  />
                </div>
              </div>
              <button
                onClick={handleFilter}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-indigo-700 transition-all"
              >
                Filter
              </button>
            </div>

            {summary && (
              <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow-md">
                  <p className="font-semibold text-blue-700">Total Records</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {summary.totalRecords}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow-md">
                  <p className="font-semibold text-green-700">Total Updates</p>
                  <p className="text-3xl font-bold text-green-900">
                    {summary.totalUpdates}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow-md">
                  <p className="font-semibold text-purple-700">
                    Products Tracked
                  </p>
                  <p className="text-3xl font-bold text-purple-900">
                    {summary.productsTracked}
                  </p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow-md">
                  <p className="font-semibold text-orange-700">
                    Total Added by Stock
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {summary.totalAddedByStock}
                  </p>
                </div>
              </div>
            )}

            <div className="overflow-x-auto rounded-lg shadow-md">
              <table className="w-full border-collapse bg-white">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-100 to-gray-200">
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Last Updated
                    </th>
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Product
                    </th>
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Current Quantity
                    </th>
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Total Added by Stock
                    </th>
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Stock Additions
                    </th>
                    <th className="p-4 text-left text-gray-700 font-semibold">
                      Update History
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    // Pagination logic
                    const startIndex = (page - 1) * pageSize;
                    const endIndex = startIndex + pageSize;
                    const pagedStockHistory = stockHistory.slice(
                      startIndex,
                      endIndex
                    );

                    return pagedStockHistory.map((stock) => (
                      <tr
                        key={stock.productId}
                        className="border-b hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-4 text-gray-700">
                          {new Date(stock.lastUpdated).toLocaleString("en-IN")}
                          <p className="text-sm text-gray-600">
                            By: {stock.lastUpdatedBy?.name} (
                            {stock.lastUpdatedBy?.email})
                            <span className="ml-1">
                              [{stock.lastUpdatedBy?.role}]
                            </span>
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold text-gray-800">
                            {stock.productName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {stock.productDescription}
                          </p>
                        </td>
                        <td className="p-4 text-gray-700">
                          {stock.currentQuantity}
                        </td>
                        <td className="p-4 text-gray-700">
                          {stock.totalAddedByStock}
                        </td>
                        <td className="p-4">
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {[...stock.stockAdditionHistory]
                              .reverse()
                              .map((addition, index) => (
                                <div
                                  key={index}
                                  className="mb-2 p-2 bg-orange-50 rounded-lg shadow-sm"
                                >
                                  <p className="text-sm text-orange-700">
                                    {new Date(addition.date).toLocaleString(
                                      "en-IN"
                                    )}
                                  </p>
                                  <p className="text-sm text-orange-600">
                                    Added:{" "}
                                    <span className="font-medium">
                                      {addition.quantity}
                                    </span>
                                  </p>
                                  <p className="text-sm text-orange-500">
                                    By: {addition.updatedBy?.name} (
                                    {addition.updatedBy?.email})
                                  </p>
                                </div>
                              ))}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {[...stock.updateHistory]
                              .reverse()
                              .map((update, index) => (
                                <div
                                  key={index}
                                  className="mb-3 p-3 bg-gray-50 rounded-lg shadow-sm"
                                >
                                  <p className="text-sm font-medium text-gray-800">
                                    {new Date(update.updatedAt).toLocaleString(
                                      "en-IN"
                                    )}
                                  </p>
                                  <p className="text-sm text-gray-700">
                                    {update.changeType}:{" "}
                                    <span className="font-medium">
                                      {update.quantity}
                                    </span>
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    By: {update.updatedBy?.name} (
                                    {update.updatedBy?.email})
                                    <span className="ml-1">
                                      [{update.updatedBy?.role}]
                                    </span>
                                  </p>
                                  {update.notes && (
                                    <p className="text-sm text-gray-500 italic">
                                      Notes: {update.notes}
                                    </p>
                                  )}
                                </div>
                              ))}
                          </div>
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {stockHistory.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pb-6 whitespace-nowrap">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, stockHistory.length)} of{" "}
                    {stockHistory.length} records
                  </div>
                  <Paginator
                    page={page}
                    total={stockHistory.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                  />
                  <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-gray-700">
                      Per page:
                    </label>
                    <select
                      id="pageSize"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1); // Reset to first page when changing page size
                      }}
                      className="border border-gray-300 rounded px-2 py-1 text-sm"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
};

export default StockHistory;
