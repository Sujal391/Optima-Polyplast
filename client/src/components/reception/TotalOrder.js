import React, { useState, useEffect } from 'react';
import axios from 'axios';
import cookies from 'js-cookie';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search, Eye, Edit, Loader2, PackageSearch,
  MapPin, User, Building2, Phone, Mail, Hash,
  ShoppingCart, CreditCard, Clock, CheckCircle2, History, X
} from "lucide-react";

import Paginator from '../common/Paginator';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

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
      try { window.location.href = "/"; } catch { }
    }
    return Promise.reject(err);
  }
);

// Formatter Helpers
const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatCurrency = (amt) => (amt !== undefined && amt !== null) ? `₹${Number(amt).toLocaleString("en-IN")}` : 'N/A';

const getPaymentStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s === 'completed' || s === 'paid') return "bg-green-100 text-green-700 border-green-200";
  if (s === 'pending') return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (s === 'partial') return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === 'failed') return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const getOrderStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s === 'delivered') return "bg-green-100 text-green-700 border-green-200";
  if (s === 'processing') return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === 'shipped') return "bg-purple-100 text-purple-700 border-purple-200";
  if (s === 'cancelled') return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200"; // default pending
};

const getOrderAmounts = (order = {}) => {
  const subtotal = order.amount ?? order.paymentDetails?.amount ?? order.totalAmount ?? 0;
  const gst = order.gst ?? 0;
  const totalWithGST = order.totalAmountWithGST ?? (subtotal + gst);
  const deliveryCharge = order.deliveryCharge ?? 0;
  const grandTotal = order.totalAmountWithDelivery ?? (totalWithGST + deliveryCharge);
  const paidAmount = order.paidAmount ?? order.paymentDetails?.paidAmount ?? 0;
  const remainingAmount = Math.max(grandTotal - paidAmount, 0);

  return {
    subtotal,
    gst,
    totalWithGST,
    deliveryCharge,
    grandTotal,
    paidAmount,
    remainingAmount
  };
};

const getResolvedPaymentStatus = (order = {}) =>
  order.paymentDetails?.status || order.paymentStatus || "pending";

const isOrderShipped = (order = {}) =>
  (order.orderStatus || "").toLowerCase() === "shipped";

