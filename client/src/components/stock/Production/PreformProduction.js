import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import ProductionList from './ProductionList';
import {
  fetchRawMaterials,
  recordPreformProduction,
  getPreformProductions,
  getPreformTypeList
} from '../../../services/api/stock';
import { Trash2 } from 'lucide-react';
import PreformDetails from './PreformDetails';

export default function PreformProduction() {
  const [materials, setMaterials] = useState([]);
  const [preformTypes, setPreformTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Production list state
  const [allProductionData, setAllProductionData] = useState([]); // Full dataset
  const [productionList, setProductionList] = useState([]); // Filtered/paginated data
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [reportSummary, setReportSummary] = useState(null);
  const [listFilters, setListFilters] = useState({
    preformType: '',
    startDate: '',
    endDate: '',
    period: '',
    page: 1,
    limit: 10,
    sortBy: 'productionDate',
    sortOrder: 'desc'
  });

  // Form state
  const [formData, setFormData] = useState({
    rawMaterials: [],
    preformTypeId: '',
    quantityProduced: '',
    wastageType1: '',
    wastageType2: '',
    remarks: '',
    productionDate: new Date().toISOString().split('T')[0],
  });

  // Raw material input state
  const [materialInput, setMaterialInput] = useState({
    materialId: '',
    quantityUsed: '',
  });

  // Fetch materials and production data on mount
  useEffect(() => {
    fetchMaterials();
    fetchPreformTypes();
    fetchAllProductionData();
  }, []);

  const fetchPreformTypes = async () => {
    try {
      const res = await getPreformTypeList();
      const data = res?.data || res || [];
      setPreformTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching preform types:', err);
    }
  };

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

  // Fetch all production data once from API
  const fetchAllProductionData = async () => {
    setListLoading(true);
    setListError(null);
    try {
      // Fetch all data without pagination for local filtering
      const res = await getPreformProductions({ limit: 1000 });
      setAllProductionData(res?.data || []);
    } catch (err) {
      setListError(err.message || 'Failed to load production list');
      console.error('Error loading production list:', err);
    } finally {
      setListLoading(false);
    }
  };

  const handleViewDetails = (row) => {
    setSelectedId(row.preformProductionId || row._id);
    setIsDetailsOpen(true);
  };

  // Apply local filtering, sorting, and pagination
  const applyLocalFilters = (data, filters) => {
    let filtered = [...data];

    // Filter by preformType
    if (filters.preformType) {
      filtered = filtered.filter(item =>
        item.preformType?.toLowerCase().includes(filters.preformType.toLowerCase())
      );
    }

    // Filter by date range
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      filtered = filtered.filter(item => new Date(item.productionDate) >= startDate);
    }
    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999); // Include the entire end day
      filtered = filtered.filter(item => new Date(item.productionDate) <= endDate);
    }

    // Sort
    const sortBy = filters.sortBy || 'productionDate';
    const sortOrder = filters.sortOrder || 'desc';
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle date sorting
      if (sortBy === 'productionDate') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle numeric sorting
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string sorting
      aVal = String(aVal || '').toLowerCase();
      bVal = String(bVal || '').toLowerCase();
      return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });

    // Calculate pagination
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

  // Effect to apply filters when data or filters change
  useEffect(() => {
    if (allProductionData.length > 0) {
      applyLocalFilters(allProductionData, listFilters);
    }
  }, [allProductionData, listFilters]);

  // Generate report with API call (requires server-side aggregation)
  // const generateReport = async (filters) => {
  //   setListLoading(true);
  //   setReportSummary(null);
  //   try {
  //     const params = {
  //       ...(filters.preformType && { preformType: filters.preformType }),
  //       ...(filters.startDate && { startDate: filters.startDate }),
  //       ...(filters.endDate && { endDate: filters.endDate }),
  //       ...(filters.period && { period: filters.period }),
  //       downloadReport: true
  //     };
  //     const res = await getPreformProductions(params);
  //     if (res?.summary) {
  //       setReportSummary(res.summary);
  //     }
  //   } catch (err) {
  //     console.error('Error generating report:', err);
  //   } finally {
  //     setListLoading(false);
  //   }
  // };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  // Local filter change - no API call, just update state
  const handleFilterChange = (key, value) => {
    setListFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Local page change - no API call
  const handlePageChange = (page) => {
    setListFilters(prev => ({ ...prev, page }));
  };

  // Local sort change - no API call
  const handleSortChange = (sortBy, sortOrder) => {
    setListFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  // Generate report - requires API call for server-side aggregation
  // const handleGenerateReport = () => {
  //   generateReport(listFilters);
  // };

  const handleSubmit = async () => {
    // Send payload according to updated API specifications
    if (!formData.preformTypeId || !formData.quantityProduced || formData.rawMaterials.length === 0) {
      setError('Preform Type, Quantity Produced, and at least one Raw Material are required');
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
        preformTypeId: formData.preformTypeId,
        quantityProduced: parseInt(formData.quantityProduced, 10),
        wastageType1: hasWastageType1 ? parseFloat(formData.wastageType1) : 0,
        wastageType2: hasWastageType2 ? parseFloat(formData.wastageType2) : 0,
        remarks: formData.remarks || '',
        productionDate: formData.productionDate || new Date().toISOString().split('T')[0],
      };

      await recordPreformProduction(payload);

      setSuccess('Production Recorded Successfully!');

      // Reset form
      setFormData({
        rawMaterials: [],
        preformTypeId: '',
        quantityProduced: '',
        wastageType1: '',
        wastageType2: '',
        remarks: '',
        productionDate: new Date().toISOString().split('T')[0],
      });

      fetchAllProductionData(); // Refresh data after successful submission

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to record preform production');
    } finally {
      setLoading(false);
    }
  };

  const totalWastage = () => {
    const type1 = parseFloat(formData.wastageType1) || 0;
    const type2 = parseFloat(formData.wastageType2) || 0;
    return type1 + type2;
  };

  // Column configuration for ProductionList
  const columns = [
    { 
      key: 'preformType', 
      label: 'Preform Type',
      render: (row) => row.outcomeType || row.preformType || 'N/A'
    },
    { 
      key: 'quantityProduced', 
      label: 'Quantity Produced',
      render: (row) => row.quantityProduced || 0
    },
    { 
      key: 'wastage', 
      label: 'Total Wastage',
      render: (row) => row.wastageKg || 0
    },
    { 
      key: 'wastageType1', 
      label: 'Reusable Wastage',
      render: (row) => row.wastageType1 || 0
    },
    { 
      key: 'wastageType2', 
      label: 'Scrap Wastage',
      render: (row) => row.wastageType2 || 0
    },
    { 
      key: 'usedInBottles', 
      label: 'Used in Bottles',
      render: (row) => row.usedInBottles || 0
    },
    {
      key: 'productionDate',
      label: 'Production Date',
      render: (row) => new Date(row.productionDate).toLocaleDateString()
    },
    {
      key: 'recordedBy',
      label: 'Recorded By',
      render: (row) => row.recordedBy?.name || 'N/A'
    },
    {
      key: 'available',
      label: 'Available',
      render: (row) => row.statistics?.available || 0
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <button className='bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded' onClick={() => handleViewDetails(row)}>View</button>
    }
  ];

  // Filter options for ProductionList
  const filterOptions = [
    {
      key: 'preformType',
      label: 'Filter by Preform Type',
      type: 'text',
      placeholder: 'Enter preform type...'
    }
  ];

  return (
    <div>
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
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Record Preform Production</h3>

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preform Type *
            </label>
            <select
              name="preformTypeId"
              value={formData.preformTypeId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Preform Type --</option>
              {preformTypes.map((pt, idx) => {
                const item = typeof pt === 'string' ? { _id: pt, name: pt } : pt;
                return (
                  <option key={item._id || idx} value={item._id}>
                    {item.name}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Produced With Wastage *
            </label>
            <input
              type="number"
              name="quantityProduced"
              value={formData.quantityProduced}
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
        </div>

        {/* Wastage Details Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Wastage Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wastage Type 1 (Reusable)
              </label>
              <input
                type="number"
                name="wastageType1"
                value={formData.wastageType1}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wastage Type 2 (Non-reusable/Scrap)
              </label>
              <input
                type="number"
                name="wastageType2"
                value={formData.wastageType2}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {totalWastage() > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Total Wastage:</span> {totalWastage()} units
              </p>
            </div>
          )}

          <div>
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

        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Recording...' : 'Record Preform Production'}
          </Button>
        </div>
      </div>

      {/* Production List */}
      <div className="mt-8">
        <ProductionList
          title="Preform Production History"
          data={productionList}
          loading={listLoading}
          error={listError}
          pagination={pagination}
          columns={columns}
          filterOptions={filterOptions}
          filters={listFilters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          // onGenerateReport={handleGenerateReport}
          sortBy={listFilters.sortBy}
          sortOrder={listFilters.sortOrder}
          sortableColumns={['preformType', 'quantityProduced', 'productionDate', 'wastageType1', 'wastageType2']}
          showDateFilters={true}
          showPeriodFilter={true}
          showReportButton={true}
          reportSummary={reportSummary}
        />
      </div>
      <PreformDetails
        productionId={selectedId}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}