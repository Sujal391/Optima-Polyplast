import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import {
  Search, Download, Eye, Loader2, PackageSearch, X,
  Clock, AlertCircle, CreditCard, ChevronRight, Hash, User, MapPin, Receipt, CheckCircle2
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

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

// Formatter Helpers
const formatCurrency = (amount) => typeof amount === "number" ? `₹${amount.toLocaleString("en-IN")}` : "N/A";
const formatDateTime = (dateString) => dateString ? new Date(dateString).toLocaleString("en-IN") : "N/A";

const getPaymentStatusColor = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'verified' || s === 'paid') return "bg-green-100 text-green-700 border-green-200";
  if (s === 'pending' || s === 'submitted') return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (s === 'partial') return "bg-orange-100 text-orange-700 border-orange-200";
  if (s === 'failed' || s === 'cancelled') return "bg-red-100 text-red-700 border-red-200";
  return "bg-gray-100 text-gray-700 border-gray-200";
};

export default function PendingPayment() {
  // STATE
  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "partial"
  
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingSearch, setPendingSearch] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);

  const [partialPayments, setPartialPayments] = useState([]);
  const [partialLoading, setPartialLoading] = useState(false);
  const [partialSearch, setPartialSearch] = useState("");
  const [partialPage, setPartialPage] = useState(1);
  const [partialPageSize, setPartialPageSize] = useState(10);

  const [downloading, setDownloading] = useState(false);

  // Modals
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, payment: null, loading: false });
  const [statusModal, setStatusModal] = useState({
    isOpen: false, paymentId: null, currentStatus: "", remainingAmount: 0, totalAmount: 0, paidAmount: 0, type: "pending"
  });
  const [statusForm, setStatusForm] = useState({ paymentStatus: "completed", receivedAmount: "", paymentMode: "", remarks: "", referenceId: "", bankName: "", screenshot: null });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // FETCH DATA
  const fetchPendingPayments = async () => {
    setPendingLoading(true);
    try {
      const res = await api.get("reception/pending-payments");
      setPendingPayments(res.data?.pendingPayments || []);
    } catch {
      toast.error("Error fetching pending payments");
    } finally {
      setPendingLoading(false);
    }
  };

  const fetchPartialPayments = async () => {
    setPartialLoading(true);
    try {
      const res = await api.get("reception/partial-payments");
      setPartialPayments(res.data?.partialPayments || []);
    } catch {
      toast.error("Error fetching partial payments");
    } finally {
      setPartialLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPayments();
    fetchPartialPayments();
  }, []);

  useEffect(() => {
    if (activeTab === "partial") fetchPartialPayments();
  }, [activeTab]);

  // DOWNLOAD EXCEL
  const handleDownloadExcel = async () => {
    setDownloading(true);
    try {
      const endpoint = activeTab === "pending" ? "reception/payments/pending/download" : "reception/payments/pending/download";
      const filename = activeTab === "pending" ? "pending_payments.xlsx" : "partial_payments.xlsx";
      
      const res = await api.get(endpoint, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${activeTab === "pending" ? 'Pending' : 'Partial'} payments downloaded`);
    } catch {
      toast.error("Error downloading Excel");
    } finally {
      setDownloading(false);
    }
  };

  // DETAILS MODAL
  const openDetailsModal = async (payment) => {
    setDetailsModal({ isOpen: true, payment: null, loading: true });
    try {
      const res = await api.get(`reception/payment/${payment.paymentId}`);
      setDetailsModal({ isOpen: true, payment: res.data?.payment || payment, loading: false });
    } catch {
      setDetailsModal({ isOpen: true, payment, loading: false });
      toast.error("Error fetching full payment details");
    }
  };

  const closeDetailsModal = () => setDetailsModal({ isOpen: false, payment: null, loading: false });

  // STATUS MODAL
  const openStatusModal = (payment, type) => {
    setStatusModal({
      isOpen: true,
      paymentId: payment.paymentId,
      currentStatus: payment.paymentStatus || payment.status || "pending",
      remainingAmount: payment.remainingAmount || 0,
      totalAmount: payment.totalAmountWithDelivery || payment.totalAmount || 0,
      paidAmount: payment.paidAmount || 0,
      type,
    });
    setStatusForm({
      paymentStatus: payment.remainingAmount > 0 ? "partial" : "completed",
      receivedAmount: payment.remainingAmount || "",
      paymentMode: payment.paymentMode || "",
      remarks: "",
      referenceId: "",
      bankName: "",
      screenshot: null
    });
  };

  const closeStatusModal = () => {
    setStatusModal({ isOpen: false, paymentId: null, currentStatus: "", remainingAmount: 0, totalAmount: 0, paidAmount: 0, type: "pending" });
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
      toast.success(res.data?.message || "Updated successfully");
      
      fetchPendingPayments();
      fetchPartialPayments();
      closeStatusModal();
    } catch (error) {
      toast.error(error.response?.data?.details?.error || error.response?.data?.message || "Error updating payment");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // FILTER & PAGINATION
  const filterPayments = (payments, term) => {
    if (!term.trim()) return payments;
    const q = term.toLowerCase();
    return payments.filter(p => 
      p.paymentId?.toLowerCase().includes(q) ||
      p.orderId?.toLowerCase().includes(q) ||
      p.user?.name?.toLowerCase().includes(q) ||
      p.firmName?.toLowerCase().includes(q) ||
      p.user?.userCode?.toLowerCase().includes(q) ||
      p.user?.phoneNumber?.toLowerCase().includes(q)
    );
  };

  const pagedData = () => {
    if (activeTab === "pending") {
      const filtered = filterPayments(pendingPayments, pendingSearch);
      const total = filtered.length;
      const startIdx = (pendingPage - 1) * pendingPageSize;
      return { data: filtered.slice(startIdx, startIdx + pendingPageSize), total, startIdx, page: pendingPage, pageSize: pendingPageSize, setPage: setPendingPage, setPageSize: setPendingPageSize };
    } else {
      const filtered = filterPayments(partialPayments, partialSearch);
      const total = filtered.length;
      const startIdx = (partialPage - 1) * partialPageSize;
      return { data: filtered.slice(startIdx, startIdx + partialPageSize), total, startIdx, page: partialPage, pageSize: partialPageSize, setPage: setPartialPage, setPageSize: setPartialPageSize };
    }
  };

  const { data, total, startIdx, page, pageSize, setPage, setPageSize } = pagedData();
  const isLoading = activeTab === "pending" ? pendingLoading : partialLoading;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-700 rounded-xl">
                <CreditCard className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Payment Management</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {pendingPayments.length} Pending • {partialPayments.length} Partial
            </p>
          </div>
          
          <Button 
            onClick={handleDownloadExcel} 
            disabled={downloading}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
          >
            {downloading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Downloading...</> : <><Download className="h-4 w-4 mr-2" />Download Excel</>}
          </Button>
        </div>

        {/* Tabs & Search */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex p-1 bg-gray-100 rounded-xl w-full sm:w-auto shrink-0">
            <button
              onClick={() => setActiveTab("pending")}
              className={`flex-1 sm:px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "pending" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Pending ({pendingPayments.length})
            </button>
            <button
              onClick={() => setActiveTab("partial")}
              className={`flex-1 sm:px-6 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === "partial" ? "bg-white text-orange-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Partial ({partialPayments.length})
            </button>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by ID, Name, Phone, Firm..."
              value={activeTab === "pending" ? pendingSearch : partialSearch}
              onChange={(e) => {
                if (activeTab === "pending") { setPendingSearch(e.target.value); setPendingPage(1); }
                else { setPartialSearch(e.target.value); setPartialPage(1); }
              }}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 h-full min-h-[40px]"
            />
          </div>
        </div>

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
                  <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-right">Paid</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-right">Remaining</TableHead>
                  <TableHead className="font-semibold text-gray-600">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        <span className="text-sm">Loading payments...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <PackageSearch className="h-8 w-8" />
                        <span className="text-sm">No records found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((p) => (
                    <TableRow key={p.paymentId} className="hover:bg-green-50/40 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-semibold text-gray-700">
                            {p.user?.userCode || "(Misc)"}
                          </span>
                          <span className="text-[11px] text-gray-500 mt-0.5">{formatDateTime(p.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{p.user?.name || "N/A"}</span>
                          <span className="text-xs text-gray-500 font-mono mt-0.5">{p.user?.phoneNumber || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{p.user?.firmName || p.firmName || "N/A"}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">{formatCurrency(p.totalAmountWithDelivery || p.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-green-600">{formatCurrency(p.paidAmount)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-red-600">{formatCurrency(p.remainingAmount)}</span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPaymentStatusColor(p.paymentStatus || p.status)}>
                          {p.paymentStatus || p.status || activeTab}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100">
                              <span className="font-bold text-lg leading-none p-0 pb-2">...</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => openDetailsModal(p)} className="cursor-pointer">
                              <Eye className="mr-2 h-4 w-4" /> View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openStatusModal(p, activeTab)} className="cursor-pointer text-green-600 focus:text-green-700">
                              <CreditCard className="mr-2 h-4 w-4" /> Update Status
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet view */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {isLoading ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                 <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                 <span className="text-sm">Loading...</span>
               </div>
            ) : data.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                 <PackageSearch className="h-8 w-8" />
                 <span className="text-sm">No records found</span>
               </div>
            ) : (
              data.map((p) => (
                <div key={p.paymentId} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                        {p.user?.userCode || "(Misc)"}
                      </span>
                      <p className="font-medium text-gray-900 mt-1">{p.user?.name || "N/A"}</p>
                    </div>
                    <Badge variant="outline" className={`${getPaymentStatusColor(p.paymentStatus || p.status)} py-0 shrink-0`}>
                      {p.paymentStatus || p.status || activeTab}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3 bg-gray-50 rounded-lg p-2">
                    <div>
                      <span className="text-xs text-gray-500 block">Total</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(p.totalAmountWithDelivery || p.totalAmount)}</span>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 block">Remaining</span>
                      <span className="font-bold text-red-600">{formatCurrency(p.remainingAmount)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <Button variant="outline" size="sm" className="flex-1 border-gray-200" onClick={() => openDetailsModal(p)}>
                      <Eye className="h-3 w-3 mr-1.5" /> View Details
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100" onClick={() => openStatusModal(p, activeTab)}>
                      <CreditCard className="h-3 w-3 mr-1.5" /> Update
                    </Button>
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
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
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

      {/* 📌 PAYMENT DETAILS DIALOG */}
      <Dialog 
        open={detailsModal.isOpen} 
        onOpenChange={(open) => !open && closeDetailsModal()}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gray-50">
          <DialogHeader className="px-6 py-4 bg-white border-b shrink-0 flex flex-row items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-gray-900">
               <Receipt className="h-5 w-5 text-green-600" /> Payment Overview
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto max-h-[70vh]">
            {detailsModal.loading ? (
              <div className="flex flex-col items-center justify-center py-10 space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                <span className="text-gray-500 text-sm">Loading details...</span>
              </div>
            ) : detailsModal.payment ? (
              <div className="space-y-6">
                
                {/* Financial Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Total Amount</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(detailsModal.payment.totalAmountWithDelivery || detailsModal.payment.totalAmount)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-medium mb-1 uppercase">Delivery Chg</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(detailsModal.payment.deliveryCharge)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 shadow-sm">
                    <p className="text-xs text-green-700 font-medium mb-1 uppercase">Paid Amount</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(detailsModal.payment.paidAmount)}</p>
                  </div>
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200 shadow-sm">
                    <p className="text-xs text-red-700 font-medium mb-1 uppercase">Remaining</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(detailsModal.payment.remainingAmount)}</p>
                  </div>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                       <User className="h-4 w-4 text-gray-400" />
                       <h3 className="font-semibold text-gray-800">Customer Info</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Name:</span> <span className="font-medium text-gray-900">{detailsModal.payment.user?.name || "N/A"}</span></p>
                      <p><span className="text-gray-500">Firm:</span> <span className="font-medium text-gray-900">{detailsModal.payment.user?.firmName || detailsModal.payment.firmName || "N/A"}</span></p>
                      <p><span className="text-gray-500">Code:</span> <span className="font-mono text-xs">{detailsModal.payment.user?.userCode || "N/A"}</span></p>
                      <p><span className="text-gray-500">Phone:</span> {detailsModal.payment.user?.phoneNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                       <MapPin className="h-4 w-4 text-gray-400" />
                       <h3 className="font-semibold text-gray-800">Order Context</h3>
                    </div>
                    <div className="text-sm space-y-1">
                      <p><span className="text-gray-500">Order ID:</span> <span className="font-mono text-xs font-semibold">{detailsModal.payment.orderId || "N/A"}</span></p>
                      <p className="flex items-center gap-2">
                         <span className="text-gray-500">Order Status:</span> 
                         <Badge variant="outline" className="py-0 h-5" >{detailsModal.payment.orderStatus || "N/A"}</Badge>
                      </p>
                      <p className="flex items-center gap-2">
                         <span className="text-gray-500">Payment Status:</span> 
                         <Badge variant="outline" className={`py-0 h-5 ${getPaymentStatusColor(detailsModal.payment.paymentStatus)}`}>{detailsModal.payment.paymentStatus || "N/A"}</Badge>
                      </p>
                      <p><span className="text-gray-500">Created:</span> {formatDateTime(detailsModal.payment.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Payment History List */}
                {detailsModal.payment.paymentHistory?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 font-semibold text-gray-800 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" /> Transaction History
                    </div>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-transparent hover:bg-transparent">
                            <TableHead className="font-semibold text-gray-600">Date</TableHead>
                            <TableHead className="font-semibold text-gray-600">Ref ID</TableHead>
                            <TableHead className="font-semibold text-gray-600">Mode</TableHead>
                            <TableHead className="font-semibold text-gray-600">Bank</TableHead>
                            <TableHead className="font-semibold text-gray-600">Screenshot</TableHead>
                            <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detailsModal.payment.paymentHistory.map((h, i) => (
                            <TableRow key={i}>
                              <TableCell className="text-xs">{formatDateTime(h.date || h.submissionDate || h.createdAt)}</TableCell>
                              <TableCell className="font-mono text-xs">{h.referenceId || h.paymentId || "—"}</TableCell>
                              <TableCell className="uppercase text-xs font-semibold">{h.paymentMode || "—"}</TableCell>
                              <TableCell className="uppercase text-xs font-semibold">{h.bankName || "—"}</TableCell>
                              <TableCell className="text-xs">
                                {h.screenshotUrl ? (
                                  <a href={h.screenshotUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                                    <Eye className="h-3 w-3" /> View
                                  </a>
                                ) : "—"}
                              </TableCell>
                              <TableCell className="text-right font-bold text-green-700">
                                {formatCurrency(h.amount || h.submittedAmount || h.verifiedAmount)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="px-6 py-4 bg-white border-t shrink-0">
             <Button variant="outline" onClick={closeDetailsModal}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 📌 UPDATE STATUS DIALOG */}
      <Dialog open={statusModal.isOpen} onOpenChange={(open) => !open && closeStatusModal()}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white">
          <div className="px-6 py-4 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <CreditCard className="h-5 w-5" />
               </div>
               <div>
                 <DialogTitle className="text-lg font-bold text-gray-900">Update Payment</DialogTitle>
                 <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mt-0.5">
                    ID: {statusModal.paymentId}
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 font-semibold text-green-700"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Mode</label>
                <select
                  value={statusForm.paymentMode}
                  onChange={(e) => setStatusForm(p => ({ ...p, paymentMode: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="" disabled>Select...</option>
                  <option value="cash">Cash</option>
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            {statusForm.paymentMode === "online" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Bank Name (Optional)</label>
                  <select
                    value={statusForm.bankName}
                    onChange={(e) => setStatusForm(p => ({ ...p, bankName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="" disabled>Select Bank...</option>
                    <option value="IDFC">IDFC</option>
                    <option value="HDFC">HDFC</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Reference ID (Optional)</label>
                    <input
                      type="text"
                      value={statusForm.referenceId}
                      onChange={(e) => setStatusForm(p => ({ ...p, referenceId: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Ref ID"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1">Upload Screenshot (Optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setStatusForm(p => ({ ...p, screenshot: e.target.files[0] }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-h-[80px] resize-none"
                placeholder="Transaction ID, notes..."
              />
            </div>

          </div>

          <div className="flex gap-3 justify-end px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
            <Button variant="outline" onClick={closeStatusModal} disabled={updatingStatus}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleUpdatePaymentStatus} disabled={updatingStatus}>
              {updatingStatus ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Updating...</> : "Submit Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}