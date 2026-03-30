import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";
import { addOutcomeItem, fetchOutcomeItems, fetchProductionOutcomes, recordProductionOutcome, fetchRawMaterials } from "../../services/api/stock";
import { X, Plus, Trash2, Package } from "lucide-react";
import Paginator from "../common/Paginator";

export default function Outcome() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isEntriesModalOpen, setIsEntriesModalOpen] = useState(false);
  const [selectedOutcomeItem, setSelectedOutcomeItem] = useState(null);

  const [items, setItems] = useState([]);
  const [productionOutcomes, setProductionOutcomes] = useState([]);
  const [materials, setMaterials] = useState([]);
  
  // Pagination for production entries
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [formData, setFormData] = useState({
    itemName: "",
    itemCode: "",
    type: "",
    subcategory: "",
    remarks: "",
  });

  // Production outcome form state
  const [productionFormData, setProductionFormData] = useState({
    rawMaterials: [],
    wastageKg: "",
    remarks: "",
    outcomes: [],
    productionDate: new Date().toISOString().split("T")[0],
  });

  // Raw material input form state
  const [rawMaterialForm, setRawMaterialForm] = useState({
    materialId: "",
    quantityUsed: "",
  });

  // Outcome item form state
  const [outcomeForm, setOutcomeForm] = useState({
    outcomeItemId: "",
    quantityCreatedKg: "",
  });

  // Fetch all outcome items
  const loadOutcomeItems = async () => {
    try {
      const res = await fetchOutcomeItems();
      setItems(res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch production outcomes
  const loadProductionOutcomes = async () => {
    try {
      const res = await fetchProductionOutcomes();
      setProductionOutcomes(res?.outcomes || res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch raw materials
  const loadRawMaterials = async () => {
    try {
      const res = await fetchRawMaterials();
      setMaterials(res?.materials || res?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadOutcomeItems();
    loadProductionOutcomes();
    loadRawMaterials();
  }, []);

  // Input change handler for add outcome form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit handler for adding outcome item
  const handleSubmit = async () => {
    setError("");
    setSuccess("");

    if (!formData.itemName || !formData.itemCode || !formData.type) {
      setError("Item Name, Item Code, and Type are required.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        itemName: formData.itemName,
        itemCode: formData.itemCode,
        type: formData.type,
        subcategory: formData.subcategory,
        remarks: formData.remarks,
      };

      await addOutcomeItem(payload);

      setSuccess("Outcome item added successfully!");
      setFormData({
        itemName: "",
        itemCode: "",
        type: "",
        subcategory: "",
        remarks: "",
      });

      loadOutcomeItems();
      setIsAddModalOpen(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to add outcome item");
    } finally {
      setLoading(false);
    }
  };

  // Production outcome handlers
  const handleProductionInputChange = (e) => {
    const { name, value } = e.target;
    setProductionFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRawMaterialInputChange = (e) => {
    const { name, value } = e.target;
    setRawMaterialForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddRawMaterial = () => {
    if (!rawMaterialForm.materialId || !rawMaterialForm.quantityUsed) {
      setError("Raw Material and Quantity are required");
      return;
    }

    if (
      productionFormData.rawMaterials.some(
        (m) => m.materialId === rawMaterialForm.materialId
      )
    ) {
      setError("This raw material is already added");
      return;
    }

    const selectedMaterial = materials.find(
      (m) => m._id === rawMaterialForm.materialId
    );

    setProductionFormData((prev) => ({
      ...prev,
      rawMaterials: [
        ...prev.rawMaterials,
        {
          materialId: rawMaterialForm.materialId,
          materialName: selectedMaterial?.itemName || "Unknown",
          materialCode: selectedMaterial?.itemCode || "",
          quantityUsed: parseFloat(rawMaterialForm.quantityUsed),
        },
      ],
    }));

    setRawMaterialForm({ materialId: "", quantityUsed: "" });
    setError("");
  };

  const handleRemoveRawMaterial = (index) => {
    setProductionFormData((prev) => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter((_, i) => i !== index),
    }));
  };

  const handleOutcomeInputChange = (e) => {
    const { name, value } = e.target;
    setOutcomeForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddOutcome = () => {
    if (!outcomeForm.outcomeItemId || !outcomeForm.quantityCreatedKg) {
      setError("Outcome Item and Quantity are required");
      return;
    }

    const selectedOutcomeItem = items.find(
      (i) => i._id === outcomeForm.outcomeItemId
    );

    setProductionFormData((prev) => ({
      ...prev,
      outcomes: [
        ...prev.outcomes,
        {
          outcomeItemId: outcomeForm.outcomeItemId,
          outcomeItemName: selectedOutcomeItem?.itemName || "Unknown",
          quantityCreatedKg: parseFloat(outcomeForm.quantityCreatedKg),
        },
      ],
    }));

    setOutcomeForm({ outcomeItemId: "", quantityCreatedKg: "" });
    setError("");
  };

  const handleRemoveOutcome = (index) => {
    setProductionFormData((prev) => ({
      ...prev,
      outcomes: prev.outcomes.filter((_, i) => i !== index),
    }));
  };

  const totalRawMaterialsKg = productionFormData.rawMaterials.reduce(
    (sum, m) => sum + (m.quantityUsed || 0),
    0
  );

  const handleRecordProduction = async () => {
    if (
      productionFormData.rawMaterials.length === 0 ||
      productionFormData.outcomes.length === 0
    ) {
      setError("At least one Raw Material and one Outcome are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        rawMaterials: productionFormData.rawMaterials.map((m) => ({
          materialId: m.materialId.trim(),
          quantityUsed: parseFloat(m.quantityUsed),
        })),
        outcomes: productionFormData.outcomes.map((o) => ({
          outcomeItemId: o.outcomeItemId.trim(),
          quantityCreatedKg: parseFloat(o.quantityCreatedKg),
        })),
        wastageKg: productionFormData.wastageKg
          ? parseFloat(productionFormData.wastageKg)
          : 0,
        remarks: productionFormData.remarks || "",
        productionDate:
          productionFormData.productionDate ||
          new Date().toISOString().split("T")[0],
      };

      for (const material of payload.rawMaterials) {
        if (!material.materialId || material.quantityUsed <= 0) {
          setError("All raw materials must have valid item and quantity");
          return;
        }
      }

      for (const outcome of payload.outcomes) {
        if (!outcome.outcomeItemId || outcome.quantityCreatedKg <= 0) {
          setError("All outcomes must have valid item and quantity");
          return;
        }
      }

      await recordProductionOutcome(payload);

      setSuccess("Production outcome recorded successfully!");

      setProductionFormData({
        rawMaterials: [],
        wastageKg: "",
        remarks: "",
        outcomes: [],
        productionDate: new Date().toISOString().split("T")[0],
      });

      await loadProductionOutcomes();
      setIsRecordModalOpen(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error recording production:", err);
      setError(
        err.message ||
          err.response?.data?.message ||
          "Failed to record production"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRecordModal = (item) => {
    setSelectedOutcomeItem(item);
    setProductionFormData({
      rawMaterials: [],
      wastageKg: "",
      remarks: "",
      outcomes: [],
      productionDate: new Date().toISOString().split("T")[0],
    });
    setOutcomeForm({ outcomeItemId: item._id, quantityCreatedKg: "" });
    setIsRecordModalOpen(true);
    setError("");
  };

  // Pagination for production entries
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedOutcomes = productionOutcomes.slice(startIdx, endIdx);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Buttons */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">
            Outcome Management
          </h2>
          <div className="flex gap-3">
            <Button
              onClick={() => setIsEntriesModalOpen(true)}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              All Outcome Entries
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              Add Outcome
            </Button>
          </div>
        </div>

        <div>
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          {/* List Section */}
          <div className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Outcome Items
            </h3>

            {items.length === 0 ? (
              <p className="text-gray-600">No items found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        Item Name
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        Item Code
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        Type
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        Subcategory
                      </th>
                      <th className="px-4 py-3 border-b text-left text-sm font-semibold text-gray-700">
                        Remarks
                      </th>
                      <th className="px-4 py-3 border-b text-center text-sm font-semibold text-gray-700">
                        Actions
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item, index) => (
                      <tr
                        key={item._id}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-4 py-3 border-b text-sm text-gray-800">
                          {item.itemName}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-600">
                          {item.itemCode}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-600 capitalize">
                          {item.type}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-600">
                          {item.subcategory || "-"}
                        </td>
                        <td className="px-4 py-3 border-b text-sm text-gray-600">
                          {item.remarks || "-"}
                        </td>
                        <td className="px-4 py-3 border-b text-center">
                          <button
                            onClick={() => handleOpenRecordModal(item)}
                            className="inline-flex items-center justify-center p-2 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition"
                            title="Record Production"
                          >
                            <Package size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Outcome Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-semibold text-gray-800">
                Add Outcome Item
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    name="itemName"
                    value={formData.itemName}
                    onChange={handleInputChange}
                    placeholder="Preform 500ml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    name="itemCode"
                    value={formData.itemCode}
                    onChange={handleInputChange}
                    placeholder="PREFORM_500"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Select Type</option>
                    <option value="preform">Preform</option>
                    <option value="cap">Cap</option>
                    <option value="bottle">Bottle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <input
                    type="text"
                    name="subcategory"
                    value={formData.subcategory}
                    onChange={handleInputChange}
                    placeholder="500ml"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Optional remarks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                onClick={() => setIsAddModalOpen(false)}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Outcome Item"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Production Outcome Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full my-8">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-semibold text-gray-800">
                Record Production Outcome
                {selectedOutcomeItem && (
                  <span className="text-lg text-amber-600 ml-2">
                    - {selectedOutcomeItem.itemName}
                  </span>
                )}
              </h3>
              <button
                onClick={() => setIsRecordModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              {/* Raw Materials Section */}
              <div className="border-b pb-4 mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Raw Materials Used
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Raw Material *
                    </label>
                    <select
                      name="materialId"
                      value={rawMaterialForm.materialId}
                      onChange={handleRawMaterialInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Material --</option>
                      {materials.map((material) => (
                        <option key={material._id} value={material._id}>
                          {material.itemName} ({material.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Used (Kg) *
                    </label>
                    <input
                      type="number"
                      name="quantityUsed"
                      value={rawMaterialForm.quantityUsed}
                      onChange={handleRawMaterialInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleAddRawMaterial}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      <Plus size={16} className="mr-1" /> Add Material
                    </Button>
                  </div>
                </div>

                {productionFormData.rawMaterials.length > 0 && (
                  <div className="bg-amber-50 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-semibold text-gray-700">
                        Added Raw Materials:
                      </h5>
                      <span className="text-sm font-medium text-amber-600">
                        Total: {totalRawMaterialsKg.toFixed(2)} Kg
                      </span>
                    </div>
                    <div className="space-y-2">
                      {productionFormData.rawMaterials.map((material, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-white p-2 rounded border border-amber-200"
                        >
                          <span className="text-sm text-gray-700">
                            {material.materialName} ({material.materialCode}) -{" "}
                            {material.quantityUsed} Kg
                          </span>
                          <button
                            onClick={() => handleRemoveRawMaterial(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Other Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Wastage (Kg)
                  </label>
                  <input
                    type="number"
                    name="wastageKg"
                    value={productionFormData.wastageKg}
                    onChange={handleProductionInputChange}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Production Date
                  </label>
                  <input
                    type="date"
                    name="productionDate"
                    value={productionFormData.productionDate}
                    onChange={handleProductionInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Remarks
                  </label>
                  <input
                    type="text"
                    name="remarks"
                    value={productionFormData.remarks}
                    onChange={handleProductionInputChange}
                    placeholder="Optional remarks"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Outcomes Section */}
              <div className="border-t pt-4 mt-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">
                  Production Outcomes
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Outcome Item *
                    </label>
                    <select
                      name="outcomeItemId"
                      value={outcomeForm.outcomeItemId}
                      onChange={handleOutcomeInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- Select Item --</option>
                      {items.map((item) => (
                        <option key={item._id} value={item._id}>
                          {item.itemName} ({item.itemCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity Created (Kg) *
                    </label>
                    <input
                      type="number"
                      name="quantityCreatedKg"
                      value={outcomeForm.quantityCreatedKg}
                      onChange={handleOutcomeInputChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <Button
                      onClick={handleAddOutcome}
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                    >
                      Add Outcome
                    </Button>
                  </div>
                </div>

                {productionFormData.outcomes.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-4">
                    <h5 className="font-semibold text-gray-700 mb-2">
                      Added Outcomes:
                    </h5>
                    <div className="space-y-2">
                      {productionFormData.outcomes.map((outcome, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center bg-white p-2 rounded border border-gray-200"
                        >
                          <span className="text-sm text-gray-700">
                            {outcome.outcomeItemName} -{" "}
                            {outcome.quantityCreatedKg} Kg
                          </span>
                          <button
                            onClick={() => handleRemoveOutcome(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t">
              <Button
                onClick={() => setIsRecordModalOpen(false)}
                className="bg-gray-300 text-gray-700 hover:bg-gray-400"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRecordProduction}
                className="bg-amber-600 text-white hover:bg-amber-700"
                disabled={loading}
              >
                {loading ? "Recording..." : "Record Production"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* All Outcome Entries Modal */}
      {isEntriesModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-2xl font-semibold text-gray-800">
                All Production Outcome Entries
              </h3>
              <button
                onClick={() => setIsEntriesModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {productionOutcomes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    No production outcomes found. Record one to get started!
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300 rounded-lg">
                    <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold">
                          Raw Materials
                        </th>
                        <th className="px-6 py-3 text-left font-semibold">
                          Total Used (Kg)
                        </th>
                        <th className="px-6 py-3 text-left font-semibold">
                          Outcomes
                        </th>
                        <th className="px-6 py-3 text-left font-semibold">
                          Wastage (Kg)
                        </th>
                        <th className="px-6 py-3 text-left font-semibold">
                          Remarks
                        </th>
                        <th className="px-6 py-3 text-left font-semibold">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedOutcomes.map((outcome, index) => (
                        <tr
                          key={outcome._id}
                          className={`border-b hover:bg-gray-50 transition ${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          }`}
                        >
                          <td className="px-6 py-4 font-medium text-gray-800">
                            <div className="text-sm">
                              {outcome.rawMaterials &&
                              outcome.rawMaterials.length > 0 ? (
                                outcome.rawMaterials.map((m, i) => (
                                  <div key={m._id || i} className="mb-1">
                                    <span className="font-medium">
                                      {m.material?.itemName || "N/A"}
                                    </span>
                                    <span className="text-gray-500 ml-1">
                                      ({m.quantityUsed} Kg)
                                    </span>
                                  </div>
                                ))
                              ) : (
                                outcome.rawMaterial?.itemName || "N/A"
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {outcome.usedRawMaterialKg} Kg
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            <div className="text-sm">
                              {outcome.outcomes?.map((o, i) => (
                                <div key={i}>
                                  {o.outcomeItem?.itemName || "N/A"}:{" "}
                                  {o.quantityCreatedKg} Kg
                                </div>
                              )) || "-"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {outcome.wastageKg || 0} Kg
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {outcome.remarks || "-"}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {new Date(outcome.productionDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {productionOutcomes.length > 0 && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {Math.min(productionOutcomes.length, startIdx + 1)}–
                  {Math.min(productionOutcomes.length, endIdx)} of{" "}
                  {productionOutcomes.length}
                </div>
                <Paginator
                  page={page}
                  total={productionOutcomes.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                />
                <select
                  className="border rounded px-2 py-1 text-sm"
                  value={pageSize}
                  onChange={(e) => {
                    setPage(1);
                    setPageSize(parseInt(e.target.value, 10));
                  }}
                >
                  {[5, 10, 20, 50].map((n) => (
                    <option key={n} value={n}>
                      {n} / page
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}