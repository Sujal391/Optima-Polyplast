// import React, { useState, useEffect } from "react";
// import { FaPlus, FaTrash, FaSearch } from "react-icons/fa";
// import { toast } from "react-toastify";
// import axios from "axios";
// import cookies from "js-cookie";

// const api = axios.create({
//   baseURL: process.env.REACT_APP_API,
// });

// api.interceptors.request.use(
//   (config) => {
//     const token = cookies.get("token");
//     if (token) {
//       config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// const ExtraItemsSelector = ({ onItemsChange, selectedItems = [] }) => {
//   const [products, setProducts] = useState([]);
//   const [filteredProducts, setFilteredProducts] = useState([]);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [extraItems, setExtraItems] = useState(selectedItems);

//   useEffect(() => {
//     fetchProducts();
//   }, []);

//   const fetchProducts = async () => {
//     try {
//       setLoading(true);
//       const response = await api.get("dispatch/products");
//       setProducts(response.data.products || []);
//       setFilteredProducts(response.data.products || []);
//     } catch (error) {
//       toast.error("Error fetching products");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSearch = (term) => {
//     setSearchTerm(term);
//     const filtered = products.filter((p) =>
//       p.name.toLowerCase().includes(term.toLowerCase())
//     );
//     setFilteredProducts(filtered);
//   };

//   const addItem = (product) => {
//     const newItem = {
//       productId: product._id,
//       productName: product.name,
//       productCategory: product.category,
//       productBottlesPerBox: product.bottlesPerBox,
//       quantity: 1,
//       rate: product.price || 0,
//     };
//     const updated = [...extraItems, newItem];
//     setExtraItems(updated);
//     onItemsChange(updated);
//     setSearchTerm("");
//   };

//   const removeItem = (index) => {
//     const updated = extraItems.filter((_, i) => i !== index);
//     setExtraItems(updated);
//     onItemsChange(updated);
//   };

//   const updateItemQuantity = (index, quantity) => {
//     const updated = [...extraItems];
//     updated[index].quantity = Math.max(1, parseInt(quantity) || 1);
//     setExtraItems(updated);
//     onItemsChange(updated);
//   };

//   const updateItemRate = (index, rate) => {
//     const updated = [...extraItems];
//     updated[index].rate = Math.max(0, parseFloat(rate) || 0);
//     setExtraItems(updated);
//     onItemsChange(updated);
//   };

//   return (
//     <div className="space-y-4">
//       <div>
//         <label className="block text-gray-700 font-semibold mb-2">Search & Add Products</label>
//         <div className="relative">
//           <FaSearch className="absolute left-3 top-3 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search products..."
//             value={searchTerm}
//             onChange={(e) => handleSearch(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//         {searchTerm && filteredProducts.length > 0 && (
//           <div className="mt-2 border rounded-md max-h-48 overflow-y-auto bg-white shadow-lg">
//             {filteredProducts.map((product) => (
//               <div
//                 key={product._id}
//                 className="p-3 border-b hover:bg-gray-50 flex justify-between items-center cursor-pointer"
//               >
//                 <div>
//                   <p className="font-medium">{product.name} - {product.category}</p>
//                   <p className="text-sm text-gray-600">₹{product.price || 0} , {product.bottlesPerBox} Bottles per Box</p>
//                 </div>
//                 <button
//                   onClick={() => addItem(product)}
//                   className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//                 >
//                   <FaPlus />
//                 </button>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {extraItems.length > 0 && (
//         <div>
//           <label className="block text-gray-700 font-semibold mb-2">Selected Extra Items</label>
//           <div className="space-y-2">
//             {extraItems.map((item, index) => (
//               <div key={index} className="flex gap-2 items-center bg-gray-50 p-3 rounded-md">
//                 <div className="flex-1">
//                   {item.productName} - <span>{item.productCategory}</span>
//                   <p className="text-sm text-gray-600">₹{item.rate || 0} , {item.bottlesPerBox} Bottles per Box</p>
//                 </div>
//                 <div className="flex flex-col items-center">
//                 <label className="text-xs text-gray-600 mb-1">Quantity</label>
//                 <input
//                   type="number"
//                   min="1"
//                   value={item.quantity}
//                   onChange={(e) => updateItemQuantity(index, e.target.value)}
//                   placeholder="Qty"
//                   className="w-20 p-2 border rounded text-center"
//                 />
//                 </div>
//                 <div className="flex flex-col items-center">
//                 <label className="text-xs text-gray-600 mb-1">Rate (₹)</label>
//                 <input
//                   type="number"
//                   min="0"
//                   step="0.01"
//                   value={item.rate}
//                   onChange={(e) => updateItemRate(index, e.target.value)}
//                   placeholder="Rate"
//                   className="w-24 p-2 border rounded text-center"
//                 />
//                 </div>
//                 <button
//                   onClick={() => removeItem(index)}
//                   className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
//                 >
//                   <FaTrash />
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default ExtraItemsSelector;

