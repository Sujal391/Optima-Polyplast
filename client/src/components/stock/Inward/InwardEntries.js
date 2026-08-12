import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import Paginator from '../../common/Paginator';
import { getCurrentStockReport, fetchInwardEntries, recordInwardEntry } from '../../../services/api/stock';

export default function InwardEntries() {
  const [materials, setMaterials] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Form state
  const [formData, setFormData] = useState({
    rawMaterialId: '',
    quantityKg: '',
    remarks: '',
  });

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [materialsRes, entriesRes] = await Promise.all([
        getCurrentStockReport(),
        fetchInwardEntries(),
      ]);
      
      setMaterials(materialsRes.data || []);
      setEntries(entriesRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveEntry = async () => {
    if (!formData.rawMaterialId || !formData.quantityKg) {
      setError('Raw Material and Quantity are required');
      return;
    }

    const quantity = parseFloat(formData.quantityKg);
    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await recordInwardEntry({
        rawMaterialId: formData.rawMaterialId,
        quantityKg: quantity,
        remarks: formData.remarks || undefined,
      });
      
      setSuccess(response.message || 'Raw material entry added successfully');
      setFormData({ rawMaterialId: '', quantityKg: '', remarks: '' });
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record entry');
    } finally {
      setLoading(false);
    }
  };

  // Pagination
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedEntries = entries.slice(startIdx, endIdx);

  return (
    <div>
      {/* Success Message */}
      {success && (
        <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
          {success}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Form Section */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Record New Entry</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Raw Material *
            </label>
            <select
              name="rawMaterialId"
              value={formData.rawMaterialId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">-- Select Material --</option>
              {materials.map(material => (
                // <option key={material._id} value={material._id}>
                //   {material.itemName} ({material.itemCode}) - Stock: {material.currentStock} {material.unit}
                //   {material.lowStockAlert ? ' ⚠️ Low Stock' : ''}
                // </option>
                <option key={material._id} value={material._id}>
                  {material.itemName} ({material.itemCode})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity (Kg) *
            </label>
            <input
              type="number"
              name="quantityKg"
              value={formData.quantityKg}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Optional remarks"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSaveEntry}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Saving...' : 'Save Entry'}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      )}

      {/* Entries Table */}
      {!loading && entries.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Material Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Item Code</th>
                  <th className="px-6 py-3 text-left font-semibold">Quantity</th>
                  <th className="px-6 py-3 text-left font-semibold">Remarks</th>
                  <th className="px-6 py-3 text-left font-semibold">Entered By</th>
                  <th className="px-6 py-3 text-left font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEntries.map((entry, index) => (
                  <tr
                    key={entry._id}
                    className={`border-b hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {entry.rawMaterial?.itemName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {entry.rawMaterial?.itemCode || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {entry.quantityKg} {entry.rawMaterial?.unit || 'Kg'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {entry.remarks || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {entry.enteredBy?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {new Date(entry.entryDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between px-6 pb-6">
            <div className="text-sm text-gray-600">
              Showing {Math.min(entries.length, startIdx + 1)}–{Math.min(entries.length, endIdx)} of {entries.length}
            </div>
            <Paginator page={page} total={entries.length} pageSize={pageSize} onPageChange={setPage} />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No inward entries found. Record one to get started!</p>
        </div>
      )}
    </div>
  );
}