import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Loader2, PackageSearch, Calendar, MapPin, Package, Eye, CheckCircle2, XCircle
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../ui/dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

const SalesOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModal, setDetailModal] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  // Add ref for reject section
  const rejectSectionRef = useRef(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/sales/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      setError("Failed to load sales orders.");
      toast.error(err.response?.data?.error || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderToApproveArg) => {
    // If called via onClick={handleApprove}, the first arg is an event.
    // We prefer the passed arg if it's a valid order object, otherwise fallback to selectedOrder.
    const order = (orderToApproveArg && orderToApproveArg._id) ? orderToApproveArg : selectedOrder;
    if (!order) return;

    setApproving(order._id || true);
    try {
      await api.put(`/sales/orders/${order._id}/approve`);
      toast.success("Order approved successfully!");
      setDetailModal(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve order.");
    } finally {
      setApproving(false);
    }
  };

  const initiateReject = (order) => {
    setSelectedOrder(order);
    setShowRejectInput(true);
    setRejectReason("");
    setDetailModal(true);
    
    // Scroll to reject section after modal opens
    setTimeout(() => {
      if (rejectSectionRef.current) {
        rejectSectionRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
    }, 100);
  };

  const handleReject = async () => {
    if (!selectedOrder) return;
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason.");
      return;
    }
    setRejecting(true);
    try {
      await api.put(`/sales/orders/${selectedOrder._id}/reject`, { reason: rejectReason });
      toast.success("Order rejected successfully!");
      setDetailModal(false);
      setSelectedOrder(null);
      setShowRejectInput(false);
      setRejectReason("");
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject order.");
    } finally {
      setRejecting(false);
    }
  };

  const openDetails = (order) => {
    setSelectedOrder(order);
    setShowRejectInput(false);
    setRejectReason("");
    setDetailModal(true);
  };

  const formatCurrency = (amt) => amt !== undefined ? `₹${Number(amt).toLocaleString("en-IN")}` : "N/A";

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('pending')) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (s.includes('approved')) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes('rejected')) return "bg-red-100 text-red-700 border-red-200";
    if (s.includes('delivered') || s.includes('completed')) return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s.includes('processing') || s.includes('shipped')) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-blue-500">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium text-slate-500">Loading Orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight">Sales Orders</h1>
            <p className="text-sm text-slate-500 mt-1">Review and approve customer orders before dispatch.</p>
          </div>
          <div className="bg-white border text-sm font-semibold border-slate-200 shadow-sm rounded-xl px-4 py-2 text-slate-600 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-500" />
            {orders.length} Total Orders
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-sm text-center">
            {error}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400">
            <PackageSearch className="h-16 w-16 mb-4 text-slate-300" />
            <h3 className="text-lg font-bold text-slate-600">No Orders Found</h3>
            <p className="text-sm mt-1">There are currently no orders assigned to sales.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden lg:block bg-white border text-sm font-medium border-slate-200 shadow-sm rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left align-middle whitespace-nowrap">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4 font-semibold">Order Details</th>
                      <th className="px-6 py-4 font-semibold">Customer & Shipping</th>
                      <th className="px-6 py-4 font-semibold">Summary</th>
                      <th className="px-6 py-4 font-semibold">Amount & Status</th>
                      <th className="px-6 py-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit uppercase">
                              ID: {order._id.slice(-6)}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-bold text-slate-800 line-clamp-1" title={order.user?.customerDetails?.firmName || order.firmName || order.user?.name || "Customer"}>
                              {order.user?.customerDetails?.firmName || order.firmName || order.user?.name || "Customer"}
                            </span>
                            <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-0.5 line-clamp-2" title={`${order.shippingAddress?.city}, ${order.shippingAddress?.state}`}>
                              <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pinCode}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 max-w-[200px] whitespace-normal">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs font-semibold text-slate-500">{order.products?.length} items</span>
                            <span className="text-xs text-slate-600 line-clamp-2" title={order.products?.map(p => p.product?.name).join(", ")}>
                              {order.products?.map(p => p.product?.name).join(", ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1.5 items-start">
                            <span className="text-sm font-bold text-slate-800">{formatCurrency(order.totalAmountWithGST || order.totalAmountWithDelivery || order.totalAmount)}</span>
                            <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 ${getStatusColor(order.orderStatus)}`}>
                              {order.orderStatus?.replace('_', ' ')}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors rounded-full"
                              onClick={() => openDetails(order)}
                              title="View Details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {(order.orderStatus === "pending" || order.orderStatus === "sales_pending") && (
                               <>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-full transition-colors"
                                    onClick={() => handleApprove(order)}
                                    title="Approve Order"
                                    disabled={approving || rejecting}
                                  >
                                    {approving === order._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-full transition-colors"
                                    onClick={() => initiateReject(order)}
                                    title="Reject Order"
                                    disabled={approving || rejecting}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                               </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile View */}
            <div className="lg:hidden space-y-4">
              {orders.map((order) => (
                <div key={order._id} className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit uppercase">
                        ID: {order._id.slice(-6)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <div>
                      <Badge variant="outline" className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 ${getStatusColor(order.orderStatus)}`}>
                        {order.orderStatus?.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-slate-800 line-clamp-1">
                      {order.user?.customerDetails?.firmName || order.firmName || order.user?.name || "Customer"}
                    </span>
                    <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pinCode}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                     <div className="flex flex-col gap-1">
                       <span className="text-[10px] text-slate-500 font-semibold uppercase">Products ({order.products?.length})</span>
                       <span className="text-sm text-slate-800 font-medium line-clamp-1">
                         {order.products?.map(p => p.product?.name).join(", ")}
                       </span>
                     </div>
                     <div className="flex flex-col gap-1 items-end">
                       <span className="text-[10px] text-slate-500 font-semibold uppercase">Total Amount</span>
                                               <span className="text-sm font-bold text-slate-800">{formatCurrency(order.totalAmountWithGST || order.totalAmountWithDelivery || order.totalAmount)}</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 flex-1 text-blue-600 border-blue-200 hover:bg-blue-50 transition-colors rounded-xl"
                      onClick={() => openDetails(order)}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View
                    </Button>
                    {(order.orderStatus === "pending" || order.orderStatus === "sales_pending") && (
                       <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 flex-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-colors"
                            onClick={() => handleApprove(order)}
                            disabled={approving || rejecting}
                          >
                            {approving === order._id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : <><CheckCircle2 className="h-4 w-4 mr-1" /> Approve</>}
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 w-10 p-0 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                            onClick={() => initiateReject(order)}
                            title="Reject Order"
                            disabled={approving || rejecting}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                       </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 📌 ORDER DETAILS & ACTION MODAL */}
      <Dialog open={detailModal} onOpenChange={(v) => !v && setDetailModal(false)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
          {selectedOrder && (
            <>
              <DialogHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 relative">
                <DialogTitle className="text-lg font-bold text-slate-900 flex items-center justify-between">
                  Order Summary
                </DialogTitle>
                <div className="text-sm text-slate-500 font-medium mt-1">
                  ID: <span className="font-mono text-slate-700">{selectedOrder._id}</span>
                </div>
              </DialogHeader>

              <div className="px-6 py-4 overflow-y-auto max-h-[60vh] space-y-6">
                
                {/* Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                     <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Customer info</h4>
                     <p className="font-semibold text-slate-800">{selectedOrder.user?.name || "Unknown"} ({selectedOrder.user?.phoneNumber || "-"})</p>
                     <p className="font-semibold text-slate-800">{selectedOrder.user?.customerDetails?.userCode || "-"}</p>
                     <p className="text-sm text-slate-600 mt-1">{selectedOrder.user?.customerDetails?.firmName || selectedOrder.firmName}</p>
                  </div>
                  <div>
                     <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Shipping</h4>
                     <p className="text-sm text-slate-700">
                       {selectedOrder.shippingAddress?.address}, {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pinCode}
                     </p>
                     <Badge variant="outline" className="mt-2 text-blue-600 border-blue-200 bg-blue-50">
                        {selectedOrder.deliveryChoice}
                     </Badge>
                  </div>
                </div>

                {/* Products */}
                <div>
                  <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-3">Products ({selectedOrder.products?.length})</h4>
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left align-middle">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3">Product</th>
                          <th className="px-4 py-3 text-center">Qty (Boxes)</th>
                          <th className="px-4 py-3 text-right">Price</th>
                          <th className="px-4 py-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedOrder.products?.map((p, idx) => (
                          <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3 font-medium text-slate-800">
                              <div className="flex items-center gap-3">
                                {p.product?.image && (
                                  <img src={p.product.image} alt="" className="w-8 h-8 rounded border border-slate-200 object-cover" />
                                )}
                                <span>{p.product?.name || "Unknown"} - {p.product?.category || ""}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-slate-600 font-semibold">{p.boxes}</td>
                            <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(p.price)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrency(p.boxes * p.price)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-800">
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-slate-500 font-medium">Subtotal:</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(selectedOrder.amount || selectedOrder.totalAmount || 0)}</td>
                        </tr>
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-slate-500 font-medium">GST:</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(selectedOrder.gst || 0)}</td>
                        </tr>
                        {Number(selectedOrder.deliveryCharge) > 0 && (
                          <tr>
                            <td colSpan="3" className="px-4 py-3 text-right text-slate-500 font-medium">Delivery Charge:</td>
                            <td className="px-4 py-3 text-right text-red-600">+{formatCurrency(selectedOrder.deliveryCharge)}</td>
                          </tr>
                        )}
                        <tr>
                          <td colSpan="3" className="px-4 py-3 text-right text-base text-blue-700">Grand Total:</td>
                          <td className="px-4 py-3 text-right text-base text-blue-700">{formatCurrency(selectedOrder.totalAmountWithGST || selectedOrder.totalAmountWithDelivery || selectedOrder.totalAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* Status Logs */}
                <div className="flex gap-4 p-4 rounded-xl border border-yellow-200 bg-yellow-50/50 items-start">
                   <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Current Order Status</p>
                      <Badge className={getStatusColor(selectedOrder.orderStatus)}>{selectedOrder.orderStatus?.replace('_', ' ')}</Badge>
                   </div>
                   <div className="flex-1">
                      <p className="text-xs font-semibold text-yellow-800 mb-1">Payment Status</p>
                      <Badge className={getStatusColor(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</Badge>
                   </div>
                </div>

                {/* Reject Input - Added ref here */}
                {showRejectInput && (
                  <div 
                    ref={rejectSectionRef}
                    className="bg-red-50 p-4 rounded-xl border border-red-200 animate-in fade-in slide-in-from-top-2"
                  >
                    <label className="block text-sm font-bold text-red-800 mb-2">Rejection Reason <span className="text-red-500">*</span></label>
                    <textarea 
                      className="w-full px-3 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 text-sm min-h-[80px]"
                      placeholder="e.g., Pricing mismatch, Customer requested cancellation..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    />
                    <div className="flex gap-2 mt-3 justify-end">
                      <Button variant="outline" size="sm" onClick={() => setShowRejectInput(false)} className="bg-white" disabled={rejecting}>Cancel</Button>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white" onClick={handleReject} disabled={rejecting}>
                         {rejecting ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Confirm Reject"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0 flex gap-3 justify-end">
                {!showRejectInput && (selectedOrder.orderStatus === "pending" || selectedOrder.orderStatus === "sales_pending") && (
                  <>
                     <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => setShowRejectInput(true)} disabled={approving}>
                       Reject Order
                     </Button>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => handleApprove(selectedOrder)} disabled={approving}>
                        {approving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : "Approve Order"}
                      </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesOrders;