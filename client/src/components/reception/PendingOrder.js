// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "../ui/alert-dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuTrigger,
// } from "../ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "../ui/dialog";
// import { MoreVertical, X } from "lucide-react";
// import cookies from "js-cookie";
// import Paginator from "../common/Paginator";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API,
// });
// api.interceptors.request.use((config) => {
//   const token = cookies.get("token");
//   if (token) {
//     config.headers.Authorization = token.startsWith("Bearer ")
//       ? token
//       : `Bearer ${token}`;
//   }
//   return config;
// });

// // Toast utility
// const toast = {
//   success: (msg) => console.log("✓", msg),
//   error: (msg) => console.error("✗", msg),
//   warning: (msg) => console.warn("⚠", msg),
// };

// const PendingOrders = () => {
//   const [pendingOrders, setPendingOrders] = useState([]);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [search, setSearch] = useState("");

//   // modals
//   const [priceUpdateModal, setPriceUpdateModal] = useState({
//     isOpen: false,
//     details: [],
//     orderId: null,
//   });
//   const [successDialog, setSuccessDialog] = useState({
//     isOpen: false,
//     message: "",
//   });
//   const [confirmDialog, setConfirmDialog] = useState({
//     isOpen: false,
//     order: null,
//     priceUpdates: [],
//   });
//   const [detailsModal, setDetailsModal] = useState({
//     isOpen: false,
//     order: null,
//   });

//   // pagination
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // fetch orders
//   const fetchPendingOrders = async () => {
//     setLoading(true);
//     try {
//       const response = await api.get("/reception/orders/pending");
//       const pendingOrders = Array.isArray(response.data) ? response.data : (response.data.orders || []);
//       setPendingOrders(pendingOrders);
//     } catch {
//       setError("Error fetching pending orders");
//     } finally {
//       setLoading(false);
//     }
//   };
  
//   useEffect(() => {
//     fetchPendingOrders();
//   }, []);

//   // update order
//   const updateOrderStatus = async (orderId) => {
//     try {
//       const response = await api.patch(`/reception/orders/${orderId}/status`, {
//         status: "processing",
//       });
//       setPendingOrders((prev) => prev.filter((o) => o._id !== orderId));

//       if (response.data.priceUpdated && response.data.priceUpdateDetails) {
//         setPriceUpdateModal({
//           isOpen: true,
//           details: response.data.priceUpdateDetails,
//           orderId,
//         });
//       } else setSuccessDialog({ isOpen: true, message: response.data.message });
//     } catch {
//       setError("Error updating order status");
//     }
//   };

//   const handleMarkAsProcessing = (order) => {
//     if (order.priceUpdated && order.priceUpdateHistory?.length > 0) {
//       setConfirmDialog({
//         isOpen: true,
//         order: order,
//         priceUpdates: order.priceUpdateHistory,
//       });
//     } else {
//       updateOrderStatus(order._id);
//     }
//   };

//   const filteredOrders = pendingOrders.filter((order) => {
//     const s = search.toLowerCase();
//     return (
//       order._id.toLowerCase().includes(s) ||
//       order.orderId?.toLowerCase().includes(s) ||
//       order.user?.name?.toLowerCase().includes(s) ||
//       order.user?.email?.toLowerCase().includes(s) ||
//       order.user?.phoneNumber?.toLowerCase().includes(s) ||
//       order.user?.customerDetails?.firmName?.toLowerCase().includes(s) ||
//       order.user?.customerDetails?.userCode?.toLowerCase().includes(s)
//     );
//   });

//   // pagination logic
//   const total = filteredOrders.length;
//   const startIdx = (page - 1) * pageSize;
//   const endIdx = startIdx + pageSize;
//   const pagedOrders = filteredOrders.slice(startIdx, endIdx);

//   const getPaymentStatusColor = (status) => {
//     const colors = {
//       paid: "text-green-600",
//       pending: "text-yellow-600",
//       failed: "text-red-600",
//       partial: "text-orange-600",
//     };
//     return colors[status?.toLowerCase()] || "text-gray-600";
//   };

//   const formatShippingAddress = (a) => {
//     if (!a) return "N/A";
//     return `${a.address || ""}, ${a.city || ""}, ${a.state || ""} ${a.pinCode || ""}`;
//   };

//   const formatDate = (d) => {
//     if (!d) return "N/A";
//     return new Date(d).toLocaleString("en-IN");
//   };

//   const formatCurrency = (amount) => {
//     return typeof amount === "number" ? `₹${amount.toFixed(2)}` : "N/A";
//   };

//   return (
//     <div className="bg-green-100 min-h-screen p-4">
//       <div className="container mx-auto">
//         <h1 className="text-2xl font-bold text-center mb-6">Pending Orders</h1>

