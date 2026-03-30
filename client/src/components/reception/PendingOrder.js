import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Search, Eye, Loader2, PackageSearch, RefreshCw,
  Clock, CheckCircle2, X, MoreVertical,
  User, Building2, Phone, Mail, Hash,
  ShoppingCart, CreditCard, MapPin, Download, AlertCircle, Receipt, ChevronRight
} from "lucide-react";

import Paginator from "../common/Paginator";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

api.interceptors.request.use((config) => {
  const token = cookies.get("token");
  if (token) {
    config.headers.Authorization = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
  }
  return config;
});

// Formatter Helpers
const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatCurrency = (amount) =>
  typeof amount === "number" ? `₹${amount.toLocaleString("en-IN")}` : "N/A";

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || "pending";
  if (s === "delivered") return "bg-green-100 text-green-700 border-green-200";
  if (s === "processing" || s === "sales_pending") return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === "cancelled") return "bg-red-100 text-red-700 border-red-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

const getPaymentStatusColor = (status) => {
  const s = status?.toLowerCase() || "";
  if (s === "paid" || s === "completed") return "bg-green-100 text-green-700 border-green-200";
  if (s === "partial") return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

const PendingOrders = () => {
  const [pendingOrders, setPendingOrders] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState(null);

  // modals
  const [priceUpdateModal, setPriceUpdateModal] = useState({
    isOpen: false,
    details: [],
    orderId: null,
  });
  const [successDialog, setSuccessDialog] = useState({
    isOpen: false,
    message: "",
  });
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    order: null,
    priceUpdates: [],
  });
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    order: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  // Verification modal
  const [verifyDialog, setVerifyDialog] = useState({
    isOpen: false,
    paymentId: null,
    orderId: null,
    verifiedAmount: "",
    paidAmount: 0,
    notes: "",
    paymentRef: ""
  });
  const [isVerifying, setIsVerifying] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // fetch all pending orders from app
  const fetchPendingOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/reception/orders/all");
      const orders = response.data?.orders || [];
      // Filter to show only pending orders (orders created from app)
      const pending = orders.filter((o) => o.orderStatus === "pending");
      setPendingOrders(pending);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error fetching orders";
      setError(msg);
      toast.error(msg);
      setPendingOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingOrders();
  }, []);

  // update order status to sales_pending
  const updateOrderStatus = async (orderId) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await api.patch(`/reception/orders/${orderId}/status`, {
        status: "sales_pending",
      });
      setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));

      if (response.data.priceUpdated) {
        setPriceUpdateModal({
          isOpen: true,
          details: response.data.priceUpdateDetails || [],
          orderId,
        });
      } else {
        setSuccessDialog({
          isOpen: true,
          message:
            response.data.message || "Order marked as processing successfully",
        });
      }
      toast.success(
        response.data.message || "Order status updated successfully"
      );
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "Error updating order status";
      setError(msg);
      toast.error(msg);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleMarkAsProcessing = (order) => {
    if (order.priceUpdated && order.priceUpdateHistory?.length > 0) {
      setConfirmDialog({
        isOpen: true,
        order: order,
        priceUpdates: order.priceUpdateHistory,
      });
    } else {
      updateOrderStatus(order.orderId || order._id);
    }
  };

  const filteredOrders = pendingOrders.filter((order) => {
    const s = search.toLowerCase();
    const customer = order.customer || order.user?.customerDetails || {};
    const user = order.user || {};
    
    return (
      order._id?.toLowerCase()?.includes(s) ||
      order.orderId?.toLowerCase()?.includes(s) ||
      user.name?.toLowerCase()?.includes(s) ||
      customer.name?.toLowerCase()?.includes(s) ||
      user.email?.toLowerCase()?.includes(s) ||
      customer.firmName?.toLowerCase()?.includes(s) ||
      order.firmName?.toLowerCase()?.includes(s) ||
      customer.userCode?.toLowerCase()?.includes(s)
    );
  });

  const openVerifyDialog = (order) => {
    const payment = order.payment || {};
    const extractedPaymentId = payment.paymentId || payment._id || payment.id;
    const paidAmount = payment.paidAmount || 0;
    const lastPayment = payment.lastPayment || {};

    setVerifyDialog({
      isOpen: true,
      paymentId: extractedPaymentId,
      orderId: order.orderId || order._id,
      verifiedAmount: paidAmount.toString(),
      paidAmount: paidAmount,
      notes: "",
      paymentRef: lastPayment.referenceId || "N/A"
    });
  };

  const closeVerifyDialog = () => {
    setVerifyDialog({
      isOpen: false,
      paymentId: null,
      orderId: null,
      verifiedAmount: "",
      paidAmount: 0,
      notes: "",
      paymentRef: ""
    });
  };

  const handleVerifyPayment = async () => {
    const { paymentId, verifiedAmount, notes } = verifyDialog;

    if (!verifiedAmount || isNaN(parseFloat(verifiedAmount))) {
      return toast.warning("Please enter a valid amount.");
    }

    setIsVerifying(true);
    try {
      await api.patch(`/reception/payments/${paymentId}/verify-submitted`, {
        verifiedAmount: parseFloat(verifiedAmount),
        notes: notes || "Payment confirmed"
      });
      toast.success("Payment verified successfully");
      fetchPendingOrders();
      closeVerifyDialog();
      setDetailsModal({ isOpen: false, order: null });
    } catch (error) {
      toast.error(error.response?.data?.message || "Error verifying payment");
    } finally {
      setIsVerifying(false);
    }
  };

  // pagination logic
  const total = filteredOrders.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedOrders = filteredOrders.slice(startIdx, endIdx);

  const formatShippingAddress = (a) => {
    if (!a) return "N/A";
    return `${a.address || ""}, ${a.city || ""}, ${a.state || ""} ${
      a.pinCode || ""
    }`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-600 rounded-xl">
                <Clock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Pending App Orders
              </h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Process orders created by users from the mobile application
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filter orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 shadow-sm"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-10 px-4 border-gray-200"
              onClick={fetchPendingOrders}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Orders Table container */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80 border-b-gray-200">
                  <TableHead className="font-semibold text-gray-600">
                    Order ID / Date
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Customer
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Products
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Total
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Status
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center w-[150px]">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        <span className="text-sm">Loading orders...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pagedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <PackageSearch className="h-8 w-8" />
                        <span className="text-sm">
                          No pending orders found
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      className="hover:bg-green-50/40 transition-colors"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">
                            {order.orderId || order._id.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">
                            {order.customer?.name || order.user?.name || "N/A"}
                          </span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">
                            {order.customer?.userCode || order.user?.customerDetails?.userCode || "(Misc)"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs space-y-0.5">
                          {order.products?.slice(0, 2).map((p, i) => (
                            <div key={i} className="text-xs text-gray-600">
                              {p.name || p.product?.name || "Product"} x {p.boxes}
                            </div>
                          ))}
                          {order.products?.length > 2 && (
                            <span className="text-[10px] text-gray-400 font-medium">
                              +{order.products.length - 2} more items
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(order.totalAmountWithGST || order.payment?.totalAmount || order.totalAmount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusColor(order.orderStatus)}
                        >
                          {order.orderStatus || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => setDetailsModal({ isOpen: true, order })} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleMarkAsProcessing(order)} className="cursor-pointer text-blue-600">
                                  <RefreshCw className="mr-2 h-4 w-4" /> Process Order
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => openVerifyDialog(order)} className="cursor-pointer text-green-600">
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Verify Payment
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile view */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                <span className="text-sm">Loading orders...</span>
              </div>
            ) : pagedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <PackageSearch className="h-8 w-8" />
                <span className="text-sm">No orders found</span>
              </div>
            ) : (
              pagedOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {order.orderId || order._id.slice(-8).toUpperCase()}
                      </span>
                      <p className="font-medium text-gray-900 mt-1">
                        {order.customer?.name || order.user?.name || "N/A"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(order.totalAmountWithGST || order.totalAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <p className="text-xs text-gray-500 font-mono">
                      {order.customer?.userCode || order.user?.customerDetails?.userCode || "(Misc)"}
                    </p>
                    <p className="text-xs text-gray-500 text-right">
                      {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <Badge
                        variant="outline"
                        className={`text-[10px] px-1.5 py-0 ${getStatusColor(
                          order.orderStatus
                        )}`}
                      >
                        {order.orderStatus || "pending"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                               <DropdownMenuItem onClick={() => setDetailsModal({ isOpen: true, order })} className="cursor-pointer">
                                  <Eye className="mr-2 h-4 w-4" /> View Details
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => handleMarkAsProcessing(order)} className="cursor-pointer text-blue-600">
                                  <RefreshCw className="mr-2 h-4 w-4" /> Process
                               </DropdownMenuItem>
                               <DropdownMenuItem onClick={() => openVerifyDialog(order)} className="cursor-pointer text-green-600">
                                  <CheckCircle2 className="mr-2 h-4 w-4" /> Verify Payment
                               </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
                Showing{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(total, startIdx + 1)}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">
                  {Math.min(total, startIdx + pageSize)}
                </span>{" "}
                of <span className="font-medium text-gray-900">{total}</span>
              </span>
              <div className="flex items-center gap-3">
                <Paginator
                  page={page}
                  total={total}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
                <select
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(parseInt(e.target.value, 10));
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 📌 ORDER DETAILS DIALOG */}
      <Dialog
        open={detailsModal.isOpen}
        onOpenChange={(open) =>
          !open && setDetailsModal({ isOpen: false, order: null })
        }
      >
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-50 gap-0">
          {detailsModal.order && (
            <>
              <DialogHeader className="px-6 py-5 bg-white border-b shrink-0">
                <div className="flex items-center justify-between">
                  <DialogTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    Order Details
                  </DialogTitle>
                  <div className="flex gap-2">
                    <Badge
                      variant="outline"
                      className={getStatusColor(detailsModal.order.orderStatus)}
                    >
                      Status: {detailsModal.order.orderStatus || "pending"}
                    </Badge>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-6 overflow-y-auto max-h-[70vh] space-y-6">
                {/* Top Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg shrink-0">
                      <Hash className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        Order ID
                      </p>
                      <p className="font-mono text-sm font-semibold truncate text-gray-900">
                        {detailsModal.order.orderId || detailsModal.order._id}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        Created At
                      </p>
                      <p className="text-sm font-semibold truncate text-gray-900">
                        {formatDate(detailsModal.order.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 font-medium">
                        Payment Status
                      </p>
                      <p className="text-sm font-semibold truncate">
                        <Badge
                          variant="outline"
                          className={getPaymentStatusColor(
                            detailsModal.order.payment?.status || detailsModal.order.paymentStatus
                          )}
                        >
                          {detailsModal.order.payment?.status || detailsModal.order.paymentStatus || "pending"}
                        </Badge>
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
                        <span className="text-gray-500 font-medium col-span-1">
                          Name:
                        </span>
                        <span className="text-gray-900 col-span-2 font-medium">
                          {detailsModal.order.customer?.name || detailsModal.order.user?.name || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">
                          Firm:
                        </span>
                        <span className="text-gray-900 col-span-2">
                          {detailsModal.order.customer?.firmName || detailsModal.order.user?.customerDetails?.firmName || "N/A"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 text-sm">
                        <span className="text-gray-500 font-medium col-span-1">
                          Phone:
                        </span>
                        <span className="text-gray-900 col-span-2 flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-gray-400" />{" "}
                          {detailsModal.order.customer?.phoneNumber || detailsModal.order.user?.phoneNumber || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping & Delivery */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> Shipping & Delivery
                    </div>
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Delivery Choice</p>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                          {detailsModal.order.deliveryChoice === "homeDelivery" ? "Home Delivery" : "Self Pickup"}
                        </Badge>
                      </div>
                      
                      { (detailsModal.order.customer?.shippingAddress || detailsModal.order.shippingAddress) ? (
                        <div className="text-sm text-gray-700 space-y-1">
                          <p className="text-xs text-gray-500 font-medium mb-1">Address</p>
                          <p className="font-medium text-gray-900 whitespace-pre-wrap leading-relaxed">
                            {(detailsModal.order.customer?.shippingAddress || detailsModal.order.shippingAddress).address}
                          </p>
                          <p>
                            {(detailsModal.order.customer?.shippingAddress || detailsModal.order.shippingAddress).city},{" "}
                            {(detailsModal.order.customer?.shippingAddress || detailsModal.order.shippingAddress).state}
                          </p>
                          <p className="font-semibold pt-1">
                            PIN: {(detailsModal.order.customer?.shippingAddress || detailsModal.order.shippingAddress).pinCode}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          No shipping address provided.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Payment Breakdown & screenshot */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment Details */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" /> Payment Summary
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Payment Status</p>
                          <Badge variant="outline" className={getPaymentStatusColor(detailsModal.order.payment?.status || detailsModal.order.paymentStatus)}>
                            {detailsModal.order.payment?.status || detailsModal.order.paymentStatus || "pending"}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-gray-50">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Subtotal</span>
                          <span className="font-medium text-gray-900">{formatCurrency(detailsModal.order.amount || detailsModal.order.totalAmount)}</span>
                        </div>
                        {detailsModal.order.gst !== undefined && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">GST</span>
                            <span className="font-medium text-gray-900">{formatCurrency(detailsModal.order.gst)}</span>
                          </div>
                        )}
                        {detailsModal.order.deliveryCharge > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Delivery Charge</span>
                            <span className="font-medium text-gray-900">{formatCurrency(detailsModal.order.deliveryCharge)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t border-gray-50">
                          <span className="text-gray-900">Total Payable</span>
                          <span className="text-green-600">{formatCurrency(detailsModal.order.totalAmountWithGST || detailsModal.order.payment?.totalAmount || detailsModal.order.totalAmountWithDelivery || detailsModal.order.totalAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Paid Amount</span>
                          <span className="font-medium text-blue-600">{formatCurrency(detailsModal.order.payment?.paidAmount || detailsModal.order.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Remaining</span>
                          <span className="font-medium text-red-600">{formatCurrency(detailsModal.order.payment?.remainingAmount || (detailsModal.order.totalAmountWithGST || detailsModal.order.totalAmount) - (detailsModal.order.payment?.paidAmount || detailsModal.order.paidAmount || 0))}</span>
                        </div>
                      </div>

                      {detailsModal.order.payment?.lastPayment && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-2">
                          <p className="text-xs font-bold text-gray-700 border-b border-gray-200 pb-1 mb-2">Last Payment Attempt</p>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <p className="text-gray-500">Ref ID</p>
                              <p className="font-mono font-medium truncate" title={detailsModal.order.payment.lastPayment.referenceId}>
                                {detailsModal.order.payment.lastPayment.referenceId || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-500">Mode</p>
                              <p className="font-medium capitalize">{detailsModal.order.payment.lastPayment.paymentMode}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Amount</p>
                                <p className="font-bold text-gray-900">{formatCurrency(detailsModal.order.payment.lastPayment.submittedAmount)}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Date</p>
                                <p className="font-medium">{formatDate(detailsModal.order.payment.lastPayment.submissionDate)}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Screenshot section */}
                  <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 font-semibold text-sm text-gray-700 flex items-center gap-2">
                      <Eye className="h-4 w-4" /> Payment Screenshot
                    </div>
                    <div className="p-4 flex-1 flex items-center justify-center bg-gray-50/30">
                      {detailsModal.order.payment?.lastPayment?.screenshotUrl ? (
                         <div 
                           className="relative group cursor-zoom-in overflow-hidden rounded-lg shadow-md border border-gray-200"
                           onClick={() => setImagePreview(detailsModal.order.payment.lastPayment.screenshotUrl)}
                         >
                            <img 
                              src={detailsModal.order.payment.lastPayment.screenshotUrl} 
                              alt="Payment Proof" 
                              className="max-h-[300px] w-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                               <p className="text-white opacity-0 group-hover:opacity-100 transition-opacity font-medium text-xs bg-black/60 px-4 py-2 rounded-full backdrop-blur-sm">
                                   Click for full preview
                               </p>
                            </div>
                         </div>
                      ) : (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 p-3 rounded-full inline-block mb-3">
                                <PackageSearch className="h-6 w-6 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-500 italic">No screenshot available for this payment.</p>
                        </div>
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
                          <TableHead className="font-semibold text-gray-600">
                            Item
                          </TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">
                            Boxes
                          </TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">
                            Rate
                          </TableHead>
                          <TableHead className="font-semibold text-gray-600 text-right">
                            Total
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailsModal.order.products?.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>
                              <p className="font-medium text-gray-900">
                                {p.name || p.product?.name || "Product"}
                              </p>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {p.boxes}
                            </TableCell>
                            <TableCell className="text-right text-gray-600">
                              {formatCurrency(p.price || p.product?.price || (p.total / p.boxes))}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900">
                              {formatCurrency(
                                p.total || (p.price || p.product?.price || 0) * p.boxes
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="bg-gray-50/80 p-4 border-t border-gray-100 flex flex-col items-end gap-2 text-sm text-gray-600">
                    <div className="flex justify-between w-full sm:w-64">
                      <span>Subtotal:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(detailsModal.order.amount || detailsModal.order.totalAmount)}</span>
                    </div>
                    {detailsModal.order.gst !== undefined && (
                      <div className="flex justify-between w-full sm:w-64">
                        <span>GST:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(detailsModal.order.gst)}</span>
                      </div>
                    )}
                    {detailsModal.order.deliveryCharge > 0 && (
                      <div className="flex justify-between w-full sm:w-64">
                        <span>Delivery Charge:</span>
                        <span className="font-medium text-red-600">+{formatCurrency(detailsModal.order.deliveryCharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between w-full sm:w-64 text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                      <span>Grand Total:</span>
                      <span className="text-green-700">
                        {formatCurrency(detailsModal.order.totalAmountWithGST || detailsModal.order.totalAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 bg-white border-t shrink-0 flex items-center justify-end gap-2">
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white gap-2"
                  onClick={() => openVerifyDialog(detailsModal.order)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Payment
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDetailsModal({ isOpen: false, order: null })}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CONFIRM PRICE UPDATE MODAL */}
      <AlertDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Price Updated</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                {confirmDialog.priceUpdates.map((p, i) => {
                  const product = confirmDialog.order?.products?.find(
                    (item) => item.product?._id === p.product
                  );
                  return (
                    <div key={i} className="p-2 bg-yellow-50 rounded border border-yellow-100">
                      <span className="font-medium text-gray-900">
                        {product?.product?.name || "Product"}
                      </span>
                      <br />
                      <span className="text-sm">
                        Price changed from{" "}
                        <span className="line-through text-gray-400">
                          {formatCurrency(p.oldPrice)}
                        </span>{" "}
                        →{" "}
                        <span className="font-bold text-green-600">
                          {formatCurrency(p.newPrice)}
                        </span>
                      </span>
                    </div>
                  );
                })}
                <p className="mt-4 text-sm text-gray-600">
                  Are you sure you want to mark this order as processing with the
                  updated prices?
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() =>
                setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] })
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                updateOrderStatus(confirmDialog.order?._id);
                setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] });
              }}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PRICE UPDATE INFO DIALOG */}
      <AlertDialog
        open={priceUpdateModal.isOpen}
        onOpenChange={(open) =>
          !open && setPriceUpdateModal({ isOpen: false, details: [], orderId: null })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Price Updated Notice</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2">
                <p className="text-sm mb-2">
                  The following product prices were updated:
                </p>
                {priceUpdateModal.details?.map((p, i) => (
                  <div key={i} className="p-2 bg-yellow-50 rounded border border-yellow-100">
                    <span className="font-medium text-gray-900">
                      {p.productName || "Product"}
                    </span>
                    <br />
                    <span className="text-sm">
                      Price:{" "}
                      <span className="line-through text-gray-400">
                        {formatCurrency(p.oldPrice)}
                      </span>{" "}
                      →{" "}
                      <span className="font-bold text-green-600">
                        {formatCurrency(p.newPrice)}
                      </span>
                    </span>
                  </div>
                ))}
                <p className="mt-4 text-sm text-green-600 font-medium">
                  Order has been marked as processing and sent to sales panel.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() =>
                setPriceUpdateModal({ isOpen: false, details: [], orderId: null })
              }
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* SUCCESS DIALOG */}
      <AlertDialog
        open={successDialog.isOpen}
        onOpenChange={(open) =>
          !open && setSuccessDialog({ isOpen: false, message: "" })
        }
      >
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
            <AlertDialogTitle className="text-center">Success</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              {successDialog.message}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction
              onClick={() => setSuccessDialog({ isOpen: false, message: "" })}
              className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 📌 VERIFY PAYMENT DIALOG */}
      <Dialog open={verifyDialog.isOpen} onOpenChange={(open) => !open && closeVerifyDialog()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <CheckCircle2 className="h-5 w-5" />
               </div>
               <div>
                 <DialogTitle className="text-lg font-bold text-gray-900">Verify Submitted Payment</DialogTitle>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-0.5">
                    Order: {verifyDialog.orderId}
                 </p>
               </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                 <span className="block text-xs text-blue-500 font-medium">Submitted Amount</span>
                 <span className="font-bold text-blue-700 text-lg">{formatCurrency(verifyDialog.paidAmount)}</span>
              </div>
              <div className="text-right">
                 <span className="block text-xs text-blue-500 font-medium">Reference ID</span>
                 <span className="font-mono text-xs font-bold text-blue-800">{verifyDialog.paymentRef}</span>
              </div>
            </div>

            <div>
              <Label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Verified Amount (₹)
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={verifyDialog.verifiedAmount}
                onChange={(e) => setVerifyDialog(p => ({ ...p, verifiedAmount: e.target.value }))}
                className="h-11 font-bold text-lg"
              />
              <p className="text-[10px] text-gray-400 mt-1 italic">
                * Confirm the actual amount received in the bank statement.
              </p>
            </div>

            <div>
              <Label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1.5">
                Verification Notes
              </Label>
              <textarea
                value={verifyDialog.notes}
                onChange={(e) => setVerifyDialog(p => ({ ...p, notes: e.target.value }))}
                placeholder="Payment confirmed from bank statement / UPI screenshot matches"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
              />
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t gap-2 sm:gap-0">
            <Button variant="ghost" onClick={closeVerifyDialog} disabled={isVerifying}>Cancel</Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white min-w-[140px] shadow-md shadow-green-100" 
              disabled={isVerifying}
              onClick={handleVerifyPayment}
            >
              {isVerifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : "Verify & Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FULL IMAGE PREVIEW DIALOG */}
      <Dialog open={!!imagePreview} onOpenChange={() => setImagePreview(null)}>
        <DialogContent className="max-w-[95vw] md:max-w-[80vw] lg:max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl gap-0">
          <DialogHeader className="absolute top-2 right-2 z-50 bg-transparent">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white rounded-full bg-black/20 hover:bg-black/40 border-none"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogHeader>
          <div className="flex items-center justify-center min-h-[50vh] max-h-[90vh] p-4 lg:p-8">
            <img
              src={imagePreview}
              alt="Payment Full View"
              className="max-h-full max-w-full object-contain shadow-2xl rounded-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
             <Button 
                variant="outline" 
                size="sm" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                onClick={() => window.open(imagePreview, '_blank')}
             >
                Open in new tab
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingOrders;