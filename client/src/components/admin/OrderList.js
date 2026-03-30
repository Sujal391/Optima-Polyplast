import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import cookies from "js-cookie";
import {
  ShoppingCart,
  Search,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Settings,
  MoreVertical,
  ChevronRight,
  Package,
  CircleDot,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import PriceUpdateConfirm from "./PriceUpdateConfirm";
import Paginator from "../shared/Paginator";

const Order = () => {
  const [searchParams] = useSearchParams();
  const statusFromUrl = searchParams.get("status");

  const [orders, setOrders] = useState([]);
  const [filterStatus, setFilterStatus] = useState(statusFromUrl || "All");
  const [filterCategory, setFilterCategory] = useState("All");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const navigate = useNavigate();

  // price update confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    order: null,
    details: [],
  });

  // processing confirmation dialog
  const [processingDialog, setProcessingDialog] = useState({
    isOpen: false,
    order: null,
    details: [],
  });

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

  useEffect(() => {
    fetchOrders();
  }, [filterCategory, filterStatus]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = cookies.get("token");
      if (!token) {
        setError("No authentication token found. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      let response;
      if (filterStatus === "preview") {
        response = await api.get("/admin/orders/preview");
      } else {
        const categoryFilter = filterCategory === "All" ? "all" : filterCategory;
        response = await api.get(`/admin/orders?type=${categoryFilter}`);
      }

      let fetchedOrders = response.data.orders || [];

      const mappedOrders = fetchedOrders.map((order) => ({
        _id: order._id,
        orderId: order.orderId,
        customerName: order.user?.name || "N/A",
        customerEmail: order.user?.email || "N/A",
        customerPhone: order.user?.phoneNumber || "N/A",
        firmName: order.firmName || order.user?.customerDetails?.firmName || "N/A",
        shippingAddress: order.shippingAddress || "N/A",
        userCode: order.user?.userCode || order.user?.customerDetails?.userCode || "N/A",
        orderStatus: order.orderStatus || "N/A",
        paymentStatus: order.paymentStatus || "N/A",
        paymentMethod: order.paymentMethod || "N/A",
        products: order.products || [],
        oldTotalAmount: order.totalAmount ?? 0,
        totalAmount: order.currentTotalAmount ?? order.totalAmount ?? 0,
        priceUpdated: order.priceUpdated ?? false,
        priceUpdateDetails: order.priceUpdateDetails || [],
        gstNumber: order.gstNumber || "N/A",
        createdAt: order.createdAt || new Date(),
        type: order.type || "N/A",
        totalAmountWithDelivery: order.totalAmountWithDelivery || 0,
      }));

      setOrders(mappedOrders);
    } catch (err) {
      if (err.response?.status === 401) {
        setError("Session expired. Please login again.");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Error loading orders. Please try again later.");
      }
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadOrderHistory = async () => {
    try {
      setLoading(true);
      const response = await api.get("admin/download-order-history", {
        responseType: "blob",
      });

      if (response.status === 200) {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "Order_History.xlsx");
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to download file");
      }
    } catch (error) {
      setError("Error downloading order history. Please try again later.");
      console.error("Download error:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderToProcessing = async (orderId) => {
    if (!orderId) {
      setError("Order ID is missing. Cannot update order status.");
      return;
    }

    try {
      const response = await api.post(`/admin/orders/${orderId}/process`);

      if (response.data.priceUpdated && response.data.priceUpdateDetails) {
        setConfirmDialog({
          isOpen: true,
          order: { _id: orderId },
          details: response.data.priceUpdateDetails,
        });
      } else {
        setConfirmDialog({
          isOpen: true,
          order: { _id: orderId },
          message: response.data.message,
        });
      }

      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      setError(
        error.response?.data?.error ||
          error.response?.data?.details ||
          "Failed to update order status."
      );
    }
  };

  const handleChangeOrderStatus = (order) => {
    if (!order._id) {
      setError("Order ID is missing. Cannot update order status.");
      return;
    }
    setProcessingDialog({
      isOpen: true,
      order,
      details: order.priceUpdateDetails || [],
    });
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === "" ||
      (order.orderId && order.orderId.includes(searchTerm)) ||
      (order.customerName && order.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.firmName && order.firmName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === "All" || order.orderStatus === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedOrders = filteredOrders.slice(startIndex, endIndex);

  const getStatusInfo = (status) => {
    const lowerStatus = status.toLowerCase();
    switch (lowerStatus) {
      case "pending":
        return { label: "Pending", icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-100" };
      case "confirmed":
        return { label: "Confirmed", icon: CheckCircle2, color: "bg-emerald-50 text-emerald-700 border-emerald-100" };
      case "shipped":
        return { label: "Shipped", icon: Truck, color: "bg-blue-50 text-blue-700 border-blue-100" };
      case "cancelled":
        return { label: "Cancelled", icon: XCircle, color: "bg-red-50 text-red-700 border-red-100" };
      case "preview":
        return { label: "Preview", icon: Eye, color: "bg-slate-50 text-slate-700 border-slate-100" };
      case "processing":
        return { label: "Processing", icon: Settings, color: "bg-orange-50 text-orange-700 border-orange-100" };
      default:
        return { label: status, icon: CircleDot, color: "bg-slate-50 text-slate-700 border-slate-100" };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl font-bold text-slate-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Order Management
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            View and manage all customer orders and their implementation status
          </motion.p>
        </div>
        <Button
          onClick={handleDownloadOrderHistory}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Download History
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500">Loading order data...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
                <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
                  <XCircle className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search Order ID, Customer, or Firm..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Select
                      value={filterCategory}
                      onValueChange={setFilterCategory}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        <SelectItem value="Bottle">Bottle</SelectItem>
                        <SelectItem value="Raw Material">Raw Material</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="preview">Preview</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Order ID
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Customer & Firm
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Items
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Status
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Total Amount
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedOrders.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                            No orders found matching your criteria
                          </td>
                        </tr>
                      ) : (
                        pagedOrders.map((order, index) => {
                          const statusInfo = getStatusInfo(order.orderStatus);
                          const StatusIcon = statusInfo.icon;

                          return (
                            <motion.tr
                              key={order._id || index}
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.03 }}
                              className="hover:bg-slate-50/50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <span className="text-sm font-bold text-slate-800">
                                  #{order.orderId}
                                </span>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-slate-800">
                                  {order.customerName}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {order.firmName}
                                </p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="max-w-[200px] truncate">
                                  {order.products.map((item, idx) => (
                                    <div key={idx} className="text-xs text-slate-600 flex items-center gap-1">
                                      <Package className="h-3 w-3 mr-0.5 text-slate-400" />
                                      {item.name || item.product?.name || "N/A"} ({item.quantity ?? 1})
                                    </div>
                                  ))}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-xs">
                                <Badge variant="secondary" className={statusInfo.color}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {statusInfo.label}
                                </Badge>
                              </td>
                              <td className="px-6 py-4">
                                {order.priceUpdated ? (
                                  <div className="flex flex-col">
                                    <span className="line-through text-[10px] text-slate-400 leading-none">
                                      ₹{order.totalAmountWithDelivery?.toLocaleString()}
                                    </span>
                                    <span className="text-sm font-bold text-blue-600">
                                      ₹{order.totalAmount?.toLocaleString()}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-slate-700">
                                    ₹{order.totalAmount?.toLocaleString()}
                                  </span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                {order.orderStatus === "preview" && (
                                  <Button
                                    onClick={() => handleChangeOrderStatus(order)}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700 h-8"
                                  >
                                    Accept Order
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-slate-600"
                                  onClick={() => navigate(`/order/${order._id}`)}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden divide-y divide-slate-100">
                  {pagedOrders.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400">
                      No orders found matching your criteria
                    </div>
                  ) : (
                    pagedOrders.map((order, index) => {
                      const statusInfo = getStatusInfo(order.orderStatus);
                      const StatusIcon = statusInfo.icon;

                      return (
                        <motion.div
                          key={order._id || index}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="p-4 space-y-4"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-sm font-bold text-slate-900">
                                #{order.orderId}
                              </span>
                              <p className="text-[10px] text-slate-400">
                                {new Date(order.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge variant="secondary" className={`${statusInfo.color} rounded-full`}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              <span className="text-[10px] font-semibold uppercase">{statusInfo.label}</span>
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Customer</p>
                              <p className="text-sm font-semibold text-slate-800 leading-tight">{order.customerName}</p>
                              <p className="text-xs text-slate-500 mt-0.5">{order.firmName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1">Amount</p>
                              {order.priceUpdated ? (
                                <div className="flex flex-col items-end">
                                  <span className="line-through text-[10px] text-slate-400 leading-none">
                                    ₹{order.totalAmountWithDelivery?.toLocaleString()}
                                  </span>
                                  <span className="text-sm font-bold text-blue-600">
                                    ₹{order.totalAmount?.toLocaleString()}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-sm font-bold text-slate-700">
                                  ₹{order.totalAmount?.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-50/50 rounded-lg p-3 space-y-1.5">
                            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mb-1 flex items-center gap-1">
                              <Package className="h-3 w-3" /> Items ({order.products.length})
                            </p>
                            {order.products.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="text-xs text-slate-600 flex justify-between">
                                <span className="truncate">{item.name || item.product?.name || "N/A"}</span>
                                <span className="font-medium text-slate-500 ml-2">x{item.quantity ?? 1}</span>
                              </div>
                            ))}
                            {order.products.length > 3 && (
                                <p className="text-[10px] text-blue-500 font-medium pt-1">
                                    + {order.products.length - 3} more items...
                                </p>
                            )}
                          </div>

                          <div className="flex gap-2">
                            {order.orderStatus === "preview" && (
                              <Button
                                onClick={() => handleChangeOrderStatus(order)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 h-9 rounded-lg text-xs"
                              >
                                Accept Order
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="flex-1 h-9 rounded-lg text-xs border-slate-200"
                              onClick={() => navigate(`/order/${order._id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Pagination Controls */}
                {filteredOrders.length > 0 && (
                  <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4 px-6 pb-6 whitespace-nowrap">
                    <div className="text-sm text-gray-700">
                      Showing {startIndex + 1}–
                      {Math.min(endIndex, filteredOrders.length)} of{" "}
                      {filteredOrders.length} orders
                    </div>
                    <Paginator
                      page={page}
                      total={filteredOrders.length}
                      pageSize={pageSize}
                      onPageChange={setPage}
                    />
                    <div className="flex items-center gap-2">
                      <label
                        htmlFor="pageSize"
                        className="text-sm text-gray-700"
                      >
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
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Processing Confirmation Dialog */}
      <PriceUpdateConfirm
        open={processingDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setProcessingDialog({ isOpen: false, order: null, details: [] })
        }
        order={processingDialog.order}
        details={processingDialog.details || []} // ✅ show backend-provided price changes here
        onConfirm={() => {
          const id = processingDialog.order?._id;
          setProcessingDialog({ isOpen: false, order: null, details: [] });
          if (id) updateOrderToProcessing(id);
        }}
        onClose={() =>
          setProcessingDialog({ isOpen: false, order: null, details: [] })
        }
        title="Confirm Order Processing"
        description={
          processingDialog?.details?.length > 0 ? (
            <>
              Are you sure you want to mark this order as processing?
              <br />
              The following price updates will be applied:
            </>
          ) : (
            "Are you sure you want to mark this order as processing?"
          )
        }
      />
      {processingDialog?.details?.length > 0 && (
        <ul className="mt-2 space-y-1">
          {processingDialog.details.map((d, idx) => {
            const productName =
              processingDialog.order?.products?.find(
                (p) => String(p.productId) === String(d.product)
              )?.name || "Unknown Product";
            return (
              <li key={idx} className="text-sm text-gray-700">
                Price of <span className="font-medium">{productName}</span>{" "}
                updated from{" "}
                <span className="line-through text-gray-500">
                  ₹{d.oldPrice}
                </span>{" "}
                to{" "}
                <span className="text-green-600 font-semibold">
                  ₹{d.newPrice}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      {/* Success Notification Dialog */}
      <PriceUpdateConfirm
        open={confirmDialog.isOpen}
        onOpenChange={(open) =>
          !open && setConfirmDialog({ isOpen: false, order: null })
        }
        order={confirmDialog.order}
        details={[]} // ✅ no price details anymore
        onConfirm={() => setConfirmDialog({ isOpen: false, order: null })}
        onClose={() => setConfirmDialog({ isOpen: false, order: null })}
        title="Order Processed Successfully"
        description="The order has been moved to processing status successfully."
        showOnlyOk={true}
      />
    </motion.div>
  );
};

export default Order;
