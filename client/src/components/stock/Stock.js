import { useState, useEffect } from "react";
import axios from "axios";
import cookies from "js-cookie";
import { Package, X, RotateCcw, History, ChevronRight, Plus } from "lucide-react";

const api = axios.create({ baseURL: process.env.REACT_APP_API });
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

export default function StockManagement() {
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [products, setProducts]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [formData, setFormData]         = useState({ boxes: "", changeType: "addition", notes: "" });
  const [error, setError]               = useState("");
  const [history, setHistory]           = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTitle, setHistoryTitle] = useState("Stock History");
  const [expanded, setExpanded]         = useState(null);

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get("/stock/products");
      if (response.data?.success) setProducts(response.data.data);
      else setError("No product data available");
    } catch (err) {
      setError("Error fetching stock data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStockHistory = async (productId, productName) => {
    try {
      const response = await api.get(`/stock/history/${productId}`);
      if (response.data?.success) {
        const processedHistory = response.data.data.updateHistory.map((update) => ({
          ...update,
          productId: { _id: response.data.data.productId._id, name: response.data.data.productId.name },
        }));
        setHistory(processedHistory);
        setHistoryTitle(`History of ${productName}`);
        setIsHistoryOpen(true);
      } else {
        setError("No stock history found for this product.");
      }
    } catch (err) {
      setError("Error fetching stock history: " + err.message);
    }
  };

  const getAllStockHistory = async () => {
    try {
      const response = await api.get("/stock/history");
      if (response.data?.success) {
        const allHistory = response.data.data.flatMap((stock) =>
          stock.updateHistory.map((update) => ({ ...update, productId: stock.productId }))
        );
        setHistory(allHistory);
        setHistoryTitle("All Stock History");
        setIsHistoryOpen(true);
      } else {
        setError("No stock history found.");
      }
    } catch (err) {
      setError("Error fetching stock history: " + err.message);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const updateStock = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !formData.boxes) { setError("Please fill in all required fields."); return; }
    try {
      const userId   = cookies.get("userId");
      const response = await api.put("/stock/update-quantity", {
        productId: selectedProduct, boxes: formData.boxes,
        changeType: formData.changeType, notes: formData.notes, updatedBy: userId,
      });
      if (response.data.success) {
        setIsFormOpen(false);
        setFormData({ boxes: "", changeType: "addition", notes: "" });
        setSelectedProduct("");
        fetchProducts();
      } else {
        setError("Failed to update stock: " + response.data.message);
      }
    } catch (err) {
      setError("Error updating stock: " + (err.response?.data?.message || err.message));
    }
  };

  const toggleDescription = (id) => setExpanded(expanded === id ? null : id);

  const changeTypeColor = (type) => {
    if (type === "addition")   return "text-green-600 bg-green-50 border-green-100";
    if (type === "reduction")  return "text-red-600 bg-red-50 border-red-100";
    return "text-amber-600 bg-amber-50 border-amber-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <Package className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Stock Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">Manage finished goods inventory</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={getAllStockHistory}
              className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-white text-amber-700
                         rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors shadow-sm"
            >
              <History className="h-4 w-4" />
              View All History
            </button>
            <button
              onClick={() => setIsFormOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white
                         rounded-xl text-sm font-medium transition-colors shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Update Boxes
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-start gap-2">
            <X className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto"><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" />
          </div>
        )}

        {/* Products Grid */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product) => {
              const isExp = expanded === product._id;
              const short = product.description?.length > 100
                ? product.description.slice(0, 100) + "..."
                : product.description;

              return (
                <div
                  key={product._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {product.image && (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-44 object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="p-5">
                    <h3 className="text-base font-semibold text-gray-900">{product.name}</h3>
                    <div className="flex gap-2 mt-1 mb-3">
                      {product.type && (
                        <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                          {product.type}
                        </span>
                      )}
                      {product.category && (
                        <span className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-sm text-gray-500 leading-relaxed mb-3">
                        {isExp ? product.description : short}
                        {product.description?.length > 100 && (
                          <button
                            onClick={() => toggleDescription(product._id)}
                            className="text-amber-600 font-medium ml-1 hover:underline"
                          >
                            {isExp ? "Read Less" : "Read More"}
                          </button>
                        )}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-50">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Boxes</p>
                        <p className="text-lg font-bold text-amber-600">{product.boxes ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Per Box</p>
                        <p className="text-base font-semibold text-gray-700">{product.bottlesPerBox ?? "—"}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => getStockHistory(product._id, product.name)}
                      className="mt-3 w-full flex items-center justify-center gap-1.5 text-sm font-medium
                                 text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      View History <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!loading && products.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-medium">No products found.</p>
          </div>
        )}
      </div>

      {/* ── Update Stock Modal ─────────────────────────────────────────── */}
      {isFormOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setIsFormOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg">
                <RotateCcw className="h-5 w-5 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Update Stock</h3>
            </div>

            <form className="space-y-4" onSubmit={updateStock}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Product <span className="text-red-500">*</span></label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  value={selectedProduct}
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product._id} value={product._id}>
                      {product.name} ({product.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Boxes <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="boxes"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={formData.boxes}
                  onChange={handleInputChange}
                  placeholder="Enter number of boxes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Change Type</label>
                <select
                  name="changeType"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  value={formData.changeType}
                  onChange={handleInputChange}
                >
                  <option value="addition">Addition</option>
                  <option value="reduction">Reduction</option>
                  <option value="adjustment">Adjustment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Enter notes"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── History Modal ──────────────────────────────────────────────── */}
      {isHistoryOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setIsHistoryOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-800">{historyTitle}</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Product", "Updated By", "Boxes", "Change Type", "Notes", "Date"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((entry, index) => (
                    <tr key={index} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-800">{entry.productId?.name || "N/A"}</td>
                      <td className="px-4 py-3 text-gray-600">{entry.updatedBy?.name || "N/A"}</td>
                      <td className="px-4 py-3 font-semibold text-amber-600">{entry.boxes}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${changeTypeColor(entry.changeType)}`}>
                          {entry.changeType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{entry.notes || "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(entry.updatedAt).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
