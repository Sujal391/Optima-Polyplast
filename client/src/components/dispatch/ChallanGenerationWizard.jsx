import React, { useState, useEffect } from "react";
import { FaArrowLeft, FaArrowRight, FaCheck, FaTimes, FaExclamationTriangle, FaEdit, FaSave, FaUndo, FaPlus, FaTrash, FaTruck } from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
import cookies from "js-cookie";

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

const ChallanGenerationWizard = ({ order, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // --- Order products edit state with price support ---
  const [orderProducts, setOrderProducts] = useState(
    order?.products?.map((p) => ({
      productId: p.product?._id || p.productId,
      productName: p.product?.name || p.productName || "N/A",
      productCategory: p.product?.category || "N/A",
      boxes: p.boxes,
      originalBoxes: p.boxes,
      pricePerBox: p.pricePerBox || p.product?.price || 0, // Use existing price or product price
      originalPrice: p.pricePerBox || p.product?.price || 0, // Store original price for comparison
      isNew: false,
    })) || []
  );
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderEdited, setOrderEdited] = useState(false);

  // --- Delivery Charge State (from PendingOrders) ---
  const [deliveryCharge, setDeliveryCharge] = useState({
    perBox: order?.deliveryChargePerBox || 0,
    total: order?.deliveryCharge || 0,
    isSet: order?.deliveryChargePerBox ? true : false,
    loading: false,
    error: ""
  });

  // Recompute total from (possibly edited) orderProducts
  const totalOrderQty = orderProducts.reduce((acc, p) => acc + (p.boxes || 0), 0);
  const totalOrderValue = orderProducts.reduce((acc, p) => acc + ((p.boxes || 0) * (p.pricePerBox || 0)), 0);

  // Update total delivery charge when perBox rate or quantity changes
  useEffect(() => {
    if (deliveryCharge.perBox > 0) {
      const total = deliveryCharge.perBox * totalOrderQty;
      setDeliveryCharge(prev => ({
        ...prev,
        total: total
      }));
    } else {
      setDeliveryCharge(prev => ({
        ...prev,
        total: 0
      }));
    }
  }, [deliveryCharge.perBox, totalOrderQty]);

  const [wizardData, setWizardData] = useState({
    splitInfo: {
      numberOfChallans: 1,
      quantities: [totalOrderQty],
    },
    scheduledDates: [""],
    deliveryChoice: "homeDelivery",
    shippingAddress: {
      address: order?.user?.customerDetails?.address || "",
      city: order?.user?.customerDetails?.city || "",
      state: order?.user?.customerDetails?.state || "",
      pinCode: order?.user?.customerDetails?.pinCode || "",
    },
    vehicleDetails: [
      {
        vehicleNo: "",
        driverName: "",
        mobileNo: order?.user?.customerDetails?.phone || "",
      },
    ],
    receiverName: order?.firmName || order?.user?.name || "",
    // Add delivery charge to wizard data for final submission
    deliveryChargePerBox: deliveryCharge.perBox,
    deliveryChargeTotal: deliveryCharge.total
  });

  const [quantityWarning, setQuantityWarning] = useState("");

  const steps = [
    { title: "Edit Order", description: "Modify order products, quantities & prices" },
    { title: "Delivery Charge", description: "Add delivery charge per box" },
    { title: "Challan Generation", description: "Split order & delivery details" },
  ];

  // Fetch available products when editing starts
  useEffect(() => {
    if (isEditingOrder) {
      fetchAvailableProducts();
    }
  }, [isEditingOrder]);

  // Update wizardData when delivery charge changes
  useEffect(() => {
    setWizardData(prev => ({
      ...prev,
      deliveryChargePerBox: deliveryCharge.perBox,
      deliveryChargeTotal: deliveryCharge.total
    }));
  }, [deliveryCharge.perBox, deliveryCharge.total]);

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      const response = await api.get("/dispatch/products");
      
      // Ensure response.data is an array
      const products = Array.isArray(response.data) ? response.data : 
                      (response.data?.data && Array.isArray(response.data.data)) ? response.data.data :
                      response.data?.products && Array.isArray(response.data.products) ? response.data.products :
                      [];
      
      setAvailableProducts(products);
      
      if (products.length === 0) {
        setProductsError("No products available");
      }
    } catch (error) {
      setProductsError("Failed to fetch products");
      toast.error("Failed to fetch products");
      console.error("Error fetching products:", error);
      setAvailableProducts([]); // Ensure it's an empty array on error
    } finally {
      setLoadingProducts(false);
    }
  };

  // Keep splitInfo in sync when totalOrderQty changes after save
  useEffect(() => {
    setWizardData((prev) => {
      const num = prev.splitInfo.numberOfChallans;
      const newQuantities = [...prev.splitInfo.quantities];
      // Recalculate last challan's quantity
      const filledQty = newQuantities.slice(0, num - 1).reduce((acc, q) => acc + (q || 0), 0);
      newQuantities[num - 1] = Math.max(totalOrderQty - filledQty, 0);
      return {
        ...prev,
        splitInfo: { ...prev.splitInfo, quantities: newQuantities },
      };
    });
  }, [totalOrderQty]);

  useEffect(() => {
    validateQuantities();
  }, [wizardData.splitInfo.quantities]);

  const validateQuantities = () => {
    const { quantities } = wizardData.splitInfo;
    const total = quantities.reduce((acc, qty) => acc + (qty || 0), 0);
    if (total !== totalOrderQty) {
      setQuantityWarning(`Total quantity must equal ${totalOrderQty}. Current total: ${total}`);
      return false;
    }
    setQuantityWarning("");
    return true;
  };

  /** -----------------------------------------------------------
   * DELIVERY CHARGE FUNCTIONS (from PendingOrders)
   * ----------------------------------------------------------- */
  const addDeliveryCharge = async () => {
    const charge = parseFloat(deliveryCharge.perBox);

    if (isNaN(charge) || charge < 0) {
      setDeliveryCharge(prev => ({
        ...prev,
        error: 'Please enter a valid delivery charge per box (₹).'
      }));
      return false;
    }

    setDeliveryCharge(prev => ({ ...prev, loading: true, error: "" }));

    try {
      const res = await api.post("/dispatch/orders/add-delivery-charge", {
        orderId: order._id,
        deliveryChargePerBox: charge,
      });

      toast.success(res.data?.message || "Delivery Charge Added Successfully!");
      setDeliveryCharge(prev => ({ 
        ...prev, 
        isSet: true,
        loading: false,
        error: ""
      }));
      
      // Update the order object with new delivery charge
      order.deliveryChargePerBox = charge;
      order.deliveryCharge = deliveryCharge.total;
      
      return true;
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || "Error adding delivery charge";
      setDeliveryCharge(prev => ({ 
        ...prev, 
        error: errorMsg,
        loading: false 
      }));
      return false;
    }
  };

  const handleDeliveryChargeChange = (value) => {
    setDeliveryCharge(prev => ({
      ...prev,
      perBox: value,
      error: ''
    }));
  };

  /** -----------------------------------------------------------
   * SAVE EDITED ORDER PRODUCTS via PATCH /dispatch/orders/:id/edit
   * Now includes pricePerBox in the payload
   * ----------------------------------------------------------- */
  const handleSaveOrderEdit = async () => {
    // Basic validation: no product can have 0 boxes or invalid price
    const invalid = orderProducts.some((p) => !p.boxes || p.boxes <= 0);
    if (invalid) {
      toast.error("All products must have at least 1 box.");
      return;
    }

    try {
      setIsSavingOrder(true);
      
      // Prepare payload with price information
      // If price hasn't changed, we can either send it or not - backend should handle default
      const payload = {
        products: orderProducts.map((p) => {
          const productPayload = {
            productId: p.productId,
            boxes: p.boxes,
          };
          
          // Only include pricePerBox if it has been modified from original
          // Or always include it based on your backend requirements
          // The updated payload shows both formats are accepted
          if (p.pricePerBox !== p.originalPrice) {
            productPayload.pricePerBox = p.pricePerBox;
          }
          
          return productPayload;
        }),
      };
      
      await api.patch(`/dispatch/orders/${order._id}/edit`, payload);
      toast.success("Order products updated successfully!");
      setIsEditingOrder(false);
      setOrderEdited(true);
      // Update originalBoxes and originalPrice to reflect saved state
      setOrderProducts((prev) =>
        prev.map((p) => ({ 
          ...p, 
          originalBoxes: p.boxes,
          originalPrice: p.pricePerBox,
          isNew: false 
        }))
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating order products");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelOrderEdit = () => {
    // Revert to original boxes/prices and remove new products
    setOrderProducts((prev) =>
      prev.filter((p) => !p.isNew).map((p) => ({ 
        ...p, 
        boxes: p.originalBoxes,
        pricePerBox: p.originalPrice 
      }))
    );
    setIsEditingOrder(false);
  };

  const handleBoxChange = (index, value) => {
    const num = parseInt(value) || 0;
    setOrderProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], boxes: num };
      return updated;
    });
  };

  const handlePriceChange = (index, value) => {
    const num = parseFloat(value) || 0;
    setOrderProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], pricePerBox: num };
      return updated;
    });
  };

  /** -----------------------------------------------------------
   * ADD / REMOVE PRODUCTS
   * ----------------------------------------------------------- */
  const handleAddProduct = (product) => {
    if (!product || !product._id) {
      toast.error("Invalid product selected");
      return;
    }

    // Check if product already exists
    const exists = orderProducts.some(p => p.productId === product._id);
    if (exists) {
      toast.error("Product already added to order");
      return;
    }

    const newProduct = {
      productId: product._id,
      productName: product.name || "Unknown Product",
      productCategory: product.category || "Unknown Category",
      boxes: 1,
      originalBoxes: 0,
      pricePerBox: product.price || 0, // Default price from admin
      originalPrice: product.price || 0,
      isNew: true,
    };
    setOrderProducts([...orderProducts, newProduct]);
  };

  const handleRemoveProduct = (index) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== index));
  };

  /** -----------------------------------------------------------
   * CHALLAN SPLIT LOGIC
   * ----------------------------------------------------------- */
  const handleNumberOfChallansChange = (num) => {
    const currentQuantities = [...wizardData.splitInfo.quantities];
    const currentDates = [...wizardData.scheduledDates];
    const currentVehicles = [...wizardData.vehicleDetails];

    let newQuantities, newDates, newVehicles;

    if (num > currentQuantities.length) {
      newQuantities = [...currentQuantities, ...Array(num - currentQuantities.length).fill(0)];
      newDates = [...currentDates, ...Array(num - currentDates.length).fill("")];
      newVehicles = [
        ...currentVehicles,
        ...Array(num - currentVehicles.length).fill({
          vehicleNo: "",
          driverName: "",
          mobileNo: order?.user?.customerDetails?.phone || "",
        }),
      ];
    } else {
      newQuantities = currentQuantities.slice(0, num);
      newDates = currentDates.slice(0, num);
      newVehicles = currentVehicles.slice(0, num);
    }

    const filledQty = newQuantities.slice(0, num - 1).reduce((acc, qty) => acc + (qty || 0), 0);
    newQuantities[num - 1] = Math.max(totalOrderQty - filledQty, 0);

    setWizardData({
      ...wizardData,
      splitInfo: { numberOfChallans: num, quantities: newQuantities },
      scheduledDates: newDates,
      vehicleDetails: newVehicles,
    });
  };

  const handleQuantityChange = (index, value) => {
    const numValue = parseInt(value) || 0;
    const newQuantities = [...wizardData.splitInfo.quantities];
    const numberOfChallans = wizardData.splitInfo.numberOfChallans;

    if (index < numberOfChallans - 1) {
      const otherQuantities = newQuantities
        .slice(0, numberOfChallans - 1)
        .map((q, i) => (i === index ? numValue : q || 0));
      const filledQty = otherQuantities.reduce((acc, qty) => acc + qty, 0);
      if (filledQty > totalOrderQty) {
        toast.error(`Total quantity cannot exceed ${totalOrderQty}`);
        return;
      }
      newQuantities[index] = numValue;
      newQuantities[numberOfChallans - 1] = totalOrderQty - filledQty;
    } else {
      newQuantities[index] = numValue;
    }

    setWizardData({
      ...wizardData,
      splitInfo: { ...wizardData.splitInfo, quantities: newQuantities },
    });
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...wizardData.vehicleDetails];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setWizardData({ ...wizardData, vehicleDetails: newVehicles });
  };

  const handleDateChange = (index, value) => {
    const newDates = [...wizardData.scheduledDates];
    newDates[index] = value;
    setWizardData({ ...wizardData, scheduledDates: newDates });
  };

  /** -----------------------------------------------------------
   * STEP VALIDATION
   * ----------------------------------------------------------- */
  const validateStep = (step) => {
    if (step === 0 && isEditingOrder) {
      toast.error("Please save or cancel your order edits before proceeding.");
      return false;
    }
    if (step === 1) { // Delivery Charge Step
      if (!deliveryCharge.perBox || deliveryCharge.perBox <= 0) {
        toast.error("Please add a delivery charge per box");
        return false;
      }
    }
    if (step === 2) { // Challan Generation Step
      if (!validateQuantities()) {
        toast.error("Please ensure total quantity matches order quantity");
        return false;
      }
      if (wizardData.scheduledDates.some((date) => !date)) {
        toast.error("Please select delivery date for all challans");
        return false;
      }
      if (wizardData.vehicleDetails.some((v) => !v.vehicleNo || !v.driverName || !v.mobileNo)) {
        toast.error("Please fill vehicle details for all challans");
        return false;
      }
      if (!wizardData.receiverName.trim()) {
        toast.error("Please enter receiver name");
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (currentStep === 1) {
      // If it's delivery charge step, save to backend first
      if (!deliveryCharge.isSet || deliveryCharge.perBox !== parseFloat(wizardData.deliveryChargePerBox)) {
        const success = await addDeliveryCharge();
        if (!success) return;
      }
    }
    
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = () => {
    if (!validateStep(currentStep)) return;
    onSuccess({
      splitInfo: wizardData.splitInfo,
      scheduledDates: wizardData.scheduledDates.map((date) => new Date(date).toISOString()),
      deliveryChoice: wizardData.deliveryChoice,
      shippingAddress: wizardData.shippingAddress,
      vehicleDetails: wizardData.vehicleDetails,
      receiverName: wizardData.receiverName,
      deliveryChargePerBox: wizardData.deliveryChargePerBox,
      deliveryChargeTotal: wizardData.deliveryChargeTotal,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">Challan Generation Wizard</h2>
          <p className="text-blue-100">Step {currentStep + 1} of {steps.length}</p>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <div className="flex justify-between mb-4">
            {steps.map((step, idx) => (
              <div key={idx} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-2 transition-colors ${
                    idx <= currentStep ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {idx < currentStep ? <FaCheck size={14} /> : idx + 1}
                </div>
                <p className="text-xs text-center text-gray-600 font-medium">{step.title}</p>
                <p className="text-xs text-center text-gray-400 hidden md:block">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="px-6 py-6 min-h-[400px]">

          {/* ─── STEP 0: Edit Order Products with Price ─── */}
          {currentStep === 0 && (
            <div className="space-y-6">

              {/* Order Products Edit Section */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <div>
                    <h3 className="text-base font-semibold text-gray-800">Order Products</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Total: <span className="font-medium text-blue-600">{totalOrderQty} boxes</span> | 
                      Value: <span className="font-medium text-green-600">₹{totalOrderValue.toFixed(2)}</span>
                      {orderEdited && (
                        <span className="ml-2 text-green-600 font-medium">✓ Saved</span>
                      )}
                    </p>
                  </div>
                  {!isEditingOrder ? (
                    <button
                      onClick={() => setIsEditingOrder(true)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors"
                    >
                      <FaEdit size={12} /> Edit Order
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelOrderEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-200 text-sm transition-colors"
                      >
                        <FaUndo size={11} /> Cancel
                      </button>
                      <button
                        onClick={handleSaveOrderEdit}
                        disabled={isSavingOrder}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm font-medium transition-colors"
                      >
                        {isSavingOrder ? (
                          <>
                            <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                            Saving...
                          </>
                        ) : (
                          <><FaSave size={11} /> Save Changes</>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {isEditingOrder && (
                  <div className="p-4 bg-blue-50 border-b border-blue-100">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">Add Products</h4>
                    {loadingProducts ? (
                      <p className="text-sm text-gray-500">Loading products...</p>
                    ) : productsError ? (
                      <p className="text-sm text-red-500">{productsError}</p>
                    ) : !Array.isArray(availableProducts) || availableProducts.length === 0 ? (
                      <p className="text-sm text-gray-500">No products available</p>
                    ) : (
                      <select
                        className="w-full p-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
                        onChange={(e) => {
                          const product = availableProducts.find(p => p._id === e.target.value);
                          if (product) handleAddProduct(product);
                          e.target.value = ""; // Reset select
                        }}
                        value=""
                      >
                        <option value="">Select a product to add...</option>
                        {availableProducts.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} - {product.type} - {product.category} (₹{product.price})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {orderProducts.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      No products in order
                    </div>
                  ) : (
                    orderProducts.map((product, index) => (
                      <div
                        key={product.productId || index}
                        className={`flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
                          product.isNew ? "bg-green-50" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <p className="font-medium text-gray-800 text-sm truncate">
                            {product.productName} - {product.productCategory}
                            {product.isNew && (
                              <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">New</span>
                            )}
                          </p>
                          {isEditingOrder && (product.originalBoxes !== product.boxes || product.originalPrice !== product.pricePerBox) && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Original: {product.originalBoxes} boxes @ ₹{product.originalPrice}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isEditingOrder ? (
                            <>
                              <div className="flex flex-col items-end">
                                <label className="text-xs text-gray-500 mb-1">Boxes</label>
                                <input
                                  type="number"
                                  min="1"
                                  value={product.boxes}
                                  onChange={(e) => handleBoxChange(index, e.target.value)}
                                  className="w-20 p-1.5 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                />
                              </div>
                              <div className="flex flex-col items-end">
                                <label className="text-xs text-gray-500 mb-1">Price/Box (₹)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={product.pricePerBox}
                                  onChange={(e) => handlePriceChange(index, e.target.value)}
                                  className="w-24 p-1.5 text-sm border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                                />
                              </div>
                              {product.isNew && (
                                <button
                                  onClick={() => handleRemoveProduct(index)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Remove product"
                                >
                                  <FaTrash size={14} />
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                              {product.boxes} boxes @ ₹{product.pricePerBox}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isEditingOrder && (
                  <div className="bg-amber-50 border-t border-amber-100 px-4 py-2.5">
                    <p className="text-xs text-amber-700 flex items-center gap-1.5">
                      <FaExclamationTriangle size={11} />
                      Editing order quantities and prices will update the order before generating challans.
                      New total: <strong>{totalOrderQty} boxes</strong> | New value: <strong>₹{totalOrderValue.toFixed(2)}</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 1: Delivery Charge (from PendingOrders) ─── */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                    <FaTruck className="text-blue-600" />
                    Delivery Charge
                  </h3>
                </div>

                <div className="p-6">
                  {/* Order Summary */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Order Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Order ID</p>
                        <p className="font-mono font-medium">{order?.orderId || order?._id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Customer</p>
                        <p className="font-medium">{order?.user?.name || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Products</p>
                        <p className="font-medium">{orderProducts.length} items</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Boxes</p>
                        <p className="font-medium">{totalOrderQty} boxes</p>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Charge Input */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Delivery Charge per Box (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={deliveryCharge.perBox}
                        onChange={(e) => handleDeliveryChargeChange(e.target.value)}
                        placeholder="Enter charge per box"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={deliveryCharge.loading}
                      />
                    </div>

                    {/* Calculation Preview */}
                    {deliveryCharge.perBox > 0 && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-800 mb-2">Charge Calculation</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-blue-700">Per Box Rate:</span>
                            <span className="font-medium">₹{parseFloat(deliveryCharge.perBox).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-700">Total Boxes:</span>
                            <span className="font-medium">{totalOrderQty}</span>
                          </div>
                          <div className="border-t border-blue-200 pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                              <span className="text-blue-800">Total Delivery Charge:</span>
                              <span className="text-blue-800">₹{deliveryCharge.total.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Error Message */}
                    {deliveryCharge.error && (
                      <div className="p-3 bg-red-100 text-red-700 rounded-lg">
                        {deliveryCharge.error}
                      </div>
                    )}

                    {/* Info Message */}
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                      <FaExclamationTriangle className="inline mr-1 text-yellow-500" />
                      This charge will be multiplied by the total number of boxes ({totalOrderQty}) in the order.
                      The total delivery charge will be added to the order total.
                    </p>

                    {/* Success Message */}
                    {deliveryCharge.isSet && (
                      <div className="p-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-2">
                        <FaCheck size={14} />
                        Delivery charge has been set successfully!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 2: Challan Split + Vehicle Details (unchanged) ─── */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Challan Generation</h3>

                <div className="mb-6">
                  <label className="block text-gray-700 font-medium mb-2">Number of Challans</label>
                  <input
                    type="number"
                    min="1"
                    value={wizardData.splitInfo.numberOfChallans}
                    onChange={(e) => handleNumberOfChallansChange(parseInt(e.target.value) || 1)}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Total order quantity: <strong>{totalOrderQty} boxes</strong> | 
                    Total value: <strong>₹{totalOrderValue.toFixed(2)}</strong> |
                    Delivery charge: <strong>₹{deliveryCharge.total.toFixed(2)}</strong>
                    {orderEdited && <span className="ml-1 text-green-600">(updated)</span>}
                  </p>
                </div>

                {quantityWarning && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-md flex items-center gap-2">
                    <FaExclamationTriangle className="text-yellow-600" />
                    <span className="text-sm text-yellow-800">{quantityWarning}</span>
                  </div>
                )}

                <div className="space-y-4">
                  {Array.from({ length: wizardData.splitInfo.numberOfChallans }).map((_, idx) => {
                    const isLastRow = idx === wizardData.splitInfo.numberOfChallans - 1;
                    return (
                      <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                        <h4 className="font-semibold text-gray-700 mb-3">Challan {idx + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">
                              Quantity (Boxes) {isLastRow && <span className="text-blue-500">(Auto-calculated)</span>}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={wizardData.splitInfo.quantities[idx] || ""}
                              onChange={(e) => handleQuantityChange(idx, e.target.value)}
                              disabled={isLastRow}
                              className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 ${
                                isLastRow ? "bg-gray-100 cursor-not-allowed" : ""
                              }`}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Delivery Date</label>
                            <input
                              type="date"
                              value={wizardData.scheduledDates[idx] || ""}
                              onChange={(e) => handleDateChange(idx, e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Driver Name</label>
                            <input
                              type="text"
                              value={wizardData.vehicleDetails[idx]?.driverName || ""}
                              onChange={(e) => handleVehicleChange(idx, "driverName", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Vehicle Number</label>
                            <input
                              type="text"
                              value={wizardData.vehicleDetails[idx]?.vehicleNo || ""}
                              onChange={(e) => handleVehicleChange(idx, "vehicleNo", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-700 mb-1">Mobile Number</label>
                            <input
                              type="tel"
                              value={wizardData.vehicleDetails[idx]?.mobileNo || ""}
                              onChange={(e) => handleVehicleChange(idx, "mobileNo", e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        {isLastRow && (
                          <p className="text-xs text-blue-600 mt-2">
                            ℹ️ This quantity is automatically calculated as the remaining balance
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6">
                  <label className="block text-sm text-gray-700 font-medium mb-1">Receiver Name</label>
                  <input
                    type="text"
                    value={wizardData.receiverName}
                    onChange={(e) => setWizardData({ ...wizardData, receiverName: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2 text-sm"
          >
            <FaTimes /> Cancel
          </button>

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 flex items-center gap-2 text-sm"
              >
                <FaArrowLeft /> Previous
              </button>
            )}
            {currentStep < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 text-sm"
              >
                Next <FaArrowRight />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!!quantityWarning}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                <FaCheck /> Generate Challans
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallanGenerationWizard;