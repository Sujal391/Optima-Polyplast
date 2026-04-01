import React, { useState, useEffect } from "react";
import { 
  ArrowLeft, ArrowRight, Check, X, AlertTriangle, 
  Edit, Save, Undo, Trash2, Loader2, Plus
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import cookies from "js-cookie";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";

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

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // --- Order products edit state with price support ---
  const [orderProducts, setOrderProducts] = useState(
    order?.products?.map((p) => ({
      productId: p.product?._id || p.productId,
      productName: p.product?.name || p.productName || "N/A",
      productCategory: p.product?.category || "N/A",
      boxes: p.boxes,
      originalBoxes: p.boxes,
      pricePerBox: p.price || p.product?.originalPrice || 0,   // ← was p.pricePerBox
      originalPrice: p.price || p.product?.originalPrice || 0,
      isNew: false,
    })) || []
  );
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [orderEdited, setOrderEdited] = useState(false);

  // Recompute total from (possibly edited) orderProducts
  const totalOrderQty = orderProducts.reduce((acc, p) => acc + (p.boxes || 0), 0);
  const totalOrderValue = orderProducts.reduce((acc, p) => acc + ((p.boxes || 0) * (p.pricePerBox || 0)), 0);

  const [wizardData, setWizardData] = useState({
    splitInfo: {
      numberOfChallans: 1,
      itemsDistribution: [
        (order?.products || []).map((p) => ({
          productId: p.product?._id || p.productId,
          productName: p.product?.name || p.productName || "N/A",
          boxes: p.boxes,
          originalBoxes: p.boxes
        }))
      ],
    },
    scheduledDates: [getTodayDate()], // Auto-set to today's date
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
    deliveryChargePerBox: [0], // Array — one entry per challan
    receiverName: order?.firmName || order?.user?.name || "",
  });

  const [quantityWarning, setQuantityWarning] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const steps = [
    { title: "Edit Order", description: "Modify order products, quantities & prices" },
    { title: "Challan Setup", description: "Split order & delivery details" },
  ];

  // Fetch available products when editing starts
  useEffect(() => {
    if (isEditingOrder) {
      fetchAvailableProducts();
    }
  }, [isEditingOrder]);

  // Keep splitInfo in sync when orderProducts change (after save)
  useEffect(() => {
    setWizardData((prev) => {
      const num = prev.splitInfo.numberOfChallans;
      const newDistribution = [...prev.splitInfo.itemsDistribution];
      
      const lastIndex = num - 1;
      const updatedLastDistrib = orderProducts.map(p => {
        let allocatedSum = 0;
        for (let i = 0; i < lastIndex; i++) {
          const existingChallan = newDistribution[i] || [];
          const item = existingChallan.find(x => x.productId === p.productId);
          allocatedSum += (item ? (parseInt(item.boxes) || 0) : 0);
        }
        return {
          productId: p.productId,
          productName: p.productName,
          originalBoxes: p.boxes,
          boxes: Math.max(0, p.boxes - allocatedSum)
        };
      });
      newDistribution[lastIndex] = updatedLastDistrib;

      // also make sure previous distributions have updated originalBoxes
      for (let i = 0; i < lastIndex; i++) {
        newDistribution[i] = newDistribution[i] || [];
        newDistribution[i] = orderProducts.map(p => {
          const existing = newDistribution[i].find(x => x.productId === p.productId);
          return {
            productId: p.productId,
            productName: p.productName,
            originalBoxes: p.boxes,
            boxes: existing ? existing.boxes : 0
          };
        });
      }

      return {
        ...prev,
        splitInfo: { ...prev.splitInfo, itemsDistribution: newDistribution },
      };
    });
  }, [orderProducts]);

  useEffect(() => {
    validateQuantities();
  }, [wizardData.splitInfo.itemsDistribution]);

  const validateQuantities = () => {
    const { itemsDistribution } = wizardData.splitInfo;
    for (const op of orderProducts) {
      const productTotal = itemsDistribution.reduce((acc, challan) => {
        const item = challan.find(x => x.productId === op.productId);
        return acc + (item ? (parseInt(item.boxes) || 0) : 0);
      }, 0);
      if (productTotal !== op.boxes) {
        setQuantityWarning(`Total ${op.productName} boxes must equal ${op.boxes}.`);
        return false;
      }
    }
    setQuantityWarning("");
    return true;
  };

  const fetchAvailableProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError(null);
      const response = await api.get("/dispatch/products");

      const products = Array.isArray(response.data) ? response.data :
        (response.data?.data && Array.isArray(response.data.data)) ? response.data.data :
          response.data?.products && Array.isArray(response.data.products) ? response.data.products :
            [];

      setAvailableProducts(products);
      if (products.length === 0) setProductsError("No products available");
    } catch (error) {
      setProductsError("Failed to fetch products");
      toast.error("Failed to fetch products");
      console.error("Error fetching products:", error);
      setAvailableProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleSaveOrderEdit = async () => {
    if (orderProducts.length === 0) {
      toast.error("Order must have at least 1 product.");
      return;
    }

    const invalid = orderProducts.some((p) => !p.boxes || p.boxes <= 0);
    if (invalid) {
      toast.error("All products must have at least 1 box.");
      return;
    }

    const missingPrice = orderProducts.some(
      (p) => p.pricePerBox === "" || p.pricePerBox === null || Number.isNaN(Number(p.pricePerBox))
    );
    if (missingPrice) {
      toast.error("Please fill price per box for all products.");
      return;
    }

    try {
      setIsSavingOrder(true);

      const payload = {
        products: orderProducts.map((p) => {
          const productPayload = {
            productId: p.productId,
            boxes: p.boxes,
          };
          const currentPrice = Number(p.pricePerBox);
          if (currentPrice !== p.originalPrice) {
            productPayload.price = currentPrice;
          }
          return productPayload;
        }),
      };

      await api.patch(`/dispatch/orders/${order._id}/edit`, payload);
      toast.success("Order products updated successfully!");
      setIsEditingOrder(false);
      setOrderEdited(true);
      setOrderProducts((prev) =>
        prev.map((p) => ({
          ...p,
          originalBoxes: p.boxes,
          originalPrice: Number(p.pricePerBox),
          isNew: false,
        }))
      );
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating order products");
    } finally {
      setIsSavingOrder(false);
    }
  };

  const handleCancelOrderEdit = () => {
    setOrderProducts((prev) =>
      prev.filter((p) => !p.isNew).map((p) => ({
        ...p,
        boxes: p.originalBoxes,
        pricePerBox: p.originalPrice,
      }))
    );
    setIsEditingOrder(false);
  };

  const handleStartOrderEdit = () => {
    setOrderProducts((prev) =>
      prev.map((p) => ({
        ...p,
        pricePerBox: "",
      }))
    );
    setIsEditingOrder(true);
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
    setOrderProducts((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        pricePerBox: value === "" ? "" : parseFloat(value),
      };
      return updated;
    });
  };

  const handleAddProduct = (product) => {
    if (!product || !product._id) {
      toast.error("Invalid product selected");
      return;
    }
    const exists = orderProducts.some((p) => p.productId === product._id);
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
      pricePerBox: product.price || 0,
      originalPrice: product.price || 0,
      isNew: true,
    };
    setOrderProducts([...orderProducts, newProduct]);
  };

  const handleRemoveProduct = (index) => {
    setOrderProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleNumberOfChallansChange = (num) => {
    const currentDistribution = [...wizardData.splitInfo.itemsDistribution];
    const currentDates = [...wizardData.scheduledDates];
    const currentVehicles = [...wizardData.vehicleDetails];
    const currentDeliveryCharges = [...wizardData.deliveryChargePerBox];
    const todayDate = getTodayDate();

    let newDistribution, newDates, newVehicles, newDeliveryCharges;

    if (num > currentDistribution.length) {
      newDistribution = [...currentDistribution];
      for (let i = currentDistribution.length; i < num; i++) {
        newDistribution.push(
          orderProducts.map(p => ({
            productId: p.productId,
            productName: p.productName,
            originalBoxes: p.boxes,
            boxes: 0
          }))
        );
      }
      newDates = [...currentDates, ...Array(num - currentDates.length).fill(todayDate)]; // Auto-set to today's date
      newVehicles = [
        ...currentVehicles,
        ...Array(num - currentVehicles.length).fill({
          vehicleNo: "",
          driverName: "",
          mobileNo: order?.user?.customerDetails?.phone || "",
        }),
      ];
      newDeliveryCharges = [...currentDeliveryCharges, ...Array(num - currentDeliveryCharges.length).fill(0)];
    } else {
      newDistribution = currentDistribution.slice(0, num);
      newDates = currentDates.slice(0, num);
      newVehicles = currentVehicles.slice(0, num);
      newDeliveryCharges = currentDeliveryCharges.slice(0, num);
    }

    const lastIndex = num - 1;
    newDistribution[lastIndex] = orderProducts.map(p => {
      let allocatedSum = 0;
      for (let i = 0; i < lastIndex; i++) {
        const item = newDistribution[i].find(x => x.productId === p.productId);
        allocatedSum += (item ? (parseInt(item.boxes) || 0) : 0);
      }
      return {
        productId: p.productId,
        productName: p.productName,
        originalBoxes: p.boxes,
        boxes: Math.max(0, p.boxes - allocatedSum)
      };
    });

    setWizardData({
      ...wizardData,
      splitInfo: { numberOfChallans: num, itemsDistribution: newDistribution },
      scheduledDates: newDates,
      vehicleDetails: newVehicles,
      deliveryChargePerBox: newDeliveryCharges,
    });
  };

  const handleItemQuantityChange = (challanIndex, productId, value) => {
    const numValue = parseInt(value) || 0;
    const newDistribution = [...wizardData.splitInfo.itemsDistribution];
    const numberOfChallans = wizardData.splitInfo.numberOfChallans;
    const lastIndex = numberOfChallans - 1;

    if (challanIndex < lastIndex) {
      // Find the product being edited
      const product = orderProducts.find(p => p.productId === productId);
      if (!product) return;

      // Ensure that this change doesn't cause allocated to exceed total order amount for this product
      let otherAllocated = 0;
      for (let i = 0; i < lastIndex; i++) {
        if (i === challanIndex) continue;
        const item = newDistribution[i].find(x => x.productId === productId);
        otherAllocated += (item ? (parseInt(item.boxes) || 0) : 0);
      }

      if (otherAllocated + numValue > product.boxes) {
        toast.error(`Total quantity for ${product.productName} cannot exceed ${product.boxes}`);
        return;
      }

      // Update the value
      const challanItems = [...newDistribution[challanIndex]];
      const itemIndex = challanItems.findIndex(x => x.productId === productId);
      if (itemIndex >= 0) {
        challanItems[itemIndex] = { ...challanItems[itemIndex], boxes: numValue };
      }
      newDistribution[challanIndex] = challanItems;

      // Auto update the last index
      const lastChallanItems = [...newDistribution[lastIndex]];
      const lastItemIndex = lastChallanItems.findIndex(x => x.productId === productId);
      if (lastItemIndex >= 0) {
        lastChallanItems[lastItemIndex] = { ...lastChallanItems[lastItemIndex], boxes: product.boxes - (otherAllocated + numValue) };
      }
      newDistribution[lastIndex] = lastChallanItems;
    } else {
      // Direct edit on last challan if there is only 1 challan
      if (numberOfChallans === 1) {
        const challanItems = [...newDistribution[challanIndex]];
        const itemIndex = challanItems.findIndex(x => x.productId === productId);
        if (itemIndex >= 0) {
           challanItems[itemIndex] = { ...challanItems[itemIndex], boxes: numValue };
        }
        newDistribution[challanIndex] = challanItems;
      }
    }

    setWizardData({
      ...wizardData,
      splitInfo: { ...wizardData.splitInfo, itemsDistribution: newDistribution },
    });
  };

  const handleDeliveryChargePerBoxChange = (index, value) => {
    const num = parseFloat(value) || 0;
    const newCharges = [...wizardData.deliveryChargePerBox];
    newCharges[index] = num;
    setWizardData({ ...wizardData, deliveryChargePerBox: newCharges });
  };

  const handleVehicleChange = (index, field, value) => {
    const newVehicles = [...wizardData.vehicleDetails];
    newVehicles[index] = { ...newVehicles[index], [field]: value };
    setWizardData({ ...wizardData, vehicleDetails: newVehicles });
  };

  // Date change handler removed - dates are now auto-set and cannot be changed

  const validateStep = (step) => {
    if (step === 0 && isEditingOrder) {
      toast.error("Please save or cancel your order edits before proceeding.");
      return false;
    }
    if (step === 1) {
      if (!validateQuantities()) {
        toast.error("Please ensure total quantity matches order quantity");
        return false;
      }
      // All dates are automatically set, so no need to validate them
      if (wizardData.vehicleDetails.some((v) => !v.vehicleNo || !v.driverName || !v.mobileNo)) {
        toast.error("Please fill vehicle details for all challans");
        return false;
      }
      if (wizardData.deliveryChargePerBox.some((c) => c === "" || c === null || c === undefined || isNaN(c) || c < 0)) {
        toast.error("Please enter a valid delivery charge per box for all challans");
        return false;
      }
      if (!wizardData.receiverName.trim()) {
        toast.error("Please enter receiver name");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handlePrev = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    setIsGenerating(true);
    try {
      await onSuccess({
        splitInfo: wizardData.splitInfo,
        scheduledDates: wizardData.scheduledDates.map((date) => new Date(date).toISOString()),
        deliveryChoice: wizardData.deliveryChoice,
        shippingAddress: wizardData.shippingAddress,
        vehicleDetails: wizardData.vehicleDetails,
        deliveryChargePerBox: wizardData.deliveryChargePerBox,
        receiverName: wizardData.receiverName,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent hideClose className="max-w-4xl p-0 overflow-hidden bg-slate-50 flex flex-col gap-0 max-h-[92vh]">
        
        {/* ── Improved Header ── */}
        <div className="bg-gradient-to-br from-indigo-700 via-indigo-600 to-blue-600 px-6 pt-6 pb-5 text-white shrink-0">
          <div className="flex justify-between items-start mb-1">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-indigo-200 mb-1">Dispatch Module</p>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Challan Generation Wizard</h2>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <X className="h-5 w-5 text-white/80" />
            </button>
          </div>
          
          {/* Order summary chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium border border-white/20">
              Order #{order?._id?.slice(-8).toUpperCase()}
            </span>
            <span className="bg-white/15 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full font-medium border border-white/20">
              {order?.firmName || order?.user?.name}
            </span>
            <span className="bg-emerald-400/30 text-emerald-100 text-xs px-3 py-1 rounded-full font-bold border border-emerald-300/30">
              {totalOrderQty} Boxes
            </span>
          </div>

          {/* Step Indicator */}
          <div className="mt-5 flex items-center gap-0 relative">
            <div className="absolute top-[18px] left-[18px] right-[18px] h-px bg-white/20 z-0" />
            <div 
              className="absolute top-[18px] left-[18px] h-px bg-white z-0 transition-all duration-500" 
              style={{ width: currentStep === 0 ? '0%' : `calc(100% - 36px)` }}
            />
            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center flex-1">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 ${
                  idx < currentStep 
                    ? "bg-emerald-400 text-white ring-4 ring-emerald-300/30" 
                    : idx === currentStep 
                    ? "bg-white text-indigo-700 ring-4 ring-white/30 shadow-lg" 
                    : "bg-indigo-500/50 text-indigo-200 border-2 border-white/20"
                }`}>
                  {idx < currentStep ? <Check strokeWidth={3} className="h-4 w-4" /> : idx + 1}
                </div>
                <div className="mt-2 text-center">
                  <p className={`text-[11px] font-semibold ${idx <= currentStep ? "text-white" : "text-indigo-300"}`}>{step.title}</p>
                  <p className={`text-[10px] hidden sm:block mt-0.5 ${idx <= currentStep ? "text-indigo-200" : "text-indigo-400"}`}>{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          
          {/* ─── STEP 0: Edit Order Products ─── */}
          {currentStep === 0 && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-gradient-to-r from-slate-50 to-white px-5 py-4 border-b border-slate-200 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Order Items</h3>
                    <div className="text-sm text-slate-500 mt-0.5 space-y-1">
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-indigo-600">{totalOrderQty} boxes</span>
                        <span className="text-slate-300">·</span>
                        <span className="font-medium">Subtotal: <span className="text-slate-900">₹{totalOrderValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-medium text-slate-500">GST (5%): <span className="text-slate-900">₹{(totalOrderValue * 0.05).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span></span>
                        <span className="text-slate-300">·</span>
                        <span className="font-bold text-emerald-600 font-bold">Total: ₹{(totalOrderValue * 1.05 + (Number(order.deliveryCharge) || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        {orderEdited && (
                          <span className="ml-2 text-emerald-600 font-medium inline-flex items-center gap-1"><Check className="h-3 w-3"/> Updated</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {!isEditingOrder ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleStartOrderEdit}
                      className="border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-xl"
                    >
                      <Edit className="h-4 w-4 mr-2" /> Modify Items
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCancelOrderEdit} className="text-slate-600 hover:bg-slate-100 rounded-xl">
                        <Undo className="h-4 w-4 mr-1.5" /> Discard
                      </Button>
                      <Button size="sm" onClick={handleSaveOrderEdit} disabled={isSavingOrder} className="bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl">
                        {isSavingOrder ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Add products row when editing */}
                {isEditingOrder && (
                  <div className="p-4 bg-indigo-50/70 border-b border-indigo-100">
                    <h4 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                      <Plus className="h-4 w-4"/> Add Product
                    </h4>
                    {loadingProducts ? (
                      <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin"/> Loading catalogue...</p>
                    ) : productsError ? (
                      <p className="text-sm text-red-500">{productsError}</p>
                    ) : !Array.isArray(availableProducts) || availableProducts.length === 0 ? (
                      <p className="text-sm text-slate-500">No products available.</p>
                    ) : (
                      <select
                        className="w-full p-2.5 bg-white border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm"
                        onChange={(e) => {
                          const product = availableProducts.find((p) => p._id === e.target.value);
                          if (product) handleAddProduct(product);
                          e.target.value = "";
                        }}
                        value=""
                      >
                        <option value="">Select a product to add...</option>
                        {availableProducts.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name} – {product.category} (₹{product.price})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Product list */}
                <div className="divide-y divide-slate-100">
                  {orderProducts.length === 0 ? (
                    <div className="px-5 py-10 text-center text-slate-400">No products in this order.</div>
                  ) : (
                    orderProducts.map((product, index) => (
                      <div
                        key={product.productId || index}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 transition-colors ${
                          product.isNew ? "bg-emerald-50/60" : "hover:bg-slate-50/70"
                        }`}
                      >
                        <div className="flex-1 min-w-0 mr-4 mb-3 sm:mb-0">
                          <p className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                            {product.productName}
                            {product.isNew && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">New</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{product.productCategory}</p>
                          {isEditingOrder && (product.originalBoxes !== product.boxes || product.originalPrice !== product.pricePerBox) && (
                            <p className="text-xs font-medium text-amber-600 mt-1.5 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Was: {product.originalBoxes} boxes @ ₹{product.originalPrice}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          {isEditingOrder ? (
                            <>
                              <div className="flex flex-col">
                                <label className="text-[10px] font-semibold uppercase text-slate-400 mb-1 tracking-wider">Boxes</label>
                                <input
                                  type="number" min="1" value={product.boxes}
                                  onChange={(e) => handleBoxChange(index, e.target.value)}
                                  className="w-20 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center bg-white shadow-sm"
                                />
                              </div>
                              <div className="flex flex-col">
                                <label className="text-[10px] font-semibold uppercase text-slate-400 mb-1 tracking-wider">₹/Box</label>
                                <input
                                  type="number" min="0" step="0.01" value={product.pricePerBox}
                                  onChange={(e) => handlePriceChange(index, e.target.value)}
                                  className="w-24 p-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center bg-white shadow-sm"
                                />
                              </div>
                              {orderProducts.length > 1 && (
                                <button onClick={() => handleRemoveProduct(index)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg mt-5 transition-colors">
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                              <div className="text-right">
                                <p className="text-sm font-bold text-slate-800">{product.boxes} <span className="font-normal text-slate-400 text-xs">boxes</span></p>
                                <p className="text-xs text-slate-400">@ ₹{product.pricePerBox}/box</p>
                              </div>
                              <div className="h-8 border-l border-slate-200" />
                              <div className="text-right">
                                <p className="font-bold text-indigo-600 text-sm">₹{(product.boxes * product.pricePerBox).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">+ 5% GST</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isEditingOrder && (
                  <div className="bg-amber-50 border-t border-amber-100 px-5 py-3">
                    <p className="text-xs font-medium text-amber-800 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                      Saving will update the original order before challan creation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── STEP 1: Challan Split + Details ─── */}
          {currentStep === 1 && (
            <div className="space-y-5">
              {/* Split Config */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Challan Split</h3>
                    <p className="text-sm text-slate-400 mt-0.5">Divide this order into one or more shipments</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-sm font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl">
                    {totalOrderQty} total boxes
                  </span>
                </div>

                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Number of Challans</label>
                  <input
                    type="number" min="1"
                    value={wizardData.splitInfo.numberOfChallans}
                    onChange={(e) => handleNumberOfChallansChange(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm text-slate-800 font-semibold"
                  />
                </div>

                {quantityWarning && (
                  <div className="mt-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-amber-800">{quantityWarning}</span>
                  </div>
                )}
              </div>

              {/* Per-Challan Cards */}
              <div className="space-y-4">
                {Array.from({ length: wizardData.splitInfo.numberOfChallans }).map((_, idx) => {
                  const isLastRow = idx === wizardData.splitInfo.numberOfChallans - 1;
                  const challanQty = (wizardData.splitInfo.itemsDistribution[idx] || []).reduce((acc, item) => acc + (parseInt(item.boxes) || 0), 0);
                  const challanCharge = wizardData.deliveryChargePerBox[idx] || 0;

                  return (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      {/* Challan card header accent */}
                      <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-400" />
                      <div className="p-5">
                        <div className="flex items-center gap-3 mb-5">
                          <span className="bg-indigo-100 text-indigo-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</span>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">Challan / Shipment {idx + 1}</h4>
                            {challanQty > 0 && <p className="text-xs text-slate-400 mt-0.5">{challanQty} boxes · ₹{(challanQty * challanCharge).toLocaleString('en-IN')} delivery est.</p>}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Items Quantity */}
                          <div className="lg:col-span-3 mb-2">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Item Distribution</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {orderProducts.map(product => {
                                const challanData = wizardData.splitInfo.itemsDistribution[idx] || [];
                                const item = challanData.find(x => x.productId === product.productId);
                                const boxes = item ? item.boxes : 0;
                                return (
                                  <div key={product.productId} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-slate-800 truncate" title={product.productName}>{product.productName}</p>
                                      <p className="text-[10px] text-slate-500">Total Ordered: {product.boxes}</p>
                                    </div>
                                    <input
                                      type="number" min="0" max={product.boxes}
                                      value={boxes === 0 && !isLastRow ? "" : boxes}
                                      onChange={(e) => handleItemQuantityChange(idx, product.productId, e.target.value)}
                                      disabled={isLastRow && wizardData.splitInfo.numberOfChallans > 1}
                                      className={`w-16 p-1.5 border rounded-md focus:ring-2 focus:ring-indigo-500 text-xs shadow-sm text-center transition-colors ${
                                        isLastRow && wizardData.splitInfo.numberOfChallans > 1 ? "bg-slate-100 border-slate-200 cursor-not-allowed text-slate-400" : "bg-white border-slate-300 text-slate-800"
                                      }`}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                            {isLastRow && wizardData.splitInfo.numberOfChallans > 1 && <p className="text-[10px] text-slate-400 mt-1">*Auto-balanced remainders</p>}
                          </div>
                          
                          {/* Delivery Charge */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Total Delivery Charge</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">₹</span>
                              <input
                                type="number" min="0" step="0.01"
                                value={wizardData.deliveryChargePerBox[idx] ?? ""}
                                onChange={(e) => handleDeliveryChargePerBoxChange(idx, e.target.value)}
                                className="w-full pl-7 p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm"
                              />
                            </div>
                          </div>

                          {/* Delivery Date (readonly) */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Delivery Date</label>
                            <input
                              type="date"
                              value={wizardData.scheduledDates[idx] || getTodayDate()}
                              readOnly disabled
                              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Auto-set to today</p>
                          </div>

                          {/* Driver Name */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Driver Name</label>
                            <input
                              type="text"
                              value={wizardData.vehicleDetails[idx]?.driverName || ""}
                              onChange={(e) => handleVehicleChange(idx, "driverName", e.target.value)}
                              placeholder="e.g. Ramesh Kumar"
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm placeholder:text-slate-300"
                            />
                          </div>

                          {/* Vehicle Number */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vehicle Number</label>
                            <input
                              type="text"
                              value={wizardData.vehicleDetails[idx]?.vehicleNo || ""}
                              onChange={(e) => handleVehicleChange(idx, "vehicleNo", e.target.value)}
                              placeholder="e.g. GJ 01 AB 1234"
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm uppercase placeholder:normal-case placeholder:text-slate-300"
                            />
                          </div>

                          {/* Driver Mobile */}
                          <div>
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Driver Mobile</label>
                            <input
                              type="tel"
                              value={wizardData.vehicleDetails[idx]?.mobileNo || ""}
                              onChange={(e) => handleVehicleChange(idx, "mobileNo", e.target.value)}
                              placeholder="9876543210"
                              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm placeholder:text-slate-300"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Receiver Section */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Receiver Details</h3>
                <div className="max-w-sm">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Receiver Firm / Contact Name</label>
                  <input
                    type="text"
                    value={wizardData.receiverName}
                    onChange={(e) => setWizardData({ ...wizardData, receiverName: e.target.value })}
                    placeholder="Enter receiver name or firm"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm text-sm placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer Actions ── */}
        <div className="px-5 py-4 bg-white border-t border-slate-200 shrink-0 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          <Button variant="outline" onClick={onClose} disabled={isGenerating} className="text-slate-500 border-slate-200 hover:bg-slate-50 rounded-xl px-5">
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <div className="flex gap-3">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} disabled={isGenerating} className="rounded-xl border-slate-200 text-slate-600 px-5">
                <ArrowLeft className="h-4 w-4 mr-2" /> Back
              </Button>
            )}
            {currentStep < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={isGenerating} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 font-semibold shadow-sm">
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!!quantityWarning || isGenerating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 font-semibold shadow-sm disabled:bg-slate-200 disabled:text-slate-400"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
                {isGenerating ? "Generating..." : "Generate Challans"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallanGenerationWizard;
