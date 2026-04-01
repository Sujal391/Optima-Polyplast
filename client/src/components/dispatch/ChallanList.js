import React, { useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Download, Printer, Search, Edit, Loader2, FileText,
  Calendar, Truck, User, MapPin, RefreshCw, X, ChevronDown, ChevronUp, XCircle, AlertCircle
} from "lucide-react";
import logo from "../../assets/logo1.png";
import qrImage from "../../assets/qr.png";
import cookies from "js-cookie";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Card, CardContent } from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Label } from "../ui/label";
import Paginator from '../common/Paginator';
import RescheduleModal from "./RescheduleModal";

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) {
      config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const normalizeProductsResponse = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.products)) return data.products;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

const createProductLookup = (products = []) => {
  return products.reduce((acc, product) => {
    if (product?._id) {
      acc[String(product._id)] = {
        name: product.name || "",
        category: product.category || "",
      };
    }
    return acc;
  }, {});
};

const resolveChallanItem = (item, productLookup = {}) => {
  const matchedProduct = productLookup[String(item?.productId || item?.product?._id || "")] || {};

  return {
    ...item,
    productName:
      matchedProduct.name ||
      item?.product?.name ||
      item?.productName ||
      item?.description ||
      "N/A",
    category:
      matchedProduct.category ||
      item?.product?.category ||
      item?.category ||
      "",
  };
};

