import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cookies from 'js-cookie';
import Paginator from '../common/Paginator';

// Axios instance
const api = axios.create({ baseURL: process.env.REACT_APP_API });

api.interceptors.request.use((config) => {
  const token = cookies.get("token");
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      cookies.remove("token");
      try { window.location.href = "/"; } catch {}
    }
    return Promise.reject(err);
  }
);

// COMPONENT STARTS
export default function OrderManagement() {
  const [orderHistory, setOrderHistory] = useState([]);
  const [historyError, setHistoryError] = useState('');

  // Search
  const [search, setSearch] = useState("");

  // Modals
  const [detailModal, setDetailModal] = useState({
    isOpen: false, order: null,
  });

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formatCurrency = (amt) => amt ? `₹${amt.toFixed(2)}` : 'N/A';

  const formatShippingAddress = (address) => {
    if (!address) return 'N/A';
    const addressParts = [
      address.address,
      address.city,
      address.state,
      address.pinCode
    ].filter(Boolean);
    return addressParts.join(', ') || 'N/A';
  };

  const getPaymentStatusColor = (status) => {
    const colors = { 
      completed: 'text-green-600', 
      pending: 'text-red-600', 
      partial: 'text-yellow-600', 
      failed: 'text-red-600' 
    };
    return colors[status?.toLowerCase()] || 'text-gray-600';
  };

  const getOrderStatusColor = (status) => {
    const colors = {
      processing: 'text-blue-600',
      shipped: 'text-purple-600',
      delivered: 'text-green-600',
      cancelled: 'text-red-600'
    };
    return colors[status?.toLowerCase()] || 'text-gray-600';
  };

  const fetchOrderHistory = async () => {
    try {
      const res = await api.get("/reception/orders/history");
      setOrderHistory(res.data?.orders || []);
      setHistoryError("");
    } catch (err) {
      setHistoryError(err.response?.data?.message || "Error fetching orders");
    }
  };

  useEffect(() => { fetchOrderHistory(); }, []);

  // 👉 Filter Orders based on search
  const filteredOrders = orderHistory.filter((o) => {
    const query = search.toLowerCase();
    return (
      o._id?.toLowerCase().includes(query) ||
      o.user?.name?.toLowerCase().includes(query) ||
      o.user?.phoneNumber?.toLowerCase().includes(query) ||
      o.firmName?.toLowerCase().includes(query) ||
      o.user?.customerDetails?.firmName?.toLowerCase().includes(query) ||
      o.user?.customerDetails?.userCode?.toLowerCase().includes(query) ||
      o.orderSource?.toLowerCase().includes(query)
    );
  });

  // Pagination Logic
  const total = filteredOrders.length;
  const startIdx = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIdx, startIdx + pageSize);

  return (
    <div className="bg-green-100 min-h-screen">
      <div className="container mx-auto p-6">
        {/* Header */}
        <h1 className="text-3xl font-bold text-center mb-6">Order History</h1>

        {/* 🔍 Search Box */}
        <div className="flex justify-end mb-4">
          <input
            type="text"
            placeholder="Search by Order ID, Name, Phone, Firm, User Code, Source..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border rounded-lg w-full md:w-1/3"
          />
        </div>

        {historyError && <p className="text-red-500">{historyError}</p>}

        {/* Responsive Table */}
        <div className="overflow-x-auto shadow-xl rounded-xl">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-400 text-sm">
                <th className="py-2 px-4 border-b">User Code</th>
                <th className="py-2 px-4 border-b">Date & Time</th>
                <th className="py-2 px-4 border-b">Customer Name</th>
                <th className="py-2 px-4 border-b">Firm</th>
                <th className="py-2 px-4 border-b">Order Status</th>
                <th className="py-2 px-4 border-b">Payment Status</th>
                <th className="py-2 px-4 border-b">Payment Method</th>
                <th className="py-2 px-4 border-b">Total with Delivery</th>
                <th className="py-2 px-4 border-b">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pagedOrders.length ? pagedOrders.map((o) => (
                <tr key={o._id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 border-b font-mono text-sm">
                    {o.user?.customerDetails?.userCode || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b text-sm">
                    {formatDate(o.createdAt)}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {o.user?.name || 'N/A'}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {o.firmName || o.user?.customerDetails?.firmName || 'N/A'}
                  </td>
                  <td className={`py-2 px-4 border-b font-medium ${getOrderStatusColor(o.orderStatus)}`}>
                    {o.orderStatus}
                  </td>
                  <td className={`py-2 px-4 border-b font-medium ${getPaymentStatusColor(o.paymentStatus)}`}>
                    {o.paymentStatus}
                  </td>
                  <td className="py-2 px-4 border-b">
                    {o.paymentMethod}
                  </td>
                  <td className="py-2 px-4 border-b font-medium">
                    {formatCurrency(o.totalAmountWithDelivery || o.totalAmount)}
                  </td>

                  {/* 👉 Actions Button (View Details) */}
                  <td className="py-2 px-4 border-b">
                    <button
                      onClick={() => setDetailModal({ isOpen: true, order: o })}
                      className="px-3 py-1 text-white bg-blue-500 rounded hover:bg-blue-600 text-xs"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="py-3 text-center">No results found</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-gray-600">
            Showing {Math.min(total, startIdx + 1)}–{Math.min(total, startIdx + pageSize)} of {total}
          </span>
          <Paginator page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
          >
            {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
          </select>
        </div>
      </div>

      {/* 📌 DETAILS MODAL */}
      {detailModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white max-w-4xl w-full mx-4 rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order Details</h2>
              <button
                onClick={() => setDetailModal({ isOpen: false, order: null })}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Order Summary */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-mono text-xs break-all">{detailModal.order._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Source</p>
                  <p>{detailModal.order.orderSource || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created By</p>
                  <p>{detailModal.order.createdByReception?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created At</p>
                  <p>{formatDate(detailModal.order.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Customer Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <p><span className="text-gray-600">Name:</span> {detailModal.order.user?.name || 'N/A'}</p>
                <p><span className="text-gray-600">Email:</span> {detailModal.order.user?.email || 'N/A'}</p>
                <p><span className="text-gray-600">Phone:</span> {detailModal.order.user?.phoneNumber || 'N/A'}</p>
                <p><span className="text-gray-600">Firm:</span> {detailModal.order.firmName || detailModal.order.user?.customerDetails?.firmName || 'N/A'}</p>
                <p><span className="text-gray-600">User Code:</span> {detailModal.order.user?.customerDetails?.userCode || 'N/A'}</p>
                <p><span className="text-gray-600">Order Type:</span> {detailModal.order.type || 'N/A'}</p>
              </div>
            </div>

            {/* Shipping Address */}
            {detailModal.order.shippingAddress && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <p className="whitespace-pre-line">{detailModal.order.shippingAddress.address}</p>
                  <p>{detailModal.order.shippingAddress.city}, {detailModal.order.shippingAddress.state} - {detailModal.order.shippingAddress.pinCode}</p>
                </div>
              </div>
            )}

            {/* Products */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Products</h3>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Product</th>
                      <th className="px-4 py-2 text-left">Type/Category</th>
                      <th className="px-4 py-2 text-right">Boxes</th>
                      <th className="px-4 py-2 text-right">Price/Box</th>
                      <th className="px-4 py-2 text-right">Original Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailModal.order.products.map((p, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-4 py-2">{p.product?.name || 'N/A'}</td>
                        <td className="px-4 py-2">
                          {p.product?.type || p.type || 'N/A'} 
                          {p.product?.category && ` / ${p.product.category}`}
                        </td>
                        <td className="px-4 py-2 text-right">{p.boxes}</td>
                        <td className="px-4 py-2 text-right">₹{p.price}</td>
                        <td className="px-4 py-2 text-right">₹{p.originalPrice || p.price}</td>
                        <td className="px-4 py-2 text-right font-medium">₹{(p.price * p.boxes).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Payment Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-medium">{formatCurrency(detailModal.order.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Delivery Charge</p>
                    <p className="font-medium">{formatCurrency(detailModal.order.deliveryCharge || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total with Delivery</p>
                    <p className="font-medium text-lg">
                      {formatCurrency(detailModal.order.totalAmountWithDelivery || detailModal.order.totalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment History - if available */}
            {detailModal.order.paymentHistory && detailModal.order.paymentHistory.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Payment History</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Mode</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Reference</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailModal.order.paymentHistory.map((payment, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-4 py-2">{formatDate(payment.submissionDate)}</td>
                          <td className="px-4 py-2 capitalize">{payment.paymentMode}</td>
                          <td className="px-4 py-2 text-right">{formatCurrency(payment.submittedAmount)}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              payment.status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {payment.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 font-mono text-xs">{payment.referenceId}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Order Status Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Order Status Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-600">Order Status</p>
                  <p className={`font-medium ${getOrderStatusColor(detailModal.order.orderStatus)}`}>
                    {detailModal.order.orderStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Status</p>
                  <p className={`font-medium ${getPaymentStatusColor(detailModal.order.paymentStatus)}`}>
                    {detailModal.order.paymentStatus}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-medium">{detailModal.order.paymentMethod}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => setDetailModal({ isOpen: false, order: null })}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}