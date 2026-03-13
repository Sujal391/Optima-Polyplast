import React, { useState, useEffect } from "react";
import axios from "axios";
import cookies from 'js-cookie';

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

  const fetchOrderHistory = async () => {
    try {
      const response = await api.get("/dispatch/order-history");
      setOrderHistory(response.data?.orders || []);
      setFilteredOrders(response.data?.orders || []);
    } catch (error) {
      console.error("Error fetching order history:", error);
    }
  };

  useEffect(() => {
    fetchOrderHistory();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    
    if (!term.trim()) {
      setFilteredOrders(orderHistory);
      return;
    }

    const searchTermLower = term.toLowerCase().trim();
    
    const filtered = orderHistory.filter(order => {
      const getValue = (obj, path) => {
        return path.split('.').reduce((current, key) => {
          return current && current[key] !== undefined ? current[key] : '';
        }, obj);
      };

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
  };

  const openModal = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setIsModalOpen(false);
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const calculateTotalBoxes = (products) => {
    return products.reduce((sum, item) => sum + (item.boxes || 0), 0);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-3xl font-semibold mb-4 text-green-600">Dispatch History</h2>
        
        {/* Search Section */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <input
                type="text"
                placeholder="Search across all fields..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="searchField" className="text-gray-700 font-medium">
              Search in:
            </label>
            <select
              id="searchField"
              value={searchField}
              onChange={handleSearchFieldChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Fields</option>
              <option value="orderId">Order ID</option>
              <option value="customerName">Customer Name</option>
              <option value="phoneNumber">Phone Number</option>
              <option value="firmName">Firm Name</option>
              <option value="userCode">User Code</option>
              <option value="orderStatus">Order Status</option>
              <option value="paymentStatus">Payment Status</option>
              <option value="paymentMethod">Payment Method</option>
              <option value="createdBy">Created By</option>
            </select>
          </div>
          
          {searchTerm && (
            <div className="text-sm text-gray-600">
              Found {filteredOrders.length} {filteredOrders.length === 1 ? 'result' : 'results'}
            </div>
          )}
        </div>

        {/* Orders Table - Only Important Columns */}
        {filteredOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200">
                  <th className="py-2 px-4 border-b">Order ID</th>
                  <th className="py-2 px-4 border-b">Date</th>
                  <th className="py-2 px-4 border-b">Customer</th>
                  <th className="py-2 px-4 border-b">Firm Name</th>
                  <th className="py-2 px-4 border-b">Total Boxes</th>
                  <th className="py-2 px-4 border-b">Total Amount</th>
                  <th className="py-2 px-4 border-b">Order Status</th>
                  <th className="py-2 px-4 border-b">Payment</th>
                  <th className="py-2 px-4 border-b">Created By</th>
                  <th className="py-2 px-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="border hover:bg-gray-50">
                    <td className="py-2 px-4 border-b font-medium">{order.orderId || "N/A"}</td>
                    <td className="py-2 px-4 border-b">{formatDate(order.createdAt)}</td>
                    <td className="py-2 px-4 border-b">
                      <div>{order.user?.name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{order.user?.phoneNumber || ""}</div>
                    </td>
                    <td className="py-2 px-4 border-b">{order.firmName || order.user?.customerDetails?.firmName || "N/A"}</td>
                    <td className="py-2 px-4 border-b text-center font-medium">{calculateTotalBoxes(order.products)}</td>
                    <td className="py-2 px-4 border-b font-medium">₹{order.totalAmountWithDelivery?.toLocaleString()}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                        order.orderStatus?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                        order.orderStatus?.toLowerCase() === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                        order.orderStatus?.toLowerCase() === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                          order.paymentStatus?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {order.paymentStatus}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">{order.paymentMethod}</div>
                      </div>
                    </td>
                    <td className="py-2 px-4 border-b">
                      {order.createdByReception?.name || "System"}
                    </td>
                    <td className="py-2 px-4 border-b">
                      <button
                        onClick={() => openModal(order)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            {searchTerm ? (
              <p className="text-gray-500">No results found for "{searchTerm}"</p>
            ) : (
              <p className="text-gray-500">No order history available.</p>
            )}
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-semibold text-green-600">Order Details</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>

              {/* Order Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Order ID</p>
                  <p className="font-medium">{selectedOrder.orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Status</p>
                  <p className="font-medium">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      selectedOrder.orderStatus?.toLowerCase() === 'delivered' ? 'bg-green-100 text-green-800' :
                      selectedOrder.orderStatus?.toLowerCase() === 'shipped' ? 'bg-blue-100 text-blue-800' :
                      selectedOrder.orderStatus?.toLowerCase() === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedOrder.orderStatus}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Order Source</p>
                  <p className="font-medium">{selectedOrder.orderSource || "N/A"}</p>
                </div>
              </div>

              {/* Customer Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Customer Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.user?.name || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone Number</p>
                    <p className="font-medium">{selectedOrder.user?.phoneNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedOrder.user?.email || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Firm Name</p>
                    <p className="font-medium">{selectedOrder.firmName || selectedOrder.user?.customerDetails?.firmName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">User Code</p>
                    <p className="font-medium">{selectedOrder.user?.customerDetails?.userCode || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {selectedOrder.shippingAddress && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold mb-2 text-gray-700">Shipping Address</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    {typeof selectedOrder.shippingAddress === 'object' ? (
                      <>
                        <p className="font-medium">{selectedOrder.shippingAddress.address}</p>
                        <p className="text-gray-600">
                          {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pinCode}
                        </p>
                      </>
                    ) : (
                      <p className="font-medium">{selectedOrder.shippingAddress}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Products</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 border text-left">Product</th>
                        <th className="py-2 px-4 border text-left">Type</th>
                        <th className="py-2 px-4 border text-left">Category</th>
                        <th className="py-2 px-4 border text-right">Boxes</th>
                        <th className="py-2 px-4 border text-right">Price/Box</th>
                        <th className="py-2 px-4 border text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.products.map((item, index) => (
                        <tr key={item._id || index}>
                          <td className="py-2 px-4 border">{item.product?.name || "N/A"}</td>
                          <td className="py-2 px-4 border">{item.product?.type || selectedOrder.type || "N/A"}</td>
                          <td className="py-2 px-4 border">{item.product?.category || "N/A"}</td>
                          <td className="py-2 px-4 border text-right">{item.boxes}</td>
                          <td className="py-2 px-4 border text-right">₹{item.price}</td>
                          <td className="py-2 px-4 border text-right font-medium">₹{(item.boxes * item.price).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="py-2 px-4 border text-right font-semibold">Subtotal:</td>
                        <td className="py-2 px-4 border text-right font-semibold">₹{selectedOrder.totalAmount?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="py-2 px-4 border text-right font-semibold">Delivery Charge:</td>
                        <td className="py-2 px-4 border text-right font-semibold">₹{selectedOrder.deliveryCharge?.toLocaleString()}</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td colSpan="5" className="py-2 px-4 border text-right font-semibold text-lg">Total Amount:</td>
                        <td className="py-2 px-4 border text-right font-semibold text-lg text-green-600">₹{selectedOrder.totalAmountWithDelivery?.toLocaleString()}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Payment Information */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-2 text-gray-700">Payment Information</h4>
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Status</p>
                    <p className="font-medium">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedOrder.paymentStatus?.toLowerCase() === 'paid' ? 'bg-green-100 text-green-800' :
                        selectedOrder.paymentStatus?.toLowerCase() === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {selectedOrder.paymentStatus}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Created By */}
              {selectedOrder.createdByReception && (
                <div className="mb-4">
                  <h4 className="text-lg font-semibold mb-2 text-gray-700">Created By</h4>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium">{selectedOrder.createdByReception.name}</p>
                  </div>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={closeModal}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DispatchComponent;