const ChallanList = () => {
  const [challans, setChallans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(0);
  const [expandedRow, setExpandedRow] = useState(null);
  const [productLookup, setProductLookup] = useState({});

  // Filters
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Action states
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  const companyDetails = {
    name: "OPTIMA POLYPLAST LLP",
    address: "Plot No.12, 296, Industrial Road, Near Umiya Battery, Mota Jalundra Industrial Zone, Derojnagar, Gandhinagar, Gujarat",
    phone: "+919274658587",
    email: "info@optimapoliplast.com",
    gst: "24AAFFO8968G1ZU",
    iso: "ISO 9001:2015 Certified Company",
  };

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dispatch/challans?startDate=${startDate}&endDate=${endDate}${status !== 'all' ? `&status=${status}` : ''}`);
      setChallans(res.data.challans || []);
      setCount(res.data.count || 0);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error fetching challans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [startDate, endDate, status]);

  useEffect(() => {
    const fetchDispatchProducts = async () => {
      try {
        const res = await api.get("/dispatch/products");
        setProductLookup(createProductLookup(normalizeProductsResponse(res.data)));
      } catch (error) {
        console.error("Error fetching dispatch products:", error);
      }
    };

    fetchDispatchProducts();
  }, []);

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
      await fetchChallans();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error rescheduling challan");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!cancelReason.trim()) {
      toast.warning("Please provide a reason for cancellation.");
      return;
    }

    setIsCancelLoading(true);
    try {
      await api.patch(`/dispatch/challans/${cancellingId}/cancel`, {
        reason: cancelReason,
      });
      toast.success("Challan cancelled successfully!");
      setShowCancelDialog(false);
      setCancellingId(null);
      setCancelReason("");
      await fetchChallans();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error cancelling challan");
    } finally {
      setIsCancelLoading(false);
    }
  };

  // --- Helpers from ChallanHistory.js ---
  const getDisplayDate = (challan) => {
    if (challan.rescheduleHistory && challan.rescheduleHistory.length > 0) {
      const latestReschedule = challan.rescheduleHistory[challan.rescheduleHistory.length - 1];
      return new Date(latestReschedule.newDate).toLocaleDateString("en-GB");
    }
    return new Date(challan.challanDate || challan.createdAt).toLocaleDateString("en-GB");
  };

  const formatAddress = (shippingAddress) => {
    if (!shippingAddress) return "-";
    const addressParts = [
      shippingAddress.address,
      shippingAddress.city,
      shippingAddress.state,
      shippingAddress.pinCode,
    ].filter((part) => part && part.trim() !== "");
    return addressParts.join(", ") || "-";
  };

  const getCustomerInfo = (challan) => {
    let customerName = "-";
    let firmName = "-";
    const originalOrder = challan.originalOrder || challan.order;

    if (originalOrder) {
      if (originalOrder.customerName) customerName = originalOrder.customerName;
      if (originalOrder.firmName) firmName = originalOrder.firmName;
      if (originalOrder.customer?.name) customerName = originalOrder.customer.name;
      if (originalOrder.customer?.firmName) firmName = originalOrder.customer.firmName;
      if (originalOrder.user?.name) customerName = originalOrder.user.name;
    }
    if (customerName === "-" && challan.receiverName) customerName = challan.receiverName;
    return { customerName, firmName };
  };

  const getResolvedItem = (item) => resolveChallanItem(item, productLookup);

  // --- UPDATED PDF GENERATION LOGIC FOR A5 PORTRAIT SINGLE CHALLAN ---
  const getChallanHTML = (challan) => {
    const subtotal = challan.totalAmount ?? (challan.items || []).reduce((acc, item) => acc + (item.amount || 0), 0);
    const gstAmount = challan.gst ?? (subtotal * 0.05);
    const totalWithGST = challan.totalAmountWithGST ?? (subtotal + gstAmount);
    const deliveryCharge = challan.deliveryCharge || 0;
    const grandTotal = challan.totalAmountWithDelivery ?? (totalWithGST + deliveryCharge);
    const displayDate = getDisplayDate(challan);
    const formattedAddress = formatAddress(challan.shippingAddress);
    const { customerName, firmName } = getCustomerInfo(challan);

    return `
      <div style="font-family: Arial, sans-serif; padding: 12px; width: 100%; max-width: 148mm; box-sizing: border-box; background: white; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 8px; margin-bottom: 12px;">
          <img src="${logo}" style="width: 60px; height: auto; margin-bottom: 5px;" />
          <h1 style="font-size: 16px; margin: 3px 0; font-weight: bold; color: #2c3e50;">${companyDetails.name}</h1>
          <div style="font-size: 8px; margin: 2px 0; color: #555;">
            <p style="margin: 1px 0;">${companyDetails.address}</p>
            <p style="margin: 1px 0;">
              <span>Phone: ${companyDetails.phone}</span> | 
              <span>Email: ${companyDetails.email}</span> | 
              <span>GST: ${companyDetails.gst}</span>
            </p>
            <p style="margin: 2px 0; font-style: italic; color: #777;">${companyDetails.iso}</p>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 9px; margin-bottom: 12px;">
          <div style="background: #f9f9f9; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
            <h3 style="margin: 0 0 6px 0; font-size: 10px; border-bottom: 1px solid #ddd; padding-bottom: 3px; color: #333;">Customer Details</h3>
            <p style="margin: 2px 0;"><strong>Firm Name:</strong> ${firmName}</p>
            <p style="margin: 2px 0;"><strong>Customer Name:</strong> ${customerName}</p>
            <p style="margin: 2px 0;"><strong>User Code:</strong> ${challan.userCode}</p>
            <p style="margin: 2px 0;"><strong>Receiver:</strong> ${challan.receiverName}</p>
            <p style="margin: 2px 0; line-height: 1.3;"><strong>Delivery Address:</strong> ${formattedAddress}</p>
          </div>
          
          <div style="background: #f9f9f9; padding: 8px; border-radius: 6px; border: 1px solid #eee;">
            <h3 style="margin: 0 0 6px 0; font-size: 10px; border-bottom: 1px solid #ddd; padding-bottom: 3px; color: #333;">Challan Details</h3>
            <p style="margin: 2px 0;"><strong>Challan No:</strong> ${challan.invoiceNo || challan.dcNo}</p>
            <p style="margin: 2px 0;"><strong>Date:</strong> ${displayDate}</p>
            <p style="margin: 2px 0;"><strong>Vehicle No:</strong> ${challan.vehicleNo}</p>
            <p style="margin: 2px 0;"><strong>Driver Name:</strong> ${challan.driverName}</p>
            <p style="margin: 2px 0;"><strong>Delivery Choice:</strong> ${challan.deliveryChoice || "Company Pickup"}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 8px; margin-bottom: 12px;">
          <thead>
            <tr style="background: #34495e; color: white;">
              <th style="border: 1px solid #2c3e50; padding: 4px;">No</th>
              <th style="border: 1px solid #2c3e50; padding: 4px;">Description</th>
              <th style="border: 1px solid #2c3e50; padding: 4px;">Boxes</th>
              <th style="border: 1px solid #2c3e50; padding: 4px;">Rate</th>
              <th style="border: 1px solid #2c3e50; padding: 4px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${(challan.items || []).map((item, index) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 4px; text-align:center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 4px;">${getResolvedItem(item).productName || "-"} ${getResolvedItem(item).category ? `(${getResolvedItem(item).category})` : ''}</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align:center;">${item.boxes}</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align:right;">₹ ${Number(item.rate).toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 4px; text-align:right;">₹ ${Number(item.amount).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px;">
          <div style="width: 110px; border: 1px solid #ddd; border-radius: 6px; padding: 6px; text-align: center; background: #fff; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
            <h4 style="margin: 0 0 3px 0; font-size: 8px; font-weight: 800; color: #222; text-transform: uppercase;">Optima Polyplast LLP</h4>
            <p style="margin: 0 0 3px 0; font-size: 6px; font-weight: 700;">
              <span style="color: #666; font-style: italic;">UPI ID:</span> <span style="color: #900;">optimap.07@idfcbank</span>
            </p>
            <p style="margin: 0 0 4px 0; font-size: 5px; color: #555; line-height: 1.2;">Scan this QR code with any<br/>UPI app to transfer</p>
            <img src="${qrImage}" style="width: 65px; height: 65px; margin: 0 auto; display: block;" alt="QR Code" />
            <div style="margin-top: 4px; background: #900; color: white; padding: 3px; border-radius: 2px; font-size: 5.5px; font-weight: bold; letter-spacing: 0.2px;">
              IDFC FIRST Bank
            </div>
          </div>

          <div style="width: 180px; font-size: 9px; background: #ecf0f1; padding: 8px; border-radius: 6px;">
            <p style="margin: 3px 0; display: flex; justify-content: space-between;">
              <span>Subtotal:</span> <span>₹ ${Number(subtotal).toFixed(2)}</span>
            </p>
            <p style="margin: 3px 0; display: flex; justify-content: space-between;">
              <span>GST (5%):</span> <span>₹ ${Number(gstAmount).toFixed(2)}</span>
            </p>
            <div style="border-top: 1px dashed #999; margin: 6px 0 3px 0;"></div>
            <p style="margin: 3px 0; display: flex; justify-content: space-between; font-weight: bold;">
              <span>Total with GST:</span> <span>₹ ${Number(totalWithGST).toFixed(2)}</span>
            </p>
            <div style="border-top: 1px dashed #999; margin: 6px 0 3px 0;"></div>
            <p style="margin: 3px 0; display: flex; justify-content: space-between;">
              <span>Delivery Charge:</span> <span>${Number(deliveryCharge) === 0 ? "Free" : `₹ ${Number(deliveryCharge).toFixed(2)}`}</span>
            </p>
            <div style="border-top: 2px solid #bdc3c7; margin: 6px 0 3px 0;"></div>
            <p style="margin: 3px 0; display: flex; justify-content: space-between; font-weight: bold; font-size: 10px;">
              <span>Grand Total:</span> <span>₹ ${Number(grandTotal).toFixed(2)}</span>
            </p>
          </div>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-top: 15px; font-size: 8px; border-top: 1px dashed #999; padding-top: 8px;">
          <div>
            <p style="margin: 2px 0;">Issuer's Signature: ____________</p>
            <p style="margin: 2px 0; color: #666; font-size: 7px;">Authorized Signatory</p>
          </div>
          <div>
            <p style="margin: 2px 0;">Receiver's Signature: ____________</p>
            <p style="margin: 2px 0; color: #666; font-size: 7px;">Customer Signature</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 8px; font-size: 6px; color: #777;">
          <p>This is a system generated challan - valid with authorized signature</p>
        </div>
      </div>
    `;
  };

  // Single A5 Portrait Challan HTML
  const getSingleChallanHTML = (challan) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Challan - ${challan.invoiceNo || challan.dcNo}</title>
        <style>
          @page {
            size: A5;
            margin: 8mm;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }
          .container {
            width: 100%;
            height: auto;
            background: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          ${getChallanHTML(challan)}
        </div>
      </body>
      </html>
    `;
  };

  // Updated download function for A5 portrait
  const downloadChallan = (challan) => {
    const element = document.createElement("div");
    element.innerHTML = getSingleChallanHTML(challan);

    html2pdf()
      .from(element)
      .set({
        margin: 0.5,
        filename: `challan_${challan.invoiceNo || challan.dcNo}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: {
          unit: "mm",
          format: "a5",
          orientation: "portrait"
        },
      })
      .save();
  };

  // Updated print function for A5 portrait
  const printChallan = (challan) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(getSingleChallanHTML(challan));
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const filteredChallans = challans.filter(c => {
    const q = searchTerm.toLowerCase();
    return (
      (c.invoiceNo || "").toLowerCase().includes(q) ||
      (c.dcNo || "").toLowerCase().includes(q) ||
      (c.receiverName || "").toLowerCase().includes(q) ||
      (c.userCode || "").toLowerCase().includes(q) ||
      (c.vehicleNo || "").toLowerCase().includes(q)
    );
  });

  const pagedChallans = filteredChallans.slice((page - 1) * pageSize, page * pageSize);

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'cancelled') return "bg-red-100 text-red-700 border-red-200";
    if (s === 'delivered' || s === 'completed' || s === 'shipped' || s === 'dispatched')
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s === 'scheduled') return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === 'pending') return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const formatCurrencyValue = (amt) =>
    (amt !== undefined && amt !== null) ? `₹${Number(amt).toLocaleString("en-IN")}` : 'N/A';

  return (
    <div className="min-h-screen bg-slate-50 tracking-tight font-sans">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Total Challan List</h1>
            <p className="text-sm text-slate-500 mt-1">Review and manage all historical delivery challans.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1.5 font-bold bg-white text-slate-700 h-10 border-slate-200">
              {count} Records Found
            </Badge>
            <Button variant="outline" onClick={fetchChallans} className="h-10 bg-white shadow-sm border-slate-200">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card className="border-0 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Start Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="pl-9 h-11 border-slate-200" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">End Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="pl-9 h-11 border-slate-200" />
                </div>
              </div>
              <div className="space-y-2 lg:col-span-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Search Information</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search DC No, User Code, or Receiver..."
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    className="pl-9 h-11 border-slate-200 shadow-sm"
                  />
                  {searchTerm && (
                    <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table/List View */}
        <Card className="border-0 shadow-sm overflow-hidden min-h-[400px]">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-4" />
                <p className="font-medium">Loading Challans...</p>
              </div>
            ) : filteredChallans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <FileText className="h-16 w-16 mb-4 text-slate-200" />
                <p className="text-lg font-bold text-slate-600">No Challans Found</p>
                <p className="text-sm">Try adjusting your date range or filters.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200">
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-left">DC No / Invoice</TableHead>
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-center">Scheduled</TableHead>
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-left">Receiver & Fleet</TableHead>
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-center">Status</TableHead>
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-right">Value</TableHead>
                        <TableHead className="font-bold text-slate-600 px-6 py-4 uppercase text-[11px] tracking-wider text-right">Actions</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedChallans.map((c) => (
                        <React.Fragment key={c._id || c.challanId}>
                          <TableRow className={`hover:bg-slate-50/50 transition-colors border-b border-slate-100 ${expandedRow === (c._id || c.challanId) ? 'bg-blue-50/30' : ''}`}>
                            <TableCell className="px-6 py-4">
                              <div className="flex flex-col gap-1">
                                <span className="font-mono text-[13px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 w-fit">
                                  {c.invoiceNo || c.dcNo}
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order: {c.orderCode || c.order?.orderId?.slice(-6) || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center">
                              <div className="flex flex-col items-center">
                                <span className="text-sm font-bold text-slate-700">{getDisplayDate(c)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <User className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-sm font-bold text-slate-800">{c.receiverName} ({c.userCode})</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Truck className="h-3.5 w-3.5 text-slate-400" />
                                  <span className="text-xs text-slate-600 font-medium">{c.vehicleNo} · {c.driverName}</span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-center">
                              <Badge variant="outline" className={`uppercase text-[9px] font-bold tracking-widest px-2.5 py-1 ${getStatusColor(c.status)}`}>
                                {c.status || "active"}
                              </Badge>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-bold text-slate-900">{formatCurrencyValue(c.totalAmountWithDelivery)}</span>
                                <span className="text-[10px] text-slate-400">Total Bill</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => downloadChallan(c)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" title="Download PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => printChallan(c)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full" title="Print Challan">
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {c.status !== "cancelled" && (
                                  <>
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedChallan(c); setShowRescheduleModal(true); }} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-full" title="Reschedule Date">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => { setCancellingId(c._id || c.challanId); setShowCancelDialog(true); }} className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-full" title="Cancel Challan">
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-4">
                              <button
                                onClick={() => setExpandedRow(expandedRow === (c._id || c.challanId) ? null : (c._id || c.challanId))}
                                className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                              >
                                {expandedRow === (c._id || c.challanId) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </TableCell>
                          </TableRow>

                          {/* Expanded Details - Kept same as original */}
                          {expandedRow === (c._id || c.challanId) && (
                            <TableRow className="bg-slate-50/80 border-b border-slate-100">
                              <TableCell colSpan={7} className="px-8 py-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
                                  <div className="lg:col-span-2 space-y-4 text-left">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                      <FileText className="h-3.5 w-3.5" /> Items Details
                                    </h4>
                                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                                      <table className="w-full text-sm text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase">
                                          <tr>
                                            <th className="px-4 py-3">Product Name</th>
                                            <th className="px-4 py-3 text-center">Qty (Boxes)</th>
                                            <th className="px-4 py-3 text-right">Rate</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-left">
                                          {(c.items || []).map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                              <td className="px-4 py-3 font-medium text-slate-800">{getResolvedItem(item).productName}{getResolvedItem(item).category ? ` - ${getResolvedItem(item).category}` : ""}</td>
                                              <td className="px-4 py-3 text-center text-slate-600 font-bold">{item.boxes}</td>
                                              <td className="px-4 py-3 text-right text-slate-600">{formatCurrencyValue(item.rate)}</td>
                                              <td className="px-4 py-3 text-right font-bold text-slate-800">{formatCurrencyValue(item.amount)}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                        <tfoot className="bg-slate-50/50 text-xs border-t border-slate-200">
                                          <tr>
                                            <td colSpan="3" className="px-4 py-2 text-right text-slate-500 font-medium">Amount:</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-700">{formatCurrencyValue(c.totalAmount)}</td>
                                          </tr>
                                          <tr>
                                            <td colSpan="3" className="px-4 py-2 text-right text-slate-500 font-medium">GST:</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-700">{formatCurrencyValue(c.gst || 0)}</td>
                                          </tr>
                                          <tr>
                                            <td colSpan="3" className="px-4 py-2 text-right text-slate-500 font-bold">Total with GST:</td>
                                            <td className="px-4 py-2 text-right font-bold text-slate-800">{formatCurrencyValue(c.totalAmountWithGST || c.totalAmount)}</td>
                                          </tr>
                                          <tr>
                                            <td colSpan="3" className="px-4 py-2 text-right text-slate-500 font-medium">Delivery Charges:</td>
                                            <td className="px-4 py-2 text-right font-medium text-slate-700">{formatCurrencyValue(c.deliveryCharge || 0)}</td>
                                          </tr>
                                          <tr className="bg-slate-100 border-t border-slate-200 text-sm">
                                            <td colSpan="3" className="px-4 py-3 text-right text-slate-700 font-black uppercase">Total with Delivery:</td>
                                            <td className="px-4 py-3 text-right text-blue-700 font-black">{formatCurrencyValue(c.totalAmountWithDelivery || c.totalAmount)}</td>
                                          </tr>
                                        </tfoot>
                                      </table>
                                    </div>
                                  </div>

                                  <div className="space-y-6 text-left">
                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin className="h-3.5 w-3.5" /> Shipping Address
                                      </h4>
                                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-2 text-sm">
                                        <p className="font-bold text-slate-800">{formatAddress(c.shippingAddress)}</p>
                                        <p className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-1 rounded w-fit uppercase tracking-wider">{c.deliveryChoice}</p>
                                      </div>
                                    </div>

                                    <div className="space-y-3">
                                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" /> Logistics Breakdown
                                      </h4>
                                      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-sm space-y-2">
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Vehicle No:</span>
                                          <span className="font-bold text-slate-800">{c.vehicleNo}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-slate-500">Driver:</span>
                                          <span className="font-bold text-slate-800">{c.driverName}</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
                  <span className="text-sm text-slate-500">
                    Showing <span className="font-bold text-slate-700">{Math.min(filteredChallans.length, (page - 1) * pageSize + 1)}</span> to <span className="font-bold text-slate-700">{Math.min(filteredChallans.length, page * pageSize)}</span> of <span className="font-bold text-slate-700">{filteredChallans.length}</span>
                  </span>
                  <div className="flex items-center gap-4">
                    <Paginator page={page} total={filteredChallans.length} pageSize={pageSize} onPageChange={setPage} />
                    <select
                      className="border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                      value={pageSize}
                      onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
                    >
                      {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
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

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" /> Cancel Delivery Challan
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this challan? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-xs font-bold uppercase text-slate-500">Reason for Cancellation</Label>
              <Input
                id="reason"
                placeholder="e.g. Customer not available / Incorrect items"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)} disabled={isCancelLoading}>
              Dismiss
            </Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleCancelChallan} disabled={isCancelLoading}>
              {isCancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Confirm Cancellation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChallanList;
