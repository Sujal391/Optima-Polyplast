import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Loader2, RefreshCw, MoreVertical, FileText, XCircle,
  ChevronDown, ChevronUp, PackageSearch, Search, ClipboardList, CheckCircle2
} from "lucide-react";
import cookies from "js-cookie";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Paginator from '../common/Paginator';
import ChallanGenerationWizard from "./ChallanGenerationWizard";
import RescheduleModal from "./RescheduleModal";

const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const formatDate = (d) => {
  if (!d) return "N/A";
  return new Date(d).toLocaleString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
};

const formatCurrency = (amt) =>
  (amt !== undefined && amt !== null) ? `₹${Number(amt).toLocaleString("en-IN")}` : 'N/A';

const getStatusColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s === 'approved_by_sales') return "bg-blue-100 text-blue-700 border-blue-200";
  if (s === 'processing' || s === 'confirmed') return "bg-teal-100 text-teal-700 border-teal-200";
  if (s === 'shipped') return "bg-green-100 text-green-700 border-green-200";
  if (s === 'cancelled') return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

const getPaymentColor = (status) => {
  const s = status?.toLowerCase() || '';
  if (s === 'completed' || s === 'paid') return "bg-green-100 text-green-700 border-green-200";
  if (s === 'pending') return "bg-amber-100 text-amber-700 border-amber-200";
  if (s === 'partial') return "bg-orange-100 text-orange-700 border-orange-200";
  return "bg-yellow-100 text-yellow-700 border-yellow-200";
};

const statusLabel = (s) => (s ? s.replace(/_/g, ' ') : 'approved by sales');

