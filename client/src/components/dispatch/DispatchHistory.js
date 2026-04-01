import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from 'js-cookie';
import {
  Loader2, Search, X, History, ChevronUp, ChevronDown, PackageSearch,
  FileText, Truck, Receipt, MapPin
} from "lucide-react";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../ui/table";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogFooter } from "../ui/dialog";
import Paginator from '../common/Paginator';

const api = axios.create({
  baseURL: process.env.REACT_APP_API,
});

api.interceptors.request.use(
  (request) => {
    const token = cookies.get("token");
    if (token) {
      request.headers.Authorization = token.startsWith("Bearer ")
        ? token
        : `Bearer ${token}`;
    }
    return request;
  },
  (error) => Promise.reject(error)
);

const DispatchComponent = () => {
  const [orderHistory, setOrderHistory] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Separate challans dialog state
  const [challansOrder, setChallansOrder] = useState(null);
  const [isChallansOpen, setIsChallansOpen] = useState(false);
  const [challans, setChallans] = useState([]);
  const [challansLoading, setChallansLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [expandedRow, setExpandedRow] = useState(null);

  const fetchOrderHistory = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/dispatch/order-history");
      setOrderHistory(response.data?.orders || []);
      setFilteredOrders(response.data?.orders || []);
    } catch (error) {
      console.error("Error fetching order history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    setPage(1); // Reset to first page on search

    if (!term.trim()) {
      setFilteredOrders(orderHistory);
      return;
    }

    const searchTermLower = term.toLowerCase().trim();

    const filtered = orderHistory.filter(order => {
      const searchableFields = {
        orderId: order.orderId || '',
        customerName: order.user?.name || '',
        phoneNumber: order.user?.phoneNumber || '',
        firmName: order.firmName || order.user?.customerDetails?.firmName || '',
        shippingAddress: order.shippingAddress && typeof order.shippingAddress === 'object'
          ? `${order.shippingAddress.address}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pinCode}`
          : order.shippingAddress || '',
        userCode: order.user?.customerDetails?.userCode || '',
        orderStatus: order.orderStatus || '',
        paymentStatus: order.paymentStatus || '',
        paymentMethod: order.paymentMethod || '',
        products: order.products.map(item => item.product?.name || '').join(' '),
        orderSource: order.orderSource || '',
        totalAmountWithDelivery: order.totalAmountWithDelivery?.toString() || '',
        createdBy: order.createdByReception?.name || ''
      };

      if (searchField === 'all') {
        return Object.values(searchableFields).some(value =>
          value.toLowerCase().includes(searchTermLower)
        );
      } else {
        const fieldValue = searchableFields[searchField] || '';
        return fieldValue.toLowerCase().includes(searchTermLower);
      }
    });

    setFilteredOrders(filtered);
  };

  const handleSearchFieldChange = (e) => {
    setSearchField(e.target.value);
    if (searchTerm) {
      handleSearch(searchTerm);
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilteredOrders(orderHistory);
    setPage(1);
  };

  const fetchChallans = async (orderId) => {
    setChallansLoading(true);
    setChallans([]);
    try {
      const res = await api.get(`/dispatch/challans/order/${orderId}`);
      setChallans(res.data?.challans || []);
    } catch (err) {
      console.error("Error fetching challans:", err);
    } finally {
      setChallansLoading(false);
    }
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const openChallansModal = (order) => {
    setChallansOrder(order);
    setIsChallansOpen(true);
    fetchChallans(order._id);
  };

  const closeChallansModal = () => {
    setChallansOrder(null);
    setIsChallansOpen(false);
    setChallans([]);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const calculateTotalBoxes = (products) => {
    return products.reduce((sum, item) => sum + (item.boxes || 0), 0);
  };

  const formatCurrency = (amt) => (amt !== undefined && amt !== null) ? `₹${Number(amt).toLocaleString("en-IN")}` : 'N/A';

  const getStatusColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'approved_by_sales') return "bg-blue-100 text-blue-700 border-blue-200";
    if (s === 'processing' || s === 'confirmed') return "bg-indigo-100 text-indigo-700 border-indigo-200";
    if (s === 'shipped') return "bg-green-100 text-green-700 border-green-200";
    if (s === 'delivered') return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if (s === 'cancelled' || s === 'rejected_by_sales') return "bg-red-100 text-red-700 border-red-200";
    return "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getPaymentColor = (status) => {
    const s = status?.toLowerCase() || '';
    if (s === 'completed' || s === 'paid') return "bg-green-100 text-green-700 border-green-200";
    if (s === 'pending') return "bg-yellow-100 text-yellow-700 border-yellow-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  // Pagination Logic
  const total = filteredOrders.length;
  const startIdx = (page - 1) * pageSize;
  const pagedOrders = filteredOrders.slice(startIdx, startIdx + pageSize);

  const handleRowExpand = (orderId) => {
    setExpandedRow(expandedRow === orderId ? null : orderId);
  };

  const renderMobileOrderCard = (order) => (
    <div key={order._id} className="p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
            {order.orderId || "N/A"}
          </span>
          <p className="font-medium text-gray-900 mt-1">{order.firmName || order.user?.customerDetails?.firmName || "N/A"}</p>
          <p className="text-sm text-gray-500">{order.user?.name} | {order.user?.phoneNumber}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-bold text-gray-900">{formatCurrency(order.totalAmountWithGST || order.totalAmountWithDelivery || order.totalAmount)}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mt-0.5">{order.paymentMethod || "COD"}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-3 font-medium">
        <span>{calculateTotalBoxes(order.products)} Boxes total</span>
        <span>{formatDate(order.createdAt)}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
        <div className="flex flex-col gap-1.5 items-start">
          <Badge variant="outline" className={`text-[10px] px-2 py-0 uppercase tracking-wider ${getStatusColor(order.orderStatus)}`}>
            {order.orderStatus || "unknown"}
          </Badge>
          <Badge variant="outline" className={`text-[10px] px-2 py-0 uppercase tracking-wider ${getPaymentColor(order.paymentStatus)}`}>
            {order.paymentStatus || "pending"}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleRowExpand(order._id)} className="h-8 px-2 text-xs border-gray-200 text-gray-600">
            {expandedRow === order._id ? (
              <><ChevronUp className="h-3 w-3 mr-1" /> Less</>
            ) : (
              <><ChevronDown className="h-3 w-3 mr-1" />More</>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => openChallansModal(order)} className="h-8 px-2 text-xs border-green-200 text-green-700 hover:bg-green-50">
            <Truck className="h-3 w-3 mr-1" />Challans
          </Button>
          <Button size="sm" onClick={() => openModal(order)} className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 font-medium">
            Details
          </Button>
        </div>
      </div>

      {expandedRow === order._id && (
        <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-3">
          <p className="text-xs font-semibold text-gray-700 mb-2 border-b border-gray-200 pb-1">Products Summary:</p>
          <ul className="space-y-1.5">
            {order.products.map((item, index) => (
              <li key={index} className="flex justify-between text-xs text-gray-600">
                <span className="truncate pr-2">{item.product?.name || "N/A"}</span>
                <span className="font-semibold text-gray-800 shrink-0">{item.boxes} x {formatCurrency(item.price)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-green-100 text-green-700 rounded-xl">
                <History className="h-6 w-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dispatch History</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Archived records and historical dispatches. {total > 0 && `${total} orders found.`}
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative w-full md:w-96 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <label htmlFor="searchField" className="text-sm font-medium text-gray-600 shrink-0">
              Filter By:
            </label>
            <select
              id="searchField"
              value={searchField}
              onChange={handleSearchFieldChange}
              className="w-full md:w-48 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium text-gray-700"
            >
              <option value="all">All Fields</option>
              <option value="orderId">Order ID</option>
              <option value="customerName">Customer Name</option>
              <option value="phoneNumber">Phone Number</option>
              <option value="firmName">Firm Name</option>
              <option value="orderStatus">Order Status</option>
              <option value="paymentStatus">Payment Status</option>
              <option value="paymentMethod">Payment Method</option>
            </select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="font-semibold text-gray-600">Order ID</TableHead>
                  <TableHead className="font-semibold text-gray-600">Date Issued</TableHead>
                  <TableHead className="font-semibold text-gray-600">Company / Caller</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">Status</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">Payment</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-center">Total Box</TableHead>
                  <TableHead className="font-semibold text-gray-600 text-right">Valuation</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center border-0">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                        <span className="text-sm font-medium">Fetching dispatch history...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : pagedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-48 text-center border-0">
                      <div className="inline-flex flex-col items-center justify-center text-gray-400 space-y-2">
                        <PackageSearch className="h-8 w-8 text-gray-300" />
                        <span className="text-lg font-medium text-gray-500">No history records found</span>
                        {searchTerm && <span className="text-sm">Try adjusting your filters or search term.</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedOrders.map((order) => (
                    <TableRow key={order._id} className="hover:bg-green-50/40 transition-colors">
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {order.orderId || "N/A"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600 font-medium">
                          {formatDate(order.createdAt)}
                        </span>
                        <p className="text-[10px] text-gray-400 mt-0.5">By {order.createdByReception?.name || "System"}</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{order.firmName || order.user?.customerDetails?.firmName || "N/A"}</span>
                          <span className="text-gray-500 text-xs mt-0.5">{order.user?.name || "N/A"} • {order.user?.customerDetails?.userCode || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`uppercase tracking-wider text-[10px] ${getStatusColor(order.orderStatus)}`}>
                          {order.orderStatus || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge variant="outline" className={`uppercase tracking-wider text-[10px] ${getPaymentColor(order.paymentStatus)}`}>
                            {order.paymentStatus || "pending"}
                          </Badge>
                          <span className="text-[10px] uppercase font-bold text-gray-400">{order.paymentMethod || "COD"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="inline-block bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">
                          {calculateTotalBoxes(order.products)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-bold text-gray-900">{formatCurrency(order.totalAmountWithDelivery || order.totalAmountWithDelivery || order.totalAmount)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openChallansModal(order)}
                            className="h-8 text-green-600 hover:text-green-800 hover:bg-green-50 font-medium"
                          >
                            <Truck className="h-3.5 w-3.5 mr-1" />Challans
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openModal(order)}
                            className="h-8 text-blue-600 hover:text-blue-800 hover:bg-blue-50 font-medium"
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="block lg:hidden divide-y divide-gray-100">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2">
                <Loader2 className="h-6 w-6 animate-spin text-green-500" />
                <span className="text-sm">Fetching history...</span>
              </div>
            ) : pagedOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 space-y-2 p-4 text-center">
                <PackageSearch className="h-8 w-8 text-gray-300 mb-2" />
                <span className="text-sm">No history records found</span>
              </div>
            ) : (
              pagedOrders.map(renderMobileOrderCard)
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
        </div>
      </div>

      {/* Details Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !open && closeModal()}>
        {selectedOrder && (
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-gray-50 flex flex-col gap-0 max-h-[90vh]">
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 text-white shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight">Order Details Record</h2>
                <p className="text-green-100 text-sm mt-0.5">#{selectedOrder.orderId}</p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-full hover:bg-white/20 transition-colors hidden sm:block">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto space-y-6">

              {/* Summary Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Status</p>
                  <Badge variant="outline" className={`uppercase tracking-wider ${getStatusColor(selectedOrder.orderStatus)}`}>
                    {selectedOrder.orderStatus}
                  </Badge>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Payment</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.paymentMethod} <span className={`text-[10px] px-1.5 py-0.5 ml-1 rounded-sm uppercase tracking-wider ${getPaymentColor(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span></p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Date Logged</p>
                  <p className="font-semibold text-gray-900 text-sm">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Source</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.orderSource || "System Entry"}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Customer Info Box */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                    <FileText className="h-4 w-4 text-gray-500" /> Customer Fact Sheet
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500 font-medium">Firm Name</span>
                      <span className="font-semibold text-gray-900 text-sm text-right">{selectedOrder.firmName || selectedOrder.user?.customerDetails?.firmName || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500 font-medium">Contact Person</span>
                      <span className="font-semibold text-gray-900 text-sm text-right">{selectedOrder.user?.name || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500 font-medium">Phone</span>
                      <span className="font-semibold text-gray-900 text-sm text-right w-1/2 break-words">{selectedOrder.user?.phoneNumber || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500 font-medium">Email</span>
                      <span className="font-semibold text-gray-900 text-sm text-right w-1/2 break-words">{selectedOrder.user?.email || "N/A"}</span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-xs text-gray-500 font-medium">User Code</span>
                      <span className="font-semibold text-gray-900 text-sm text-right">{selectedOrder.user?.customerDetails?.userCode || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping info */}
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                    <FileText className="h-4 w-4 text-gray-500" /> Dispatch Destination
                  </h4>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 h-28 flex items-center justify-center text-center">
                    {selectedOrder.shippingAddress ? (
                      <div>
                        {typeof selectedOrder.shippingAddress === 'object' ? (
                          <>
                            <p className="font-bold text-gray-800 text-sm">{selectedOrder.shippingAddress.address}</p>
                            <p className="text-gray-500 text-sm mt-1">
                              {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pinCode}
                            </p>
                          </>
                        ) : (
                          <p className="font-medium text-gray-700 text-sm">{selectedOrder.shippingAddress}</p>
                        )}
                      </div>
                    ) : (<span className="text-gray-400">No Address Validated</span>)}
                  </div>
                </div>
              </div>

              {/* Items Breakdown */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                  <h4 className="text-sm font-bold text-gray-800">Historical Item Ledger</h4>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-transparent hover:bg-transparent">
                        <TableHead className="font-semibold text-gray-600">Spec</TableHead>
                        <TableHead className="font-semibold text-gray-600 text-center">Boxes Disp.</TableHead>
                        <TableHead className="font-semibold text-gray-600 text-right">Unit Rate</TableHead>
                        <TableHead className="font-semibold text-gray-600 text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.products.map((item, index) => (
                        <TableRow key={item._id || index}>
                          <TableCell>
                            <p className="font-medium text-gray-900">{item.product?.name || "N/A"}</p>
                            <p className="text-[10px] text-gray-500">{item.product?.category || "N/A"}</p>
                          </TableCell>
                          <TableCell className="text-center font-semibold text-gray-800">{item.boxes}</TableCell>
                          <TableCell className="text-right text-gray-600 text-sm">{formatCurrency(item.price)}</TableCell>
                          <TableCell className="text-right font-bold text-gray-900 text-sm">{formatCurrency(item.boxes * item.price)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Modal Footer Aggregates */}
                <div className="bg-gray-50/80 p-5 border-t border-gray-200 flex flex-col items-end space-y-2">
                  <div className="flex justify-between w-full max-w-xs text-sm">
                    <span className="text-gray-600 font-medium">Subtotal Net:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.amount || selectedOrder.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs text-sm">
                    <span className="text-gray-600 font-medium">GST:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.gst)}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs text-sm">
                    <span className="text-gray-600 font-medium">Total with GST:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.totalAmountWithGST || ((selectedOrder.amount || selectedOrder.totalAmount || 0) + (selectedOrder.gst || 0)))}</span>
                  </div>
                  <div className="flex justify-between w-full max-w-xs text-sm">
                    <span className="text-gray-600 font-medium">Delivery Charge:</span>
                    <span className="font-semibold text-gray-900">{formatCurrency(selectedOrder.deliveryCharge)}</span>
                  </div>
                  <div className="border-t border-gray-200 w-full max-w-xs my-2"></div>
                  <div className="flex justify-between w-full max-w-xs text-base">
                    <span className="text-gray-800 font-bold uppercase tracking-wider">Grand Total:</span>
                    <span className="font-bold text-green-700">{formatCurrency(selectedOrder.totalAmountWithDelivery || selectedOrder.totalAmountWithGST || selectedOrder.totalAmount)}</span>
                  </div>
                </div>
              </div>

            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-gray-200 shrink-0">
              <Button onClick={closeModal} variant="outline" className="w-full sm:w-auto">
                Dismiss View
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* ── Separate Challans Dialog ──────────────────────────────── */}
      <Dialog open={isChallansOpen} onOpenChange={(open) => !open && closeChallansModal()}>
        {challansOrder && (
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-gray-50 flex flex-col gap-0 max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 p-5 text-white shrink-0 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Truck className="h-5 w-5" /> Challans
                </h2>
                <p className="text-green-100 text-sm mt-0.5">#{challansOrder.orderId} · {challansOrder.firmName || challansOrder.user?.customerDetails?.firmName}</p>
              </div>
              <button onClick={closeChallansModal} className="p-1 rounded-full hover:bg-white/20 transition-colors hidden sm:block">
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {challansLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Loader2 className="h-7 w-7 animate-spin text-green-500" />
                  <span className="text-sm">Loading challans...</span>
                </div>
              ) : challans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
                  <Receipt className="h-12 w-12 opacity-30" />
                  <p className="font-medium">No challans generated for this order.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {challans.map((challan, ci) => (
                    <div key={challan.challanId} className="p-5 sm:p-6 space-y-4 bg-white">

                      {/* Challan Header row */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Challan {ci + 1}</span>
                            <span className="font-mono text-xs font-bold bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded">
                              {challan.invoiceNo || challan.dcNo}
                            </span>
                            <Badge variant="outline" className="uppercase tracking-wider text-[10px] bg-blue-50 text-blue-700 border-blue-200">
                              {challan.status}
                            </Badge>
                            <Badge variant="outline" className="uppercase tracking-wider text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                              {challan.deliveryChoice === 'homeDelivery' ? 'Home Delivery' : challan.deliveryChoice}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500">
                            Issued: {formatDate(challan.challanDate)}
                            {challan.scheduledDate && (
                              <> · Scheduled: {new Date(challan.scheduledDate).toLocaleDateString('en-IN')}</>
                            )}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold">Grand Total</p>
                          <p className="text-xl font-bold text-green-700">{formatCurrency(challan.totalAmountWithDelivery)}</p>
                        </div>
                      </div>

                      {/* Driver + Address */}
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-2">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Driver Info</p>
                          {[['Driver', challan.driverName], ['Vehicle', challan.vehicleNo], ['Mobile', challan.mobileNo], challan.userCode && ['User Code', challan.userCode]].filter(Boolean).map(([lbl, val]) => (
                            <div key={lbl} className="flex justify-between">
                              <span className="text-gray-500">{lbl}</span>
                              <span className="font-semibold text-gray-800">{val || 'N/A'}</span>
                            </div>
                          ))}
                        </div>

                        {challan.shippingAddress && (
                          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Delivery Address
                            </p>
                            <p className="font-semibold text-gray-800">{challan.shippingAddress.address}</p>
                            <p className="text-gray-500">{challan.shippingAddress.city}, {challan.shippingAddress.state} – {challan.shippingAddress.pinCode}</p>
                          </div>
                        )}
                      </div>

                      {/* Items table */}
                      <div className="overflow-x-auto rounded-xl border border-gray-100">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-green-600 hover:bg-green-600">
                              <TableHead className="font-semibold text-white text-sm">Product</TableHead>
                              <TableHead className="font-semibold text-white text-center text-sm">Boxes</TableHead>
                              <TableHead className="font-semibold text-white text-right text-sm">Rate</TableHead>
                              <TableHead className="font-semibold text-white text-right text-sm">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {challan.items.map((item, idx) => (
                              <TableRow key={idx} className="hover:bg-green-50/30">
                                <TableCell>
                                  <span className="font-medium text-gray-900">{item.productName}</span>
                                  {item.isExtraItem && (
                                    <Badge variant="outline" className="ml-2 text-[9px] bg-orange-50 text-orange-600 border-orange-200">Extra</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-center font-semibold text-gray-800">{item.boxes}</TableCell>
                                <TableCell className="text-right text-gray-600 text-sm">{formatCurrency(item.rate)}</TableCell>
                                <TableCell className="text-right font-bold text-gray-900">{formatCurrency(item.amount)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Totals */}
                      <div className="flex justify-end">
                        <div className="w-full max-w-[260px] space-y-1.5 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(challan.totalAmount)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">GST (5%)</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(challan.gst)}</span>
                          </div>
                          <div className="flex justify-between font-medium">
                            <span className="text-gray-700">Total with GST</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(challan.totalAmountWithGST)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Delivery Charge</span>
                            <span className="font-semibold text-gray-900">{formatCurrency(challan.deliveryCharge)}</span>
                          </div>
                          <div className="border-t border-gray-200 pt-1.5 flex justify-between text-base font-bold">
                            <span className="text-gray-800">Grand Total</span>
                            <span className="text-green-700">{formatCurrency(challan.totalAmountWithDelivery)}</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="px-6 py-4 bg-white border-t border-gray-200 shrink-0">
              <Button onClick={closeChallansModal} variant="outline" className="w-full sm:w-auto">
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
};

export default DispatchComponent;