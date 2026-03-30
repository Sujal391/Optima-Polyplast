import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { MoreVertical, X, ArrowLeft } from "lucide-react";
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
  Divider,
  Grid,
  Card,
  CardContent,
  LinearProgress,
} from "@mui/material";

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
    partial: "warning",
  };
  return colors[s] || "default";
};

const toast = {
  success: (msg) => console.log("✓", msg),
  error: (msg) => console.error("✗", msg),
  warning: (msg) => console.warn("⚠", msg),
};

// Dropdown Menu Component
const DropdownMenu = ({ onViewDetails }) => {
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
      <IconButton onClick={handleClick} size="small">
        <MoreVertical size={18} />
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={handleClose}>
        <MenuItem onClick={() => { onViewDetails(); handleClose(); }}>
          View Details
        </MenuItem>
      </Menu>
    </>
  );
};

const PartialPayment = () => {
  const navigate = useNavigate();

  // PARTIAL PAYMENTS STATE
  const [partialPayments, setPartialPayments] = useState([]);
  const [partialCount, setPartialCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // VIEW DETAILS MODAL
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    payment: null,
    loading: false,
  });

  // FETCH PARTIAL PAYMENTS
  const fetchPartialPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("reception/partial-payments");
      const data = res.data || {};
      setPartialPayments(data.partialPayments || []);
      setPartialCount(data.count || (data.partialPayments || []).length || 0);
    } catch (error) {
      console.error(error);
      setError("Error fetching partial payments");
      toast.error("Error fetching partial payments");
    } finally {
      setLoading(false);
    }
  };

  // OPEN DETAILS MODAL - Fetch detailed payment info from API
  const openDetailsModal = async (payment) => {
    setDetailsModal({
      isOpen: true,
      payment: null,
      loading: true,
    });

    try {
      const res = await api.get(`reception/payment/${payment.paymentId}`);
      setDetailsModal({
        isOpen: true,
        payment: res.data?.payment || payment,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching payment details:", error);
      setDetailsModal({
        isOpen: true,
        payment,
        loading: false,
      });
      toast.error("Error fetching payment details");
    }
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      payment: null,
      loading: false,
    });
  };


  // INITIAL LOAD
  useEffect(() => {
    fetchPartialPayments();
  }, []);

  // FILTER FUNCTION
  const filterPayments = (payments, term) => {
    if (!term.trim()) return payments;

    const searchLower = term.toLowerCase();
    return payments.filter((payment) => {
      return (
        payment.paymentId?.toLowerCase().includes(searchLower) ||
        payment.orderId?.toLowerCase().includes(searchLower) ||
        payment.user?.name?.toLowerCase().includes(searchLower) ||
        payment.user?.firmName?.toLowerCase().includes(searchLower) ||
        payment.firmName?.toLowerCase().includes(searchLower) ||
        payment.user?.userCode?.toLowerCase().includes(searchLower) ||
        payment.user?.phoneNumber?.toLowerCase().includes(searchLower) ||
        payment.user?.email?.toLowerCase().includes(searchLower) ||
        payment.paymentStatus?.toLowerCase().includes(searchLower) ||
        payment.orderStatus?.toLowerCase().includes(searchLower)
      );
    });
  };

  // APPLY FILTERS AND PAGINATION
  const filteredPayments = filterPayments(partialPayments, searchTerm);
  const total = filteredPayments.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedPayments = filteredPayments.slice(startIdx, endIdx);

  const formatShippingAddress = (address) =>
    address ? `${address.address || ''}, ${address.city || ''}, ${address.state || ''} ${address.pinCode || ''}` : 'N/A';

  return (
    <Box sx={{ bgcolor: '#e8f5e9', minHeight: '100vh', p: 3 }}>
      <Box sx={{ maxWidth: '1400px', mx: 'auto' }}>
        {/* Header with Back Button */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowLeft size={16} />}
            onClick={() => navigate('/reception/pending-payments')}
          >
            Back
          </Button>
          <Typography variant="h4" fontWeight="bold" textAlign="center" sx={{ flex: 1 }}>
            Partial Payments
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
          <TextField
            placeholder="Search by Order ID, Name, Phone..."
            size="small"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            sx={{ flex: 1, maxWidth: 400, bgcolor: 'white' }}
          />
          <Chip
            label={`${partialCount} Partial Payments`}
            color="warning"
            variant="outlined"
          />
        </Box>

        {searchTerm && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Found {total} result{total !== 1 ? 's' : ''}
          </Typography>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Table */}
        <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#bdbdbd' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>User Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Date & Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Firm</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Paid Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Remaining</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Payment %</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Order Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : pagedPayments.length > 0 ? (
                pagedPayments.map((payment) => (
                  <TableRow key={payment.paymentId} hover>
                    <TableCell>{payment.user?.userCode || '(Misc)'}</TableCell>
                    <TableCell>{formatDateTime(payment.createdAt)}</TableCell>
                    <TableCell>{payment.user?.name || "N/A"}</TableCell>
                    <TableCell>{payment.user?.firmName || payment.firmName || "N/A"}</TableCell>
                    <TableCell>{payment.user?.phoneNumber || "N/A"}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{formatCurrency(payment.totalAmountWithGST || payment.totalAmountWithDelivery || payment.totalAmount)}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 500 }}>{formatCurrency(payment.paidAmount)}</TableCell>
                    <TableCell sx={{ color: 'error.main', fontWeight: 500 }}>{formatCurrency(payment.remainingAmount)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={parseFloat(payment.paymentPercentage) || 0}
                          sx={{ width: 60, height: 8, borderRadius: 4 }}
                          color={parseFloat(payment.paymentPercentage) >= 50 ? "success" : "warning"}
                        />
                        <Typography variant="body2" fontWeight={500}>
                          {payment.paymentPercentage || 0}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{payment.orderStatus || "N/A"}</TableCell>
                    <TableCell>
                      <DropdownMenu onViewDetails={() => openDetailsModal(payment)} />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No partial payments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* PAGINATION */}
        <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {Math.min(total, startIdx + 1)}–{Math.min(total, endIdx)} of {total}
          </Typography>
          <Paginator
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(parseInt(e.target.value, 10));
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
      </Box>


      {/* VIEW DETAILS MODAL */}
      <Dialog
        open={detailsModal.isOpen}
        onClose={closeDetailsModal}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="bold">Payment Details</Typography>
          <IconButton onClick={closeDetailsModal} size="small">
            <X size={24} />
          </IconButton>
        </DialogTitle>

        {detailsModal.loading ? (
          <DialogContent sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
            <CircularProgress />
          </DialogContent>
        ) : detailsModal.payment ? (
          <>
            <DialogContent dividers>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 24, bgcolor: 'primary.main', borderRadius: 1 }} />
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Customer Name</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.user?.name || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Firm Name</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.user?.firmName || detailsModal.payment.firmName || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">User Code</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.user?.userCode || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Created At</Typography>
                    <Typography variant="body2" fontWeight={500}>{formatDateTime(detailsModal.payment.createdAt)}</Typography>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 24, bgcolor: 'success.main', borderRadius: 1 }} />
                  Contact Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.user?.phoneNumber || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Email Address</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.user?.email || "N/A"}</Typography>
                  </Grid>
                  {detailsModal.payment.gstNumber && (
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">GST Number</Typography>
                      <Typography variant="body2" fontWeight={500}>{detailsModal.payment.gstNumber}</Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 24, bgcolor: 'secondary.main', borderRadius: 1 }} />
                  Shipping Address
                </Typography>
                <Typography variant="body2">{formatShippingAddress(detailsModal.payment.shippingAddress)}</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 4, height: 24, bgcolor: 'info.main', borderRadius: 1 }} />
                  Payment Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total Amount</Typography>
                    <Typography variant="h6" fontWeight={600}>{formatCurrency(detailsModal.payment.totalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">GST</Typography>
                    <Typography variant="h6" fontWeight={600}>{formatCurrency(detailsModal.payment.gst || 0)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total (Inc. GST)</Typography>
                    <Typography variant="h6" fontWeight={600}>{formatCurrency(detailsModal.payment.totalAmountWithGST || detailsModal.payment.totalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Paid Amount</Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">{formatCurrency(detailsModal.payment.paidAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Delivery Charge</Typography>
                    <Typography variant="h6" fontWeight={600}>{formatCurrency(detailsModal.payment.deliveryCharge)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Total with Delivery</Typography>
                    <Typography variant="h6" fontWeight={600}>{formatCurrency(detailsModal.payment.totalAmountWithDelivery)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Remaining Amount</Typography>
                    <Typography variant="h6" fontWeight={600} color="error.main">{formatCurrency(detailsModal.payment.remainingAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Payment Percentage</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={parseFloat(detailsModal.payment.paymentPercentage) || 0}
                        sx={{ width: 80, height: 10, borderRadius: 4 }}
                        color={parseFloat(detailsModal.payment.paymentPercentage) >= 50 ? "success" : "warning"}
                      />
                      <Typography variant="h6" fontWeight={600}>
                        {detailsModal.payment.paymentPercentage || 0}%
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Payment Method</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.paymentMethod || "N/A"}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Payment Status</Typography>
                    <Chip
                      label={detailsModal.payment.paymentStatus || detailsModal.payment.status || "N/A"}
                      color={getPaymentStatusColor(detailsModal.payment.paymentStatus || detailsModal.payment.status)}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Order Status</Typography>
                    <Typography variant="body2" fontWeight={500}>{detailsModal.payment.orderStatus || "N/A"}</Typography>
                  </Grid>
                </Grid>
              </Box>

              {detailsModal.payment.products?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 24, bgcolor: 'warning.main', borderRadius: 1 }} />
                      Products ({detailsModal.payment.products.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {detailsModal.payment.products.map((product, idx) => (
                        <Card key={idx} variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Box>
                                <Typography variant="body1" fontWeight={600}>{product.productName}</Typography>
                              </Box>
                              {product.totalPrice && (
                                <Typography variant="h6" fontWeight="bold">{formatCurrency(product.totalPrice)}</Typography>
                              )}
                            </Box>
                            <Chip
                              label={`${product.boxes} boxes × ${formatCurrency(product.price)}`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                </>
              )}


              {/* Payment History Section */}
              {detailsModal.payment.paymentHistory?.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 4, height: 24, bgcolor: 'error.main', borderRadius: 1 }} />
                      Payment History ({detailsModal.payment.paymentHistory.length})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {detailsModal.payment.paymentHistory.map((history, idx) => (
                        <Card key={idx} variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                          <CardContent>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Reference ID</Typography>
                                <Typography variant="body2" fontWeight={500}>{history.referenceId || "N/A"}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Status</Typography>
                                <Chip
                                  label={history.status || "N/A"}
                                  color={history.status === 'verified' ? 'success' : 'default'}
                                  size="small"
                                />
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Submitted Amount</Typography>
                                <Typography variant="body2" fontWeight={500}>{formatCurrency(history.submittedAmount)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Verified Amount</Typography>
                                <Typography variant="body2" fontWeight={500} color="success.main">{formatCurrency(history.verifiedAmount)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Submission Date</Typography>
                                <Typography variant="body2" fontWeight={500}>{formatDateTime(history.submissionDate)}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Verification Date</Typography>
                                <Typography variant="body2" fontWeight={500}>{formatDateTime(history.verificationDate)}</Typography>
                              </Grid>
                              {history.verifiedBy && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Verified By</Typography>
                                  <Typography variant="body2" fontWeight={500}>{history.verifiedBy}</Typography>
                                </Grid>
                              )}
                              {history.verificationNotes && (
                                <Grid item xs={6}>
                                  <Typography variant="caption" color="text.secondary">Notes</Typography>
                                  <Typography variant="body2" fontWeight={500}>{history.verificationNotes}</Typography>
                                </Grid>
                              )}
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeDetailsModal} variant="contained" color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>
    </Box>
  );
};

export default PartialPayment;