//         {/* Search */}
//         <div className="mb-4 flex justify-end">
//           <input
//             type="text"
//             placeholder="Search orders..."
//             className="px-3 py-2 border rounded w-full sm:w-72 shadow-sm"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//         </div>

//         {/* Error Message */}
//         {error && (
//           <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
//             {error}
//           </div>
//         )}

//         {/* TABLE */}
//         <div className="overflow-y-auto shadow-xl rounded-xl bg-white">
//           <table className="min-w-full text-sm table-auto">
//             <thead className="bg-gray-300 text-gray-700">
//               <tr>
//                 <th className="px-4 py-2">Order ID</th>
//                 <th className="px-4 py-2">User Code</th>
//                 <th className="px-4 py-2">Date & Time</th>
//                 <th className="px-4 py-2">Customer</th>
//                 <th className="px-4 py-2">Phone</th>
//                 <th className="px-4 py-2">Firm Name</th>
//                 <th className="px-4 py-2">Payment Status</th>
//                 <th className="px-4 py-2">Total</th>
//                 <th className="px-4 py-2 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan="10" className="text-center py-8">
//                     <div className="flex justify-center items-center">
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
//                     </div>
//                   </td>
//                 </tr>
//               ) : pagedOrders.length ? (
//                 pagedOrders.map((order) => (
//                   <tr key={order._id} className="border-b hover:bg-gray-50">
//                     <td className="px-4 py-2 font-mono text-xs">
//                       {order.orderId || order._id.slice(-8)}
//                     </td>
//                     <td className="px-4 py-2">
//                       {order.user?.customerDetails?.userCode || "(Misc)"}
//                     </td>
//                     <td className="px-4 py-2">{formatDate(order.createdAt)}</td>
//                     <td className="px-4 py-2">{order.user?.name || "N/A"}</td>
//                     <td className="px-4 py-2">
//                       {order.user?.phoneNumber || "N/A"}
//                     </td>
//                     <td className="px-4 py-2">
//                       {order.user?.customerDetails?.firmName || "N/A"}
//                     </td>
//                     <td className={`px-4 py-2 font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
//                       {order.paymentStatus || "pending"}
//                     </td>
//                     <td className="px-4 py-2">
//                       {formatCurrency(order.totalAmount)}
//                     </td>
//                     <td className="px-4 py-2 text-center">
//                       <DropdownMenu>
//                         <DropdownMenuTrigger className="p-2 rounded hover:bg-gray-200">
//                           <MoreVertical size={18} />
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent>
//                           <DropdownMenuItem
//                             onClick={() =>
//                               setDetailsModal({ isOpen: true, order })
//                             }
//                           >
//                             View Details
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() => handleMarkAsProcessing(order)}
//                           >
//                             Mark as Processing
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </td>
//                   </tr>
//                 ))
//               ) : (
//                 <tr>
//                   <td colSpan="10" className="text-center py-8 text-gray-500">
//                     No pending orders found.
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* PAGINATION */}
//         <div className="mt-4 flex items-center justify-between flex-wrap">
//           <span className="text-sm">
//             Showing {Math.min(total, startIdx + 1)}–{Math.min(total, endIdx)} of{" "}
//             {total}
//           </span>
//           <Paginator
//             page={page}
//             total={total}
//             pageSize={pageSize}
//             onPageChange={setPage}
//           />
//           <select
//             className="border rounded px-2 py-1"
//             value={pageSize}
//             onChange={(e) => {
//               setPage(1);
//               setPageSize(parseInt(e.target.value));
//             }}
//           >
//             {[5, 10, 20, 50].map((n) => (
//               <option key={n} value={n}>
//                 {n} / page
//               </option>
//             ))}
//           </select>
//         </div>
//       </div>

//       {/* VIEW DETAILS MODAL */}
//       {detailsModal.isOpen && detailsModal.order && (
//         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//           <div className="bg-white max-w-4xl w-full mx-4 rounded-lg p-6 shadow-lg max-h-[90vh] overflow-y-auto">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">
//                 Order Details – {detailsModal.order.orderId || detailsModal.order._id}
//               </h2>
//               <button
//                 onClick={() => setDetailsModal({ isOpen: false, order: null })}
//                 className="p-1 hover:bg-gray-100 rounded"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {/* Status Badges */}
//             <div className="flex gap-4 mb-4">
//               <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                 detailsModal.order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' :
//                 detailsModal.order.paymentStatus === 'partial' ? 'bg-orange-100 text-orange-800' :
//                 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 Payment: {detailsModal.order.paymentStatus || 'pending'}
//               </span>
//               <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
//                 detailsModal.order.status === 'delivered' ? 'bg-green-100 text-green-800' :
//                 detailsModal.order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
//                 detailsModal.order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
//                 'bg-yellow-100 text-yellow-800'
//               }`}>
//                 Status: {detailsModal.order.status || 'pending'}
//               </span>
//             </div>