const DispatchComponent = () => {
  const [processingOrders, setProcessingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [generatedChallans, setGeneratedChallans] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Fix: use data attributes to detect outside clicks, not a single ref
  const handleGlobalClick = useCallback((e) => {
    if (!e.target.closest('[data-menu-container]')) {
      setActiveMenuId(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, [handleGlobalClick]);

  const handleMenuToggle = (e, orderId) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === orderId ? null : orderId));
  };

  const fetchProcessingOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/dispatch/orders/processing", {
        headers: { "Cache-Control": "no-cache" },
      });
      setProcessingOrders(response.data?.orders || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching processing orders");
    } finally {
      setIsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    setActiveMenuId(null);
    try {
      await api.patch(`/dispatch/orders/${orderId}/status`, { status });
      toast.success(`Order ${status === 'cancelled' ? 'cancelled' : `updated to ${status}`} successfully`);
      await fetchProcessingOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating order status");
    }
  };

  const generateChallansFromWizard = async (wizardData) => {
    const orderId = selectedOrder._id;
    const deliveryChoice = selectedOrder.deliveryChoice || "homeDelivery";
    const shippingAddress = selectedOrder.shippingAddress || {};
    const receiverFallback = selectedOrder.firmName || selectedOrder.user?.name || "";

    try {
      setIsLoading(true);
      const payload = {
        splitInfo: {
          numberOfChallans: wizardData.splitInfo.numberOfChallans,
          quantities: wizardData.splitInfo.quantities,
        },
        extraItems: wizardData.extraItems || [],
        scheduledDates: wizardData.scheduledDates.map((d) => new Date(d).toISOString()),
        deliveryChoice,
        shippingAddress,
        vehicleDetails: wizardData.vehicleDetails || [],
        deliveryChargePerBox: wizardData.deliveryChargePerBox || [],
        receiverName: wizardData.receiverName || receiverFallback,
      };

      const response = await api.post(`/dispatch/orders/${orderId}/generate-challan`, payload);
      toast.success(`${response.data.count || response.data.challans?.length || 1} challan(s) generated!`);
      setGeneratedChallans(response.data.challans || []);
      setShowWizard(false);
      setSelectedOrder(null);

      try {
        await api.patch(`/dispatch/orders/${orderId}/status`, { status: "shipped" });
        toast.success("Order marked as shipped!");
      } catch (statusErr) {
        toast.error(statusErr.response?.data?.error || "Challan generated but failed to mark as shipped.");
      }
      await fetchProcessingOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error generating challans");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchChallansForOrder = async (orderId) => {
    try {
      const response = await api.get(`/dispatch/orders/${orderId}/challans`);
      setGeneratedChallans(response.data.challans || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching challans");
    }
  };

  const rescheduleChallan = async (rescheduleData) => {
    try {
      setRescheduleLoading(true);
      await api.patch(`/dispatch/challans/${rescheduleData.challanId}/reschedule`, {
        newDate: rescheduleData.newDate,
        reason: rescheduleData.reason,
      });
      toast.success("Challan rescheduled successfully!");
      setShowRescheduleModal(false);
      setSelectedChallan(null);
      if (selectedOrder) await fetchChallansForOrder(selectedOrder._id);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error rescheduling challan");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleOrderSelection = (order) => {
    setSelectedOrder(order);
    setShowWizard(true);
    setActiveMenuId(null);
  };

  useEffect(() => { fetchProcessingOrders(); }, []);
  useEffect(() => { setPage(1); }, [search]);

  const filteredOrders = processingOrders.filter((o) => {
    if (o.orderStatus !== 'approved_by_sales') return false;
    const q = search.toLowerCase();
    return (
      !q ||
      o._id?.toLowerCase().includes(q) ||
      o.user?.name?.toLowerCase().includes(q) ||
      o.user?.phoneNumber?.toLowerCase().includes(q) ||
      o.firmName?.toLowerCase().includes(q) ||
      o.user?.customerDetails?.firmName?.toLowerCase().includes(q) ||
      o.user?.customerDetails?.userCode?.toLowerCase().includes(q)
    );
  });

  const total = filteredOrders.length;
  const startIdx = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIdx, startIdx + pageSize);
  const challanAlreadyExists = (order) => order.challanGenerated || (order.challanCount > 0);

  /* ─── Action Dropdown (shared by desktop & mobile) ─── */
  const ActionDropdown = ({ order }) => (
    <div data-menu-container className="relative inline-block">
      <button
        onClick={(e) => handleMenuToggle(e, order._id)}
        className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
        title="Order actions"
      >
        <MoreVertical className="h-4 w-4 text-gray-500" />
      </button>

      {activeMenuId === order._id && (
        <div className="absolute right-0 top-full mt-1 w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-1 overflow-hidden">
          {challanAlreadyExists(order) ? (
            <div className="px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed select-none">
              <CheckCircle2 className="h-4 w-4 text-green-400" /> Challan Generated
            </div>
          ) : (
            <button
              onMouseDown={(e) => { e.stopPropagation(); handleOrderSelection(order); }}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4 text-blue-500" /> Generate Challan
            </button>
          )}
          <div className="border-t border-gray-100 mt-1">
            <button
              onMouseDown={(e) => { e.stopPropagation(); updateOrderStatus(order._id, "cancelled"); }}
              className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
            >
              <XCircle className="h-4 w-4 text-red-500" /> Cancel Order
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl">
                <ClipboardList className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Approved Orders</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {isLoading ? "Loading…" : `${total} order${total !== 1 ? "s" : ""} pending dispatch`}
            </p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              />
            </div>
            <Button
              onClick={fetchProcessingOrders}
              variant="outline"
              className="bg-white border-gray-200 hover:bg-gray-50 shadow-sm rounded-xl shrink-0"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* ── Main Content Card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <span className="text-sm">Fetching approved orders...</span>
            </div>
          )}

          {/* Empty */}
          {!isLoading && pagedOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <PackageSearch className="h-10 w-10 text-gray-300" />
              <span className="text-base font-medium text-gray-500">No approved orders found</span>
              <span className="text-sm">Orders approved by sales will appear here.</span>
            </div>
          )}

          {/* ── Desktop Table (lg+) ── */}
          {!isLoading && pagedOrders.length > 0 && (
            <>
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      <TableHead className="font-semibold text-gray-600">Order</TableHead>
                      <TableHead className="font-semibold text-gray-600">Customer</TableHead>
                      <TableHead className="font-semibold text-gray-600">Address</TableHead>
                      <TableHead className="font-semibold text-gray-600">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600">Payment</TableHead>
                      <TableHead className="font-semibold text-gray-600">Items</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedOrders.map((order) => (
                      <TableRow key={order._id} className="hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded w-fit">
                              #{order.orderId || order._id.slice(-8).toUpperCase()}
                            </span>
                            <span className="text-[11px] text-gray-400 mt-1">{formatDate(order.createdAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="font-semibold text-gray-900 text-sm">{order.firmName || "N/A"}</p>
                          <p className="text-gray-500 text-xs mt-0.5">{order.user?.name}</p>
                          <p className="font-mono text-gray-400 text-[10px]">{order.user?.phoneNumber}</p>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="text-xs text-gray-500 truncate" title={
                            order.shippingAddress
                              ? `${order.shippingAddress.address || ""}, ${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} - ${order.shippingAddress.pinCode || ""}`
                              : "N/A"
                          }>
                            {order.shippingAddress
                              ? `${order.shippingAddress.address || ""}, ${order.shippingAddress.city || ""}`
                              : "N/A"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getStatusColor(order.orderStatus)}`}>
                            {statusLabel(order.orderStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-xs ${getPaymentColor(order.paymentStatus)}`}>
                            {order.paymentStatus || "pending"}
                          </Badge>
                          <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold">{order.paymentMethod || "COD"}</p>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <p className="text-xs text-gray-600 truncate" title={order.products.map((i) => `${i.product?.name}: ${i.boxes}`).join(', ')}>
                            {order.products.map((item, i) => (
                              <span key={i}>
                                <span className="font-medium text-gray-800">{item.product?.name} - {item.product?.category}</span> ({item.boxes})
                                {i < order.products.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </p>
                        </TableCell>
                        <TableCell className="text-right font-bold text-gray-900">
                          {formatCurrency(order.totalAmountWithGST || order.totalAmountWithDelivery || order.totalAmount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <ActionDropdown order={order} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ── Mobile / Tablet Cards (< lg) ── */}
              <div className="block lg:hidden divide-y divide-gray-100">
                {pagedOrders.map((order) => (
                  <div key={order._id} className="p-4 hover:bg-gray-50/60 transition-colors">
                    {/* Top row: ID + amount + action menu */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                            #{order.orderId || order._id.slice(-8).toUpperCase()}
                          </span>
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getStatusColor(order.orderStatus)}`}>
                            {statusLabel(order.orderStatus)}
                          </Badge>
                        </div>
                        <p className="font-semibold text-gray-900 mt-1 text-sm">{order.firmName || "N/A"}</p>
                        <p className="text-xs text-gray-500">{order.user?.name} · {order.user?.phoneNumber}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-1">
                        <p className="font-bold text-gray-900 text-sm">{formatCurrency(order.totalAmountWithGST || order.totalAmountWithDelivery || order.totalAmount)}</p>
                        <ActionDropdown order={order} />
                      </div>
                    </div>

                    {/* Badge row */}
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus || "pending"}
                      </Badge>
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {order.paymentMethod || "COD"}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>

                    {/* Products + expand */}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 truncate flex-1 mr-2">
                        {order.products.map((i) => `${i.product?.name} - ${i.product?.category} (${i.boxes})`).join(', ')}
                      </p>
                      <button
                        onClick={() => setExpandedRow((prev) => (prev === order._id ? null : order._id))}
                        className="shrink-0 text-xs text-blue-600 flex items-center gap-1 hover:underline"
                      >
                        {expandedRow === order._id
                          ? <><ChevronUp className="h-3 w-3" /> Less</>
                          : <><ChevronDown className="h-3 w-3" /> Details</>}
                      </button>
                    </div>

                    {/* Expanded detail */}
                    {expandedRow === order._id && (
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Products:</p>
                          <ul className="text-xs text-gray-500 space-y-0.5 list-disc pl-4">
                            {order.products.map((item, i) => (
                              <li key={i}>{item.product?.name} - {item.product?.category} : <span className="font-semibold text-gray-700">{item.boxes} boxes</span></li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 mb-1">Shipping Address:</p>
                          <p className="text-xs text-gray-500">
                            {order.shippingAddress
                              ? `${order.shippingAddress.address || ""}, ${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} - ${order.shippingAddress.pinCode || ""}`
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Pagination ── */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <span className="text-sm text-gray-500">
                Showing <span className="font-medium text-gray-700">{Math.min(total, startIdx + 1)}</span>–
                <span className="font-medium text-gray-700">{Math.min(total, startIdx + pageSize)}</span> of{' '}
                <span className="font-medium text-gray-700">{total}</span>
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

      {/* ── Wizard ── */}
      {showWizard && selectedOrder && (
        <ChallanGenerationWizard
          order={selectedOrder}
          onClose={() => { setShowWizard(false); setSelectedOrder(null); }}
          onSuccess={generateChallansFromWizard}
        />
      )}

      {showRescheduleModal && selectedChallan && (
        <RescheduleModal
          challan={selectedChallan}
          onClose={() => { setShowRescheduleModal(false); setSelectedChallan(null); }}
          onConfirm={rescheduleChallan}
          loading={rescheduleLoading}
        />
      )}
    </div>
  );
};

export default DispatchComponent;