import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/button';
import ProductionList from './ProductionList';

// 👉 API imports
import {
  recordBottleProduction,
  getAvailablePreformTypes,
  getCaps,
  getLabels,
  checkMaterialAvailability,
  getBottleProductions,
  recordWastage,
  getBottleProductionCategories
} from '../../../services/api/stock';

export default function BottleProduction() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown data
  const [preformTypes, setPreformTypes] = useState([]); // Now contains objects with _id
  const [caps, setCaps] = useState([]);
  const [labels, setLabels] = useState([]);
  const [categories, setCategories] = useState([]); // Categories with IDs
  const [selectedCategory, setSelectedCategory] = useState('');

  const [availability, setAvailability] = useState(null);

  // Production list state
  const [allProductionData, setAllProductionData] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [listFilters, setListFilters] = useState({
    bottleCategory: '',
    startDate: '',
    endDate: '',
    page: 1,
    limit: 10,
    sortBy: 'productionDate',
    sortOrder: 'desc'
  });

  const [formData, setFormData] = useState({
  preformTypeId: '', // For check-availability API
  preformType: '',   // For record production API (the name like "500ml")
  boxesProduced: '',
  bottlesPerBox: '',
  bottleCategoryId: '',
  bottleCategoryName: '',
  labelId: '',
  capId: '',
  remarks: '',
  productionDate: new Date().toISOString().split('T')[0],
});

  // Wastage form state
  const [wastageData, setWastageData] = useState({
    source: 'Bottle',
    quantityType1: '',
    quantityType2: '',
    remarks: '',
  });

  // 🔹 Load Preform Types, Caps, Labels on Mount
  useEffect(() => {
    async function loadDropdowns() {
      try {
        // Fetch preform types with IDs
        const pf = await getAvailablePreformTypes();
        console.log('📦 Preform Types API response:', pf);
        console.log('📦 Preform Types data structure:', pf?.data?.[0]);
        setPreformTypes(pf?.data || []);

        // Fetch caps
        const capsRes = await getCaps();
        setCaps(capsRes?.data || []);

        // Fetch labels
        const labelsRes = await getLabels();
        setLabels(labelsRes?.data || []);

      } catch (err) {
        console.error('Dropdown load failed', err);
      }
    }
    loadDropdowns();
    fetchAllProductionData();
  }, []);

  // 🔹 Load Bottle Categories
  useEffect(() => {
    const loadBottleCategories = async () => {
      setLoadingCategories(true);
      try {
        const categoriesRes = await getBottleProductionCategories();
        
        if (categoriesRes?.status && categoriesRes?.data) {
          setCategories(categoriesRes.data || []);
        } else {
          console.warn('No categories data received');
        }
      } catch (error) {
        console.error('Failed to load bottle categories:', error);
        setError('Failed to load bottle categories. Please refresh the page.');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadBottleCategories();
  }, []);

  // 🔹 Fetch all bottle production data
  const fetchAllProductionData = async () => {
    setListLoading(true);
    setListError(null);
    try {
      const res = await getBottleProductions({ limit: 1000 });
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

    if (filters.bottleCategory) {
      filtered = filtered.filter(item =>
        item.bottleCategory?.toLowerCase().includes(filters.bottleCategory.toLowerCase())
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

  // Local filter change
  const handleFilterChange = (key, value) => {
    setListFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  // Local page change
  const handlePageChange = (page) => {
    setListFilters(prev => ({ ...prev, page }));
  };

  // Local sort change
  const handleSortChange = (sortBy, sortOrder) => {
    setListFilters(prev => ({ ...prev, sortBy, sortOrder, page: 1 }));
  };

  // 🔹 Auto Check Availability when form fields change
  useEffect(() => {
  autoCheckAvailability();
}, [formData.preformTypeId, formData.boxesProduced, formData.bottlesPerBox, 
    formData.bottleCategoryId, formData.labelId, formData.capId]);

  // 🔹 UPDATED: Check availability with IDs
const autoCheckAvailability = async () => {
  // Check if all required fields are filled
  const requiredFields = [
    formData.preformTypeId,
    formData.boxesProduced,
    formData.bottlesPerBox,
    formData.bottleCategoryId,
    formData.labelId,
    formData.capId
  ];

  if (requiredFields.some(field => !field)) {
    console.log('Missing form data, cannot check availability');
    console.log('Missing fields:', {
      preformTypeId: !formData.preformTypeId,
      boxesProduced: !formData.boxesProduced,
      bottlesPerBox: !formData.bottlesPerBox,
      bottleCategoryId: !formData.bottleCategoryId,
      labelId: !formData.labelId,
      capId: !formData.capId
    });
    setAvailability(null);
    return;
  }

  try {
    setChecking(true);
    setError('');

    const params = {
      preformTypeId: formData.preformTypeId,
      boxes: Number(formData.boxesProduced),
      bottlesPerBox: Number(formData.bottlesPerBox),
      bottleCategoryId: formData.bottleCategoryId,
      labelId: formData.labelId,
      capId: formData.capId
    };

    console.log('📤 Sending availability check with params:', params);
    console.log('📤 API endpoint: POST stock/production/check-availability');
    
    const res = await checkMaterialAvailability(params);

    console.log('✅ Availability check response:', res);

    if (res?.success) {
      setAvailability(res.data || null);
    } else {
      setAvailability(null);
      console.warn('Availability check returned without success:', res);
    }

  } catch (err) {
    console.error('❌ Availability check failed:', err);
    
    if (err.response) {
      console.error('Error response status:', err.response.status);
      console.error('Error response data:', err.response.data);
      
      // More specific error handling
      if (err.response.status === 400) {
        console.error('400 Bad Request - Likely missing or invalid parameters');
        console.error('Expected parameters:', [
          'preformTypeId',
          'boxes',
          'bottlesPerBox',
          'bottleCategoryId',
          'labelId',
          'capId'
        ]);
        
        setError(`Validation error: ${err.response.data?.message || 'Missing required parameters'}`);
      } else if (err.response.status === 404) {
        setError('API endpoint not found. Please check the backend server.');
      } else {
        setError(`Server error: ${err.response.status}`);
      }
    } else if (err.request) {
      console.error('No response received:', err.request);
      setError('No response from server. Please check your connection.');
    } else {
      console.error('Request setup error:', err.message);
      setError(`Request error: ${err.message}`);
    }
    
    setAvailability(null);
  } finally {
    setChecking(false);
  }
};

  // 🔹 Input Handler - Updated for IDs
  const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'preformTypeId') {
    // Find the selected preform to get both ID and type name
    const selectedPreform = preformTypes.find(p => p.preformTypeId === value);
    
    setFormData(prev => ({
      ...prev,
      preformTypeId: value,              // ObjectId for check-availability
      preformType: selectedPreform?.type || ''  // Type name for record production
    }));
  } else if (name === 'bottleCategoryId') {
    const selectedCat = categories.find(cat => cat._id === value);
    
    setFormData(prev => ({
      ...prev,
      bottleCategoryId: value,
      bottleCategoryName: selectedCat?.name || ''
    }));
    
    setSelectedCategory(value);
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};

  // Wastage input handler
  const handleWastageChange = (e) => {
    const { name, value } = e.target;
    setWastageData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 🔹 UPDATED: Submit Handler with new payload format
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    // Validate required fields
    if (!formData.preformTypeId || 
        !formData.boxesProduced || 
        !formData.bottlesPerBox || 
        !formData.bottleCategoryId ||
        !formData.labelId ||
        !formData.capId) {
      setError("All fields marked with * are required");
      return;
    }

    if (availability && availability.canProduce === false) {
      setError("Insufficient material stock. Cannot produce. Please check the availability details below.");
      return;
    }

    try {
      setLoading(true);

      // UPDATED payload structure
      const payload = {
      preformType: formData.preformType,  // ✅ Send "500ml" (the type name)
      bottleCategoryId: formData.bottleCategoryId,
      boxesProduced: Number(formData.boxesProduced),
      bottlesPerBox: Number(formData.bottlesPerBox),
      labelId: formData.labelId,
      capId: formData.capId,
      remarks: formData.remarks,
      productionDate: formData.productionDate,
    };

      // Step 1: Record production
      await recordBottleProduction(payload);

      // Step 2: Record wastage if applicable
      const hasWastage = wastageData.quantityType1 || wastageData.quantityType2;
      if (hasWastage) {
        const wastagePayload = {
          source: 'Bottle',
          ...(wastageData.quantityType1 && { quantityType1: Number(wastageData.quantityType1) }),
          ...(wastageData.quantityType2 && { quantityType2: Number(wastageData.quantityType2) }),
          remarks: wastageData.remarks || '',
          date: formData.productionDate,
        };
        await recordWastage(wastagePayload);
      }

      setSuccess("Production & Wastage Recorded Successfully!");

      // Reset forms
      setFormData({
  preformTypeId: '',
  preformType: '',     // ✅ Add this
  boxesProduced: '',
  bottlesPerBox: '',
  bottleCategoryId: '',
  bottleCategoryName: '',
  labelId: '',
  capId: '',
  remarks: '',
  productionDate: new Date().toISOString().split('T')[0],
});

      setWastageData({
        source: 'Bottle',
        quantityType1: '',
        quantityType2: '',
        remarks: '',
      });

      setAvailability(null);
      fetchAllProductionData(); // Refresh data

    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to record bottle production";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

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
        <h3 className="text-xl font-semibold text-gray-800 mb-4">Record Bottle Production</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* UPDATED: Preform Dropdown - now uses ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Preform Type *
            </label>
            <select
              name="preformTypeId"
              value={formData.preformTypeId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Preform</option>
              {preformTypes.map((p) => (
                <option key={p.preformTypeId} value={p.preformTypeId}>
                  {p.type} (Available: {p.totalAvailable})
                </option>
              ))}
            </select>
          </div>

          {/* UPDATED: Bottle Category Dropdown - now uses ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bottle Category *
              {loadingCategories && (
                <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
              )}
            </label>
            <select
              name="bottleCategoryId"
              value={formData.bottleCategoryId}
              onChange={handleInputChange}
              disabled={loadingCategories}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Select Bottle Category</option>
              {categories.length > 0 ? (
                categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name} - {category.category}
                  </option>
                ))
              ) : (
                !loadingCategories && <option value="" disabled>No categories available</option>
              )}
            </select>
            {formData.bottleCategoryName && (
              <div className="mt-1 text-xs text-gray-600">
                Selected: {formData.bottleCategoryName}
              </div>
            )}
          </div>

          {/* Label Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label *
            </label>
            <select
              name="labelId"
              value={formData.labelId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Label</option>
              {labels.map((label) => (
                <option key={label._id} value={label._id}>
                  {label.bottleName} - {label.bottleCategory}
                </option>
              ))}
            </select>
          </div>

          {/* Cap Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cap *
            </label>
            <select
              name="capId"
              value={formData.capId}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Cap</option>
              {caps.map((cap) => (
                <option key={cap._id} value={cap._id}>
                  {cap.neckType} - {cap.size} - {cap.color}
                </option>
              ))}
            </select>
          </div>

          {/* Boxes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Boxes Produced *
            </label>
            <input
              type="number"
              name="boxesProduced"
              value={formData.boxesProduced}
              onChange={handleInputChange}
              placeholder="100"
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Bottles Per Box */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bottles Per Box *
            </label>
            <input
              type="number"
              name="bottlesPerBox"
              value={formData.bottlesPerBox}
              onChange={handleInputChange}
              placeholder="12"
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Production Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Production Date
            </label>
            <input
              type="date"
              name="productionDate"
              value={formData.productionDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Remarks
            </label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Optional production notes"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* AVAILABILITY STATUS */}
        {checking && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-700 font-medium">Checking material availability...</p>
            </div>
          </div>
        )}

        {availability && (
          <div className="mb-6">
            {/* Overall Status Banner */}
            <div className={`p-4 mb-4 rounded-lg border-2 ${
              availability.canProduce 
                ? 'bg-green-50 border-green-400' 
                : 'bg-red-50 border-red-400'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {availability.canProduce ? (
                    <svg className="w-6 h-6 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  <div>
                    <p className={`font-bold text-lg ${
                      availability.canProduce ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {availability.canProduce 
                        ? 'Production Ready ✓' 
                        : 'Insufficient Materials ✗'}
                    </p>
                    <p className={`text-sm ${
                      availability.canProduce ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {availability.canProduce 
                        ? 'All required materials are available' 
                        : 'Some materials are insufficient for production'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Summary */}
            {availability.requirements && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
                <h4 className="text-md font-semibold text-gray-800 mb-3">Production Requirements</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <RequirementBox label="Total Bottles" value={availability.requirements.bottles} />
                  <RequirementBox label="Preforms Needed" value={availability.requirements.preforms} />
                  <RequirementBox label="Caps Needed" value={availability.requirements.caps} />
                  <RequirementBox label="Shrink Roll" value={`${availability.requirements.shrinkRoll} gm`} />
                  <RequirementBox label="Labels Needed" value={availability.requirements.labels} />
                </div>
              </div>
            )}

            {/* Material Availability Details */}
            {availability.availability && (
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3">Material Availability Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Preforms */}
                  {availability.availability.preforms && (
                    <MaterialCard
                      title="Preforms"
                      icon="🔹"
                      data={availability.availability.preforms}
                      required={availability.requirements?.preforms}
                    />
                  )}

                  {/* Caps */}
                  {availability.availability.caps && (
                    <MaterialCard
                      title={`Caps (${availability.availability.caps.type || 'N/A'})`}
                      icon="🔘"
                      data={availability.availability.caps}
                      required={availability.requirements?.caps}
                    />
                  )}

                  {/* Shrink Roll */}
                  {availability.availability.shrinkRoll && (
                    <MaterialCard
                      title="Shrink Roll"
                      icon="📦"
                      data={{
                        available: availability.availability.shrinkRoll.available,
                        sufficient: availability.availability.shrinkRoll.sufficient,
                        shortage: availability.availability.shrinkRoll.sufficient 
                          ? 0 
                          : availability.availability.shrinkRoll.required - availability.availability.shrinkRoll.available
                      }}
                      required={availability.availability.shrinkRoll.required}
                      unit={availability.availability.shrinkRoll.unit}
                    />
                  )}

                  {/* Labels */}
                  {availability.availability.labels && (
                    <MaterialCard
                      title="Labels"
                      icon="🏷️"
                      data={{
                        available: availability.availability.labels.available,
                        sufficient: availability.availability.labels.sufficient,
                        shortage: availability.availability.labels.sufficient 
                          ? 0 
                          : availability.availability.labels.required - availability.availability.labels.available
                      }}
                      required={availability.availability.labels.required}
                      unit={availability.availability.labels.unit}
                    />
                  )}

                </div>
              </div>
            )}
          </div>
        )}

        {/* Wastage Details Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Wastage Details (Optional)</h4>
          <p className="text-sm text-gray-500 mb-4">At least one wastage type must have a value to record wastage.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type 1: Reusable Wastage
              </label>
              <input
                type="number"
                name="quantityType1"
                value={wastageData.quantityType1}
                onChange={handleWastageChange}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type 2: Non-reusable / Scrap
              </label>
              <input
                type="number"
                name="quantityType2"
                value={wastageData.quantityType2}
                onChange={handleWastageChange}
                placeholder="0"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wastage Remarks
              </label>
              <textarea
                name="remarks"
                value={wastageData.remarks}
                onChange={handleWastageChange}
                placeholder="Optional wastage remarks"
                rows="2"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={loading || checking || loadingCategories || (availability && !availability.canProduce)}
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Recording...' : 'Record Bottle Production'}
          </Button>
        </div>
      </div>

      {/* Production List */}
      <div className="mt-8">
        <ProductionList
          title="Bottle Production History"
          data={productionList}
          loading={listLoading}
          error={listError}
          pagination={pagination}
          columns={[
            { key: 'preformType', label: 'Preform Type', render: (row) => row.preformType || 'N/A' },
            { key: 'bottleCategory', label: 'Bottle Category', render: (row) => row.bottleCategory || 'N/A' },
            { key: 'boxesProduced', label: 'Boxes Produced', render: (row) => row.boxesProduced || 0 },
            { key: 'bottlesPerBox', label: 'Bottles/Box', render: (row) => row.bottlesPerBox || 0 },
            { key: 'totalBottles', label: 'Total Bottles', render: (row) => row.details?.totalBottles || (row.boxesProduced * row.bottlesPerBox) || 0 },
            { key: 'labelUsed', label: 'Label Used', render: (row) => row.labelUsed?.bottleName || 'N/A' },
            { key: 'capUsed', label: 'Cap Used', render: (row) => row.capUsed ? `${row.capUsed.size} ${row.capUsed.color}` : 'N/A' },
            { key: 'productionDate', label: 'Production Date', render: (row) => new Date(row.productionDate).toLocaleDateString() },
            { key: 'recordedBy', label: 'Recorded By', render: (row) => row.recordedBy?.name || 'N/A' }
          ]}
          filterOptions={[
            { key: 'bottleCategory', label: 'Bottle Category', type: 'text', placeholder: 'Enter bottle category...' }
          ]}
          filters={listFilters}
          onFilterChange={handleFilterChange}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          sortBy={listFilters.sortBy}
          sortOrder={listFilters.sortOrder}
          sortableColumns={['preformType', 'bottleCategory', 'boxesProduced', 'productionDate']}
          showDateFilters={true}
          showPeriodFilter={false}
          showReportButton={false}
        />
      </div>
    </div>
  );
}

// Helper component for requirements display
function RequirementBox({ label, value }) {
  return (
    <div className="bg-white p-3 rounded border border-gray-200 text-center">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
    </div>
  );
}

// Enhanced Material Card Component
function MaterialCard({ title, icon, data, required, unit = 'nos' }) {
  const isAvailable = data.sufficient;
  const shortage = data.shortage || 0;

  return (
    <div className={`p-4 rounded-lg border-2 ${
      isAvailable ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <span className="text-2xl mr-2">{icon}</span>
          <h5 className="font-semibold text-gray-800">{title}</h5>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${
          isAvailable ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
        }`}>
          {isAvailable ? '✓ Sufficient' : '✗ Insufficient'}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Available:</span>
          <span className="font-semibold text-gray-800">
            {data.available} {unit}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Required:</span>
          <span className="font-semibold text-gray-800">
            {required} {unit}
          </span>
        </div>

        {!isAvailable && shortage > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-red-200">
            <span className="text-sm font-medium text-red-700">Shortage:</span>
            <span className="font-bold text-red-700">
              {shortage} {unit}
            </span>
          </div>
        )}

        {isAvailable && (
          <div className="flex justify-between items-center pt-2 border-t border-green-200">
            <span className="text-sm font-medium text-green-700">Extra:</span>
            <span className="font-bold text-green-700">
              {data.available - required} {unit}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}