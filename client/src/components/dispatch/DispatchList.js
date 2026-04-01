import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Loader2, RefreshCw, MoreVertical, FileText, XCircle, Undo2,
  ChevronDown, ChevronUp, PackageSearch, Search, ClipboardList, CheckCircle2,
  Printer, Download
} from "lucide-react";
import cookies from "js-cookie";
import html2pdf from "html2pdf.js";
import logo from "../../assets/logo1.png";
import qrImage from "../../assets/qr.png";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Paginator from '../common/Paginator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
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

const companyDetails = {
  name: "OPTIMA POLYPLAST LLP",
  address: "Plot No.12, 296, Industrial Road, Near Umiya Battery, Mota Jalundra Industrial Zone, Derojnagar, Gandhinagar, Gujarat",
  phone: "+919274658587",
  email: "info@optimapoliplast.com",
  gst: "24AAFFO8968G1ZU",
  iso: "ISO 9001:2015 Certified Company",
};

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

const enrichChallanItems = (items = [], productLookup = {}, orderProducts = []) => {
  return items.map((item) => {
    const matchedOrderProduct = orderProducts.find(
      (product) =>
        String(product.product?._id || product.productId || "") === String(item.productId || "") ||
        product.product?.name === item.productName ||
        product.productName === item.productName
    );
    const matchedProduct = productLookup[String(item.productId || "")] || {};

    return {
      ...item,
      productName:
        matchedProduct.name ||
        matchedOrderProduct?.product?.name ||
        matchedOrderProduct?.productName ||
        item.product?.name ||
        item.productName ||
        item.description ||
        "",
      category:
        matchedProduct.category ||
        matchedOrderProduct?.product?.category ||
        matchedOrderProduct?.category ||
        item.product?.category ||
        item.category ||
        "",
    };
  });
};

// Updated A5 Portrait Single Challan HTML
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
              <td style="border: 1px solid #ddd; padding: 4px;">${item.productName || item.description || "-"} ${item.category ? `(${item.category})` : ''}</td>
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

// Generate multiple copies on separate A5 pages
const getMultiChallanHTML = (challan, copies = 2) => {
  const challanHTML = getChallanHTML(challan);
  let allChallansHTML = '';

  for (let i = 0; i < copies; i++) {
    allChallansHTML += `
      <div style="page-break-after: ${i < copies - 1 ? 'always' : 'auto'};">
        ${challanHTML}
      </div>
    `;
  }

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
      </style>
    </head>
    <body>
      ${allChallansHTML}
    </body>
    </html>
  `;
};

// Generate batch HTML for multiple challans
const getBatchMultiChallanHTML = (challans, copies = 2) => {
  let allChallansHTML = '';

  challans.forEach((challan, challanIndex) => {
    const challanHTML = getChallanHTML(challan);
    for (let i = 0; i < copies; i++) {
      const isLast = (challanIndex === challans.length - 1) && (i === copies - 1);
      allChallansHTML += `
        <div style="page-break-after: ${isLast ? 'auto' : 'always'};">
          ${challanHTML}
        </div>
      `;
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Batch Challans</title>
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
      </style>
    </head>
    <body>
      ${allChallansHTML}
    </body>
    </html>
  `;
};

const DEFAULT_COPIES = 1;

