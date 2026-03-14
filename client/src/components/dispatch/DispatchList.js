import React, { useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaPrint, FaTimes, FaCheck, FaSync, FaEllipsisV } from "react-icons/fa";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import {
  LocalShipping as ShippedIcon,
  Cancel as CancelIcon,
  PictureAsPdf as PdfIcon,
  Print as PrintIcon,
  Edit as EditIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import logo from "../../assets/logo1.png";
import cookies from "js-cookie";
import OrderActions from "./OrderActions";
import ChallanGenerationWizard from "./ChallanGenerationWizard";
import ChallanListView from "./ChallanListView";
import RescheduleModal from "./RescheduleModal";

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

const DispatchComponent = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [processingOrders, setProcessingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [challanData, setChallanData] = useState({
    userCode: "",
    vehicleNo: "",
    driverName: "",
    mobileNo: "",
    items: [],
    receiverName: "",
    deliveryAddress: {
      address: "",
      city: "",
      state: "",
      pinCode: "",
    },
    deliveryChoice: "homeDelivery",
  });

  const [isChallanValid, setIsChallanValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChallanModal, setShowChallanModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [generatedChallan, setGeneratedChallan] = useState(null);
  const [generatedChallans, setGeneratedChallans] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  
  // Menu state for better positioning
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuOrder, setMenuOrder] = useState(null);
  const [expandedRow, setExpandedRow] = useState(null);

  const handleMenuOpen = (event, order) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuOrder(order);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuOrder(null);
  };

  const handleRowExpand = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  /** ------------------------------------------------------
   * FETCH PROCESSING ORDERS
   * ------------------------------------------------------ */
  const fetchProcessingOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/dispatch/orders/processing", {
        headers: { "Cache-Control": "no-cache" },
      });
      setProcessingOrders(response.data?.orders || []);
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error fetching processing orders"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /** ------------------------------------------------------
   * HANDLE STATUS UPDATE
   * ------------------------------------------------------ */
  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.patch(`/dispatch/orders/${orderId}/status`, { status });
      toast.success(`Order status updated to ${status}`);
      if (["shipped", "cancelled"].includes(status)) {
        setProcessingOrders((prev) =>
          prev.filter((order) => order._id !== orderId)
        );
      }
      await fetchProcessingOrders();
      handleMenuClose();
    } catch (error) {
      toast.error(
        error.response?.data?.error || "Error updating order status"
      );
      await fetchProcessingOrders();
    }
  };

  /** ------------------------------------------------------
   * SINGLE CHALLAN GENERATION (OLD FLOW)
   * ------------------------------------------------------ */
  const generateChallan = async () => {
    try {
      const subtotal = challanData.items.reduce((acc, item) => acc + item.amount, 0);
      const gstRate = 0.05;
      const gstAmount = subtotal * gstRate;
      const deliveryCharge = selectedOrder.deliveryCharge || 0;
      const totalAmount = subtotal + gstAmount + deliveryCharge;

      const payload = {
        ...challanData,
        deliveryCharge,
        subtotal,
        gstAmount,
        totalAmount,
        shippingAddress: challanData.deliveryAddress,
      };

      const response = await api.post("/dispatch/generate-challan", payload);
      toast.success("Challan generated successfully!");

      setGeneratedChallan({
        ...response.data.challan,
        deliveryCharge,
        subtotal,
        gstAmount,
        totalAmount,
        shippingAddress: challanData.deliveryAddress,
      });
      setShowChallanModal(false);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error generating challan");
    }
  };

  /** ------------------------------------------------------
   * MULTIPLE CHALLAN GENERATION (WIZARD FLOW)
   * ------------------------------------------------------ */
  const generateChallansFromWizard = async (wizardData) => {
    try {
      setIsLoading(true);

      const payload = {
        splitInfo: {
          numberOfChallans: wizardData.splitInfo.numberOfChallans,
          quantities: wizardData.splitInfo.quantities,
        },
        extraItems: wizardData.extraItems || [],
        scheduledDates: wizardData.scheduledDates.map((d) =>
          new Date(d).toISOString()
        ),
        deliveryChoice: selectedOrder.deliveryChoice || "homeDelivery",
        shippingAddress: selectedOrder.shippingAddress || {},
        vehicleDetails: wizardData.vehicleDetails || [],
        deliveryChargePerBox: wizardData.deliveryChargePerBox || [],
        receiverName:
          wizardData.receiverName ||
          selectedOrder.firmName ||
          selectedOrder.user?.name ||
          "",
      };

      const response = await api.post(
        `/dispatch/orders/${selectedOrder._id}/generate-challan`,
        payload
      );

      toast.success(
        `${response.data.count || response.data.challans?.length || 1} challan(s) generated successfully!`
      );
      setGeneratedChallans(response.data.challans || []);
      setShowWizard(false);
      setSelectedOrder(null);
      await fetchProcessingOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error generating challans");
    } finally {
      setIsLoading(false);
    }
  };

  /** ------------------------------------------------------
   * FETCH CHALLANS FOR A SPECIFIC ORDER
   * ------------------------------------------------------ */
  const fetchChallansForOrder = async (orderId) => {
    try {
      const response = await api.get(`/dispatch/orders/${orderId}/challans`);
      setGeneratedChallans(response.data.challans || []);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching challans");
    }
  };

  /** ------------------------------------------------------
   * RESCHEDULE CHALLAN
   * ------------------------------------------------------ */
  const rescheduleChallan = async (rescheduleData) => {
    try {
      setRescheduleLoading(true);
      await api.patch(
        `/dispatch/challans/${rescheduleData.challanId}/reschedule`,
        {
          newDate: rescheduleData.newDate,
          reason: rescheduleData.reason,
        }
      );
      toast.success("Challan rescheduled successfully!");
      setShowRescheduleModal(false);
      setSelectedChallan(null);
      if (selectedOrder) {
        await fetchChallansForOrder(selectedOrder._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error rescheduling challan");
    } finally {
      setRescheduleLoading(false);
    }
  };

  /** ------------------------------------------------------
   * ORDER SELECTION
   * ------------------------------------------------------ */
  const handleOrderSelection = (order) => {
    setSelectedOrder(order);
    setChallanData({
      userCode: order.user?.customerDetails?.userCode || "",
      vehicleNo: "",
      driverName: "",
      mobileNo: order.user?.customerDetails?.phone || "",
      items: order.products.map((item) => ({
        description: item.product?.name || "N/A",
        boxes: item.boxes >= 230 ? item.boxes : 230,
        rate: item.price || 0,
        amount: (item.boxes >= 230 ? item.boxes : 230) * (item.price || 0),
      })),
      receiverName: order.firmName || order.user?.name || "N/A",
      deliveryAddress: order.shippingAddress || {
        address: "",
        city: "",
        state: "",
        pinCode: "",
      },
      deliveryChoice: order.deliveryChoice || "homeDelivery",
    });
    setShowWizard(true);
    handleMenuClose();
  };

  /** ------------------------------------------------------
   * CHALLAN VALIDATION (for Single Flow)
   * ------------------------------------------------------ */
  useEffect(() => {
    const isValid =
      challanData.userCode &&
      challanData.vehicleNo &&
      challanData.driverName &&
      challanData.mobileNo &&
      challanData.receiverName &&
      challanData.deliveryAddress.address &&
      challanData.deliveryAddress.city &&
      challanData.deliveryAddress.state &&
      /^\d{6}$/.test(challanData.deliveryAddress.pinCode) &&
      challanData.items.length > 0 &&
      challanData.items.every((item) => item.boxes >= 230);

    setIsChallanValid(isValid);
  }, [challanData]);

  /** ------------------------------------------------------
   * DOWNLOAD + PRINT FUNCTIONALITY
   * ------------------------------------------------------ */
  const downloadChallan = () => {
    if (!generatedChallan)
      return toast.warning("No challan available to download.");
    const element = document.getElementById("challan-content");
    html2pdf()
      .from(element)
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `challan_${generatedChallan.invoiceNo}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  const printChallan = () => {
    if (!generatedChallan)
      return toast.warning("No challan available to print.");
    const element = document.getElementById("challan-content");
    html2pdf()
      .from(element)
      .set({
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `challan_${generatedChallan.invoiceNo}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      })
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const blobURL = pdf.output("bloburl");
        const newWindow = window.open(blobURL, "_blank");
        if (newWindow) {
          newWindow.onload = () => {
            newWindow.document.body.style.margin = 0;
            newWindow.document.documentElement.style.height = "100%";
            newWindow.document.body.style.overflow = "hidden";
          };
        }
      });
  };

  /** ------------------------------------------------------
   * HELPER: Get status chip color
   * ------------------------------------------------------ */
  const getStatusColor = (status) => {
    switch (status) {
      case "processing":
        return "warning";
      case "confirmed":
        return "info";
      case "shipped":
        return "success";
      default:
        return "default";
    }
  };

  const getPaymentColor = (status) => {
    switch (status) {
      case "pending":
        return "error";
      case "completed":
        return "success";
      default:
        return "warning";
    }
  };

  /** ------------------------------------------------------
   * INITIAL FETCH
   * ------------------------------------------------------ */
  useEffect(() => {
    fetchProcessingOrders();
  }, []);

  // Mobile card view for orders
  const renderMobileOrderCard = (order) => (
    <Paper
      key={order._id}
      elevation={2}
      sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        position: 'relative',
        '&:hover': { backgroundColor: '#f9fafb' }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {order.firmName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.user?.name} | {order.user?.phoneNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Code: {order.user?.customerDetails?.userCode || "N/A"}
          </Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={order.orderStatus}
            color={getStatusColor(order.orderStatus)}
            size="small"
          />
          <IconButton
            onClick={(e) => handleMenuOpen(e, order)}
            size="small"
            sx={{ ml: 1 }}
          >
            <FaEllipsisV />
          </IconButton>
        </Box>
      </Box>

      <Box mt={1.5} display="flex" flexWrap="wrap" gap={1}>
        <Chip
          label={`Payment: ${order.paymentStatus}`}
          color={getPaymentColor(order.paymentStatus)}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Delivery: ₹${order.deliveryCharge || 0}`}
          size="small"
          variant="outlined"
        />
        <Chip
          label={`Total: ₹${order.totalAmountWithDelivery || order.totalAmount}`}
          color="primary"
          size="small"
        />
      </Box>

      {expandedRow === order._id && (
        <Box mt={2}>
          <Typography variant="body2" fontWeight={500}>Items:</Typography>
          {order.products.map((item, i) => (
            <Typography key={i} variant="body2" color="text.secondary">
              {item.product?.name}: {item.boxes} boxes
            </Typography>
          ))}
          <Typography variant="body2" fontWeight={500} mt={1}>Address:</Typography>
          <Typography variant="body2" color="text.secondary">
            {order.shippingAddress
              ? `${order.shippingAddress.address || ""}, ${
                  order.shippingAddress.city || ""
                }, ${order.shippingAddress.state || ""} - ${
                  order.shippingAddress.pinCode || ""
                }`
              : "N/A"}
          </Typography>
        </Box>
      )}

      <Box display="flex" justifyContent="flex-end" mt={1}>
        <Tooltip title={expandedRow === order._id ? "Show less" : "Show more"}>
          <IconButton size="small" onClick={() => handleRowExpand(order._id)}>
            <Typography variant="body2">
              {expandedRow === order._id ? "▲" : "▼"}
            </Typography>
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );

  return (
    <div className="p-4 md:p-6 bg-gradient-to-br from-gray-100 to-gray-200 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* ACTIVE ORDERS TABLE */}
      <div className="bg-white p-4 md:p-6 rounded-xl shadow-xl border border-gray-100 transform transition-all duration-300 hover:shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold text-gray-800 bg-gradient-to-r from-blue-500 to-teal-500 bg-clip-text text-transparent">
            Active Processing Orders
          </h2>
          <Tooltip title="Refresh Orders">
            <IconButton
              onClick={fetchProcessingOrders}
              className="bg-blue-600 text-white hover:bg-blue-700"
              sx={{ 
                bgcolor: '#2563eb', 
                color: 'white',
                '&:hover': { bgcolor: '#1d4ed8' }
              }}
            >
              <FaSync className={isLoading ? "animate-spin" : ""} />
            </IconButton>
          </Tooltip>
        </div>

        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            <CircularProgress size={48} />
          </Box>
        ) : processingOrders.length > 0 ? (
          <>
            {/* Mobile View - Cards */}
            {isMobile && (
              <Box sx={{ maxHeight: "70vh", overflow: "auto", px: 1 }}>
                {processingOrders.map(renderMobileOrderCard)}
              </Box>
            )}

            {/* Tablet/Desktop View - Table with overflow handling */}
            {!isMobile && (
              <TableContainer 
                component={Paper} 
                sx={{ 
                  maxHeight: "70vh",
                  overflow: "auto",
                  position: 'relative',
                  '& .MuiTable-root': {
                    minWidth: isTablet ? 1200 : 1400,
                  }
                }}
              >
                <Table stickyHeader size={isTablet ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      {[
                        "Firm Name",
                        "Type",
                        "Customer",
                        "User Code",
                        "Phone",
                        "Address",
                        "Status",
                        "Payment",
                        "Method",
                        "Items",
                        "Delivery",
                        "Total",
                        "Actions",
                      ].map((header) => (
                        <TableCell
                          key={header}
                          sx={{
                            fontWeight: 600,
                            backgroundColor: "#f0f9ff",
                            color: "#374151",
                            whiteSpace: 'nowrap',
                            py: isTablet ? 1 : 1.5,
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processingOrders.map((order) => (
                      <TableRow
                        key={order._id}
                        sx={{
                          "&:hover": { backgroundColor: "#f9fafb" },
                          "&:nth-of-type(odd)": { backgroundColor: "#fafafa" },
                          position: 'relative',
                        }}
                      >
                        <TableCell sx={{ fontWeight: 500, whiteSpace: 'nowrap' }}>
                          {order.firmName}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.type}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.user?.name}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          {order.user?.customerDetails?.userCode || "N/A"}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.user?.phoneNumber || "N/A"}</TableCell>
                        <TableCell sx={{ maxWidth: 200 }}>
                          <Tooltip title={
                            order.shippingAddress
                              ? `${order.shippingAddress.address || ""}, ${
                                  order.shippingAddress.city || ""
                                }, ${order.shippingAddress.state || ""} - ${
                                  order.shippingAddress.pinCode || ""
                                }`
                              : "N/A"
                          }>
                            <Typography variant="body2" noWrap>
                              {order.shippingAddress
                                ? `${order.shippingAddress.address || ""}, ${
                                    order.shippingAddress.city || ""
                                  }, ${order.shippingAddress.state || ""} - ${
                                    order.shippingAddress.pinCode || ""
                                  }`
                                : "N/A"}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.orderStatus}
                            color={getStatusColor(order.orderStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={order.paymentStatus}
                            color={getPaymentColor(order.paymentStatus)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{order.paymentMethod}</TableCell>
                        <TableCell>
                          <Tooltip title={
                            order.products.map(item => `${item.product?.name}: ${item.boxes}`).join(', ')
                          }>
                            <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                              {order.products.map((item, i) => (
                                <span key={i}>
                                  {item.product?.name}: {item.boxes}
                                  {i < order.products.length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>₹ {order.deliveryCharge || 0}</TableCell>
                        <TableCell sx={{ fontWeight: 600, color: "#2563eb", whiteSpace: 'nowrap' }}>
                          ₹ {order.totalAmountWithDelivery || order.totalAmount}
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={(e) => handleMenuOpen(e, order)}
                            size="small"
                            sx={{ 
                              bgcolor: '#f3f4f6',
                              '&:hover': { bgcolor: '#e5e7eb' }
                            }}
                          >
                            <FaEllipsisV size={14} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Action Menu - Fixed positioning to avoid overflow issues */}
            <Menu
              anchorEl={menuAnchorEl}
              open={Boolean(menuAnchorEl)}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              PaperProps={{
                elevation: 3,
                sx: {
                  minWidth: 200,
                  maxWidth: 300,
                  borderRadius: 2,
                  mt: 1,
                }
              }}
            >
              {menuOrder && (
                <>
                  <MenuItem 
                    onClick={() => {
                      handleOrderSelection(menuOrder);
                      handleMenuClose();
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <PdfIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText primary="Generate Challan" />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      updateOrderStatus(menuOrder._id, "shipped");
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <ShippedIcon fontSize="small" color="success" />
                    </ListItemIcon>
                    <ListItemText primary="Mark as Shipped" />
                  </MenuItem>
                  <MenuItem 
                    onClick={() => {
                      updateOrderStatus(menuOrder._id, "cancelled");
                    }}
                    sx={{ py: 1.5 }}
                  >
                    <ListItemIcon>
                      <CancelIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Cancel Order" />
                  </MenuItem>
                </>
              )}
            </Menu>
          </>
        ) : (
          <Typography
            variant="body1"
            color="text.secondary"
            textAlign="center"
            py={8}
          >
            No active processing orders found.
          </Typography>
        )}
      </div>

      {/* WIZARD (MULTIPLE CHALLAN FLOW) */}
      {showWizard && selectedOrder && (
        <ChallanGenerationWizard
          order={selectedOrder}
          onClose={() => {
            setShowWizard(false);
            setSelectedOrder(null);
          }}
          onSuccess={generateChallansFromWizard}
        />
      )}
      
      {/* RESCHEDULE MODAL */}
      {showRescheduleModal && selectedChallan && (
        <RescheduleModal
          challan={selectedChallan}
          onClose={() => {
            setShowRescheduleModal(false);
            setSelectedChallan(null);
          }}
          onConfirm={rescheduleChallan}
          loading={rescheduleLoading}
        />
      )}

      {/* SINGLE CHALLAN MODAL */}
      {showChallanModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-[1000]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto transform transition-all duration-300 scale-95 hover:scale-100">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">
              Generate Delivery Challan
            </h2>
            <form className="space-y-4">
              {[ 
                { label: "User Code", value: challanData.userCode, readOnly: true },
                { label: "Vehicle Number", key: "vehicleNo" },
                { label: "Driver Name", key: "driverName" },
                { label: "Mobile Number", key: "mobileNo" },
                { label: "Receiver Name", key: "receiverName" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="block text-gray-700 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={field.value || challanData[field.key]}
                    onChange={(e) =>
                      !field.readOnly &&
                      setChallanData({
                        ...challanData,
                        [field.key]: e.target.value,
                      })
                    }
                    readOnly={field.readOnly}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              ))}

              {/* ADDRESS FIELDS */}
              {["address", "city", "state", "pinCode"].map((field) => (
                <div key={field}>
                  <label className="block text-gray-700 mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={challanData.deliveryAddress[field]}
                    onChange={(e) =>
                      setChallanData({
                        ...challanData,
                        deliveryAddress: {
                          ...challanData.deliveryAddress,
                          [field]: e.target.value,
                        },
                      })
                    }
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowChallanModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2"
                >
                  <FaTimes /> Cancel
                </button>
                <button
                  type="button"
                  onClick={generateChallan}
                  disabled={!isChallanValid}
                  className={`px-4 py-2 flex items-center gap-2 text-white rounded-md ${
                    isChallanValid
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }`}
                >
                  <FaCheck /> Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchComponent;