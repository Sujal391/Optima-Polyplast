import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { MoreVertical, X } from "lucide-react";

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

const formatCurrency = (amount) =>
  typeof amount === "number" ? `₹${amount.toFixed(2)}` : "N/A";

const formatDateTime = (dateString) =>
  dateString ? new Date(dateString).toLocaleString("en-IN") : "N/A";

const getPaymentStatusColor = (status) => {
  const s = status?.toLowerCase();
  const colors = {
    pending: "bg-yellow-100 text-yellow-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    submitted: "bg-blue-100 text-blue-800",
    verified: "bg-green-100 text-green-900",
  };
  return colors[s] || "bg-gray-100 text-gray-800";
};

const toast = {
  success: (msg) => console.log("✓", msg),
  error: (msg) => console.error("✗", msg),
  warning: (msg) => console.warn("⚠", msg),
};

// Dropdown Menu Component
const DropdownMenu = ({ onViewDetails, onUpdateStatus }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-200 rounded-full transition-colors"
      >
        <MoreVertical size={18} />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-20">
            <button
              onClick={() => {
                onViewDetails();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
            >
              View Details
            </button>
            <button
              onClick={() => {
                onUpdateStatus();
                setIsOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t"
            >
              Verify Payment
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Paginator Component
const Paginator = ({ page, pageSize, total, onPageChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Previous
      </button>
      <span className="px-3 py-1">
        Page {page} of {totalPages || 1}
      </span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages || totalPages === 0}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
};

const SubmittedPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  // VIEW DETAILS MODAL
  const [detailsModal, setDetailsModal] = useState({
    isOpen: false,
    payment: null,
  });

  // VERIFY PAYMENT MODAL
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    paymentId: null,
    suggestedAmount: 0,
  });

  const [verifyForm, setVerifyForm] = useState({
    verifiedAmount: "",
    verificationNotes: "",
    status: "verified",
  });

  // FETCH SUBMITTED PAYMENTS
  const fetchSubmittedPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("reception/payments/submitted");
      const data = res.data || {};
      setPayments(data.payments || []);
    } catch (error) {
      console.error(error);
      setError("Error fetching submitted payments");
      toast.error("Error fetching submitted payments");
    } finally {
      setLoading(false);
    }
  };

  // FILTER FUNCTION
  const filterPayments = (payments, searchTerm) => {
    if (!searchTerm.trim()) return payments;
    
    const term = searchTerm.toLowerCase();
    return payments.filter((payment) => {
      return (
        payment._id?.toLowerCase().includes(term) ||
        payment.paymentId?.toLowerCase().includes(term) ||
        payment.user?.name?.toLowerCase().includes(term) ||
        payment.user?.customerDetails?.firmName?.toLowerCase().includes(term) ||
        payment.user?.customerDetails?.userCode?.toLowerCase().includes(term) ||
        payment.user?.phoneNumber?.toLowerCase().includes(term) ||
        payment.user?.email?.toLowerCase().includes(term) ||
        payment.status?.toLowerCase().includes(term) ||
        payment.orderDetails?.orderStatus?.toLowerCase().includes(term)
      );
    });
  };

  // OPEN DETAILS MODAL
  const openDetailsModal = (payment) => {
    setDetailsModal({
      isOpen: true,
      payment,
    });
  };

  const closeDetailsModal = () => {
    setDetailsModal({
      isOpen: false,
      payment: null,
    });
  };

  // OPEN VERIFY MODAL
  const openVerifyModal = (payment) => {
    const lastHistory =
      payment.paymentHistory?.length > 0
        ? payment.paymentHistory[payment.paymentHistory.length - 1]
        : null;

    const suggestedAmount =
      lastHistory?.submittedAmount ||
      payment.amount ||
      payment.remainingAmount ||
      0;

    setVerifyModal({
      isOpen: true,
      paymentId: payment._id || payment.paymentId,
      suggestedAmount,
    });

    setVerifyForm({
      verifiedAmount: suggestedAmount,
      verificationNotes: "",
      status: "verified",
    });
  };

  const closeVerifyModal = () => {
    setVerifyModal({
      isOpen: false,
      paymentId: null,
      suggestedAmount: 0,
    });
    setVerifyForm({
      verifiedAmount: "",
      verificationNotes: "",
      status: "verified",
    });
  };

  // SUBMIT VERIFY PAYMENT
  const handleVerifyPayment = async () => {
    const { verifiedAmount, verificationNotes, status } = verifyForm;
    const { paymentId } = verifyModal;

    const parsedAmount = parseFloat(verifiedAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return toast.warning("Please enter a valid verified amount.");
    }

    try {
      const res = await api.patch(`reception/payments/${paymentId}/verify`, {
        verifiedAmount: parsedAmount,
        verificationNotes: verificationNotes || undefined,
        status: status || undefined,
      });

      const updated = res.data?.payment;
      toast.success(res.data?.message || "Payment verified successfully");

      if (updated) {
        setPayments((prev) =>
          prev.map((p) =>
            (p._id || p.paymentId) === (updated.paymentId || paymentId)
              ? {
                  ...p,
                  status: updated.status || "completed",
                  paidAmount: typeof updated.paidAmount === "number" ? updated.paidAmount : p.paidAmount,
                  remainingAmount: typeof updated.remainingAmount === "number" ? updated.remainingAmount : p.remainingAmount,
                  verifiedAmount: typeof updated.verifiedAmount === "number" ? updated.verifiedAmount : p.verifiedAmount,
                }
              : p
          )
        );
      }

      closeVerifyModal();
    } catch (error) {
      console.error(error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Error verifying payment"
      );
    }
  };

  // INITIAL LOAD
  useEffect(() => {
    fetchSubmittedPayments();
  }, []);

  // APPLY FILTERS AND PAGINATION
  const filteredPayments = filterPayments(payments, searchTerm);
  const total = filteredPayments.length;
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pagedPayments = filteredPayments.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto p-4 max-w-full">
        <h1 className="text-3xl font-bold text-center mb-6">Submitted Payments</h1>

        <div className="mb-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-xl font-semibold">
              Payment List {total ? `(${total})` : ""}
            </h2>
            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search payments..."
                className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 w-64"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              <button
                onClick={fetchSubmittedPayments}
                className="px-4 py-2 text-sm bg-gray-200 rounded hover:bg-gray-300 whitespace-nowrap"
              >
                Refresh
              </button>
            </div>
          </div>
          {searchTerm && (
            <div className="text-sm text-gray-600">
              Found {total} result{total !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {loading && <p>Loading submitted payments...</p>}
        {error && <div className="text-red-600 mb-2">{error}</div>}

        <div className="overflow-x-auto shadow-xl rounded-xl">
          <table className="w-full bg-white border">
            <thead className="bg-gray-200">
              <tr>
                {[
                  "Customer Name",
                  "Firm Name",
                  "User Code",
                  "Contact",
                  "Amount",
                  "Paid",
                  "Remaining",
                  "Status",
                  "Last Submission",
                  "Order Status",
                  "Action",
                ].map((th) => (
                  <th
                    key={th}
                    className="py-3 px-4 text-left text-sm font-semibold text-gray-700 whitespace-nowrap"
                  >
                    {th}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pagedPayments.length > 0 ? (
                pagedPayments.map((payment) => {
                  const lastHistory =
                    payment.paymentHistory?.length > 0
                      ? payment.paymentHistory[payment.paymentHistory.length - 1]
                      : null;
                  return (
                    <tr
                      key={payment._id || payment.paymentId}
                      className="hover:bg-gray-50 border-b"
                    >
                      <td className="py-3 px-4 text-sm">{payment.user?.name || "N/A"}</td>
                      <td className="py-3 px-4 text-sm">
                        {payment.user?.customerDetails?.firmName || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.user?.customerDetails?.userCode || "N/A"}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        <div>{payment.user?.phoneNumber || "N/A"}</div>
                        <div className="text-xs text-gray-500">{payment.user?.email || "—"}</div>
                      </td>
                      <td className="py-3 px-4 text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-green-600 font-medium">
                        {formatCurrency(payment.paidAmount)}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 font-medium">
                        {formatCurrency(payment.remainingAmount)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            payment.status
                          )}`}
                        >
                          {payment.status || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {lastHistory ? (
                          <div className="text-xs">
                            <div>Ref: {lastHistory.referenceId || "—"}</div>
                            <div>Amt: {formatCurrency(lastHistory.submittedAmount)}</div>
                            <div>On: {formatDateTime(lastHistory.submissionDate)}</div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No history</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {payment.orderDetails?.orderStatus || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <DropdownMenu
                          onViewDetails={() => openDetailsModal(payment)}
                          onUpdateStatus={() => openVerifyModal(payment)}
                        />
                      </td>
                    </tr>
                  );
                })
              ) : (
                !loading && (
                  <tr>
                    <td className="text-center py-8 text-sm text-gray-500" colSpan={11}>
                      No submitted payments found.
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div className="text-sm">
            Showing {total === 0 ? 0 : startIdx + 1}–
            {Math.min(endIdx, total)} of {total}
          </div>
          <Paginator
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
          />
          <select
            className="border rounded px-2 py-1 text-sm"
            value={pageSize}
            onChange={(e) => {
              setPage(1);
              setPageSize(parseInt(e.target.value, 10));
            }}
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>
                {n} / page
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW DETAILS MODAL */}
      {detailsModal.isOpen && detailsModal.payment && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Payment Details</h2>
              <button onClick={closeDetailsModal} className="p-1 hover:bg-gray-100 rounded">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Payment ID:</span>
                    <p className="text-sm">{detailsModal.payment.paymentId || detailsModal.payment._id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Customer Name:</span>
                    <p className="text-sm">{detailsModal.payment.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Firm Name:</span>
                    <p className="text-sm">
                      {detailsModal.payment.user?.customerDetails?.firmName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">User Code:</span>
                    <p className="text-sm">
                      {detailsModal.payment.user?.customerDetails?.userCode || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <p className="text-sm">{detailsModal.payment.user?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <p className="text-sm">{detailsModal.payment.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Created At:</span>
                    <p className="text-sm">{formatDateTime(detailsModal.payment.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-700">Payment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                    <p className="text-sm font-semibold">
                      {formatCurrency(detailsModal.payment.amount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Paid Amount:</span>
                    <p className="text-sm font-semibold text-green-600">
                      {formatCurrency(detailsModal.payment.paidAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Remaining Amount:</span>
                    <p className="text-sm font-semibold text-red-600">
                      {formatCurrency(detailsModal.payment.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                    <p className="text-sm">
                      {detailsModal.payment.orderDetails?.paymentMethod || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Payment Status:</span>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-1 ${getPaymentStatusColor(
                        detailsModal.payment.status
                      )}`}
                    >
                      {detailsModal.payment.status || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Order Status:</span>
                    <p className="text-sm">
                      {detailsModal.payment.orderDetails?.orderStatus || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              {detailsModal.payment.paymentHistory?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-700">Payment History</h3>
                  <div className="space-y-3">
                    {detailsModal.payment.paymentHistory.map((history, idx) => (
                      <div key={idx} className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="font-medium text-gray-600">Reference ID:</span>{" "}
                            {history.referenceId || "N/A"}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Submitted Amount:</span>{" "}
                            {formatCurrency(history.submittedAmount)}
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Submission Date:</span>{" "}
                            {formatDateTime(history.submissionDate)}
                          </div>
                          {history.notes && (
                            <div className="col-span-2">
                              <span className="font-medium text-gray-600">Notes:</span> {history.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VERIFY PAYMENT MODAL */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Verify Payment</h2>
            <p className="text-sm mb-3 text-gray-600">
              Suggested verified amount:{" "}
              <span className="font-semibold">{formatCurrency(verifyModal.suggestedAmount)}</span>
            </p>

            <label className="block text-sm mb-1 font-medium">Verified Amount</label>
            <input
              type="number"
              className="w-full p-2 border rounded mb-3 text-sm"
              value={verifyForm.verifiedAmount}
              onChange={(e) =>
                setVerifyForm((prev) => ({ ...prev, verifiedAmount: e.target.value }))
              }
            />

            <label className="block text-sm mb-1 font-medium">Verification Notes</label>
            <textarea
              rows="3"
              className="w-full p-2 border rounded mb-3 text-sm"
              placeholder="Optional verification notes..."
              value={verifyForm.verificationNotes}
              onChange={(e) =>
                setVerifyForm((prev) => ({ ...prev, verificationNotes: e.target.value }))
              }
            />

            <label className="block text-sm mb-1 font-medium">Final Status</label>
            <select
              className="w-full p-2 border rounded mb-4 text-sm"
              value={verifyForm.status}
              onChange={(e) => setVerifyForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="verified">Verified</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400" onClick={closeVerifyModal}>
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleVerifyPayment}
              >
                Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmittedPayments;