import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { toast } from "react-toastify";
import {
  Loader2, Package, Calendar, Edit, IndianRupee, CreditCard, X
} from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../ui/dialog";
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

const formatCurrency = (amount) => {
  return amount !== undefined && amount !== null 
    ? `₹${Number(amount).toLocaleString("en-IN")}` 
    : 'N/A';
};

const UserOrdersDrawer = ({ open, onClose, customer }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // --- Edit Order State ---
  const [editModal, setEditModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [editForm, setEditForm] = useState({
    products: [],
    deliveryChoice: "homeDelivery",
    shippingAddress: { address: "", city: "", state: "", pinCode: "" }
  });
  const [updatingOrder, setUpdatingOrder] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // --- Payment Status State ---
  const [statusModal, setStatusModal] = useState({
    isOpen: false, paymentId: null, remainingAmount: 0, totalAmount: 0
  });
  const [statusForm, setStatusForm] = useState({
    paymentStatus: "completed", receivedAmount: "", paymentMode: "", remarks: "", referenceId: "", bankName: "", screenshot: null
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (open && customer?.userCode) {
      fetchOrders();
    } else {
      setOrders([]);
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, customer]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/reception/orders/full/${customer.userCode}`);
      setOrders(res.data?.orders || []);
    } catch (err) {
      if (err.response?.status === 404) {
        setOrders([]); // no orders found
      } else {
        setError(err.response?.data?.error || "Failed to load order history");
        toast.error(err.response?.data?.error || "Failed to load order history");
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('sales_pending') || s.includes('pending')) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (s.includes('approved_by_sales') || s.includes('delivered') || s.includes('completed') || s.includes('paid')) return "bg-green-100 text-green-700 border-green-200";
    if (s.includes('processing') || s.includes('shipped') || s.includes('confirmed')) return "bg-blue-100 text-blue-700 border-blue-200";
    if (s.includes('partial')) return "bg-orange-100 text-orange-700 border-orange-200";
    if (s.includes('rejected_by_sales') || s.includes('cancelled') || s.includes('failed')) return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  // --------------------------------------------------------------------------
  // EDIT ORDER LOGIC
  // --------------------------------------------------------------------------
  const createPanelApi = (panelToken) => {
    const inst = axios.create({ baseURL: process.env.REACT_APP_API });
    inst.interceptors.request.use(
      (config) => {
        config.headers.Authorization = panelToken.startsWith("Bearer ") ? panelToken : `Bearer ${panelToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );
    return inst;
  };

  const fetchProductsForEdit = async () => {
    setLoadingProducts(true);
    try {
      const accessRes = await api.post("/reception/user-panel-access", { userCode: customer.userCode });
      const panelApi = createPanelApi(accessRes.data.token);
      const prodRes = await panelApi.get("/reception/user-panel/products");
      setAllProducts(prodRes.data.products || []);
    } catch (err) {
      toast.error("Failed to load products list");
    } finally {
      setLoadingProducts(false);
    }
  };

  const openEditModal = (order) => {
    setEditOrder(order);
    setEditForm({
      products: order.products?.map(p => ({
        productId: p.product?._id || p.product?.id || p.product,
        name: p.product?.name || "Unknown Product",
        boxes: p.boxes || 0,
        price: p.price || 0
      })) || [],
      deliveryChoice: order.deliveryChoice || "homeDelivery",
      shippingAddress: order.shippingAddress || { address: "", city: "", state: "", pinCode: "" }
    });
    setEditModal(true);
    if (allProducts.length === 0) {
      fetchProductsForEdit();
    }
  };

  const closeEditModal = () => {
    setEditModal(false);
    setEditOrder(null);
  };

  const updateEditProduct = (idx, field, value) => {
    const updated = [...editForm.products];
    updated[idx][field] = value;
    setEditForm({ ...editForm, products: updated });
  };

  const removeEditProduct = (idx) => {
    const updated = [...editForm.products];
    updated.splice(idx, 1);
    setEditForm({ ...editForm, products: updated });
  };

  const handleAddProduct = (e) => {
    const productId = e.target.value;
    if (!productId) return;
    const product = allProducts.find(p => p._id === productId);
    if (product) {
      setEditForm(prev => ({
        ...prev,
        products: [...prev.products, {
          productId: product._id,
          name: product.name,
          boxes: 1,
          price: product.price
        }]
      }));
    }
    e.target.value = "";
  };

  const handleEditSubmit = async () => {
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
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to update order");
    } finally {
      setUpdatingOrder(false);
    }
  };

  // --------------------------------------------------------------------------
  // UPDATE PAYMENT STATUS LOGIC
  // --------------------------------------------------------------------------
  const openStatusModal = (order) => {
    if (!order.paymentDetails) {
       toast.error("No payment details available for this order (older records may not support this)");
       return; 
    }
    const remainingAmount = order.paymentDetails.amount - (order.paymentDetails.paidAmount || 0);

    setStatusModal({
      isOpen: true,
      paymentId: order.paymentDetails._id,
      remainingAmount: remainingAmount > 0 ? remainingAmount : 0,
      totalAmount: order.paymentDetails.amount || order.totalAmountWithDelivery || order.totalAmount || 0,
    });
    
    setStatusForm({
      paymentStatus: remainingAmount > 0 ? "partial" : "completed",
      receivedAmount: remainingAmount > 0 ? remainingAmount : "",
      paymentMode: "",
      remarks: "",
      referenceId: "",
      bankName: "",
      screenshot: null
    });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, paymentId: null, remainingAmount: 0, totalAmount: 0 });
    setStatusForm({ paymentStatus: "completed", receivedAmount: "", paymentMode: "", remarks: "", referenceId: "", bankName: "", screenshot: null });
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleUpdatePaymentStatus = async () => {
    const { paymentStatus, receivedAmount, paymentMode, remarks, referenceId, bankName, screenshot } = statusForm;
    const { paymentId, remainingAmount } = statusModal;

    if (!paymentStatus) return toast.warning("Please select a status.");
    if (!paymentMode) return toast.warning("Please select a mode.");
    if (paymentMode === "cheque" && !referenceId.trim()) {
      return toast.warning("Reference ID is required for cheque payments.");
    }

    const parsedAmount = parseFloat(receivedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return toast.warning("Enter a valid amount.");
    if (remainingAmount && parsedAmount > remainingAmount) return toast.warning(`Amount cannot exceed ₹${remainingAmount}.`);

    setUpdatingStatus(true);
    try {
      let screenshotBase64 = undefined;
      if (screenshot) {
        screenshotBase64 = await convertToBase64(screenshot);
      }

      const payload = {
        paymentStatus,
        receivedAmount: parsedAmount,
        paymentMode,
        remarks: remarks || undefined,
        referenceId: referenceId || undefined,
        bankName: bankName || undefined,
        screenshotUrl: screenshotBase64
      };

      const res = await api.patch(`/reception/payments/${paymentId}/status`, payload);
      toast.success(res.data?.message || "Payment updated successfully");
      
      closeStatusModal();
      fetchOrders();
    } catch (error) {
      toast.error(error.response?.data?.details?.error || error.response?.data?.message || "Error updating payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col p-0 overflow-hidden bg-gray-50/50">
          <SheetHeader className="px-6 py-5 bg-white border-b border-gray-100 shrink-0 shadow-sm relative z-10">
            <SheetTitle className="flex items-center gap-2 text-xl font-bold text-gray-900">
              <Package className="h-5 w-5 text-blue-600" /> Order History
            </SheetTitle>
            <SheetDescription className="text-gray-500 mt-1">
              {customer ? `Showing orders for ${customer.name || customer.firmName} (${customer.userCode})` : "Select a customer"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm font-medium">Fetching history...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm border border-red-100">
                {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3 bg-white border border-gray-100 rounded-2xl p-8">
                <Package className="h-12 w-12 text-gray-200" />
                <p className="text-sm font-medium text-gray-500">No previous orders found.</p>
              </div>
            ) : (
               orders.map((order, idx) => (
                 <div key={order._id || idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                   {/* Header */}
                   <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex justify-between items-start mb-2">
                     <div>
                       <p className="text-xs text-gray-500 font-medium mb-1.5 flex items-center gap-1.5">
                         <Calendar className="h-3.5 w-3.5 text-gray-400" /> {new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} 
                       </p>
                       <p className="font-mono text-xs font-bold text-gray-800 tracking-tight bg-white px-2 py-1 rounded border border-gray-200 inline-block">ID: {order._id.slice(-6).toUpperCase()}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-lg font-bold text-gray-900">{formatCurrency(order.totalAmountWithDelivery || order.totalAmount)}</p>
                       <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">{order.paymentMethod}</p>
                     </div>
                   </div>

                   {/* Body */}
                   <div className="px-5 py-4">
                     <div className="flex flex-wrap gap-2 mb-5">
                       <Badge variant="outline" className={`text-[10px] shadow-sm uppercase font-bold tracking-wider px-2 py-0.5 ${getStatusColor(order.orderStatus)}`}>
                         Status: {order.orderStatus?.replace('_', ' ')}
                       </Badge>
                       <Badge variant="outline" className={`text-[10px] shadow-sm uppercase font-bold tracking-wider px-2 py-0.5 ${getStatusColor(order.paymentStatus)}`}>
                         Payment: {order.paymentStatus}
                       </Badge>
                     </div>
                     
                     <div className="space-y-3 mb-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                       <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200 pb-2 mb-2">Invoice Items</p>
                       {order.products?.map((item, i) => (
                         <div key={i} className="flex justify-between items-center text-sm">
                           <div className="flex items-center gap-2">
                             <span className="font-semibold text-gray-800">{item.product?.name || "Product"}</span>
                             <span className="text-[10px] font-bold text-gray-500 bg-gray-200/60 px-2 py-0.5 rounded-full">x{item.boxes} boxes</span>
                           </div>
                           <span className="text-gray-700 font-bold">{formatCurrency(item.boxes * item.price)}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   {/* Actions */}
                   <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/50 flex flex-wrap justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-semibold text-amber-600 border-amber-200 hover:bg-amber-50 transition-colors" onClick={() => openEditModal(order)}>
                        <Edit className="h-3.5 w-3.5 mr-1.5" /> Edit Order
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-3 text-xs font-semibold text-emerald-600 border-emerald-200 hover:bg-emerald-50 transition-colors" onClick={() => openStatusModal(order)}>
                        <IndianRupee className="h-3.5 w-3.5 mr-1.5" /> Update Payment
                      </Button>
                   </div>
                 </div>
               ))
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <Button variant="outline" className="w-full font-medium" onClick={onClose}>
              Close History
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 📌 EDIT ORDER DIALOG */}
      <Dialog open={editModal} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="px-6 py-4 border-b border-gray-100 shrink-0">
            <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Edit className="h-5 w-5 text-amber-600" /> Edit Order {editOrder && (editOrder._id?.slice(-8).toUpperCase())}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 overflow-y-auto max-h-[65vh] space-y-6">
            
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Products</h3>
              <div className="space-y-3">
                {editForm.products.map((p, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                    <div className="flex-1 pr-6 sm:pr-0">
                      <p className="font-semibold text-sm text-gray-800">{p.name}</p>
                    </div>
                    <div className="flex gap-3 items-end">
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 absolute top-2 right-2 sm:relative sm:top-0 sm:right-0 mb-0 sm:mb-0"
                        onClick={() => removeEditProduct(idx)}
                        title="Remove Product"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Product Dropdown */}
                <div className="pt-2">
                  {loadingProducts ? (
                    <div className="flex items-center text-sm text-gray-500 gap-2 px-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-500" /> Loading products...
                    </div>
                  ) : (
                    <select
                      className="w-full border border-dashed border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white hover:bg-gray-50 transition-colors"
                      onChange={handleAddProduct}
                      defaultValue=""
                    >
                      <option value="" disabled>+ Select additional product to add...</option>
                      {allProducts
                        .filter(p => !editForm.products.find(ep => ep.productId === p._id))
                        .map(p => (
                          <option key={p._id} value={p._id}>
                            {p.name} (₹{p.price})
                          </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

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


      {/* 📌 UPDATE STATUS DIALOG */}
      <Dialog open={statusModal.isOpen} onOpenChange={(open) => !open && closeStatusModal()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                  <CreditCard className="h-5 w-5" />
               </div>
               <div>
                 <DialogTitle className="text-lg font-bold text-gray-900">Update Payment</DialogTitle>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-0.5">
                    Order ID: {statusModal.paymentId ? statusModal.paymentId.slice(-6).toUpperCase() : ""}
                 </p>
               </div>
            </div>
          </div>

          <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[65vh]">
            
            <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                 <span className="block text-xs text-gray-500 font-medium">Remaining Amount</span>
                 <span className="font-bold text-red-600 text-base">{formatCurrency(statusModal.remainingAmount)}</span>
              </div>
              <div className="text-right">
                 <span className="block text-xs text-gray-500 font-medium">Total Amount</span>
                 <span className="font-semibold text-gray-900">{formatCurrency(statusModal.totalAmount)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Payment Status</label>
              <select
                value={statusForm.paymentStatus}
                onChange={(e) => setStatusForm(p => ({ ...p, paymentStatus: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="completed">Completed</option>
                <option value="partial">Partial</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Received Amt (₹)</label>
                <input
                  type="number"
                  min="0" max={statusModal.remainingAmount}
                  value={statusForm.receivedAmount}
                  onChange={(e) => setStatusForm(p => ({ ...p, receivedAmount: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-emerald-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Mode</label>
                <select
                  value={statusForm.paymentMode}
                  onChange={(e) => setStatusForm(p => ({ ...p, paymentMode: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>Select...</option>
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            {statusForm.paymentMode === "cheque" && (
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reference ID</label>
                <input
                  type="text"
                  value={statusForm.referenceId}
                  onChange={(e) => setStatusForm(p => ({ ...p, referenceId: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Cheque number / Ref ID"
                />
              </div>
            )}

            {statusForm.paymentMode === "online" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Bank Name (Optional)</label>
                  <select
                    value={statusForm.bankName}
                    onChange={(e) => setStatusForm(p => ({ ...p, bankName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="" disabled>Select Bank...</option>
                    <option value="IDFC">IDFC</option>
                    <option value="HDFC">HDFC</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Ref ID (Optional)</label>
                    <input
                      type="text"
                      value={statusForm.referenceId}
                      onChange={(e) => setStatusForm(p => ({ ...p, referenceId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ref ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Screenshot (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
                          if (!validTypes.includes(file.type) || file.size > 1024 * 1024) {
                            toast.error("upload valid image less than 1 mb");
                            e.target.value = "";
                            return;
                          }
                          setStatusForm(p => ({ ...p, screenshot: file }));
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Remarks (Optional)</label>
              <textarea
                value={statusForm.remarks}
                onChange={(e) => setStatusForm(p => ({ ...p, remarks: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[80px] resize-none"
                placeholder="Transaction ID, notes..."
              />
            </div>

          </div>

          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
            <Button variant="outline" onClick={closeStatusModal} disabled={updatingStatus}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleUpdatePaymentStatus} disabled={updatingStatus}>
              {updatingStatus ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : "Submit Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserOrdersDrawer;
