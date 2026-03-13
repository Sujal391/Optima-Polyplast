import React, { useState, useEffect } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaDownload, FaPrint, FaSearch, FaEdit } from "react-icons/fa";
import logo from "../../assets/logo1.png";
import cookies from "js-cookie";
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

  // Company details
  const companyDetails = {
    name: "OPTIMA POLYPLAST LLP",
    address:
      "Plot No.12,296, Industrial Road, Near Umiya Battery, Mota Jalundra Industrial Zone, Derojnagar, Gandhinagar, Gujarat",
    phone: "+919274658587",
    email: "info@optimapoliplast.com",
    gst: "24AAFFO8968G1ZU",
    iso: "ISO 9001:2015 Certified Company",
  };

  // Fetch processing orders
  const fetchProcessingOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/dispatch/orders/processing");
      setProcessingOrders(response.data?.orders || []);
    } catch (error) {
      toast.error("Error fetching processing orders");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch challans by user code
  const fetchChallansByUserCode = async (userCode) => {
    if (!userCode) {
      toast.warning("Please enter a user code.");
      setUserChallans([]);
      setFilteredChallans([]);
      setNoChallansMessage("Enter a user code to view challan history.");
      return;
    }

    setIsLoading(true);
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
        // Handle no challans found
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

  // Filter challans by DC number
  const filterChallansByDcNumber = (searchTerm) => {
    setDcSearchTerm(searchTerm);

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
    // Clear DC search when searching for new user
    setDcSearchTerm("");
  };

  const handleDcSearchChange = (e) => {
    filterChallansByDcNumber(e.target.value);
  };

  const clearDcSearch = () => {
    setDcSearchTerm("");
    setFilteredChallans(userChallans);
  };

  const rescheduleChallan = async (rescheduleData) => {
    try {
      setRescheduleLoading(true);
      const response = await api.patch(
        `/dispatch/challans/${rescheduleData.challanId}/reschedule`,
        {
          newDate: rescheduleData.newDate,
          reason: rescheduleData.reason,
        }
      );
      toast.success("Challan rescheduled successfully!");
      setShowRescheduleModal(false);
      setSelectedChallan(null);
      // Refresh the challans list
      if (searchUserCode) {
        await fetchChallansByUserCode(searchUserCode);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error rescheduling challan");
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Helper function to get the appropriate date for display
  const getDisplayDate = (challan) => {
    // Check if there's a reschedule history and use the latest rescheduled date
    if (challan.rescheduleHistory && challan.rescheduleHistory.length > 0) {
      // Get the most recent reschedule (last in the array)
      const latestReschedule =
        challan.rescheduleHistory[challan.rescheduleHistory.length - 1];
      return new Date(latestReschedule.newDate).toLocaleDateString("en-GB");
    }
    // If no reschedule, use the created date
    return new Date(challan.createdAt).toLocaleDateString("en-GB");
  };

  // Helper function to format address from shippingAddress object
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

  // Helper function to get customer name and firm name from original order
  const getCustomerInfo = (challan) => {
    let customerName = "-";
    let firmName = "-";

    // Try to get from originalOrder if it exists and has customer details
    if (challan.originalOrder) {
      // If originalOrder has customerName directly
      if (challan.originalOrder.customerName) {
        customerName = challan.originalOrder.customerName;
      }

      // If originalOrder has firmName directly
      if (challan.originalOrder.firmName) {
        firmName = challan.originalOrder.firmName;
      }

      // If originalOrder has customer object with name
      if (
        challan.originalOrder.customer &&
        challan.originalOrder.customer.name
      ) {
        customerName = challan.originalOrder.customer.name;
      }

      // If originalOrder has customer object with firmName
      if (
        challan.originalOrder.customer &&
        challan.originalOrder.customer.firmName
      ) {
        firmName = challan.originalOrder.customer.firmName;
      }
    }

    // If customerName is still "-", try to get from userCode or other fields
    if (customerName === "-" && challan.receiverName) {
      customerName = challan.receiverName;
    }

    return { customerName, firmName };
  };

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
    <!-- HEADER -->
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

    <!-- CHALLAN INFO - GRID LAYOUT -->
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

    <!-- ADDRESS AND CUSTOMER INFO -->
    <div style="font-size: 10px; background: #f5f5f5; padding: 8px; border-radius: 6px; margin-bottom: 15px;">
      <p style="margin: 3px 0;"><strong>Delivery Address:</strong> ${formattedAddress}</p>
      <p style="margin: 3px 0;"><strong>Customer Name:</strong> ${customerName} | <strong>Firm Name:</strong> ${firmName}</p>
    </div>

    <!-- ITEMS TABLE -->
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
        ${challan.items
          .map(
            (item, index) => `
            <tr>
              <td style="border: 1px solid #ddd; padding: 5px; text-align:center;">${index + 1}</td>
              <td style="border: 1px solid #ddd; padding: 5px;">${item.description}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align:center;">${item.boxes}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align:right;">₹ ${Number(item.rate).toFixed(2)}</td>
              <td style="border: 1px solid #ddd; padding: 5px; text-align:right;">₹ ${Number(item.amount).toFixed(2)}</td>
            </tr>
          `
          )
          .join("")}
      </tbody>
    </table>

    <!-- TOTALS SECTION - UPDATED FORMAT -->
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

    <!-- SIGNATURES AND TERMS -->
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
    
    <!-- FOOTER -->
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
 
@page{
  size:A4 portrait;
  margin:0;
}
 
body{
  margin:0;
  padding:0;
  font-family:Arial, sans-serif;
}
 
.page{
  width:210mm;
  height:297mm;
  display:flex;
  flex-direction:column;
}
 
.half{
  width:210mm;
  height:148.5mm;
  position:relative;
  overflow:hidden;
  border-bottom:2px dashed #999;
}
 
.half:last-child{
  border-bottom:none;
}
 
.rotate{
  position:absolute;
  top:50%;
  left:50%;
  transform:translate(-50%, -50%) rotate(90deg);
  width:140mm;
}
 
</style>
</head>
 
<body>
 
<div class="page">
 
  <div class="half">
      <div class="rotate">
        ${getChallanHTML(challan,1,2)}
      </div>
  </div>
 
  <div class="half">
      <div class="rotate">
        ${getChallanHTML(challan,2,2)}
      </div>
  </div>
 
</div>
 
</body>
</html>`
;
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
        jsPDF: {
          unit: "mm",
          format: "a4",
          orientation: "portrait",
        },
      })
      .save();
  };

  const printChallan = (challan) => {
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(getDoubleChallanHTML(challan));
      printWindow.document.close();

      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  useEffect(() => {
    fetchProcessingOrders();
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <ToastContainer />
      <div className="flex justify-between items-center bg-white p-4 shadow-md rounded-lg mb-6">
        <h1 className="text-2xl font-bold text-blue-600">
          Dispatch Management
        </h1>
        <form onSubmit={handleSearchSubmit} className="flex items-center">
          <input
            type="text"
            placeholder="Enter User Code"
            value={searchUserCode}
            onChange={handleSearchInputChange}
            className="p-2 border rounded"
          />
          <button
            type="submit"
            className="ml-2 p-2 bg-blue-500 text-white rounded flex items-center"
          >
            <FaSearch className="mr-1" /> Search
          </button>
        </form>
      </div>

      {/* Display User Challans */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        {isLoading ? (
          <p className="text-center text-gray-500">Loading...</p>
        ) : userChallans.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-blue-600">
                Generated Challans for User Code: {searchUserCode}
              </h2>

              {/* DC Number Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by DC Number or Order ID..."
                  value={dcSearchTerm}
                  onChange={handleDcSearchChange}
                  className="pl-8 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FaSearch className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                {dcSearchTerm && (
                  <button
                    onClick={clearDcSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Search Results Info */}
            {dcSearchTerm && (
              <div className="mb-3 text-sm text-gray-600">
                Found {filteredChallans.length}{" "}
                {filteredChallans.length === 1 ? "challan" : "challans"}{" "}
                matching "{dcSearchTerm}"
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="py-2 px-4 border-b">DC No</th>
                    <th className="py-2 px-4 border-b">Order ID</th>
                    <th className="py-2 px-4 border-b">Receiver Name</th>
                    <th className="py-2 px-4 border-b">Vehicle Number</th>
                    <th className="py-2 px-4 border-b">Driver Name</th>
                    <th className="py-2 px-4 border-b">Status</th>
                    <th className="py-2 px-4 border-b">Scheduled Date</th>
                    <th className="py-2 px-4 border-b">Split Info</th>
                    <th className="py-2 px-4 border-b">
                      Total Amount With Delivery
                    </th>
                    <th className="py-2 px-4 border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredChallans.map((challan) => {
                    const getStatusBadge = (status) => {
                      const statusConfig = {
                        pending: {
                          color: "bg-orange-100",
                          textColor: "text-orange-800",
                        },
                        scheduled: {
                          color: "bg-blue-100",
                          textColor: "text-blue-800",
                        },
                        dispatched: {
                          color: "bg-green-100",
                          textColor: "text-green-800",
                        },
                      };
                      const config =
                        statusConfig[status] || statusConfig.pending;
                      return (
                        <span
                          className={`px-2 py-1 rounded text-sm font-medium ${config.color} ${config.textColor}`}
                        >
                          {status || "pending"}
                        </span>
                      );
                    };

                    // Highlight matching DC number if searching
                    const dcNumber = challan.invoiceNo || challan.dcNo || "";
                    const shouldHighlight =
                      dcSearchTerm &&
                      dcNumber
                        .toLowerCase()
                        .includes(dcSearchTerm.toLowerCase());

                    return (
                      <tr
                        key={challan._id}
                        className="text-center hover:bg-gray-50"
                      >
                        <td
                          className={`py-2 px-4 border-b font-medium ${shouldHighlight ? "bg-yellow-100" : ""}`}
                        >
                          {dcNumber}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {challan.orderCode}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {challan.receiverName}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {challan.vehicleNo}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {challan.driverName}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {getStatusBadge(challan.status)}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {new Date(challan.scheduledDate).toLocaleDateString(
                            "en-GB"
                          )}
                        </td>
                        <td className="py-2 px-4 border-b text-sm">
                          {challan.splitInfo?.isSplit ? (
                            <span className="text-blue-600 font-medium">
                              Split {challan.splitInfo.splitIndex + 1}/
                              {challan.splitInfo.totalSplits}
                            </span>
                          ) : (
                            <span className="text-gray-500">Single</span>
                          )}
                        </td>
                        <td className="py-2 px-4 border-b">
                          ₹ {challan.totalAmountWithDelivery}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => downloadChallan(challan)}
                              className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              title="Download"
                            >
                              <FaDownload />
                            </button>

                            <button
                              onClick={() => printChallan(challan)}
                              className="p-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                              title="Print"
                            >
                              <FaPrint />
                            </button>

                            {challan.status === "scheduled" && (
                              <button
                                onClick={() => {
                                  setSelectedChallan(challan);
                                  setShowRescheduleModal(true);
                                }}
                                className="p-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                                title="Reschedule"
                              >
                                <FaEdit />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* No results message for DC search */}
            {filteredChallans.length === 0 && dcSearchTerm && (
              <div className="text-center py-4 text-gray-500">
                No challans found with DC number matching "{dcSearchTerm}"
              </div>
            )}
          </>
        ) : (
          <p className="text-center text-gray-500">{noChallansMessage}</p>
        )}
      </div>

      {/* Reschedule Modal */}
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