const DispatchComponent = () => {
  const [processingOrders, setProcessingOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [generatedChallans, setGeneratedChallans] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [successModalData, setSuccessModalData] = useState(null);
  const [printCopies, setPrintCopies] = useState(DEFAULT_COPIES);

  const handleDownloadChallans = () => {
    if (!successModalData) return;

    if (successModalData.length === 1) {
      const element = document.createElement("div");
      element.innerHTML = getMultiChallanHTML(successModalData[0], printCopies);
      html2pdf()
        .from(element)
        .set({
          margin: 0.5,
          filename: `challan_${successModalData[0].invoiceNo || successModalData[0].dcNo}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
        })
        .save();
    } else {
      const element = document.createElement("div");
      element.innerHTML = getBatchMultiChallanHTML(successModalData, printCopies);
      html2pdf()
        .from(element)
        .set({
          margin: 0.5,
          filename: `challans_batch_${Date.now()}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a5", orientation: "portrait" },
        })
        .save();
    }
    setSuccessModalData(null);
  };

  const handlePrintChallans = () => {
    if (!successModalData) return;

    let printHTML;
    if (successModalData.length === 1) {
      printHTML = getMultiChallanHTML(successModalData[0], printCopies);
    } else {
      printHTML = getBatchMultiChallanHTML(successModalData, printCopies);
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printHTML);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    setSuccessModalData(null);
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
    try {
      await api.patch(`/dispatch/orders/${orderId}/status`, { status });
      toast.success(`Order ${status === 'cancelled' ? 'cancelled' : `updated to ${status}`} successfully`);
      await fetchProcessingOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating order status");
    }
  };

  const moveOrderToSales = async (orderId) => {
    try {
      await api.patch(`/dispatch/orders/${orderId}/move-to-sales-pending`);
      toast.success("Order moved back to sales successfully");
      await fetchProcessingOrders();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error moving order to sales");
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
          itemsDistribution: wizardData.splitInfo.itemsDistribution.map(challan => 
            challan.filter(p => p.boxes > 0).map(p => ({ productId: p.productId, boxes: p.boxes }))
          ),
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
      let outputChallans = response.data.challans || [];

      let productLookup = {};
      try {
        const productsResponse = await api.get("/dispatch/products");
        productLookup = createProductLookup(normalizeProductsResponse(productsResponse.data));
      } catch (productError) {
        console.error("Failed to fetch dispatch products for challan enrichment:", productError);
      }

      outputChallans = outputChallans.map(challan => ({
        ...challan,
        items: enrichChallanItems(challan.items || [], productLookup, selectedOrder.products || []),
      }));

      toast.success(`${response.data.count || outputChallans.length || 1} challan(s) generated!`);
      setGeneratedChallans(outputChallans);
      setSuccessModalData(outputChallans.length > 0 ? outputChallans : [{ invoiceNo: "Generated", dcNo: "Generated", items: [], ...response.data }]);
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

  const ActionDropdown = ({ order }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
          title="Order actions"
        >
          <MoreVertical className="h-4 w-4 text-gray-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-100 rounded-xl shadow-xl z-[100] py-1 overflow-hidden">
        {challanAlreadyExists(order) ? (
          <DropdownMenuItem disabled className="px-4 py-2.5 text-sm text-gray-400 flex items-center gap-2 cursor-not-allowed select-none">
            <CheckCircle2 className="h-4 w-4 text-green-400" /> Challan Generated
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => handleOrderSelection(order)}
            className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-50 hover:text-blue-700 focus:text-blue-700 flex items-center gap-2 transition-colors cursor-pointer outline-none"
          >
            <FileText className="h-4 w-4 text-blue-500" /> Generate Challan
          </DropdownMenuItem>
        )}
        <div className="border-t border-gray-100 mt-1">
          <DropdownMenuItem
            onSelect={() => moveOrderToSales(order._id)}
            className="w-full text-left px-4 py-2.5 text-sm text-indigo-600 hover:bg-indigo-50 focus:bg-indigo-50 flex items-center gap-2 transition-colors cursor-pointer outline-none"
          >
            <Undo2 className="h-4 w-4 text-indigo-500" /> Back to Sales
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => updateOrderStatus(order._id, "cancelled")}
            className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 focus:bg-red-50 flex items-center gap-2 transition-colors cursor-pointer outline-none"
          >
            <XCircle className="h-4 w-4 text-red-500" /> Cancel Order
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

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

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {isLoading && (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
              <span className="text-sm">Fetching approved orders...</span>
            </div>
          )}

          {!isLoading && pagedOrders.length === 0 && (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <PackageSearch className="h-10 w-10 text-gray-300" />
              <span className="text-base font-medium text-gray-500">No approved orders found</span>
              <span className="text-sm">Orders approved by sales will appear here.</span>
            </div>
          )}

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
                          <p className="font-mono text-gray-400 text-[10px]">{order.user?.customerDetails?.userCode}</p>
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

              <div className="block lg:hidden divide-y divide-gray-100">
                {pagedOrders.map((order) => (
                  <div key={order._id} className="p-4 hover:bg-gray-50/60 transition-colors">
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

                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus || "pending"}
                      </Badge>
                      <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                        {order.paymentMethod || "COD"}
                      </span>
                      <span className="text-[10px] text-gray-400">{formatDate(order.createdAt)}</span>
                    </div>

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

      <Dialog open={!!successModalData}>
        <DialogContent className="sm:max-w-md" hideClose onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-xl text-center flex flex-col items-center gap-2">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-2">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              Challan Generated Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-500">
              What would you like to do with the {successModalData?.length || 1} generated challan(s)?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-3 py-2">
            <span className="text-sm text-gray-600">Number of copies:</span>
            <select
              value={printCopies}
              onChange={(e) => setPrintCopies(parseInt(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n} copy{n > 1 ? 's' : ''}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-3 py-4">
            <Button onClick={handlePrintChallans} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium flex items-center justify-center gap-2">
              <Printer className="w-4 h-4" /> Print Challan ({printCopies} copy{printCopies > 1 ? 's' : ''})
            </Button>
            <Button onClick={handleDownloadChallans} variant="outline" className="w-full border-blue-200 hover:bg-blue-50 text-blue-700 font-medium flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> Download Challan ({printCopies} copy{printCopies > 1 ? 's' : ''})
            </Button>
            <Button onClick={() => setSuccessModalData(null)} variant="ghost" className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium">
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchComponent;