//             {/* Customer Information */}
//             <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded">
//               <div>
//                 <p className="text-sm text-gray-600">Customer Name</p>
//                 <p className="font-medium">{detailsModal.order.user?.name || "N/A"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Firm Name</p>
//                 <p className="font-medium">{detailsModal.order.user?.customerDetails?.firmName || "N/A"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Email</p>
//                 <p className="font-medium">{detailsModal.order.user?.email || "N/A"}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Phone</p>
//                 <p className="font-medium">{detailsModal.order.user?.phoneNumber || "N/A"}</p>
//               </div>
//             </div>

//             {/* Shipping Address */}
//             <div className="mb-4 p-4 bg-gray-50 rounded">
//               <p className="text-sm text-gray-600 mb-1">Shipping Address</p>
//               <p className="font-medium">{formatShippingAddress(detailsModal.order.shippingAddress)}</p>
//             </div>

//             {/* Products */}
//             <h3 className="font-semibold mb-2">Products:</h3>
//             <table className="min-w-full text-sm mb-4">
//               <thead className="bg-gray-200">
//                 <tr>
//                   <th className="px-3 py-2 text-left">Product</th>
//                   <th className="px-3 py-2 text-center">Boxes</th>
//                   <th className="px-3 py-2 text-right">Price/Box</th>
//                   <th className="px-3 py-2 text-right">Total</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {detailsModal.order.products?.map((p, i) => (
//                   <tr key={i} className="border-b">
//                     <td className="px-3 py-2">
//                       {p.product?.name} - {p.product?.category}
//                     </td>
//                     <td className="px-3 py-2 text-center">{p.boxes}</td>
//                     <td className="px-3 py-2 text-right">₹{p.price}</td>
//                     <td className="px-3 py-2 text-right">₹{p.boxes * p.price}</td>
//                   </tr>
//                 ))}
//               </tbody>
//               <tfoot className="bg-gray-100">
//                 <tr>
//                   <td colSpan="3" className="px-3 py-2 text-right font-bold">Total:</td>
//                   <td className="px-3 py-2 text-right font-bold">₹{detailsModal.order.totalAmount}</td>
//                 </tr>
//               </tfoot>
//             </table>

//             {/* Payment History */}
//             {detailsModal.order.paymentStatusHistory?.length > 0 && (
//               <>
//                 <h3 className="font-semibold mb-2">Payment History:</h3>
//                 <div className="space-y-2">
//                   {detailsModal.order.paymentStatusHistory.map((h, idx) => (
//                     <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
//                       <span className="font-medium">{h.status}</span> - {formatDate(h.updatedAt)}
//                     </div>
//                   ))}
//                 </div>
//               </>
//             )}

//             {/* Close Button */}
//             <div className="mt-6 text-right">
//               <button
//                 onClick={() => setDetailsModal({ isOpen: false, order: null })}
//                 className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
//               >
//                 Close
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* CONFIRM PRICE UPDATE MODAL */}
//       <AlertDialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] })}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Price Updated</AlertDialogTitle>
//             <AlertDialogDescription>
//               <div className="space-y-2">
//                 {confirmDialog.priceUpdates.map((p, i) => {
//                   const product = confirmDialog.order?.products?.find(
//                     (item) => item.product?._id === p.product
//                   );
//                   return (
//                     <div key={i} className="p-2 bg-yellow-50 rounded">
//                       <span className="font-medium">{product?.product?.name || "Product"}</span>
//                       <br />
//                       <span className="text-sm">
//                         Price changed from <span className="line-through">₹{p.oldPrice}</span> → <span className="font-bold">₹{p.newPrice}</span>
//                       </span>
//                     </div>
//                   );
//                 })}
//                 <p className="mt-4 text-sm">
//                   Are you sure you want to mark this order as processing with the updated prices?
//                 </p>
//               </div>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
              
//           <AlertDialogFooter>
//             <AlertDialogCancel
//               onClick={() =>
//                 setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] })
//               }
//             >
//               Cancel
//             </AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => {
//                 updateOrderStatus(confirmDialog.order?._id);
//                 setConfirmDialog({ isOpen: false, order: null, priceUpdates: [] });
//               }}
//               className="bg-green-600 hover:bg-green-700"
//             >
//               Confirm
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* SUCCESS DIALOG */}
//       <AlertDialog open={successDialog.isOpen} onOpenChange={(open) => !open && setSuccessDialog({ isOpen: false, message: "" })}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Success</AlertDialogTitle>
//             <AlertDialogDescription>
//               {successDialog.message}
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogAction onClick={() => setSuccessDialog({ isOpen: false, message: "" })}>
//               OK
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// };

// export default PendingOrders;