export default function OrderManagement() {
  const [orderHistory, setOrderHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState("");

  // Modals
  const [detailModal, setDetailModal] = useState({ isOpen: false, order: null });
  const [editModal, setEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    products: [],
    deliveryChoice: "homeDelivery",
    shippingAddress: { address: "", city: "", state: "", pinCode: "" }
  });
  const [updatingOrder, setUpdatingOrder] = useState(false);

  const openEditModal = (order) => {
    if (isOrderShipped(order)) {
      toast.error("Shipped orders cannot be edited");
      return;
    }

    setEditOrder(order);
    setEditForm({
      products: order.products?.map(p => ({
        productId: p.product?._id || p.product?.id || p.product,
        name: p.product?.name || "Unknown Product",
        category: p.product?.category || "",
        boxes: p.boxes || 0,
        price: p.price || 0
      })) || [],
      deliveryChoice: order.deliveryChoice || "homeDelivery",
      shippingAddress: order.shippingAddress || { address: "", city: "", state: "", pinCode: "" }
    });
    setEditModal(true);
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditOrder(null);
  };

  const handleEditSubmit = async () => {
    if (isOrderShipped(editOrder)) {
      toast.error("Shipped orders cannot be edited");
      closeEditModal();
      return;
    }

    setUpdatingOrder(true);
    try {
      const payload = {
        products: editForm.products.map(p => ({
          productId: p.productId,
          boxes: Number(p.boxes),
          price: Number(p.price)
        })),
        deliveryChoice: editForm.deliveryChoice,
        shippingAddress: editForm.shippingAddress
      };

      const res = await api.patch(`/reception/orders/${editOrder._id}/edit`, payload);
      toast.success(res.data?.message || "Order updated successfully");
      closeEditModal();
      fetchOrderHistory();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingOrder(false);
    }
  };

  const updateEditProduct = (idx, field, value) => {
    const updated = [...editForm.products];
    updated[idx][field] = value;
    setEditForm({ ...editForm, products: updated });
  };

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchOrderHistory = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reception/orders/history");
      setOrderHistory(res.data?.orders || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching order history.");
      toast.error(err.response?.data?.message || "Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrderHistory(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  // Filter Orders
  const filteredOrders = orderHistory.filter((o) => {
    const q = search.toLowerCase();
    return (
      o._id?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.phoneNumber?.toLowerCase().includes(q) ||
      o.firmName?.toLowerCase().includes(q) ||
      o.user?.customerDetails?.firmName?.toLowerCase().includes(q) ||
      o.user?.customerDetails?.userCode?.toLowerCase().includes(q) ||
      o.orderSource?.toLowerCase().includes(q)
    );
  });

  const total = filteredOrders.length;
  const startIdx = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIdx, startIdx + pageSize);
  const detailOrderAmounts = detailModal.order ? getOrderAmounts(detailModal.order) : null;
  const detailPaymentStatus = detailModal.order ? getResolvedPaymentStatus(detailModal.order) : "pending";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <History className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order History</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {loading ? "Loading…" : `${total} total order${total !== 1 ? "s" : ""} recorded`}
            </p>
          </div>
          <div className="relative w-full sm:w-80 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-shadow"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Desktop Table / Mobile Cards container */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Desktop view */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b-gray-200">
                  <TableHead className="font-semibold text-gray-600">ID / Date</TableHead>
                  <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                  <TableHead className="font-semibold text-gray-600">Firm</TableHead>
                  <TableHead className="font-semibold text-gray-600">Total Amount</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600">Payment</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center w-[150px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                        <span className="text-sm">Loading orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pagedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <PackageSearch className="h-8 w-8" />
                        <span className="text-sm">No orders found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedOrders.map((o) => (
                    <TableRow key={o._id} className="hover:bg-blue-50/40 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">
                            {o.orderId || o._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">{formatDate(o.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{o.user?.name || "N/A"}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">
                            {o.user?.customerDetails?.userCode || "(Misc)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{o.firmName || o.user?.customerDetails?.firmName || "N/A"}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(getOrderAmounts(o).grandTotal)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getOrderStatusColor(o.orderStatus)}>
                          {o.orderStatus || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="outline" className={getPaymentStatusColor(getResolvedPaymentStatus(o))}>
                            {getResolvedPaymentStatus(o)}
                          </Badge>
                          <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">
                            {o.paymentMethod || "COD"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-full"
                            onClick={() => setDetailModal({ isOpen: true, order: o })}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-100 rounded-full"
                            disabled={isOrderShipped(o)}
                            onClick={() => openEditModal(o)}
                            title={isOrderShipped(o) ? "Shipped orders cannot be edited" : "Edit Order"}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet view */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
                <span className="text-sm">Loading orders...</span>
              </div>
            ) : pagedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <PackageSearch className="h-8 w-8" />
                <span className="text-sm">No orders found</span>
              </div>
            ) : (
              pagedOrders.map((o) => (
                <div key={o._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {o.orderId || o._id.slice(-8).toUpperCase()}
                      </span>
                      <p className="font-medium text-gray-900 mt-1">{o.user?.name || "N/A"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">{formatCurrency(getOrderAmounts(o).grandTotal)}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">{o.paymentMethod || "COD"}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <p className="text-xs text-gray-500 font-mono">{o.user?.customerDetails?.userCode || "(Misc)"}</p>
                    <p className="text-xs text-gray-500 text-right">{formatDate(o.createdAt)}</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getOrderStatusColor(o.orderStatus)}`}>
                        {o.orderStatus || "pending"}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPaymentStatusColor(getResolvedPaymentStatus(o))}`}>
                        {getResolvedPaymentStatus(o)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3 border-gray-200"
                        onClick={() => setDetailModal({ isOpen: true, order: o })}
                      >
                        <Eye className="h-3 w-3 mr-1.5" /> View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs px-3 border-amber-200 text-amber-600 hover:bg-amber-50"
                        disabled={isOrderShipped(o)}
                        onClick={() => openEditModal(o)}
                        title={isOrderShipped(o) ? "Shipped orders cannot be edited" : "Edit Order"}
                      >
                        <Edit className="h-3 w-3 mr-1.5" /> Edit
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-900">{Math.min(total, startIdx + 1)}</span> to <span className="font-medium text-gray-900">{Math.min(total, startIdx + pageSize)}</span> of <span className="font-medium text-gray-900">{total}</span>
              </span>
              <div className="flex items-center gap-3">
                <Paginator page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
                <select
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={pageSize}
                  onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
                >
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 📌 ORDER DETAILS DIALOG */}
      <Dialog
        open={detailModal.isOpen}
        onOpenChange={(open) => !open && setDetailModal({ isOpen: false, order: null })}
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-50 gap-0">
          {detailModal.order && (
            <>
              <DialogHeader className="px-6 py-5 bg-white border-b shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <ShoppingCart className="h-5 w-5 text-blue-600" />
                    Order Details
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline" className={getOrderStatusColor(detailModal.order.orderStatus)}>
                      Status: {detailModal.order.orderStatus || "pending"}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">

                {/* Top Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Order ID</p>
                      <p className="font-mono text-sm font-semibold truncate text-gray-900">
                        {detailModal.order.orderId || detailModal.order._id}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Created At</p>
                      <p className="text-sm font-semibold truncate text-gray-900">
                        {formatDate(detailModal.order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">Payment ({detailModal.order.paymentMethod || 'COD'})</p>
                      <p className={`text-sm font-semibold truncate ${detailPaymentStatus === 'completed' || detailPaymentStatus === 'paid'
                        ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                        {detailPaymentStatus}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Customer Info */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" /> Customer Information
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">Name:</span>
                        <span className="text-gray-900 col-span-2 font-medium">{detailModal.order.user?.name || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">User Code:</span>
                        <span className="text-gray-900 col-span-2 font-mono text-xs">{detailModal.order.user?.customerDetails?.userCode || "(Misc)"}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">Firm:</span>
                        <span className="text-gray-900 col-span-2">{detailModal.order.firmName || detailModal.order.user?.customerDetails?.firmName || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">Phone:</span>
                        <span className="text-gray-900 col-span-2 flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" /> {detailModal.order.user?.phoneNumber || "N/A"}</span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">Email:</span>
                        <span className="text-gray-900 col-span-2 flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" /> {detailModal.order.user?.email || "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Info */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Shipping Address
                    </div>
                    <div className="p-4">
                      {detailModal.order.shippingAddress ? (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="font-medium text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {detailModal.order.shippingAddress.address}
                          </p>
                          <p>
                            {detailModal.order.shippingAddress.city}, {detailModal.order.shippingAddress.state}
                          </p>
                          <p className="font-semibold pt-1">PIN: {detailModal.order.shippingAddress.pinCode}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No shipping address provided.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product List */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                    <PackageSearch className="h-4 w-4" /> Ordered Products
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-transparent hover:bg-transparent">
                          <TableHead className="font-semibold text-gray-600">Item</TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">Boxes</TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">Rate</TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailModal.order.products?.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="font-medium text-gray-900">{p.product?.name || 'Unknown Product'}</p>
                              <p className="text-xs text-gray-500">{p.product?.category || p.type}</p>
                            </TableCell>
                            <TableCell className="text-right font-medium">{p.boxes}</TableCell>
                            <TableCell className="text-right text-gray-600">
                              {formatCurrency(p.price)}
                              {p.originalPrice && p.originalPrice > p.price && (
                                <span className="block text-[10px] text-red-400 line-through">{formatCurrency(p.originalPrice)}</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900">
                              {formatCurrency(p.price * p.boxes)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Order Totals */}
                  <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex flex-col items-end gap-2">
                    <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600">
                      <span>Subtotal:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(detailOrderAmounts?.subtotal)}</span>
                    </div>
                    <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600">
                      <span>GST:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(detailOrderAmounts?.gst)}</span>
                    </div>
                    <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600">
                      <span>Total With GST:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(detailOrderAmounts?.totalWithGST)}</span>
                    </div>
                    {detailOrderAmounts?.deliveryCharge > 0 && (
                      <div className="flex justify-between w-full sm:w-64 text-sm text-gray-600">
                        <span>Delivery Charge:</span>
                        <span className="font-medium text-red-600">+{formatCurrency(detailOrderAmounts?.deliveryCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full sm:w-64 text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Grand Total:</span>
                      <span className="text-blue-700">{formatCurrency(detailOrderAmounts?.grandTotal)}</span>
                    </div>
                    {(detailModal.order.paidAmount !== undefined || detailModal.order.paymentDetails?.paidAmount !== undefined) && (
                      <>
                        <div className="flex justify-between w-full sm:w-64 text-sm text-green-600">
                          <span>Paid Amount:</span>
                          <span className="font-medium">{formatCurrency(detailOrderAmounts?.paidAmount)}</span>
                        </div>
                        <div className="flex justify-between w-full sm:w-64 text-sm text-red-600">
                          <span>Remaining:</span>
                          <span className="font-medium">
                            {formatCurrency(detailOrderAmounts?.remainingAmount)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Payment History */}
                {detailModal.order.paymentHistory?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <History className="h-4 w-4" /> Payment History
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-transparent hover:bg-transparent">
                            <TableHead className="font-semibold text-gray-600">Date</TableHead>
                            <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                            <TableHead className="font-semibold text-gray-600">Status</TableHead>
                            <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailModal.order.paymentHistory.map((pmt, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-sm">{formatDate(pmt.submissionDate)}</TableCell>
                              <TableCell className="text-sm font-medium uppercase">{pmt.paymentMode}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={pmt.status === 'verified' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}>
                                  {pmt.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right font-bold text-gray-900">{formatCurrency(pmt.submittedAmount)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}

              </div>

              <DialogFooter className="px-6 py-4 bg-gray-50 border-t shrink-0">
                <Button variant="outline" onClick={() => setDetailModal({ isOpen: false, order: null })}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 📌 EDIT ORDER DIALOG */}
      <Dialog open={editModal} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" /> Edit Order {editOrder && (editOrder.orderId || editOrder._id?.slice(-8).toUpperCase())}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto max-h-[65vh] space-y-6">

            {/* Products Array */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Products</h3>
              <div className="space-y-3">
                {editForm.products.map((p, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-gray-800">
                        {p.name} {p.category && <span className="text-gray-500 font-normal">({p.category})</span>}
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Boxes</label>
                        <input
                          type="number" min="1"
                          value={p.boxes}
                          onChange={(e) => updateEditProduct(idx, 'boxes', e.target.value)}
                          className="w-20 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-gray-500 uppercase mb-1">Price</label>
                        <input
                          type="number" min="0" step="0.01"
                          value={p.price}
                          onChange={(e) => updateEditProduct(idx, 'price', e.target.value)}
                          className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Choice */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Delivery Choice</h3>
              <select
                value={editForm.deliveryChoice}
                onChange={(e) => setEditForm({ ...editForm, deliveryChoice: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="homeDelivery">Home Delivery</option>
                <option value="companyPickup">Company Pickup</option>
                <option value="transport">Transport</option>
              </select>
            </div>

            {/* Shipping Address */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Shipping Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <textarea
                    value={editForm.shippingAddress?.address || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shippingAddress: { ...(prev.shippingAddress || {}), address: e.target.value } }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm max-h-24 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input
                    type="text"
                    value={editForm.shippingAddress?.city || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shippingAddress: { ...(prev.shippingAddress || {}), city: e.target.value } }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                  <input
                    type="text"
                    value={editForm.shippingAddress?.state || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shippingAddress: { ...(prev.shippingAddress || {}), state: e.target.value } }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={editForm.shippingAddress?.pinCode || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, shippingAddress: { ...(prev.shippingAddress || {}), pinCode: e.target.value } }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

          </div>

          <DialogFooter className="px-6 py-4 border-t border-gray-100 shrink-0 flex gap-3 justify-end bg-gray-50/50">
            <Button variant="outline" onClick={closeEditModal} disabled={updatingOrder}>Cancel</Button>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleEditSubmit} disabled={updatingOrder}>
              {updatingOrder ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
