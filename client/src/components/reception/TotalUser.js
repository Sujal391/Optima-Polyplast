import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  ShoppingCart, X, PackageSearch, Plus, Minus,
  User, Phone, Mail, Building2, Hash, Loader2,
  MapPin, CheckCircle2,
} from "lucide-react";

// shadcn components
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "../ui/table";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "../ui/sheet";
import Paginator from "../common/Paginator";
import UserOrdersDrawer from "./UserOrdersDrawer";

// ─── Axios: receptionist auth ─────────────────────────────────────────────────
const api = axios.create({ baseURL: process.env.REACT_APP_API });
api.interceptors.request.use(
  (config) => {
    const token = cookies.get("token");
    if (token) config.headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Panel API: customer token in state only, never in cookie ─────────────────
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

const fmt = (d) => new Date(d).toLocaleDateString("en-IN");

// ═════════════════════════════════════════════════════════════════════════════
// CreateOrderSheet
// ═════════════════════════════════════════════════════════════════════════════
const CreateOrderSheet = ({ open, onClose, customer }) => {
  const [panelToken, setPanelToken] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedBoxes, setSelectedBoxes] = useState({});
  const [deliveryChoice, setDeliveryChoice] = useState("homeDelivery");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  // Shipping auto-filled from customer's stored address
  const [shipping, setShipping] = useState({ address: "", city: "", state: "", pinCode: "" });

  const [loadingAccess, setLoadingAccess] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [panelError, setPanelError] = useState("");

  // Step 1: get panel token
  const gainPanelAccess = useCallback(async () => {
    if (!customer?.userCode) return;
    setLoadingAccess(true);
    setPanelError("");
    try {
      const res = await api.post("/reception/user-panel-access", { userCode: customer.userCode });
      setPanelToken(res.data.token); // ✅ stored in state only
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to access user panel";
      setPanelError(msg);
      toast.error(msg);
    } finally {
      setLoadingAccess(false);
    }
  }, [customer]);

  // Step 2: fetch products
  const fetchProducts = useCallback(async () => {
    if (!panelToken) return;
    setLoadingProducts(true);
    try {
      const panelApi = createPanelApi(panelToken);
      const res = await panelApi.get("/reception/user-panel/products");
      setProducts(res.data.products || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load products";
      setPanelError(msg);
      toast.error(msg);
    } finally {
      setLoadingProducts(false);
    }
  }, [panelToken]);

  // Reset + auto-fill when sheet opens
  useEffect(() => {
    if (open && customer) {
      setPanelToken(null);
      setProducts([]);
      setSelectedBoxes({});
      setPanelError("");
      setDeliveryChoice("homeDelivery");
      setPaymentMethod("COD");

      // ── Auto-fill shipping from customer's stored address ──────────────────
      setShipping({
        address: customer.address?.address || "",
        city:    customer.address?.city    || "",
        state:   customer.address?.state   || "",
        pinCode: customer.address?.pinCode || "",
      });

      gainPanelAccess();
    }
  }, [open, customer, gainPanelAccess]);

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

  const handleSubmit = async () => {
    const ordered = products
      .filter((p) => selectedBoxes[p._id] > 0)
      .map((p) => ({ productId: p._id, boxes: selectedBoxes[p._id], price: p.price }));

    if (ordered.length === 0) { toast.error("Select at least one product."); return; }
    const totalBoxes = ordered.reduce((s, p) => s + p.boxes, 0);
    if (totalBoxes < 200) { toast.error("Minimum 200 boxes required across all products."); return; }

    if (deliveryChoice === "homeDelivery") {
      const { address, city, state, pinCode } = shipping;
      if (!address || !city || !state || !pinCode) { toast.error("Complete the shipping address."); return; }
      if (!/^\d{6}$/.test(pinCode)) { toast.error("Pin code must be 6 digits."); return; }
    }

    const shippingAddress = deliveryChoice === "companyPickup"
      ? { address: "Company Warehouse", city: "Ahmedabad", state: "Gujarat", pinCode: "380001" }
      : shipping;

    setLoadingOrder(true);
    try {
      const panelApi = createPanelApi(panelToken);
      await panelApi.post("/reception/user-panel/orders", {
        products: ordered,
        paymentMethod,
        deliveryChoice,
        shippingAddress,
      });
      toast.success("Order placed successfully!");
      onClose();
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to create order";
      toast.error(msg);
      setPanelError(msg);
    } finally {
      setLoadingOrder(false);
    }
  };

  const selectedCount = Object.keys(selectedBoxes).length;
  const totalBoxes = Object.values(selectedBoxes).reduce((s, v) => s + v, 0);
  const addrIsAutofilled = customer?.address?.city;

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col p-0 overflow-hidden">

        {/* Header */}
        <SheetHeader className="px-5 pt-6 pb-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 shrink-0">
          <SheetTitle className="flex items-center gap-2 text-green-800">
            <ShoppingCart className="h-5 w-5" /> Create Order
          </SheetTitle>
          <SheetDescription className="text-green-700">Ordering on behalf of customer</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">

          {/* Customer Info */}
          {customer && (
            <div className="mx-4 mt-4 rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">Customer Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <span className="flex items-center gap-2 text-gray-700">
                  <User className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="font-medium">{customer.name}</span>
                </span>
                {customer.firmName && (
                  <span className="flex items-center gap-2 text-gray-700">
                    <Building2 className="h-4 w-4 text-green-500 shrink-0" />
                    {customer.firmName}
                  </span>
                )}
                {customer.phoneNumber && (
                  <span className="flex items-center gap-2 text-gray-700">
                    <Phone className="h-4 w-4 text-green-500 shrink-0" />
                    {customer.phoneNumber}
                  </span>
                )}
                {customer.email && (
                  <span className="flex items-center gap-2 text-gray-700">
                    <Mail className="h-4 w-4 text-green-500 shrink-0" />
                    {customer.email}
                  </span>
                )}
                <span className="flex items-center gap-2 text-gray-700">
                  <Hash className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="font-mono text-xs">{customer.userCode}</span>
                </span>
                {customer.address?.city && (
                  <span className="flex items-center gap-2 text-gray-700 sm:col-span-2">
                    <MapPin className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-xs">
                      {customer.fullAddress || `${customer.address.address}, ${customer.address.city}, ${customer.address.state} – ${customer.address.pinCode}`}
                    </span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Loading / Error states */}
          {loadingAccess && (
            <div className="flex items-center justify-center gap-3 p-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              <span>Connecting to user panel…</span>
            </div>
          )}
          {panelError && !loadingAccess && (
            <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{panelError}</div>
          )}
          {loadingProducts && (
            <div className="flex items-center justify-center gap-3 p-8 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-green-500" />
              <span>Loading products…</span>
            </div>
          )}

          {/* Product list */}
          {!loadingAccess && !loadingProducts && panelToken && products.length > 0 && (
            <div className="px-4 mt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Products ({products.length})
              </p>
              {products.map((product) => {
                const qty = selectedBoxes[product._id] || 0;
                const selected = qty > 0;
                return (
                  <div
                    key={product._id}
                    className={`rounded-xl border p-3 transition-all duration-200 ${
                      selected ? "border-green-400 bg-green-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <div className="flex gap-3">
                      <img
                        src={product.image || "/placeholder-image.jpg"}
                        alt={product.name}
                        onError={(e) => { e.target.src = "/placeholder-image.jpg"; }}
                        className="h-16 w-16 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-gray-800 truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category || product.type}</p>
                        <p className="text-sm font-bold text-green-700 mt-0.5">₹{product.price}</p>
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
                          className="w-16 text-center border border-gray-300 rounded-md py-0.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                          placeholder="0"
                        />
                        <button type="button" onClick={() => inc(product._id)}
                          className="h-7 w-7 rounded-full border border-green-400 bg-green-50 text-green-700 flex items-center justify-center hover:bg-green-100 transition">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    {selected && (
                      <p className="text-xs text-green-600 mt-1 text-right">
                        Subtotal: ₹{(qty * product.price).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!loadingAccess && !loadingProducts && panelToken && products.length === 0 && !panelError && (
            <div className="flex flex-col items-center justify-center gap-3 p-10 text-gray-400">
              <PackageSearch className="h-10 w-10" />
              <p className="text-sm">No products available</p>
            </div>
          )}

          {/* Order details */}
          {panelToken && products.length > 0 && (
            <div className="px-4 mt-5 pb-2 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Order Details</p>

              {/* Delivery method */}
              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">Delivery Method</label>
                <div className="flex gap-2">
                  {["homeDelivery", "companyPickup"].map((opt) => (
                    <button key={opt} type="button" onClick={() => setDeliveryChoice(opt)}
                      className={`flex-1 py-2 text-sm rounded-lg border font-medium transition ${
                        deliveryChoice === opt
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt === "homeDelivery" ? "Home Delivery" : "Company Pickup"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Shipping address */}
              {deliveryChoice === "homeDelivery" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-600 font-medium">Shipping Address</label>
                    {addrIsAutofilled && (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Auto-filled
                      </span>
                    )}
                  </div>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Street Address"
                    value={shipping.address}
                    onChange={(e) => setShipping((p) => ({ ...p, address: e.target.value }))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="City"
                      value={shipping.city}
                      onChange={(e) => setShipping((p) => ({ ...p, city: e.target.value }))}
                    />
                    <input
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                      placeholder="State"
                      value={shipping.state}
                      onChange={(e) => setShipping((p) => ({ ...p, state: e.target.value }))}
                    />
                  </div>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    placeholder="Pin Code (6 digits)"
                    maxLength={6}
                    value={shipping.pinCode}
                    onChange={(e) => setShipping((p) => ({ ...p, pinCode: e.target.value.replace(/\D/g, "") }))}
                  />
                </div>
              )}

              {/* Payment method */}
              <div>
                <label className="text-xs text-gray-600 font-medium mb-1 block">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white"
                >
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="UPI">UPI</option>
                  <option value="netBanking">Net Banking</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="border-t bg-white px-4 py-4 shrink-0">
          {selectedCount > 0 && (
            <div className="flex items-center justify-between mb-3 text-sm">
              <span className="text-gray-500">{selectedCount} product{selectedCount !== 1 ? "s" : ""}</span>
              <span className="font-semibold text-gray-800">{totalBoxes} boxes total</span>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={onClose} disabled={loadingOrder}>Cancel</Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              onClick={handleSubmit}
              disabled={!panelToken || loadingOrder || loadingAccess || selectedCount === 0}
            >
              {loadingOrder ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Placing…</> : "Place Order"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
// CustomerManagement (TotalUser)
// ═════════════════════════════════════════════════════════════════════════════

// Updated form fields to match new API payload
const INITIAL_FORM = {
  name: "", email: "", phoneNumber: "", password: "",
  firmName: "", gstNumber: "", panNumber: "",
  address: "", city: "", state: "", pinCode: "",
};

const FIELD_META = {
  name:        { label: "Full Name",             required: true,  type: "text"     },
  phoneNumber: { label: "Phone Number",           required: true,  type: "tel"      },
  password:    { label: "Password",               required: true,  type: "password" },
  firmName:    { label: "Firm Name",              required: true,  type: "text"     },
  address:     { label: "Street Address",         required: true,  type: "text"     },
  city:        { label: "City",                   required: true,  type: "text"     },
  state:       { label: "State",                  required: true,  type: "text"     },
  pinCode:     { label: "Pin Code",               required: true,  type: "text"     },
  email:       { label: "Email (optional)",       required: false, type: "email"    },
  gstNumber:   { label: "GST Number (optional)",  required: false, type: "text"     },
  panNumber:   { label: "PAN Number (optional)",  required: false, type: "text"     },
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_FORM);

  // Sheet
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // History Drawer
  const [historySheetOpen, setHistorySheetOpen] = useState(false);
  const [historyCustomer, setHistoryCustomer] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/reception/users");
      setCustomers(res.data.users);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);
  useEffect(() => { setPage(1); }, [searchQuery, filter]);

  const handleChange = (e) => setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = [];
    if (!formData.name)        errs.push("Name is required.");
    if (!formData.phoneNumber) errs.push("Phone is required.");
    if (!formData.password)    errs.push("Password is required.");
    if (!formData.firmName)    errs.push("Firm name is required.");
    if (!formData.address)     errs.push("Address is required.");
    if (!formData.city)        errs.push("City is required.");
    if (!formData.state)       errs.push("State is required.");
    if (!formData.pinCode)     errs.push("Pin code is required.");
    if (errs.length) { toast.error(errs.join(" ")); return; }

    // Build payload matching new API structure
    const payload = {
      name:        formData.name,
      phoneNumber: formData.phoneNumber,
      password:    formData.password,
      firmName:    formData.firmName,
      address:     formData.address,
      city:        formData.city,
      state:       formData.state,
      pinCode:     formData.pinCode,
    };
    if (formData.email?.trim())     payload.email     = formData.email.trim();
    if (formData.gstNumber?.trim()) payload.gstNumber = formData.gstNumber.trim();
    if (formData.panNumber?.trim()) payload.panNumber = formData.panNumber.trim();

    try {
      await api.post("/reception/customers", payload);
      toast.success("Customer registered successfully!");
      fetchCustomers();
      setFormData(INITIAL_FORM);
      setShowForm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to register customer.");
    }
  };

  const openOrderSheet = (customer) => {
    setSelectedCustomer(customer);
    setSheetOpen(true);
  };

  const filtered = customers.filter((c) => {
    const statusOk = filter === "all" || (filter === "active" ? c.isActive : !c.isActive);
    const q = searchQuery.toLowerCase();
    const searchOk = !searchQuery ||
      c.name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phoneNumber?.toLowerCase().includes(q) ||
      c.firmName?.toLowerCase().includes(q) ||
      c.userCode?.toLowerCase().includes(q);
    return statusOk && searchOk;
  });

  const total = filtered.length;
  const startIdx = (page - 1) * pageSize;
  const paged = filtered.slice(startIdx, startIdx + pageSize);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <ToastContainer position="top-right" autoClose={4000} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Page header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Customer Management</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {loading ? "Loading…" : `${total} customer${total !== 1 ? "s" : ""} found`}
            </p>
          </div>
          <Button
            onClick={() => setShowForm((v) => !v)}
            className="bg-green-600 hover:bg-green-700 text-white self-start sm:self-auto"
          >
            {showForm ? <><X className="h-4 w-4 mr-1" />Close Form</> : <><Plus className="h-4 w-4 mr-1" />New Customer</>}
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {/* ── Register form (updated fields) ── */}
        {showForm && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-white shadow-md p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Register New Customer</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* Ordered: required fields first, then optional */}
              {[
                "name", "phoneNumber", "password", "firmName",
                "address", "city", "state", "pinCode",
                "email", "gstNumber", "panNumber",
              ].map((key) => {
                const meta = FIELD_META[key];
                return (
                  <div key={key} className={`flex flex-col gap-1 ${key === "address" ? "sm:col-span-2" : ""}`}>
                    <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {meta.label}
                    </label>
                    <input
                      type={meta.type}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      required={meta.required}
                      maxLength={key === "pinCode" ? 6 : undefined}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50"
                      placeholder={`Enter ${meta.label}`}
                    />
                  </div>
                );
              })}

              <div className="col-span-1 sm:col-span-2 flex gap-3 pt-1">
                <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-8">Register</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by name, email, phone, firm, or code…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-white shadow-sm"
          />
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 whitespace-nowrap">Filter:</span>
            <div className="flex rounded-xl border border-gray-300 bg-white shadow-sm overflow-hidden">
              {["all", "active", "inactive"].map((f) => (
                <button key={f} type="button" onClick={() => setFilter(f)}
                  className={`px-3 py-2 text-xs font-medium capitalize transition ${
                    filter === f ? "bg-green-600 text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table / Cards */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-md overflow-hidden">

          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Name</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Email</TableHead>
                  <TableHead className="font-semibold">Phone</TableHead>
                  <TableHead className="font-semibold hidden lg:table-cell">Firm</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">City</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold hidden xl:table-cell">Created</TableHead>
                  <TableHead className="font-semibold text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin" /><span>Loading customers…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paged.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-gray-400">
                      No customers found.
                    </TableCell>
                  </TableRow>
                ) : paged.map((c) => (
                  <TableRow 
                    key={c.userCode} 
                    className="hover:bg-green-50/40 transition-colors cursor-pointer"
                    onClick={() => {
                      setHistoryCustomer(c);
                      setHistorySheetOpen(true);
                    }}
                  >
                    <TableCell className="font-mono text-xs text-gray-600">{c.userCode}</TableCell>
                    <TableCell className="font-medium text-gray-800">{c.name}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-500 text-sm truncate max-w-[160px]">{c.email || "—"}</TableCell>
                    <TableCell className="text-gray-600">{c.phoneNumber}</TableCell>
                    <TableCell className="hidden lg:table-cell text-gray-600">{c.firmName || "—"}</TableCell>
                    <TableCell className="hidden xl:table-cell text-gray-500 text-sm">{c.address?.city || "—"}</TableCell>
                    <TableCell>
                      <Badge className={c.isActive ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"}>
                        {c.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-gray-500 text-sm">{fmt(c.createdAt)}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderSheet(c);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-8"
                        disabled={!c.isActive}
                        title={!c.isActive ? "Inactive customers cannot place orders" : "Create order"}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />Order
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-12 text-gray-400">
                <Loader2 className="h-5 w-5 animate-spin" /><span>Loading…</span>
              </div>
            ) : paged.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No customers found.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paged.map((c) => (
                  <div 
                    key={c.userCode} 
                    className="p-4 hover:bg-green-50/30 transition-colors cursor-pointer"
                    onClick={() => {
                      setHistoryCustomer(c);
                      setHistorySheetOpen(true);
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-gray-800">{c.name}</span>
                          <Badge className={c.isActive ? "bg-green-100 text-green-700 border-green-200 text-xs" : "bg-red-100 text-red-700 border-red-200 text-xs"}>
                            {c.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {c.firmName && (
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Building2 className="h-3 w-3" />{c.firmName}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                          <Phone className="h-3 w-3" />{c.phoneNumber}
                        </p>
                        {c.address?.city && (
                          <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />{c.address.city}, {c.address.state}
                          </p>
                        )}
                        <p className="text-xs font-mono text-gray-400 mt-0.5">{c.userCode}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openOrderSheet(c);
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs h-9 shrink-0"
                        disabled={!c.isActive}
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />Order
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
              <span className="text-xs text-gray-500">
                Showing {Math.min(total, startIdx + 1)}–{Math.min(total, startIdx + pageSize)} of {total}
              </span>
              <Paginator page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Per page:</span>
                <select
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={pageSize}
                  onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }}
                >
                  {[5, 10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Sheet */}
      <CreateOrderSheet
        open={sheetOpen}
        onClose={() => { setSheetOpen(false); setSelectedCustomer(null); }}
        customer={selectedCustomer}
      />

      {/* History Drawer */}
      <UserOrdersDrawer
        open={historySheetOpen}
        onClose={() => { setHistorySheetOpen(false); setHistoryCustomer(null); }}
        customer={historyCustomer}
      />
    </div>
  );
};

export default CustomerManagement;