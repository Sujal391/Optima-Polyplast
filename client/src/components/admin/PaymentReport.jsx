import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import cookies from 'js-cookie';
import { format } from "date-fns";
import * as XLSX from 'xlsx';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Filter states
  const [fromDate, setFromDate] = useState("2026-03-11");
  const [toDate, setToDate] = useState("2026-12-31");
  const [paymentMode, setPaymentMode] = useState("all");

  const api = axios.create({
    baseURL: process.env.REACT_APP_API,
  });

  api.interceptors.request.use(
    (config) => {
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

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const modeParam = paymentMode === "all" ? "" : `&paymentMode=${paymentMode}`;
      const response = await api.get(
        `/admin/payments/history?fromDate=${fromDate}&toDate=${toDate}${modeParam}`
      );
      
      setPayments(response.data.payments);
      setSummary(response.data.summary);
      setTotalRecords(response.data.totalRecords);
      setLoading(false);
    } catch (err) {
      setError(
        err.response?.status === 401
          ? "Session expired. Please login again."
          : "Error fetching payment history. Please try again later."
      );
      if (err.response?.status === 401) {
        cookies.remove("token");
        window.location.href = "/";
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fromDate, toDate, paymentMode]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleDownloadExcel = () => {
    if (payments.length === 0) {
      alert("No data to download");
      return;
    }

    setDownloading(true);

    // Prepare data for Excel - only selected columns
    const excelData = payments.map(payment => ({
      'Payment ID': payment.paymentId,
      'Order ID': payment.orderId,
      'Firm Name': payment.firmName,
      'User Code': payment.userCode,
      'Customer Name': payment.customerName,
      'Phone Number': payment.phoneNumber,
      'Payment Mode': payment.paymentMode,
      'Submitted Amount (₹)': payment.submittedAmount,
      'Payment Date': format(new Date(payment.paymentDate), 'dd-MM-yyyy HH:mm:ss'),
      'Order Status': payment.orderStatus
    }));

    // Create worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData, { skipHeader: false });
    
    // Set column widths
    const colWidths = [
      { wch: 25 }, // Payment ID
      { wch: 25 }, // Order ID
      { wch: 20 }, // Firm Name
      { wch: 15 }, // User Code
      { wch: 20 }, // Customer Name
      { wch: 15 }, // Phone Number
      { wch: 15 }, // Payment Mode
      { wch: 20 }, // Submitted Amount
      { wch: 20 }, // Payment Date
      { wch: 15 }, // Order Status
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');
    
    // Generate filename with date range
    const fileName = `payment_history_${fromDate}_to_${toDate}.xlsx`;
    
    // Save file
    XLSX.writeFile(wb, fileName);
    setDownloading(false);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "verified":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentModeColor = (mode) => {
    return mode === "online" 
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-purple-100 text-purple-800 border-purple-200";
  };

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar isOpen={isSidebarOpen} />

      <motion.div
        className={`flex-1 p-6 transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-0"
        }`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Payment History</h1>
            <p className="text-sm text-gray-500 mt-1">
              View and manage all payment transactions
            </p>
          </div>
          
          {/* Download Button */}
          {payments.length > 0 && (
            <motion.button
              onClick={handleDownloadExcel}
              disabled={downloading}
              className={`px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex items-center gap-2 ${
                downloading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {downloading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download Excel</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Filters Section */}
        <motion.div
          className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All</option>
                <option value="online">Online</option>
                <option value="cash">Cash</option>
              </select>
            </div>
            
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Apply Filters
            </button>
          </form>
        </motion.div>

        {/* Summary Cards */}
        {summary && !loading && (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            <motion.div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total Records</p>
              <p className="text-2xl font-bold text-gray-800">{totalRecords}</p>
            </motion.div>
            
            <motion.div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Total Submitted</p>
              <p className="text-2xl font-bold text-yellow-600">
                ₹{summary.totalSubmittedAmount.toLocaleString()}
              </p>
            </motion.div>
            
            <motion.div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Cash Payments</p>
              <p className="text-2xl font-bold text-purple-600">
                ₹{summary.totalCash.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total cash transactions</p>
            </motion.div>
            
            <motion.div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500">Online Payments</p>
              <p className="text-2xl font-bold text-blue-600">
                ₹{summary.totalOnline.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total online transactions</p>
            </motion.div>
          </motion.div>
        )}

        {/* Payments Table */}
        <AnimatePresence>
          {loading ? (
            <motion.div
              className="text-center text-xl text-gray-600 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              Loading payment history...
            </motion.div>
          ) : error ? (
            <motion.div
              className="text-center text-red-500 font-semibold mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {error}
            </motion.div>
          ) : (
            <motion.div
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {payments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No payments found for the selected filters</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Firm
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Mode
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                        <motion.tr
                          key={payment._id}
                          className="hover:bg-gray-50 transition-colors"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.paymentId.slice(-8)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Order: {payment.orderId.slice(-8)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.customerName}
                            </div>
                            <div className="text-xs text-gray-500">
                              {payment.userCode} | {payment.phoneNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{payment.firmName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ₹{payment.paidAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total: ₹{payment.totalAmount.toLocaleString()}
                            </div>
                            <div className="text-xs text-orange-500">
                              Remaining: ₹{payment.remainingAmount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPaymentModeColor(payment.paymentMode)}`}>
                              {payment.paymentMode}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(payment.paymentDate)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 border border-gray-200">
                              {payment.orderStatus}
                            </span>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default PaymentHistory;