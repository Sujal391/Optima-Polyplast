import React, { useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Download, Printer, Search, Edit, Loader2, FileText, ChevronDown, ChevronUp, X } from "lucide-react";
import logo from "../../assets/logo1.png";
import cookies from "js-cookie";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import Paginator from '../common/Paginator';
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
  const [processingOrders, setProcessingOrders] = useState([]);
  const [userChallans, setUserChallans] = useState([]);
  const [filteredChallans, setFilteredChallans] = useState([]);
  
  const [searchUserCode, setSearchUserCode] = useState("");
  const [dcSearchTerm, setDcSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [noChallansMessage, setNoChallansMessage] = useState(
    "Enter a user code to view challan history."
  );
  
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [expandedRow, setExpandedRow] = useState(null);

  // Company details for HTML PDF
  const companyDetails = {
    name: "OPTIMA POLYPLAST LLP",
    address:
      "Plot No.12,296, Industrial Road, Near Umiya Battery, Mota Jalundra Industrial Zone, Derojnagar, Gandhinagar, Gujarat",
    phone: "+919274658587",
    email: "info@optimapoliplast.com",
    gst: "24AAFFO8968G1ZU",
    iso: "ISO 9001:2015 Certified Company",
  };

  const fetchProcessingOrders = async () => {
    try {
      const response = await api.get("/dispatch/orders/processing");
      setProcessingOrders(response.data?.orders || []);
    } catch (error) {
      toast.error("Error fetching processing orders");
    }
  };

  const fetchChallansByUserCode = async (userCode) => {
    if (!userCode.trim()) {
      toast.warning("Please enter a valid user code.");
      setUserChallans([]);
      setFilteredChallans([]);
      setNoChallansMessage("Enter a user code to view challan history.");
      return;
    }

    setIsLoading(true);
    setPage(1); // Reset Pagination
    try {
      const response = await api.get(`/dispatch/challans/${userCode}`);
      const challans = response.data.challans || [];
      setUserChallans(challans);
      setFilteredChallans(challans);

      if (challans.length === 0) {
        setNoChallansMessage("No challan history available for this user.");
      } else {
        setNoChallansMessage("");
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setUserChallans([]);
        setFilteredChallans([]);
        setNoChallansMessage("No challan history available for this user.");
      } else {
        toast.error("Error fetching challans");
        setUserChallans([]);
        setFilteredChallans([]);
        setNoChallansMessage("Error fetching challan history.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const filterChallansByDcNumber = (searchTerm) => {
    setDcSearchTerm(searchTerm);
    setPage(1); // Reset Pagination on search

    if (!searchTerm.trim()) {
      setFilteredChallans(userChallans);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = userChallans.filter((challan) => {
      return (
        (challan.invoiceNo || "").toLowerCase().includes(term) ||
        (challan.dcNo || "").toLowerCase().includes(term) ||
        (challan.orderCode || "").toLowerCase().includes(term) ||
        (challan.receiverName || "").toLowerCase().includes(term) ||
        (challan.vehicleNo || "").toLowerCase().includes(term)
      );
    });

    setFilteredChallans(filtered);
  };

  const handleSearchInputChange = (e) => setSearchUserCode(e.target.value);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchChallansByUserCode(searchUserCode);
    setDcSearchTerm(""); 
  };

  const handleDcSearchChange = (e) => {
    filterChallansByDcNumber(e.target.value);
  };

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
      if (searchUserCode) {
        await fetchChallansByUserCode(searchUserCode);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error rescheduling challan");
    } finally {
      setRescheduleLoading(false);
    }
  };

  const getDisplayDate = (challan) => {
    if (challan.rescheduleHistory && challan.rescheduleHistory.length > 0) {
      const latestReschedule =
        challan.rescheduleHistory[challan.rescheduleHistory.length - 1];
      return new Date(latestReschedule.newDate).toLocaleDateString("en-GB");
    }
    return new Date(challan.createdAt).toLocaleDateString("en-GB");
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

    if (challan.originalOrder) {
      if (challan.originalOrder.customerName) {
        customerName = challan.originalOrder.customerName;
      }
      if (challan.originalOrder.firmName) {
        firmName = challan.originalOrder.firmName;
      }
      if (
        challan.originalOrder.customer &&
        challan.originalOrder.customer.name
      ) {
        customerName = challan.originalOrder.customer.name;
      }
      if (
        challan.originalOrder.customer &&
        challan.originalOrder.customer.firmName
      ) {
        firmName = challan.originalOrder.customer.firmName;
      }
    }

    if (customerName === "-" && challan.receiverName) {
      customerName = challan.receiverName;
    }

    return { customerName, firmName };
  };

  // --- PDF GENERATION LOGIC KEP EXACTLY AS ORIGINAL ---
  const getChallanHTML = (challan, copyNumber = 1, totalCopies = 1) => {
    const subtotal = challan.items.reduce((acc, item) => acc + item.amount, 0);
    const gstRate = 0.05;
    const gstAmount = subtotal * gstRate;
    const deliveryCharge = challan.deliveryCharge || 0;
    const totalWithDelivery = subtotal + deliveryCharge;
    const grandTotal = totalWithDelivery + gstAmount;
    const displayDate = getDisplayDate(challan);
    const formattedAddress = formatAddress(challan.shippingAddress);
    const { customerName, firmName } = getCustomerInfo(challan);

    return `
    <div style="font-family: Arial, sans-serif; padding: 15px; width: 140mm; box-sizing: border-box; border: 1px solid #e0e0e0; border-radius: 8px; background: white;">      
      <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 15px; position: relative;">
        <img src="${logo}" style="width: 80px; height: auto; margin-bottom: 5px;" />
        <h1 style="font-size: 18px; margin: 3px 0; font-weight: bold; color: #2c3e50;">${companyDetails.name}</h1>
        <div style="font-size: 9px; margin: 2px 0; color: #555;">
          <p style="margin: 1px 0;">${companyDetails.address}</p>
          <p style="margin: 1px 0;">
            <span>Phone: ${companyDetails.phone}</span> | 
            <span>Email: ${companyDetails.email}</span> | 
            <span>GST: ${companyDetails.gst}</span>
          </p>
          <p style="margin: 2px 0; font-style: italic; color: #777;">${companyDetails.iso}</p>
        </div>
      </div>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 10px; margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 6px;">
        <div>
          <p style="margin: 3px 0;"><strong>Challan No:</strong> ${challan.invoiceNo}</p>
          <p style="margin: 3px 0;"><strong>Date:</strong> ${displayDate}</p>
          <p style="margin: 3px 0;"><strong>User Code:</strong> ${challan.userCode}</p>
          <p style="margin: 3px 0;"><strong>Receiver:</strong> ${challan.receiverName}</p>
          <p style="margin: 3px 0;"><strong>Vehicle No:</strong> ${challan.vehicleNo}</p>
        </div>
        <div>
          <p style="margin: 3px 0;"><strong>Driver Name:</strong> ${challan.driverName}</p>
          <p style="margin: 3px 0;"><strong>GST Number:</strong> ${challan.customerGST || "-"}</p>
          <p style="margin: 3px 0;"><strong>PAN Number:</strong> ${challan.customerPAN || "-"}</p>
          <p style="margin: 3px 0;"><strong>Delivery Choice:</strong> ${challan.deliveryChoice || "Company Pickup"}</p>
        </div>
      </div>
      <div style="font-size: 10px; background: #f5f5f5; padding: 8px; border-radius: 6px; margin-bottom: 15px;">
        <p style="margin: 3px 0;"><strong>Delivery Address:</strong> ${formattedAddress}</p>
        <p style="margin: 3px 0;"><strong>Customer Name:</strong> ${customerName} | <strong>Firm Name:</strong> ${firmName}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 15px;">
        <thead>
          <tr style="background: #34495e; color: white;">
            <th style="border: 1px solid #2c3e50; padding: 5px;">No</th>
            <th style="border: 1px solid #2c3e50; padding: 5px;">Description</th>
            <th style="border: 1px solid #2c3e50; padding: 5px;">Boxes</th>
            <th style="border: 1px solid #2c3e50; padding: 5px;">Rate</th>
            <th style="border: 1px solid #2c3e50; padding: 5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${challan.items.map((item, index) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 5px; text-align:center;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 5px;">${item.description}</td>
                <td style="border: 1px solid #ddd; padding: 5px; text-align:center;">${item.boxes}</td>
                <td style="border: 1px solid #ddd; padding: 5px; text-align:right;">₹ ${Number(item.rate).toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 5px; text-align:right;">₹ ${Number(item.amount).toFixed(2)}</td>
              </tr>
            `).join("")}
        </tbody>
      </table>
      <div style="display: flex; justify-content: flex-end; margin-bottom: 15px;">
        <div style="width: 200px; font-size: 10px; background: #ecf0f1; padding: 10px; border-radius: 6px;">
          <p style="margin: 4px 0; display: flex; justify-content: space-between;">
            <span>Subtotal:</span> <span>₹ ${subtotal.toFixed(2)}</span>
          </p>
          <p style="margin: 4px 0; display: flex; justify-content: space-between;">
            <span>Delivery Charge:</span> <span>${deliveryCharge === 0 ? "Free" : `₹ ${deliveryCharge.toFixed(2)}`}</span>
          </p>
          <div style="border-top: 1px dashed #999; margin: 8px 0 4px 0;"></div>
          <p style="margin: 4px 0; display: flex; justify-content: space-between; font-weight: bold;">
            <span>Total with Delivery:</span> <span>₹ ${totalWithDelivery.toFixed(2)}</span>
          </p>
          <div style="border-top: 1px dashed #999; margin: 8px 0 4px 0;"></div>
          <p style="margin: 4px 0; display: flex; justify-content: space-between;">
            <span>GST (5%):</span> <span>₹ ${gstAmount.toFixed(2)}</span>
          </p>
          <div style="border-top: 2px solid #bdc3c7; margin: 8px 0 4px 0;"></div>
          <p style="margin: 4px 0; display: flex; justify-content: space-between; font-weight: bold; font-size: 11px;">
            <span>Grand Total:</span> <span>₹ ${grandTotal.toFixed(2)}</span>
          </p>
        </div>
      </div>
      <div style="display: flex; justify-content: space-between; margin-top: 20px; font-size: 9px; border-top: 1px dashed #999; padding-top: 10px;">
        <div>
          <p style="margin: 2px 0;">Issuer’s Signature: ____________</p>
          <p style="margin: 2px 0; color: #666; font-size: 8px;">Authorized Signatory</p>
        </div>
        <div>
          <p style="margin: 2px 0;">Receiver’s Signature: ____________</p>
          <p style="margin: 2px 0; color: #666; font-size: 8px;">Customer Signature</p>
        </div>
      </div>
      <div style="text-align: center; margin-top: 10px; font-size: 7px; color: #777;">
        <p>This is a system generated challan - valid with authorized signature</p>
      </div>
    </div>
  `;
  };

  const getDoubleChallanHTML = (challan) => {
    return`
  <!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>Challan - ${challan.invoiceNo}</title>
  <style>
  @page{ size:A4 portrait; margin:0; }
  body{ margin:0; padding:0; font-family:Arial, sans-serif; }
  .page{ width:210mm; height:297mm; display:flex; flex-direction:column; }
  .half{ width:210mm; height:148.5mm; position:relative; overflow:hidden; border-bottom:2px dashed #999; }
  .half:last-child{ border-bottom:none; }
  .rotate{ position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) rotate(90deg); width:140mm; }
  </style>
  </head>
  <body>
  <div class="page">
    <div class="half"><div class="rotate">${getChallanHTML(challan,1,2)}</div></div>
    <div class="half"><div class="rotate">${getChallanHTML(challan,2,2)}</div></div>
  </div>
  </body>
  </html>`;
  };

  const downloadChallan = (challan) => {
    const element = document.createElement("div");
    element.innerHTML = getDoubleChallanHTML(challan);

    html2pdf()
      .from(element)
      .set({
        margin: 0,
        filename: `challan_${challan.invoiceNo}.pdf`,
        image: { type: "jpeg", quality: 1 },
        html2canvas: { scale: 6, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .save();
  };

  const printChallan = (challan) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(getDoubleChallanHTML(challan));
      printWindow.document.close();
      printWindow.onload = () => { printWindow.print(); };
    }
  };

  useEffect(() => {
    fetchProcessingOrders();
  }, []);

  // Pagination Logic
  const total = filteredChallans.length;
  const startIdx = (page - 1) * pageSize;
  const pagedChallans = filteredChallans.slice(startIdx, startIdx + pageSize);

  const formatCurrency = (amount) => {
    return amount !== undefined && amount !== null 
      ? `₹${Number(amount).toLocaleString("en-IN")}` 
      : 'N/A';
  };

  const getStatusBadgeVariant = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'dispatched' || s === 'completed') return "bg-green-100 text-green-700 border-green-200";
    if (s === 'scheduled') return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === 'pending') return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const handleRowExpand = (id) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const renderMobileChallanCard = (challan) => (
    <div key={challan._id} className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex justify-between items-start mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            {challan.invoiceNo || challan.dcNo}
          </span>
          <p className="font-medium text-gray-900 mt-1">{challan.receiverName || "N/A"}</p>
          <p className="text-sm text-gray-500">{challan.driverName} | {challan.vehicleNo}</p>
        </div>
        <div className="text-right shrink-0">
          <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${getStatusBadgeVariant(challan.status)}`}>
            {challan.status || "pending"}
          </Badge>
          <p className="font-bold text-gray-900 mt-1.5">{formatCurrency(challan.totalAmountWithDelivery)}</p>
        </div>
      </div>

      <div className="flex justify-between items-center text-xs text-gray-500 mb-3 border-b border-gray-100 pb-3">
        <span>Order Code: <strong>{challan.orderCode || "Unknown"}</strong></span>
        <span>Scheduled: <strong>{new Date(challan.scheduledDate).toLocaleDateString("en-GB")}</strong></span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={() => downloadChallan(challan)} className="h-8 px-2 border-gray-200 text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Download">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => printChallan(challan)} className="h-8 px-2 border-gray-200 text-purple-600 hover:text-purple-700 hover:bg-purple-50" title="Print">
            <Printer className="h-4 w-4" />
          </Button>
          {challan.status === "scheduled" && (
            <Button variant="outline" size="sm" onClick={() => { setSelectedChallan(challan); setShowRescheduleModal(true); }} className="h-8 px-2 border-gray-200 text-orange-600 hover:text-orange-700 hover:bg-orange-50" title="Reschedule">
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={() => handleRowExpand(challan._id)} className="h-8 text-xs text-gray-500 font-medium px-2">
          {expandedRow === challan._id ? (
            <><ChevronUp className="h-3 w-3 mr-1"/> Close</>
          ) : (
            <><ChevronDown className="h-3 w-3 mr-1"/> Details</>
          )}
        </Button>
      </div>

      {expandedRow === challan._id && (
        <div className="mt-4 bg-blue-50/50 border border-blue-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-900 mb-1 border-b border-blue-100 pb-1">Split Info</p>
          <p className="text-xs text-blue-800">
            {challan.splitInfo?.isSplit ? (
              <span className="font-medium">Split Index: {challan.splitInfo.splitIndex + 1} of {challan.splitInfo.totalSplits}</span>
            ) : "Single Unsplit Challan"}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100 tracking-tight">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
                <FileText className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Challan Record Search</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Find and generate historically issued delivery challans.
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search by User Code..."
              value={searchUserCode}
              onChange={handleSearchInputChange}
              className="w-full sm:w-64 p-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow text-sm"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 px-4 h-auto">
              <Search className="h-4 w-4 mr-2" /> Find records
            </Button>
          </form>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden min-h-[400px]">
          
          <div className="bg-gray-50/80 px-4 sm:px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
               {isLoading ? (
                  <p className="text-sm font-medium text-gray-600 animate-pulse">Scanning records...</p>
               ) : userChallans.length > 0 ? (
                  <p className="text-sm font-medium text-gray-800">Showing records for user code: <span className="font-bold text-blue-600">{searchUserCode}</span></p>
               ) : (
                  <p className="text-sm font-medium text-gray-500">{noChallansMessage}</p>
               )}
            </div>

            {userChallans.length > 0 && (
              <div className="relative w-full sm:w-72 shrink-0">
                <input
                  type="text"
                  placeholder="Filter by DC Number or ID..."
                  value={dcSearchTerm}
                  onChange={handleDcSearchChange}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                {dcSearchTerm && (
                  <button onClick={() => { setDcSearchTerm(""); setFilteredChallans(userChallans); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </div>

          {!isLoading && userChallans.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-600">DC No</TableHead>
                      <TableHead className="font-semibold text-gray-600">Order Ref</TableHead>
                      <TableHead className="font-semibold text-gray-600">Receiver</TableHead>
                      <TableHead className="font-semibold text-gray-600">Vehicle / Driver</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">Scheduled</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-center">Split Info</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-right">Amount</TableHead>
                      <TableHead className="font-semibold text-gray-600 text-right w-[140px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChallans.length === 0 ? (
                       <TableRow>
                         <TableCell colSpan={9} className="h-32 text-center text-gray-500">
                           No challans match the filter criteria "{dcSearchTerm}"
                         </TableCell>
                       </TableRow>
                    ) : (
                      pagedChallans.map((challan) => {
                        const dcNumber = challan.invoiceNo || challan.dcNo || "";
                        const shouldHighlight = dcSearchTerm && dcNumber.toLowerCase().includes(dcSearchTerm.toLowerCase());

                        return (
                          <TableRow key={challan._id} className="hover:bg-blue-50/40 transition-colors">
                            <TableCell>
                              <span className={`font-mono text-xs font-semibold px-2 py-1 rounded ${shouldHighlight ? "bg-yellow-200 text-yellow-900" : "bg-gray-100 text-gray-800"}`}>
                                {dcNumber}
                              </span>
                            </TableCell>
                            <TableCell className="font-medium text-gray-700 text-sm">{challan.orderCode}</TableCell>
                            <TableCell className="text-sm font-medium text-gray-900">{challan.receiverName}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-800">{challan.vehicleNo}</span>
                                <span className="text-xs text-gray-500">{challan.driverName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className={`uppercase text-[10px] tracking-wider ${getStatusBadgeVariant(challan.status)}`}>
                                {challan.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm font-medium text-gray-700">
                              {new Date(challan.scheduledDate).toLocaleDateString("en-GB")}
                            </TableCell>
                            <TableCell className="text-center text-sm">
                              {challan.splitInfo?.isSplit ? (
                                <span className="text-blue-600 font-medium text-xs bg-blue-50 px-2 py-1 rounded-full">
                                  {challan.splitInfo.splitIndex + 1} / {challan.splitInfo.totalSplits}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">Single</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right font-bold text-gray-900">
                              {formatCurrency(challan.totalAmountWithDelivery)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1.5 justify-end">
                                <Button variant="ghost" size="sm" onClick={() => downloadChallan(challan)} className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full" title="Download Challan PDF">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => printChallan(challan)} className="h-8 w-8 p-0 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-full" title="Print Challan">
                                  <Printer className="h-4 w-4" />
                                </Button>
                                {challan.status === "scheduled" && (
                                  <Button variant="ghost" size="sm" onClick={() => { setSelectedChallan(challan); setShowRescheduleModal(true); }} className="h-8 w-8 p-0 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded-full" title="Reschedule Date">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="block lg:hidden divide-y divide-gray-100">
                 {filteredChallans.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">No challans match the filter criteria.</div>
                 ) : (
                    pagedChallans.map(renderMobileChallanCard)
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
                      className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={pageSize}
                      onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
                    >
                      {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n} / page</option>)}
                    </select>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center">
              {isLoading ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-3" />
                  <span className="text-gray-500 font-medium">Fetching secure records...</span>
                </>
              ) : (
                <>
                  <FileText className="h-10 w-10 text-gray-300 mb-3" />
                  <span className="text-gray-400 font-medium">Search a User Code to reveal data</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
};

export default DispatchComponent;