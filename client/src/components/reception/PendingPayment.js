import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { MoreVertical, X } from "lucide-react";
import Paginator from "../common/Paginator";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Alert,
  TextField,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Box,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Grid,
  Divider,
  Tab,
  Tabs,
} from "@mui/material";
import {
  PersonOutline,
  LocationOn,
  Inventory,
  History,
  Payment as PaymentIcon,
  Receipt as ReceiptIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

import { Download, Eye } from "lucide-react";

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

const formatCurrency = (amount) =>
  typeof amount === "number" ? `₹${amount.toFixed(2)}` : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString("en-IN") : "N/A";

const getPaymentStatusColor = (status) => {
  const s = status?.toLowerCase();
  const colors = {
    pending: "warning",
    completed: "success",
    failed: "error",
    submitted: "info",
    verified: "success",
    partial: "secondary",
    cancelled: "error",
    refunded: "info",
  };
  return colors[s] || "default";
};

const getPaymentStatusIcon = (status) => {
  const s = status?.toLowerCase();
  if (s === 'completed' || s === 'verified') return <CheckCircleIcon fontSize="small" />;
  if (s === 'pending' || s === 'submitted') return <PendingIcon fontSize="small" />;
  if (s === 'partial') return <WarningIcon fontSize="small" />;
  return null;
};

const toast = {
  success: (msg) => console.log("✓", msg),
  error: (msg) => console.error("✗", msg),
  warning: (msg) => console.warn("⚠", msg),
};

// Dropdown Menu Component
const DropdownMenu = ({ onViewDetails, onUpdateStatus }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="small"
      >
        <MoreVertical size={18} />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
      >
        <MenuItem onClick={() => { onViewDetails(); handleClose(); }}>
          <ReceiptIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={() => { onUpdateStatus(); handleClose(); }}>
          <PaymentIcon fontSize="small" sx={{ mr: 1 }} />
          Update Status
        </MenuItem>
      </Menu>
    </>
  );
};

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payment-tabpanel-${index}`}
      aria-labelledby={`payment-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PendingPayment = () => {
  const navigate = useNavigate();

  // PENDING PAYMENTS STATE
  const [pendingPayments, setPendingPayments] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingError, setPendingError] = useState("");
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(10);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [pendingSearchTerm, setPendingSearchTerm] = useState("");

  // PARTIAL PAYMENTS STATE
  const [partialPayments, setPartialPayments] = useState([]);
  const [partialCount, setPartialCount] = useState(0);
  const [partialLoading, setPartialLoading] = useState(false);
  const [partialError, setPartialError] = useState("");
  const [partialPage, setPartialPage] = useState(1);
  const [partialPageSize, setPartialPageSize] = useState(10);
  const [partialSearchTerm, setPartialSearchTerm] = useState("");

  // ACTIVE TAB STATE
  const [activeTab, setActiveTab] = useState(0);

  // VIEW DETAILS MODAL
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    payment: null,
    loading: false,
    activeTab: 0, // For payment history vs order details
  });

  // UPDATE PAYMENT STATUS MODAL
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    paymentId: null,
    currentStatus: "",
    remainingAmount: 0,
    totalAmount: 0,
    paidAmount: 0,
    paymentType: "pending", // 'pending' or 'partial'
  });

  const [statusForm, setStatusForm] = useState({
    paymentStatus: "completed",
    receivedAmount: "",
    paymentMode: "",
    remarks: "",
  });

  const [updatingStatus, setUpdatingStatus] = useState(false);

  // FETCH PENDING PAYMENTS
  const fetchPendingPayments = async () => {
    setPendingLoading(true);
    setPendingError("");
    try {
      const res = await api.get("reception/pending-payments");
      const data = res.data || {};
      setPendingPayments(data.pendingPayments || []);
      setPendingCount(data.count || (data.pendingPayments || []).length || 0);
    } catch (error) {
      console.error(error);
      setPendingError("Error fetching pending payments");
      toast.error("Error fetching pending payments");
    } finally {
      setPendingLoading(false);
    }
  };

  // FETCH PARTIAL PAYMENTS
  const fetchPartialPayments = async () => {
    setPartialLoading(true);
    setPartialError("");
    try {
      const res = await api.get("reception/partial-payments");
      const data = res.data || {};
      setPartialPayments(data.partialPayments || []);
      setPartialCount(data.count || (data.partialPayments || []).length || 0);
    } catch (error) {
      console.error(error);
      setPartialError("Error fetching partial payments");
      toast.error("Error fetching partial payments");
    } finally {
      setPartialLoading(false);
    }
  };

  // DOWNLOAD PENDING PAYMENTS EXCEL
  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      const endpoint = activeTab === 0 
        ? "reception/pending-payments/download" 
        : "reception/partial-payments/download";
      
      const res = await api.get(endpoint, {
        responseType: "blob",
      });

      const filename = activeTab === 0 
        ? "pending_payments.xlsx" 
        : "partial_payments.xlsx";

      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`${activeTab === 0 ? 'Pending' : 'Partial'} payments Excel downloaded`);
    } catch (error) {
      console.error(error);
      toast.error("Error downloading Excel");
    } finally {
      setDownloadingExcel(false);
    }
  };

  // OPEN DETAILS MODAL
  const openDetailsModal = async (payment) => {
    setDetailsModal({
      isOpen: true,
      payment: null,
      loading: true,
      activeTab: 0,
    });

    try {
      const res = await api.get(`reception/payment/${payment.paymentId}`);
      setDetailsModal({
        isOpen: true,
        payment: res.data?.payment || payment,
        loading: false,
        activeTab: 0,
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      // Fallback to basic payment data if API fails
      setDetailsModal({
        isOpen: true,
        payment,
        loading: false,
        activeTab: 0,
      });
      toast.error("Error fetching payment details");
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      payment: null,
      loading: false,
      activeTab: 0,
    });
  };

  // OPEN STATUS MODAL (works for both pending and partial)
  const openStatusModal = (payment, type = "pending") => {
    setStatusModal({
      isOpen: true,
      paymentId: payment.paymentId,
      currentStatus: payment.paymentStatus || payment.status || "pending",
      remainingAmount: payment.remainingAmount || 0,
      totalAmount: payment.totalAmountWithDelivery || payment.totalAmount || 0,
      paidAmount: payment.paidAmount || 0,
      paymentType: type,
    });
    
    // Pre-fill with remaining amount for convenience
    setStatusForm({
      paymentStatus: payment.remainingAmount > 0 ? "partial" : "completed",
      receivedAmount: payment.remainingAmount || "",
      paymentMode: payment.paymentMode || "",
      remarks: "",
    });
  };

  const closeStatusModal = () => {
    setStatusModal({
      isOpen: false,
      paymentId: null,
      currentStatus: "",
      remainingAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      paymentType: "pending",
    });
    setStatusForm({
      paymentStatus: "completed",
      receivedAmount: "",
      paymentMode: "",
      remarks: "",
    });
  };

  // SUBMIT STATUS UPDATE
  const handleUpdatePaymentStatus = async () => {
    const { paymentStatus, receivedAmount, paymentMode, remarks } = statusForm;
    const { paymentId, remainingAmount, paymentType } = statusModal;

    if (!paymentStatus) {
      return toast.warning("Please select a payment status.");
    }

    if (!paymentMode) {
      return toast.warning("Please select a payment mode.");
    }

    const parsedAmount = parseFloat(receivedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return toast.warning("Please enter a valid received amount.");
    }

    if (remainingAmount && parsedAmount > remainingAmount) {
      return toast.warning(
        `Received amount (₹${parsedAmount}) cannot exceed remaining amount (₹${remainingAmount}).`
      );
    }

    setUpdatingStatus(true);

    try {
      const res = await api.patch(`/reception/payments/${paymentId}/status`, {
        paymentStatus,
        receivedAmount: parsedAmount,
        paymentMode,
        remarks: remarks || undefined,
      });

      const updated = res.data?.payment;
      toast.success(res.data?.message || "Payment status updated successfully");

      // Update the appropriate state based on payment type
      if (paymentType === "pending") {
        if (updated) {
          setPendingPayments((prev) =>
            prev.map((p) =>
              p.paymentId === paymentId
                ? {
                    ...p,
                    paymentStatus: updated.status,
                    status: updated.status,
                    paidAmount: typeof updated.paidAmount === "number" 
                      ? updated.paidAmount 
                      : p.paidAmount,
                    remainingAmount: typeof updated.remainingAmount === "number" 
                      ? updated.remainingAmount 
                      : p.remainingAmount,
                    totalAmount: typeof updated.totalAmount === "number" 
                      ? updated.totalAmount 
                      : p.totalAmount,
                    totalAmountWithDelivery: typeof updated.totalAmountWithDelivery === "number"
                      ? updated.totalAmountWithDelivery
                      : p.totalAmountWithDelivery,
                    paymentMode: updated.paymentMode || paymentMode,
                    updatedBy: updated.updatedBy,
                    updatedAt: updated.updatedAt,
                  }
                : p
            )
          );
        } else {
          setPendingPayments((prev) =>
            prev.map((p) =>
              p.paymentId === paymentId 
                ? { 
                    ...p, 
                    paymentStatus, 
                    status: paymentStatus,
                    paymentMode,
                    paidAmount: (p.paidAmount || 0) + parsedAmount,
                    remainingAmount: Math.max(0, (p.remainingAmount || 0) - parsedAmount),
                  } 
                : p
            )
          );
        }
        
        // If payment becomes partial, refresh partial payments
        if (paymentStatus === "partial" || (updated?.status === "partial")) {
          fetchPartialPayments();
        }
        
        // Refresh pending payments
        fetchPendingPayments();
        
      } else {
        // Update partial payments state
        if (updated) {
          setPartialPayments((prev) =>
            prev.map((p) =>
              p.paymentId === paymentId
                ? {
                    ...p,
                    paymentStatus: updated.status,
                    status: updated.status,
                    paidAmount: typeof updated.paidAmount === "number" 
                      ? updated.paidAmount 
                      : p.paidAmount,
                    remainingAmount: typeof updated.remainingAmount === "number" 
                      ? updated.remainingAmount 
                      : p.remainingAmount,
                    paymentMode: updated.paymentMode || paymentMode,
                    updatedAt: updated.updatedAt,
                  }
                : p
            )
          );
        } else {
          setPartialPayments((prev) =>
            prev.map((p) =>
              p.paymentId === paymentId 
                ? { 
                    ...p, 
                    paymentStatus, 
                    status: paymentStatus,
                    paymentMode,
                    paidAmount: (p.paidAmount || 0) + parsedAmount,
                    remainingAmount: Math.max(0, (p.remainingAmount || 0) - parsedAmount),
                  } 
                : p
            )
          );
        }
        
        // If payment becomes completed, remove from partial list or refresh
        if (paymentStatus === "completed") {
          // Option 1: Remove from list
          setPartialPayments((prev) => 
            prev.filter(p => p.paymentId !== paymentId)
          );
          // Option 2: Refresh both lists
          fetchPartialPayments();
          fetchPendingPayments();
        }
      }

      closeStatusModal();
    } catch (error) {
      console.error(error);
      
      const errorData = error?.response?.data;
      
      if (errorData?.details) {
        const { totalDue, alreadyPaid, attemptingToPay, maxAllowed } = errorData.details;
        toast.error(
          `${errorData.error}. Already paid: ₹${alreadyPaid}, ` +
          `Maximum allowed: ₹${maxAllowed}`
        );
      } else {
        toast.error(
          errorData?.message ||
          errorData?.error ||
          "Error updating payment status"
        );
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    fetchPendingPayments();
    fetchPartialPayments();
  }, []);

  // Load partial payments when tab changes
  useEffect(() => {
    if (activeTab === 1) {
      fetchPartialPayments();
    }
  }, [activeTab]);

  // FILTER FUNCTION
  const filterPayments = (payments, searchTerm) => {
    if (!searchTerm.trim()) return payments;
    
    const term = searchTerm.toLowerCase();
    return payments.filter((payment) => {
      return (
        payment.paymentId?.toLowerCase().includes(term) ||
        payment.orderId?.toLowerCase().includes(term) ||
        payment.user?.name?.toLowerCase().includes(term) ||
        payment.user?.firmName?.toLowerCase().includes(term) ||
        payment.firmName?.toLowerCase().includes(term) ||
        payment.user?.userCode?.toLowerCase().includes(term) ||
        payment.user?.phoneNumber?.toLowerCase().includes(term) ||
        payment.user?.email?.toLowerCase().includes(term) ||
        payment.paymentStatus?.toLowerCase().includes(term) ||
        payment.status?.toLowerCase().includes(term) ||
        payment.orderStatus?.toLowerCase().includes(term)
      );
    });
  };

  // APPLY FILTERS AND PAGINATION FOR PENDING
  const filteredPending = filterPayments(pendingPayments, pendingSearchTerm);
  const pendingTotal = filteredPending.length;
  const pendingStartIdx = (pendingPage - 1) * pendingPageSize;
  const pendingEndIdx = pendingStartIdx + pendingPageSize;
  const pagedPending = filteredPending.slice(pendingStartIdx, pendingEndIdx);

  // APPLY FILTERS AND PAGINATION FOR PARTIAL
  const filteredPartial = filterPayments(partialPayments, partialSearchTerm);
  const partialTotal = filteredPartial.length;
  const partialStartIdx = (partialPage - 1) * partialPageSize;
  const partialEndIdx = partialStartIdx + partialPageSize;
  const pagedPartial = filteredPartial.slice(partialStartIdx, partialEndIdx);

  const formatShippingAddress = (address) =>
    address ? `${address.address || ''}, ${address.city || ''}, ${address.state || ''} ${address.pinCode || ''}` : 'N/A';

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Render payment table based on active tab
  const renderPaymentTable = () => {
    if (activeTab === 0) {
      // Pending Payments Table
      return (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#bdbdbd' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>User Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Firm</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Delivery Charge</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total with Delivery</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Paid</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {pendingLoading ? (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : pagedPending.length > 0 ? (
                  pagedPending.map((payment) => (
                    <TableRow key={payment.paymentId} hover>
                      <TableCell>{payment.user?.userCode || '(Misc)'}</TableCell>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                      <TableCell>{payment.user?.name || "N/A"}</TableCell>
                      <TableCell>{payment.user?.email || "N/A"}</TableCell>
                      <TableCell>{payment.user?.phoneNumber || "N/A"}</TableCell>
                      <TableCell>{payment.user?.firmName || payment.firmName || "N/A"}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(payment.totalAmount)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(payment.deliveryCharge)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(payment.totalAmountWithDelivery)}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>{formatCurrency(payment.remainingAmount)}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{formatCurrency(payment.paidAmount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.paymentStatus || payment.status || "N/A"} 
                          color={getPaymentStatusColor(payment.paymentStatus || payment.status)}
                          size="small"
                          icon={getPaymentStatusIcon(payment.paymentStatus || payment.status)}
                        />
                      </TableCell>
                      <TableCell>{payment.orderStatus || "N/A"}</TableCell>
                      <TableCell>
                        <DropdownMenu
                          onViewDetails={() => openDetailsModal(payment)}
                          onUpdateStatus={() => openStatusModal(payment, "pending")}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={14} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No pending payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pending Pagination */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min(pendingTotal, pendingStartIdx + 1)}–{Math.min(pendingTotal, pendingEndIdx)} of {pendingTotal}
            </Typography>
            <Paginator
              page={pendingPage}
              pageSize={pendingPageSize}
              total={pendingTotal}
              onPageChange={setPendingPage}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={pendingPageSize}
                onChange={(e) => {
                  setPendingPage(1);
                  setPendingPageSize(parseInt(e.target.value, 10));
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} / page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      );
    } else {
      // Partial Payments Table
      return (
        <>
          <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#bdbdbd' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>User Code</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Firm</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Paid Amount</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Last Payment</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {partialLoading ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : pagedPartial.length > 0 ? (
                  pagedPartial.map((payment) => (
                    <TableRow key={payment.paymentId} hover>
                      <TableCell>{payment.user?.userCode || '(Misc)'}</TableCell>
                      <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                      <TableCell>{payment.user?.name || "N/A"}</TableCell>
                      <TableCell>{payment.user?.phoneNumber || "N/A"}</TableCell>
                      <TableCell>{payment.user?.firmName || payment.firmName || "N/A"}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(payment.totalAmountWithDelivery || payment.totalAmount)}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{formatCurrency(payment.paidAmount)}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>{formatCurrency(payment.remainingAmount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={payment.paymentStatus || payment.status || "Partial"} 
                          color="secondary"
                          size="small"
                          icon={<WarningIcon fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(payment.updatedAt || payment.createdAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentStatus || "N/A"}
                          size="small"
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          onViewDetails={() => openDetailsModal(payment)}
                          onUpdateStatus={() => openStatusModal(payment, "partial")}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No partial payments found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Partial Pagination */}
          <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {Math.min(partialTotal, partialStartIdx + 1)}–{Math.min(partialTotal, partialEndIdx)} of {partialTotal}
            </Typography>
            <Paginator
              page={partialPage}
              pageSize={partialPageSize}
              total={partialTotal}
              onPageChange={setPartialPage}
            />
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <Select
                value={partialPageSize}
                onChange={(e) => {
                  setPartialPage(1);
                  setPartialPageSize(parseInt(e.target.value, 10));
                }}
              >
                {[5, 10, 20, 50].map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} / page
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </>
      );
    }
  };

  return (
    <Box sx={{ bgcolor: '#e8f5e9', minHeight: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        <Typography variant="h4" fontWeight="bold" textAlign="center" mb={3}>
          Payment Management
        </Typography>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3, bgcolor: 'white', borderRadius: '8px 8px 0 0' }}>
          <Tabs value={activeTab} onChange={handleTabChange} aria-label="payment tabs">
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PendingIcon fontSize="small" />
                  <span>Pending Payments ({pendingCount})</span>
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <WarningIcon fontSize="small" />
                  <span>Partial Payments ({partialCount})</span>
                </Box>
              } 
            />
          </Tabs>
        </Box>

        {/* Search & Download - Common for both tabs */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <TextField
            placeholder={`Search by Order ID, Name, Phone...`}
            size="small"
            value={activeTab === 0 ? pendingSearchTerm : partialSearchTerm}
            onChange={(e) => {
              if (activeTab === 0) {
                setPendingSearchTerm(e.target.value);
                setPendingPage(1);
              } else {
                setPartialSearchTerm(e.target.value);
                setPartialPage(1);
              }
            }}
            sx={{ flex: 1, maxWidth: 400, bgcolor: 'white' }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeTab === 1 && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Eye size={16} />}
                onClick={() => setActiveTab(0)}
              >
                View Pending Payments
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={downloadingExcel ? <CircularProgress size={16} color="inherit" /> : <Download size={16} />}
              onClick={handleDownloadExcel}
              disabled={downloadingExcel}
            >
              {downloadingExcel ? "Downloading..." : `Download ${activeTab === 0 ? 'Pending' : 'Partial'} Excel`}
            </Button>
          </Box>
        </Box>

        {/* Search Results Count */}
        {(activeTab === 0 ? pendingSearchTerm : partialSearchTerm) && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Found {activeTab === 0 ? pendingTotal : partialTotal} result{(activeTab === 0 ? pendingTotal : partialTotal) !== 1 ? 's' : ''}
          </Typography>
        )}

        {/* Error Alert */}
        {(activeTab === 0 ? pendingError : partialError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {activeTab === 0 ? pendingError : partialError}
          </Alert>
        )}

        {/* Payment Table */}
        {renderPaymentTable()}
      </Box>

      {/* VIEW DETAILS MODAL */}
      <Dialog
        open={detailsModal.isOpen}
        onClose={closeDetailsModal}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          py: 2.5,
          px: 3,
          bgcolor: 'background.paper',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ 
              width: 8, 
              height: 32, 
              bgcolor: 'primary.main', 
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(33, 150, 243, 0.3)'
            }} />
            <Typography variant="h5" fontWeight="600" color="text.primary">
              Payment Details
            </Typography>
            {detailsModal.payment?.paymentId && (
              <Chip 
                label={`ID: ${detailsModal.payment.paymentId.slice(-8)}`}
                size="small"
                variant="outlined"
                sx={{ ml: 1, borderRadius: 1 }}
              />
            )}
          </Box>
          <IconButton 
            onClick={closeDetailsModal} 
            size="small"
            sx={{ 
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' }
            }}
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        {detailsModal.loading ? (
          <DialogContent sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            minHeight: 400,
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={48} thickness={4} />
            <Typography color="text.secondary">Loading payment details...</Typography>
          </DialogContent>
        ) : detailsModal.payment ? (
          <>
            <DialogContent dividers sx={{ p: 0 }}>
              {/* Status Banner */}
              <Box sx={{ 
                p: 3, 
                borderBottom: '1px solid',
                borderColor: 'divider',
                bgcolor: (theme) => theme.palette.mode === 'light' ? 'grey.50' : 'grey.900',
              }}>
                <Grid container spacing={3} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" gutterBottom>
                          Payment Status
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                          <Box sx={{ 
                            width: 10, 
                            height: 10, 
                            borderRadius: '50%',
                            bgcolor: detailsModal.payment.paymentStatus === 'completed' ? 'success.main' : 
                                     detailsModal.payment.paymentStatus === 'pending' ? 'warning.main' : 
                                     detailsModal.payment.paymentStatus === 'partial' ? 'secondary.main' :
                                     'error.main',
                            boxShadow: `0 0 0 2px ${
                              detailsModal.payment.paymentStatus === 'completed' ? 'success.light' : 
                              detailsModal.payment.paymentStatus === 'pending' ? 'warning.light' : 
                              detailsModal.payment.paymentStatus === 'partial' ? 'secondary.light' :
                              'error.light'
                            }`
                          }} />
                          <Typography variant="body1" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                            {detailsModal.payment.paymentStatus || detailsModal.payment.status || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", flexDirection: "column" }}>
                        <Typography variant="caption" color="text.secondary">
                          Order Status
                        </Typography>
                        <Chip
                          label={detailsModal.payment.orderStatus || "Pending"}
                          size="small"
                          sx={{ 
                            mt: 0.5,
                            width: "fit-content",
                            bgcolor: 
                              detailsModal.payment.orderStatus === "delivered"
                                ? "success.light"
                                : detailsModal.payment.orderStatus === "processing"
                                ? "info.light"
                                : detailsModal.payment.orderStatus === "cancelled"
                                ? "error.light"
                                : "warning.light",
                            color:
                              detailsModal.payment.orderStatus === "delivered"
                                ? "success.dark"
                                : detailsModal.payment.orderStatus === "processing"
                                ? "info.dark"
                                : detailsModal.payment.orderStatus === "cancelled"
                                ? "error.dark"
                                : "warning.dark",
                            fontWeight: 500,
                            borderRadius: 1.5,
                          }}
                        />
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Box sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 3 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Created At</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                          {formatDateTime(detailsModal.payment.createdAt)}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Last Updated</Typography>
                        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.5 }}>
                          {formatDateTime(detailsModal.payment.updatedAt || detailsModal.payment.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* Details Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3 }}>
                <Tabs 
                  value={detailsModal.activeTab} 
                  onChange={(e, newValue) => setDetailsModal(prev => ({ ...prev, activeTab: newValue }))}
                >
                  <Tab label="Overview" />
                  <Tab label="Payment History" />
                  <Tab label="Order Details" />
                </Tabs>
              </Box>

              {/* Overview Tab */}
              <TabPanel value={detailsModal.activeTab} index={0}>
                <Box sx={{ px: 3 }}>
                  {/* Amount Cards */}
                  <Box sx={{ 
                    display: 'grid', 
                    gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, 
                    gap: 2,
                    mb: 4 
                  }}>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="primary.dark">Total Amount</Typography>
                      <Typography variant="h6" fontWeight="700" color="primary.dark">
                        {formatCurrency(detailsModal.payment.totalAmountWithDelivery || detailsModal.payment.totalAmount)}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="success.dark">Paid Amount</Typography>
                      <Typography variant="h6" fontWeight="700" color="success.dark">
                        {formatCurrency(detailsModal.payment.paidAmount)}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'error.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="error.dark">Remaining Amount</Typography>
                      <Typography variant="h6" fontWeight="700" color="error.dark">
                        {formatCurrency(detailsModal.payment.remainingAmount)}
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 2, bgcolor: 'info.50', borderRadius: 2 }}>
                      <Typography variant="caption" color="info.dark">Delivery Charge</Typography>
                      <Typography variant="h6" fontWeight="700" color="info.dark">
                        {formatCurrency(detailsModal.payment.deliveryCharge)}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Customer Information */}
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonOutline fontSize="small" color="primary" />
                      Customer Information
                    </Typography>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                      <Grid container spacing={3}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                          <Typography variant="body1" fontWeight={500}>{detailsModal.payment.user?.name || "N/A"}</Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Firm Name</Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {detailsModal.payment.user?.firmName || detailsModal.payment.firmName || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">User Code</Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {detailsModal.payment.user?.userCode || "N/A"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                          <Typography variant="body1" fontWeight={500}>
                            {detailsModal.payment.user?.phoneNumber || "N/A"}
                          </Typography>
                        </Grid>
                        {detailsModal.payment.user?.email && (
                          <Grid item xs={12}>
                            <Typography variant="caption" color="text.secondary">Email Address</Typography>
                            <Typography variant="body1" fontWeight={500}>{detailsModal.payment.user.email}</Typography>
                          </Grid>
                        )}
                        {detailsModal.payment.gstNumber && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.secondary">GST Number</Typography>
                            <Typography variant="body1" fontWeight={500}>{detailsModal.payment.gstNumber}</Typography>
                          </Grid>
                        )}
                      </Grid>
                    </Paper>
                  </Box>

                  {/* Shipping Address */}
                  {detailsModal.payment.shippingAddress && (
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOn fontSize="small" color="primary" />
                        Shipping Address
                      </Typography>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.8 }}>
                          {formatShippingAddress(detailsModal.payment.shippingAddress)}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {/* Products Section */}
                  {detailsModal.payment.products?.length > 0 && (
                    <Box>
                      <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Inventory fontSize="small" color="primary" />
                        Products ({detailsModal.payment.products.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {detailsModal.payment.products.map((product, idx) => (
                          <Paper
                            key={idx}
                            elevation={0}
                            sx={{
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'divider',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: 'primary.main',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                              }
                            }}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="subtitle2" fontWeight={600}>{product.productName}</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                  <Chip
                                    label={`${product.quantity || product.boxes || 0} ${product.unit || 'boxes'}`}
                                    size="small"
                                    sx={{ bgcolor: 'grey.100', borderRadius: 1 }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    × {formatCurrency(product.price || product.unitPrice)} per {product.unit || 'box'}
                                  </Typography>
                                </Box>
                              </Box>
                              {product.totalPrice && (
                                <Typography variant="h6" fontWeight="700" color="primary.dark">
                                  {formatCurrency(product.totalPrice)}
                                </Typography>
                              )}
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* Payment History Tab */}
              <TabPanel value={detailsModal.activeTab} index={1}>
                <Box sx={{ px: 3 }}>
                  {detailsModal.payment.paymentHistory?.length > 0 ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {detailsModal.payment.paymentHistory.map((history, idx) => (
                        <Paper
                          key={idx}
                          elevation={0}
                          sx={{
                            p: 2.5,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            bottom: 0,
                            width: 4,
                            bgcolor: history.status === 'verified' || history.status === 'completed' ? 'success.main' : 
                                     history.status === 'pending' ? 'warning.main' : 
                                     history.status === 'partial' ? 'secondary.main' : 'grey.400'
                          }} />
                          
                          <Box sx={{ pl: 2 }}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Reference ID</Typography>
                                <Typography variant="body2" fontWeight={500} fontFamily="monospace">
                                  {history.referenceId || history.paymentId || "N/A"}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">
                                  Payment Mode
                                </Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={history.paymentMode || "N/A"}
                                    size="small"
                                    color={
                                      history.paymentMode === "cash"
                                        ? "success"
                                        : history.paymentMode === "online"
                                        ? "info"
                                        : history.paymentMode === "card"
                                        ? "primary"
                                        : "default"
                                    }
                                    sx={{ borderRadius: 1, textTransform: "capitalize" }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Amount</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">
                                  {formatCurrency(history.amount || history.submittedAmount || history.verifiedAmount)}
                                </Typography>
                              </Grid>
                              <Grid item xs={12} sm={6} md={3}>
                                <Typography variant="caption" color="text.secondary">Status</Typography>
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip
                                    label={history.status || "Completed"}
                                    size="small"
                                    color={getPaymentStatusColor(history.status)}
                                    sx={{ borderRadius: 1 }}
                                  />
                                </Box>
                              </Grid>
                              <Grid item xs={12} sm={6}>
                                <Typography variant="caption" color="text.secondary">Date</Typography>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatDateTime(history.date || history.submissionDate || history.createdAt)}
                                </Typography>
                              </Grid>
                              {history.verifiedBy && (
                                <Grid item xs={12} sm={6}>
                                  <Typography variant="caption" color="text.secondary">Verified By</Typography>
                                  <Typography variant="body2" fontWeight={500}>{history.verifiedBy}</Typography>
                                </Grid>
                              )}
                              {history.remarks && (
                                <Grid item xs={12}>
                                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                                  <Paper variant="outlined" sx={{ p: 1.5, mt: 0.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                                    <Typography variant="body2">{history.remarks}</Typography>
                                  </Paper>
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Paper>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 6,
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      border: '1px dashed',
                      borderColor: 'divider'
                    }}>
                      <History sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography color="text.secondary">No payment history available</Typography>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              {/* Order Details Tab */}
              <TabPanel value={detailsModal.activeTab} index={2}>
                <Box sx={{ px: 3 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          Order Information
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Order ID</Typography>
                              <Typography variant="body2">{detailsModal.payment.orderId || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Order Date</Typography>
                              <Typography variant="body2">{formatDateTime(detailsModal.payment.orderDate || detailsModal.payment.createdAt)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Order Status</Typography>
                              <Typography variant="body2">
                                <Chip 
                                  label={detailsModal.payment.orderStatus || "N/A"} 
                                  size="small"
                                  color={
                                    detailsModal.payment.orderStatus === "delivered" ? "success" :
                                    detailsModal.payment.orderStatus === "processing" ? "info" :
                                    detailsModal.payment.orderStatus === "cancelled" ? "error" : "warning"
                                  }
                                />
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Payment Terms</Typography>
                              <Typography variant="body2">{detailsModal.payment.paymentTerms || "Standard"}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                        <Typography variant="subtitle2" fontWeight="600" gutterBottom>
                          Additional Information
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Invoice Number</Typography>
                              <Typography variant="body2">{detailsModal.payment.invoiceNumber || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">GST Number</Typography>
                              <Typography variant="body2">{detailsModal.payment.gstNumber || "N/A"}</Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="text.secondary">Notes</Typography>
                              <Typography variant="body2">{detailsModal.payment.notes || "No additional notes"}</Typography>
                            </Grid>
                          </Grid>
                        </Box>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </TabPanel>
            </DialogContent>
            
            <DialogActions sx={{ 
              p: 2.5, 
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              gap: 1
            }}>
              <Button 
                onClick={() => openStatusModal(detailsModal.payment, 
                  detailsModal.payment.paymentStatus === 'partial' ? 'partial' : 'pending'
                )}
                variant="outlined"
                color="primary"
                startIcon={<PaymentIcon />}
                sx={{ mr: 'auto' }}
              >
                Update Payment
              </Button>
              <Button 
                onClick={closeDetailsModal} 
                variant="contained" 
                color="primary"
                sx={{ 
                  px: 4,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontWeight: 500
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      {/* UPDATE PAYMENT STATUS MODAL */}
      <Dialog 
        open={statusModal.isOpen} 
        onClose={closeStatusModal} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" />
            <Typography variant="h6">
              Update Payment Status - {statusModal.paymentType === 'pending' ? 'Pending' : 'Partial'} Payment
            </Typography>
          </Box>
          <IconButton onClick={closeStatusModal} size="small">
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Current Status</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Chip 
                    label={statusModal.currentStatus} 
                    size="small"
                    color={getPaymentStatusColor(statusModal.currentStatus)}
                    icon={getPaymentStatusIcon(statusModal.currentStatus)}
                  />
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Remaining Amount</Typography>
                <Typography variant="h6" color="error.main" fontWeight="600">
                  {formatCurrency(statusModal.remainingAmount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                <Typography variant="body2" fontWeight="500">
                  {formatCurrency(statusModal.totalAmount)}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="caption" color="text.secondary">Paid Amount</Typography>
                <Typography variant="body2" fontWeight="500" color="success.main">
                  {formatCurrency(statusModal.paidAmount)}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Status</InputLabel>
            <Select
              value={statusForm.paymentStatus}
              label="Payment Status"
              onChange={(e) =>
                setStatusForm((prev) => ({ ...prev, paymentStatus: e.target.value }))
              }
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            type="number"
            label="Received Amount"
            value={statusForm.receivedAmount}
            onChange={(e) =>
              setStatusForm((prev) => ({ ...prev, receivedAmount: e.target.value }))
            }
            sx={{ mb: 2 }}
            InputProps={{
              inputProps: { min: 0, max: statusModal.remainingAmount, step: 0.01 }
            }}
            helperText={`Max: ${formatCurrency(statusModal.remainingAmount)}`}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Payment Mode</InputLabel>
            <Select
              value={statusForm.paymentMode}
              label="Payment Mode"
              onChange={(e) =>
                setStatusForm((prev) => ({ ...prev, paymentMode: e.target.value }))
              }
            >
              <MenuItem value="cash">Cash</MenuItem>
              <MenuItem value="online">Online</MenuItem>
              <MenuItem value="card">Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="cheque">Cheque</MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Remarks"
            placeholder="Optional notes about this payment..."
            value={statusForm.remarks}
            onChange={(e) => setStatusForm((prev) => ({ ...prev, remarks: e.target.value }))}
          />
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={closeStatusModal} disabled={updatingStatus}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdatePaymentStatus}
            variant="contained"
            disabled={updatingStatus || !statusForm.paymentMode || !statusForm.receivedAmount}
            startIcon={updatingStatus && <CircularProgress size={16} />}
          >
            {updatingStatus ? "Updating..." : "Update Payment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PendingPayment;