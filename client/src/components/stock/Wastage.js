import React, { useEffect, useState } from "react";
import { updateWastageReuse, getWastageReport } from "../../services/api/stock";
import { Recycle, X, AlertTriangle } from "lucide-react";

export default function Wastage() {
  const [loading, setLoading]       = useState(false);
  const [success, setSuccess]       = useState("");
  const [error, setError]           = useState("");
  const [wastageList, setWastageList] = useState([]);

  const [reuseModal, setReuseModal] = useState({
    open: false, wastageId: null, wastageType: "", quantityGenerated: 0, quantityReused: 0,
  });
  const [reuseData, setReuseData] = useState({ quantityReused: "", reuseReference: "", remarks: "" });

  const loadWastage = async () => {
    try {
      const res = await getWastageReport();
      setWastageList(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadWastage(); }, []);

  const handleReuseChange = (e) => {
    const { name, value } = e.target;
    setReuseData((p) => ({ ...p, [name]: value }));
  };

  const handleReuseSubmit = async () => {
    setError(""); setSuccess("");
    const { wastageId, wastageType, quantityGenerated, quantityReused } = reuseModal;

    if (wastageType === "Type 2: Non-reusable / Scrap") {
      setError("Type 2 (Non-reusable / Scrap) wastage cannot be reused.");
      return;
    }
    const newReuse = Number(reuseData.quantityReused);
    if (newReuse <= 0) { setError("Reuse quantity must be greater than 0."); return; }
    if (newReuse + quantityReused > quantityGenerated) {
      setError(`Cannot reuse more than generated. Generated: ${quantityGenerated}, Already reused: ${quantityReused}, Trying: ${newReuse}`);
      return;
    }

    try {
      setLoading(true);
      await updateWastageReuse({ wastageId, quantityReused: newReuse, reuseReference: reuseData.reuseReference, remarks: reuseData.remarks });
      setSuccess("Reuse recorded successfully!");
      setReuseModal({ open: false, wastageId: null, wastageType: "" });
      setReuseData({ quantityReused: "", reuseReference: "", remarks: "" });
      await loadWastage();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to record reuse");
    } finally {
      setLoading(false);
    }
  };

  const getTypeBadge = (type) => {
    if (type === "Type 1: Reusable Wastage") {
      return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">♻ Reusable</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">✕ Non-reusable</span>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <Recycle className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Wastage Management</h1>
            <p className="text-sm text-slate-500 mt-0.5">Track and reuse production wastage</p>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 flex items-center gap-2 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
            <span className="font-medium">{success}</span>
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Info Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> Wastage records are created automatically during production (Preform, Cap, or Bottle).
            This page allows you to view all wastage records and reuse <strong>Type 1 (Reusable)</strong> wastage only.
          </p>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Wastage Records</h2>
            <p className="text-sm text-gray-500">{wastageList.length} records found</p>
          </div>

          {wastageList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Recycle className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No wastage records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Source</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Generated</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Reused</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Scrapped</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    <th className="px-5 py-3.5 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {wastageList.map((item) => (
                    <tr key={item._id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-5 py-4">{getTypeBadge(item.wastageType)}</td>
                      <td className="px-5 py-4 text-gray-600 font-medium">{item.source}</td>
                      <td className="px-5 py-4 text-center font-semibold text-gray-800">{item.quantityGenerated}</td>
                      <td className="px-5 py-4 text-center text-green-600 font-semibold">{item.quantityReused}</td>
                      <td className="px-5 py-4 text-center text-red-500 font-semibold">{item.quantityScrapped}</td>
                      <td className="px-5 py-4 text-gray-500">{new Date(item.date).toLocaleDateString("en-IN")}</td>
                      <td className="px-5 py-4 text-center">
                        {item.wastageType === "Type 1: Reusable Wastage" ? (
                          <button
                            onClick={() => setReuseModal({
                              open: true, wastageId: item._id, wastageType: item.wastageType,
                              quantityGenerated: item.quantityGenerated, quantityReused: item.quantityReused,
                            })}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700
                                       text-white text-xs font-medium rounded-lg transition-colors"
                          >
                            <Recycle className="h-3.5 w-3.5" />
                            Reuse
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Cannot Reuse</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Reuse Modal ────────────────────────────────────────────────── */}
      {reuseModal.open && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={() => setReuseModal({ open: false })}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReuseModal({ open: false })}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-green-100 rounded-lg">
                <Recycle className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800">Record Wastage Reuse</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5 p-3 bg-gray-50 rounded-xl text-sm">
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Generated</p>
                <p className="font-semibold text-gray-800">{reuseModal.quantityGenerated}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Already Reused</p>
                <p className="font-semibold text-green-600">{reuseModal.quantityReused}</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reuse Quantity <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="quantityReused"
                  value={reuseData.quantityReused}
                  onChange={handleReuseChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Enter quantity"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reuse Reference</label>
                <input
                  type="text"
                  name="reuseReference"
                  value={reuseData.reuseReference}
                  onChange={handleReuseChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm"
                  placeholder="Batch number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Remarks</label>
                <textarea
                  rows={3}
                  name="remarks"
                  value={reuseData.remarks}
                  onChange={handleReuseChange}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setReuseModal({ open: false })}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReuseSubmit}
                disabled={loading}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {loading ? "Saving..." : "Save Reuse"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
