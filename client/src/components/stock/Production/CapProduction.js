import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/button';
import { Trash2 } from 'lucide-react';
import ProductionList from './ProductionList';

// 👉 API imports
import {
  fetchRawMaterials,
  recordCapProduction,
  getCapProductions,
  getCaps,  // ✅ This import is correct!
} from '../../../services/api/stock';

// Available cap colors
const CAP_COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Yellow', hex: '#FBBF24' },
  { name: 'Black', hex: '#1F2937' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'B.green', hex: '#10B981' },
  { name: 'Dark blue', hex: '#1E3A8A' },
  { name: 'K.blue', hex: '#3B82F6' },
  { name: 'V.purple', hex: '#7C3AED' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'H.pink', hex: '#EC4899' }
];

export default function CapProduction() {
  const [materials, setMaterials] = useState([]);
  const [caps, setCaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Production list state
  const [allProductionData, setAllProductionData] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [listFilters, setListFilters] = useState({
    capType: '',
    capColor: '',
    startDate: '',
    endDate: '',
    period: '',
    page: 1,
    limit: 10,
    sortBy: 'productionDate',
    sortOrder: 'desc'
  });

  const [formData, setFormData] = useState({
    rawMaterials: [],
    caps: [],
    boxesUsed: '',
    bagsUsed: '',
    wastageType1: '',
    wastageType2: '',
    remarks: '',
    productionDate: new Date().toISOString().split('T')[0],
  });

  const [capInput, setCapInput] = useState({
    capId: '',
    capColor: '',
    quantityProduced: '',
  });

  // Raw material input state
  const [materialInput, setMaterialInput] = useState({
    materialId: '',
    quantityUsed: '',
  });

  // Fetch materials, caps, and production data on mount
  useEffect(() => {
    fetchMaterials();
    fetchCaps();
    fetchAllProductionData();
  }, []);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const res = await fetchRawMaterials();
      setMaterials(res.materials || res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch materials');
      console.error('Error fetching materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCaps = async () => {
    try {
      const res = await getCaps();
      setCaps(res.caps || res.data || []);
    } catch (err) {
      console.error('Error fetching caps:', err);
    }
  };

  // Fetch all production data once from API
  const fetchAllProductionData = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await getCapProductions({ limit: 1000 });
      setAllProductionData(res?.data || []);
    } catch (err) {
      setListError(err.message || 'Failed to load production list');
      console.error('Error loading production list:', err);
    } finally {
      setListLoading(false);
    }
  };

  // Apply local filtering, sorting, and pagination
  const applyLocalFilters = (data, filters) => {
    let filtered = [...data];

    if (filters.capType) {
      filtered = filtered.filter(item =>
        item.capType?.toLowerCase().includes(filters.capType.toLowerCase())
      );
    }

    if (filters.capColor) {
      filtered = filtered.filter(item =>
        item.capColor?.toLowerCase().includes(filters.capColor.toLowerCase())
      );
    }

    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(item => new Date(item.productionDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.productionDate) <= endDate);
    }

    const sortBy = filters.sortBy || 'productionDate';
    const sortOrder = filters.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'productionDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / filters.limit) || 1;
    const currentPage = Math.min(filters.page, totalPages);
    const startIndex = (currentPage - 1) * filters.limit;
    const paginatedData = filtered.slice(startIndex, startIndex + filters.limit);

    setPagination({
      currentPage,
      totalPages,
      totalRecords,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    });

    setProductionList(paginatedData);
  };

  useEffect(() => {
    if (allProductionData.length > 0) {
      applyLocalFilters(allProductionData, listFilters);
    }
  }, [allProductionData, listFilters]);

  const handleFilterChange = (key, value) => {
    setListFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page) => {
    setListFilters(prev => ({ ...prev, page }));
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setListFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCapInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'capId') {
      const selectedCap = caps.find(cap => cap._id === value);
      setCapInput(prev => ({
        ...prev,
        capId: value,
        capColor: selectedCap ? selectedCap.color : ''
      }));
      return;
    }
    setCapInput(prev => ({ ...prev, [name]: value }));
  };

  const handleColorSelect = (colorName) => {
    setCapInput(prev => ({ ...prev, capColor: colorName }));
    setError('');
  };

  const handleAddCap = () => {
    if (!capInput.capId || !capInput.quantityProduced) {
      setError('Cap Type and Quantity are required');
      return;
    }
    const selectedCap = caps.find(c => c._id === capInput.capId);
    setFormData(prev => ({
      ...prev,
      caps: [...prev.caps, {
        capId: capInput.capId,
        capTypeDisplay: selectedCap ? `${selectedCap.size || ''} (${selectedCap.neckType || ''})` : 'Unknown',
        capColor: capInput.capColor || (selectedCap ? selectedCap.color : ''),
        quantityProduced: parseInt(capInput.quantityProduced, 10),
      }]
    }));
    setCapInput({ capId: '', capColor: '', quantityProduced: '' });
    setError('');
  };

  const handleRemoveCap = (index) => {
    setFormData(prev => ({
      ...prev,
      caps: prev.caps.filter((_, i) => i !== index)
    }));
  };

  const handleMaterialInputChange = (e) => {
    const { name, value } = e.target;
    setMaterialInput(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddMaterial = () => {
    if (!materialInput.materialId || !materialInput.quantityUsed) {
      setError('Material and Quantity are required');
      return;
    }

    const selectedMaterial = materials.find(m => m._id === materialInput.materialId);

    setFormData(prev => ({
      ...prev,
      rawMaterials: [
        ...prev.rawMaterials,
        {
          materialId: materialInput.materialId,
          materialName: selectedMaterial?.itemName || 'Unknown',
          quantityUsed: parseFloat(materialInput.quantityUsed),
        }
      ]
    }));

    setMaterialInput({ materialId: '', quantityUsed: '' });
    setError('');
  };

  const handleRemoveMaterial = (index) => {
    setFormData(prev => ({
      ...prev,
      rawMaterials: prev.rawMaterials.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (formData.caps.length === 0 || formData.rawMaterials.length === 0) {
      setError('At least one Cap and one Raw Material are required');
      return;
    }

    const hasWastageType1 = formData.wastageType1 && parseFloat(formData.wastageType1) > 0;
    const hasWastageType2 = formData.wastageType2 && parseFloat(formData.wastageType2) > 0;

    try {
      setLoading(true);
      setError('');

      const payload = {
        rawMaterials: formData.rawMaterials.map(m => ({
          materialId: m.materialId,
          quantityUsed: m.quantityUsed,
        })),
        caps: formData.caps.map(c => ({
          capId: c.capId,
          quantityProduced: parseInt(c.quantityProduced, 10)
        })),
        boxesUsed: formData.boxesUsed ? parseInt(formData.boxesUsed, 10) : 0,
        bagsUsed: formData.bagsUsed ? parseInt(formData.bagsUsed, 10) : 0,
        remarks: formData.remarks || '',
        productionDate: formData.productionDate || new Date().toISOString().split('T')[0],
      };

      if (hasWastageType1) {
        payload.wastageType1 = parseFloat(formData.wastageType1);
      }
      if (hasWastageType2) {
        payload.wastageType2 = parseFloat(formData.wastageType2);
      }

      await recordCapProduction(payload);

      setSuccess('Production & Wastage Recorded Successfully!');

      // Reset form
      setFormData({
        rawMaterials: [],
        caps: [],
        boxesUsed: '',
        bagsUsed: '',
        wastageType1: '',
        wastageType2: '',
        remarks: '',
        productionDate: new Date().toISOString().split('T')[0],
      });
      setCapInput({ capId: '', capColor: '', quantityProduced: '' });

      fetchAllProductionData();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record cap production');
    } finally {
      setLoading(false);
    }
  };

  const totalWastage = () => {
    const type1 = parseFloat(formData.wastageType1) || 0;
    const type2 = parseFloat(formData.wastageType2) || 0;
    return type1 + type2;
  };

  // UPDATED: Get cap options with proper values
  const getCapOptions = () => {
    if (!caps.length) return [];
    
    return caps.map(cap => ({
      value: cap._id,  // Use cap._id for capId
      label: cap.size ? `${cap.size} (${cap.neckType || 'N/A'})` : cap.neckType || 'Unknown',
      capType: cap.neckType, // Store cap type for display
      size: cap.size // Store size for display
    }));
  };

  // Helper to get selected cap display name
  const getSelectedCapDisplay = () => {
    if (!formData.capId) return '';
    const selectedCap = caps.find(cap => cap._id === formData.capId);
    if (!selectedCap) return '';
    return selectedCap.size ? `${selectedCap.size} (${selectedCap.neckType || 'N/A'})` : selectedCap.neckType || 'Unknown';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
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

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Record Cap Production</h3>

        {/* Raw Materials Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Raw Materials Used</h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Material *
              </label>
              <select
                name="materialId"
                value={materialInput.materialId}
                onChange={handleMaterialInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">-- Select Material --</option>
                {materials.map(material => (
                  <option key={material._id} value={material._id}>
                    {material.itemName} ({material.itemCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Used *
              </label>
              <input
                type="number"
                name="quantityUsed"
                value={materialInput.quantityUsed}
                onChange={handleMaterialInputChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <Button
                onClick={handleAddMaterial}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                Add Material
              </Button>
            </div>
          </div>

          {formData.rawMaterials.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="font-semibold text-gray-700 mb-2">Added Materials:</h5>
              <div className="space-y-2">
                {formData.rawMaterials.map((material, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
                    <span className="text-sm text-gray-700">
                      {material.materialName} - {material.quantityUsed} units
                    </span>
                    <button
                      onClick={() => handleRemoveMaterial(index)}
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

        {/* Production Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pb-6 border-b border-gray-200">
          <div className="md:col-span-2">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Add Cap Type</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cap Type *</label>
                <select
                  name="capId"
                  value={capInput.capId}
                  onChange={handleCapInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">-- Select Cap Type --</option>
                  {caps.map((cap) => (
                    <option key={cap._id} value={cap._id}>
                      {cap.size} ({cap.neckType}) - {cap.color}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Produced *</label>
                <input
                  type="number"
                  name="quantityProduced"
                  value={capInput.quantityProduced}
                  onChange={handleCapInputChange}
                  placeholder="0"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex items-end">
                <Button onClick={handleAddCap} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Add Cap
                </Button>
              </div>
            </div>

            {/* Cap Color Selector */}
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cap Color (Auto-selected or override) *</label>
              <div className={`flex flex-wrap gap-3 ${capInput.capId ? 'opacity-90' : ''}`}>
                {CAP_COLORS.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorSelect(color.name)}
                    className={`relative group transition-all ${
                      capInput.capColor === color.name ? 'ring-4 ring-blue-500 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300 hover:ring-offset-2'
                    }`}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: color.hex, border: color.name === 'White' ? '2px solid #D1D5DB' : '2px solid transparent', cursor: 'pointer' }}
                  >
                    {capInput.capColor === color.name && (
                      <svg className="absolute inset-0 m-auto" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.name === 'White' || color.name === 'Yellow' ? '#000' : '#FFF'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {formData.caps.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-3 mt-4">
                <h5 className="font-semibold text-gray-700 mb-2">Added Caps:</h5>
                <div className="space-y-2">
                  {formData.caps.map((cap, index) => (
                    <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
                      <span className="text-sm text-gray-700">
                        {cap.capTypeDisplay} ({cap.capColor}) - {cap.quantityProduced} units
                      </span>
                      <button onClick={() => handleRemoveCap(index)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boxes Used
            </label>
            <input
              type="number"
              name="boxesUsed"
              value={formData.boxesUsed}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bags Used
            </label>
            <input
              type="number"
              name="bagsUsed"
              value={formData.bagsUsed}
              onChange={handleInputChange}
              placeholder="0"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Date
            </label>
            <input
              type="date"
              name="productionDate"
              value={formData.productionDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              placeholder="Optional remarks"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Wastage Details Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Wastage Details (Optional)</h4>
          <p className="text-sm text-gray-600 mb-4">
            Enter wastage quantities by type. It will automatically create separate wastage records for each type.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type 1: Reusable Wastage
              </label>
              <input
                type="number"
                name="wastageType1"
                value={formData.wastageType1}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Wastage that can be reused</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type 2: Non-reusable / Scrap
              </label>
              <input
                type="number"
                name="wastageType2"
                value={formData.wastageType2}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Wastage that cannot be reused (scrap)</p>
            </div>
          </div>

          {(formData.wastageType1 || formData.wastageType2) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Total Wastage:</span>
                <span className="text-lg font-semibold text-blue-700">{totalWastage()} units</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                It will automatically create separate wastage records for each type
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            {loading ? 'Recording...' : 'Record Cap Production'}
          </Button>
        </div>
      </div>

      {/* Production List - No changes needed here */}
      <div className="mt-8">
        <ProductionList
          title="Cap Production History"
          data={productionList}
          loading={listLoading}
          error={listError}
          pagination={pagination}
          columns={[
            { key: 'capType', label: 'Cap Type', render: (row) => row.capType || 'N/A' },
            { key: 'capColor', label: 'Color', render: (row) => row.capColor || 'N/A' },
            { key: 'quantityProduced', label: 'Quantity Produced', render: (row) => row.quantityProduced || 0 },
            { key: 'wastageType1', label: 'Reusable Wastage', render: (row) => row.wastageType1 || 0 },
            { key: 'wastageType2', label: 'Scrap Wastage', render: (row) => row.wastageType2 || 0 },
            { key: 'productionDate', label: 'Production Date', render: (row) => new Date(row.productionDate).toLocaleDateString() },
            { key: 'recordedBy', label: 'Recorded By', render: (row) => row.recordedBy?.name || 'N/A' }
          ]}
          filterOptions={[
            { key: 'capType', label: 'Cap Type', type: 'text', placeholder: 'Enter cap type...' },
            {
              key: 'capColor',
              label: 'Cap Color',
              type: 'select',
              options: CAP_COLORS.map(c => ({ value: c.name, label: c.name }))
            }
          ]}
          filters={listFilters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          sortBy={listFilters.sortBy}
          sortOrder={listFilters.sortOrder}
          sortableColumns={['capType', 'capColor', 'quantityProduced', 'productionDate', 'wastageType1', 'wastageType2']}
          showDateFilters={true}
          showPeriodFilter={true}
          showReportButton={true}
          reportSummary={reportSummary}
        />
      </div>
    </div>
  );
}