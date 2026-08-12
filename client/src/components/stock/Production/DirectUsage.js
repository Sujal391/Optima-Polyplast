import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import {
  recordDirectUsage,
  getCurrentStockReport,
} from "../../../services/api/stock";

export default function DirectUsage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // New: Materials list
  const [materials, setMaterials] = useState([]);

  const [formData, setFormData] = useState({
    materialId: "",
    quantity: "",
    purpose: "",
    remarks: "",
    usageDate: new Date().toISOString().split("T")[0],
  });

  // Fetch materials for dropdown
  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const res = await getCurrentStockReport();
      setMaterials(res.data || []);
    } catch (err) {
      console.error("Failed to load materials", err);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.materialId || !formData.quantity || !formData.purpose) {
      setError("Material, Quantity, and Purpose are required.");
      return;
    }

    if (Number(formData.quantity) <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        materialId: formData.materialId,
        quantity: Number(formData.quantity),
        purpose: formData.purpose,
        remarks: formData.remarks,
        usageDate: new Date(formData.usageDate).toISOString(),
      };

      await recordDirectUsage(payload);

      setSuccess("Direct usage recorded successfully!");

      setFormData({
        materialId: "",
        quantity: "",
        purpose: "",
        remarks: "",
        usageDate: new Date().toISOString().split("T")[0],
      });

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to record direct usage");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">

        <h2 className="text-3xl font-bold text-gray-800 mb-6">
          Stock Management
        </h2>

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-10">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            Record Direct Usage
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Material Select (Dropdown) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Material *
              </label>
              <select
                name="materialId"
                value={formData.materialId}
                onChange={handleInput}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Material --</option>

                {materials.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.itemName} ({m.itemCode})
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity *
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInput}
                placeholder="5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Purpose *
              </label>
              <input
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={handleInput}
                placeholder="Machine Maintenance"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Usage Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Usage Date
              </label>
              <input
                type="date"
                name="usageDate"
                value={formData.usageDate}
                onChange={handleInput}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Remarks */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleInput}
                rows="3"
                placeholder="Optional remarks"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              {loading ? "Recording..." : "Record Direct Usage"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
