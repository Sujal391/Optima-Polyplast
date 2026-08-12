/**
 * CreateOrder.js — Miscellaneous Order Only
 *
 * Regular customer orders are now handled from the Total Users page (TotalUser.js).
 * This page is dedicated to creating orders for walk-in / miscellaneous customers
 * who are NOT registered in the system.
 */

import React, { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import cookies from "js-cookie";
import {
  UserX, PackageSearch, Plus, Minus, Loader2,
  ShoppingCart, CheckCircle2, Trash2, ClipboardList,
} from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

// ─── Receptionist API ─────────────────────────────────────────────────────────
const receptionApi = axios.create({ baseURL: process.env.REACT_APP_API });
receptionApi.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Panel API (misc token in state only, never in cookie) ───────────────────
function createPanelApi(panelToken) {
  const inst = axios.create({ baseURL: process.env.REACT_APP_API });
  inst.interceptors.request.use(
    (config) => {
      config.headers.Authorization = panelToken.startsWith("Bearer ") ? panelToken : `Bearer ${panelToken}`;
      return config;
    },
    (error) => Promise.reject(error)
  );
  return inst;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const inputCls = "w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-gray-400 transition";
const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1";

// ═════════════════════════════════════════════════════════════════════════════
// CreateOrder — Miscellaneous Customers
// ═════════════════════════════════════════════════════════════════════════════
const CreateOrder = () => {
  // Step 1 — misc customer info
  const [name, setName]       = useState("");
  const [mobile, setMobile]   = useState("");
  const [email, setEmail]     = useState("");

  // After access
  const [panelToken, setPanelToken]   = useState(null);
  const [customer, setCustomer]       = useState(null);
  const [products, setProducts]       = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState({});
  const [customPrices, setCustomPrices]   = useState({});
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const getPrice = (id, defaultPrice) => {
    if (customPrices[id] !== undefined && customPrices[id] !== "") {
      return parseFloat(customPrices[id]) || 0;
    }
    return defaultPrice;
  };

  // Status
  const [loadingAccess, setLoadingAccess]     = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrder, setLoadingOrder]       = useState(false);
  const [orderSuccess, setOrderSuccess]       = useState(null);

  // Step 1: request misc panel access
  const handleAccess = async () => {
    if (!name.trim())   { toast.error("Name is required."); return; }
    if (!mobile.trim()) { toast.error("Mobile number is required."); return; }
    if (!/^\d{10}$/.test(mobile.trim())) { toast.error("Mobile number must be exactly 10 digits."); return; }

    setLoadingAccess(true);
    try {
      const body = { name: name.trim(), mobileNo: mobile.trim() };
      if (email.trim()) body.email = email.trim();
      const res = await receptionApi.post("/reception/miscellaneous-panel-access", body);
      setPanelToken(res.data.token); // ✅ never touches cookie
      setCustomer(res.data.customer);
      toast.success("Panel access granted.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to access panel.");
    } finally {
      setLoadingAccess(false);
    }
  };

  // Step 2: fetch products
  const fetchProducts = useCallback(async () => {
    if (!panelToken) return;
    setLoadingProducts(true);
    try {
      const panelApi = createPanelApi(panelToken);
      const res = await panelApi.get("/reception/user-panel/products");
      setProducts(res.data.products || []);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load products.");
    } finally {
      setLoadingProducts(false);
    }
  }, [panelToken]);

  useEffect(() => { if (panelToken) fetchProducts(); }, [panelToken, fetchProducts]);

  // Qty helpers
  const setBoxes = (id, val) => {
    const n = parseInt(val, 10);
    if (!val || isNaN(n) || n < 1) {
      setSelectedBoxes((p) => { const c = { ...p }; delete c[id]; return c; });
    } else {
      setSelectedBoxes((p) => ({ ...p, [id]: n }));
    }
  };
  const inc = (id) => setSelectedBoxes((p) => ({ ...p, [id]: (p[id] || 0) + 1 }));
  const dec = (id) => {
    const cur = selectedBoxes[id] || 0;
    if (cur <= 1) setSelectedBoxes((p) => { const c = { ...p }; delete c[id]; return c; });
    else setSelectedBoxes((p) => ({ ...p, [id]: cur - 1 }));
  };

  // Step 3: submit order
  const handleOrder = async () => {
    const ordered = products
      .filter((p) => selectedBoxes[p._id] > 0)
      .map((p) => ({ productId: p._id, boxes: selectedBoxes[p._id], price: getPrice(p._id, p.price) }));

    if (ordered.length === 0) { toast.error("Select at least one product."); return; }

    setLoadingOrder(true);
    try {
      const panelApi = createPanelApi(panelToken);
      const res = await panelApi.post("/reception/user-panel/orders", {
        products: ordered,
        paymentMethod,
        deliveryChoice: "companyPickup",
        shippingAddress: {
          address: "Miscellaneous Customer", city: "Ahmedabad",
          state: "Gujarat", pinCode: "380001",
        },
        name: customer?.name || name.trim(),
        mobileNo: customer?.mobileNo || mobile.trim(),
      });
      setOrderSuccess(res.data?.message || "Order created successfully!");
      toast.success("Order placed!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to place order.");
    } finally {
      setLoadingOrder(false);
    }
  };

  const reset = () => {
    setName(""); setMobile(""); setEmail("");
    setPanelToken(null); setCustomer(null);
    setProducts([]); setSelectedBoxes({}); setCustomPrices({});
    setPaymentMethod("COD"); setOrderSuccess(null);
  };

  const selectedCount = Object.keys(selectedBoxes).length;
  const totalBoxes = Object.values(selectedBoxes).reduce((s, v) => s + v, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50">
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* ── Page header ── */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-100 rounded-2xl mb-3">
            <UserX className="h-7 w-7 text-indigo-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Miscellaneous Order</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            For walk-in or unregistered customers. Regular customer orders are handled from the{" "}
            <a href="/total-users" className="text-indigo-600 underline hover:text-indigo-800 font-medium">
              Total Users
            </a>{" "}
            page.
          </p>
        </div>

        {/* ── Success state ── */}
        {orderSuccess ? (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
            <CheckCircle2 className="h-14 w-14 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-green-800 mb-2">Order Placed!</h2>
            <p className="text-green-700 text-sm mb-6">{orderSuccess}</p>
            <Button onClick={reset} className="bg-indigo-600 hover:bg-indigo-700 text-white px-8">
              + New Order
            </Button>
          </div>
        ) : (
          <div className="space-y-5">

            {/* ── Step 1: Customer Info ── */}
            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</span>
                <h2 className="font-semibold text-gray-800">Walk-in Customer Details</h2>
              </div>

              {customer ? (
                // Confirmed customer info
                <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-indigo-800">{customer.name}</p>
                      <p className="text-sm text-indigo-600">{customer.mobileNo || mobile}</p>
                      {customer.email && <p className="text-sm text-indigo-500">{customer.email}</p>}
                    </div>
                    <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 shrink-0">
                      Panel Active
                    </Badge>
                  </div>
                  <button
                    onClick={reset}
                    className="mt-3 text-xs text-red-500 hover:text-red-700 underline transition-colors"
                  >
                    Reset & start over
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Name <span className="text-red-500 normal-case">*</span></label>
                    <input
                      className={inputCls}
                      placeholder="Customer name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Mobile <span className="text-red-500 normal-case">*</span></label>
                    <input
                      className={inputCls}
                      placeholder="10-digit mobile number"
                      maxLength={10}
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Email <span className="text-gray-400 normal-case font-normal">(optional)</span></label>
                    <input
                      className={inputCls}
                      type="email"
                      placeholder="customer@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Button
                      onClick={handleAccess}
                      disabled={loadingAccess}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 text-sm font-semibold"
                    >
                      {loadingAccess ? (
                        <><Loader2 className="h-4 w-4 animate-spin mr-2" />Connecting…</>
                      ) : (
                        "Access Panel & Load Products →"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Step 2: Products ── */}
            {panelToken && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">2</span>
                  <h2 className="font-semibold text-gray-800">Select Products</h2>
                </div>

                {loadingProducts ? (
                  <div className="flex items-center justify-center gap-3 py-10 text-gray-400">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    <span className="text-sm">Loading products…</span>
                  </div>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-10 text-gray-400">
                    <PackageSearch className="h-10 w-10" />
                    <p className="text-sm">No products available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {products.map((product) => {
                      const qty = selectedBoxes[product._id] || 0;
                      const selected = qty > 0;
                      return (
                        <div
                          key={product._id}
                          className={`rounded-xl border p-3 transition-all duration-200 ${
                            selected
                              ? "border-indigo-400 bg-indigo-50 shadow-sm"
                              : "border-gray-200 bg-gray-50 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex gap-3">
                            <img
                              src={product.image || "/placeholder-image.jpg"}
                              alt={product.name}
                              onError={(e) => { e.target.src = "/placeholder-image.jpg"; }}
                              className="h-14 w-14 rounded-lg object-cover shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
                              <p className="text-xs text-gray-500">{product.category || product.type}</p>
                              <div className="flex items-center mt-0.5">
                                <span className="text-sm font-bold text-indigo-700">₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  placeholder={product.price}
                                  value={customPrices[product._id] !== undefined ? customPrices[product._id] : product.price}
                                  onChange={(e) => setCustomPrices((prev) => ({ ...prev, [product._id]: e.target.value }))}
                                  className="w-20 text-sm font-bold text-indigo-700 bg-transparent border-b border-transparent hover:border-indigo-300 focus:border-indigo-600 focus:outline-none px-1 py-0.5 transition-colors"
                                  title="Edit Price"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <span className="text-xs text-gray-500">Boxes</span>
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => dec(product._id)}
                                className="h-7 w-7 rounded-full border border-gray-300 bg-white text-gray-600 flex items-center justify-center hover:bg-gray-50 transition disabled:opacity-40"
                                disabled={qty === 0}>
                                <Minus className="h-3 w-3" />
                              </button>
                              <input
                                type="number" min="0"
                                value={qty || ""}
                                onChange={(e) => setBoxes(product._id, e.target.value)}
                                className="w-14 text-center border border-gray-300 rounded-lg py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                                placeholder="0"
                              />
                              <button type="button" onClick={() => inc(product._id)}
                                className="h-7 w-7 rounded-full border border-indigo-400 bg-indigo-50 text-indigo-700 flex items-center justify-center hover:bg-indigo-100 transition">
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </div>

                          {selected && (
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-indigo-600 font-medium">
                                Subtotal: ₹{(qty * getPrice(product._id, product.price)).toLocaleString("en-IN")}
                              </span>
                              <button
                                onClick={() => setBoxes(product._id, "")}
                                className="text-red-400 hover:text-red-600 transition"
                                title="Remove"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Step 3: Order Details ── */}
            {panelToken && products.length > 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">3</span>
                  <h2 className="font-semibold text-gray-800">Order Details</h2>
                </div>

                {/* Misc note */}
                <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
                  📦 Miscellaneous orders use <strong>Company Pickup</strong> delivery by default.
                </div>

                {/* Payment */}
                <div className="mb-5">
                  <label className={labelCls}>Payment Method</label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {[
                      { val: "COD", label: "Cash on Delivery" },
                      { val: "UPI", label: "UPI" },
                      { val: "netBanking", label: "Net Banking" },
                    ].map(({ val, label }) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setPaymentMethod(val)}
                        className={`flex-1 py-2.5 text-sm rounded-xl border font-medium transition ${
                          paymentMethod === val
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Order summary */}
                {selectedCount > 0 && (
                  <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 mb-5 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Order Summary</p>
                    {products.filter((p) => selectedBoxes[p._id] > 0).map((p) => {
                      const finalPrice = getPrice(p._id, p.price);
                      return (
                        <div key={p._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 truncate max-w-[60%]">{p.name}</span>
                          <span className="text-gray-500 shrink-0">
                            {selectedBoxes[p._id]} boxes × ₹{finalPrice} ={" "}
                            <span className="font-semibold text-gray-800">
                              ₹{(selectedBoxes[p._id] * finalPrice).toLocaleString("en-IN")}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                    <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-sm">
                      <span>{totalBoxes} boxes</span>
                      <span className="text-indigo-700">
                        ₹{products
                          .filter((p) => selectedBoxes[p._id] > 0)
                          .reduce((s, p) => s + selectedBoxes[p._id] * getPrice(p._id, p.price), 0)
                          .toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit */}
                <Button
                  onClick={handleOrder}
                  disabled={loadingOrder || selectedCount === 0}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base"
                >
                  {loadingOrder ? (
                    <><Loader2 className="h-5 w-5 animate-spin mr-2" />Placing Order…</>
                  ) : (
                    <><ShoppingCart className="h-5 w-5 mr-2" />Place Order ({selectedCount} product{selectedCount !== 1 ? "s" : ""})</>
                  )}
                </Button>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default CreateOrder;
