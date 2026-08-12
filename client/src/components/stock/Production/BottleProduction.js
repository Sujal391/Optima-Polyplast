import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../../ui/button';
import ProductionList from './ProductionList';
import { Trash2, X, Eye } from 'lucide-react';

// 👉 API imports
import {
  getPreformTypes,
  getBottleTypes,
  getLabels,
  getCaps,
  checkMaterialAvailability,
  recordBottleProduction,
  getBottleProductions
} from '../../../services/api/stock';

// Debounce hook
function useDebounce(callback, delay) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef();

  // Update the ref whenever the callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  }, [delay]);

  return debouncedCallback;
}

export default function BottleProduction() {
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dropdown data
  const [preformTypes, setPreformTypes] = useState([]);
  const [caps, setCaps] = useState([]);
  const [labels, setLabels] = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);

  const [availability, setAvailability] = useState(null);

  // Production list state
  const [allProductionData, setAllProductionData] = useState([]);
  const [productionList, setProductionList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [selectedHistory, setSelectedHistory] = useState(null);
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
    preformTypeId: '',
    bottles: [],
    bottleRejectionKg: '',
    preformRejectionKg: '',
    remarks: '',
    productionDate: new Date().toISOString().split('T')[0],
  });

  const [bottleInput, setBottleInput] = useState({
    bottleId: '',
    boxesProduced: '',
    bottlesPerBox: '',
    preformGramage: '',
    labelId: '',
    capId: ''
  });

  // Create debounced check availability function
  const debouncedCheckAvailability = useDebounce(async () => {
    await checkAvailability();
  }, 800); // 800ms delay

  // 🔹 Load Dropdowns on Mount
  useEffect(() => {
    async function loadDropdowns() {
      setLoadingCategories(true);
      try {
        const [capsRes, labelsRes, btRes, ptRes] = await Promise.all([
          getCaps(),
          getLabels(),
          getBottleTypes(),
          getPreformTypes()
        ]);
        
        setCaps(Array.isArray(capsRes?.data) ? capsRes.data : Array.isArray(capsRes) ? capsRes : []);
        setLabels(Array.isArray(labelsRes?.data) ? labelsRes.data : Array.isArray(labelsRes) ? labelsRes : []);
        setBottleTypes(Array.isArray(btRes?.data) ? btRes.data : Array.isArray(btRes) ? btRes : []);
        setPreformTypes(Array.isArray(ptRes?.data) ? ptRes.data : Array.isArray(ptRes) ? ptRes : []);
      } catch (err) {
        console.error('Dropdown load failed', err);
        setError('Failed to load initial data. Please refresh.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadDropdowns();
    fetchAllProductionData();
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

  // Apply local filtering, sorting, and pagination with proper mapping
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

  useEffect(() => {
    const { preformTypeId } = formData;
    const { bottleId, labelId, capId, boxesProduced, bottlesPerBox, preformGramage } = bottleInput;

    if (preformTypeId && bottleId && labelId && capId && boxesProduced > 0 && bottlesPerBox > 0 && preformGramage > 0) {
      debouncedCheckAvailability();
    } else {
      setAvailability(null);
    }
  }, [
    formData.preformTypeId,
    bottleInput.bottleId,
    bottleInput.labelId,
    bottleInput.capId,
    bottleInput.boxesProduced,
    bottleInput.bottlesPerBox,
    bottleInput.preformGramage,
    debouncedCheckAvailability
  ]);

  // 🔹 Check availability function
  const checkAvailability = async () => {
    try {
      setChecking(true);
      setError('');

      const selectedCat = bottleTypes.find(c => c._id === bottleInput.bottleId);

      const params = {
        preformTypeId: formData.preformTypeId,
        boxes: Number(bottleInput.boxesProduced),
        bottlesPerBox: Number(bottleInput.bottlesPerBox),
        bottleName: selectedCat ? `${selectedCat.bottleName} - ${selectedCat.category}` : '',
        labelId: bottleInput.labelId,
        capId: bottleInput.capId,
        preformUsedKg: (Number(bottleInput.boxesProduced) * Number(bottleInput.bottlesPerBox) * Number(bottleInput.preformGramage)) / 1000
      };

      console.log('📤 Sending availability check with params:', params);
      
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
        
        if (err.response.status === 400) {
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

  // 🔹 Input Handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleBottleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill bottlesPerBox and preformGramage when bottleId is selected
    if (name === 'bottleId' && value) {
      const selectedCat = bottleTypes.find(c => c._id === value);
      if (selectedCat) {
        setBottleInput(prev => ({ 
          ...prev, 
          [name]: value,
          bottlesPerBox: selectedCat.bottlesPerBox.toString(),
          preformGramage: selectedCat.preformGramage.toString()
        }));
        return;
      }
    }
    
    setBottleInput(prev => ({ ...prev, [name]: value }));
  };

  const handleAddBottle = () => {
    if (!bottleInput.bottleId || !bottleInput.boxesProduced || !bottleInput.bottlesPerBox || !bottleInput.preformGramage || !bottleInput.labelId || !bottleInput.capId) {
      setError("All bottle fields are required to add a bottle configuration");
      return;
    }

    if (availability && !availability.canProduce) {
      setError("Cannot add this configuration: Insufficient materials.");
      return;
    }
    const cat = bottleTypes.find(c => c._id === bottleInput.bottleId);
    const lab = labels.find(l => l._id === bottleInput.labelId);
    const cap = caps.find(c => c._id === bottleInput.capId);

    setFormData(prev => ({
      ...prev,
      bottles: [...prev.bottles, {
        bottleName: `${cat.bottleName} - ${cat.category}`,
        categorySize: cat?.category || '',
        boxesProduced: parseInt(bottleInput.boxesProduced, 10),
        bottlesPerBox: parseInt(bottleInput.bottlesPerBox, 10),
        preformGramage: parseFloat(bottleInput.preformGramage),
        labelId: bottleInput.labelId,
        labelName: lab?.bottleName || 'Unknown',
        capId: bottleInput.capId,
        capName: cap ? `${cap.neckType} - ${cap.color}` : 'Unknown'
      }]
    }));
    setBottleInput({ bottleId: '', boxesProduced: '', bottlesPerBox: '', preformGramage: '', labelId: '', capId: '' });
    setError('');
  };

  const handleRemoveBottle = (index) => {
    setFormData(prev => ({
      ...prev,
      bottles: prev.bottles.filter((_, i) => i !== index)
    }));
  };

  // 🔹 Submit Handler
  const handleSubmit = async () => {
    setError('');
    setSuccess('');

    if (!formData.preformTypeId || formData.bottles.length === 0) {
      setError("Preform Type and at least one bottle configuration are required");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        preformTypeId: formData.preformTypeId,
        producedBottles: formData.bottles.map(b => ({
          bottleName: b.bottleName,
          boxesProduced: b.boxesProduced,
          bottlesPerBox: b.bottlesPerBox,
          preformGramage: b.preformGramage,
          labelId: b.labelId,
          capId: b.capId
        })),
        bottleRejectionKg: formData.bottleRejectionKg || 0,
        preformRejectionKg: formData.preformRejectionKg || 0,
        remarks: formData.remarks || '',
        productionDate: formData.productionDate,
      };

      await recordBottleProduction(payload);

      setSuccess("Production Recorded Successfully!");

      // Reset forms
      setFormData({
        preformTypeId: '',
        bottles: [],
        bottleRejectionKg: '',
        preformRejectionKg: '',
        remarks: '',
        productionDate: new Date().toISOString().split('T')[0],
      });
      setBottleInput({ bottleId: '', boxesProduced: '', bottlesPerBox: '', preformGramage: '', labelId: '', capId: '' });

      setAvailability(null);
      fetchAllProductionData();

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
          {/* Preform Dropdown */}
          <div className="md:col-span-2">
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
                <option key={p._id || p.preformTypeId} value={p._id || p.preformTypeId}>
                  {p.name || p.type} {p.totalAvailable !== undefined ? `(Available: ${p.totalAvailable})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Add Bottles Section */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Add Bottle Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
            {/* Bottle Category (Name) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bottle Name *</label>
              <select
                name="bottleId"
                value={bottleInput.bottleId}
                onChange={handleBottleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Bottle</option>
                {bottleTypes.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.bottleName} - {cat.category}</option>
                ))}
              </select>
            </div>

            {/* Label Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label *</label>
              <select
                name="labelId"
                value={bottleInput.labelId}
                onChange={handleBottleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Label</option>
                {labels.map(label => (
                  <option key={label._id} value={label._id}>{label.bottleName} - {label.bottleCategory}</option>
                ))}
              </select>
            </div>

            {/* Cap Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cap *</label>
              <select
                name="capId"
                value={bottleInput.capId}
                onChange={handleBottleInputChange}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select Cap</option>
                {caps.map(cap => (
                  <option key={cap._id} value={cap._id}>{cap.displayName}</option>
                ))}
              </select>
            </div>

            {/* Boxes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Boxes Produced *</label>
              <input
                type="number"
                name="boxesProduced"
                value={bottleInput.boxesProduced}
                onChange={handleBottleInputChange}
                placeholder="0"
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Bottles per box */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bottles Per Box *</label>
              <input
                type="number"
                name="bottlesPerBox"
                value={bottleInput.bottlesPerBox}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              />
            </div>

            {/* Preform Gramage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preform Gramage (g) *</label>
              <input
                type="number"
                name="preformGramage"
                value={bottleInput.preformGramage}
                readOnly
                className="w-full px-3 py-2 border rounded-lg bg-gray-100"
              />
            </div>

             <div className="flex items-end">
              <Button 
                onClick={handleAddBottle} 
                disabled={checking || (availability && !availability.canProduce)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Add Bottle Setting
              </Button>
            </div>
          </div>

          {formData.bottles.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mt-4">
              <h5 className="font-semibold text-gray-700 mb-2">Added Bottles:</h5>
              <div className="space-y-2">
                {formData.bottles.map((bottle, index) => (
                  <div key={index} className="flex justify-between items-center bg-white p-3 rounded border border-blue-200">
                    <span className="text-sm text-gray-800">
                      <strong>{bottle.bottleName} {bottle.categorySize ? `- ${bottle.categorySize}` : ''}</strong> | {bottle.boxesProduced} Boxes x {bottle.bottlesPerBox} 
                      | Label: {bottle.labelName} | Cap: {bottle.capName}
                      <br/><span className="text-gray-500">Usage: {(bottle.boxesProduced * bottle.bottlesPerBox * bottle.preformGramage / 1000).toFixed(2)}kg</span>
                    </span>
                    <button onClick={() => handleRemoveBottle(index)} className="text-red-500 hover:text-red-700">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Production Date</label>
            <input
              type="date"
              name="productionDate"
              value={formData.productionDate}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
            <input
              type="text"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
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
                      title={`Preforms (${availability.availability.preforms.type || 'N/A'})`}
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
                      title={`Labels (${availability.availability.labels.name} - ${availability.availability.labels.category})`}
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

        {/* Rejection Details Section */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Rejection Details (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bottle Rejection (Kg)
              </label>
              <input
                type="number"
                name="bottleRejectionKg"
                value={formData.bottleRejectionKg}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preform Rejection (Kg)
              </label>
              <input
                type="number"
                name="preformRejectionKg"
                value={formData.preformRejectionKg}
                onChange={handleInputChange}
                placeholder="0"
                min="0"
                step="0.01"
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
            { key: 'preformType', label: 'Preform Type', render: (row) => row.preformType?.name || row.preformType || 'N/A' },
            { 
              key: 'producedBottles', 
              label: 'Produced Bottles', 
              render: (row) => {
                if (row.producedBottles && row.producedBottles.length > 0) {
                  return row.producedBottles.map((b, i) => (
                    <div key={i} className="text-xs mb-1">
                      <strong>{b.bottleName}</strong>: {b.boxesProduced} boxes
                    </div>
                  ));
                }
                // Fallback for old data format
                return `${row.bottleCategory || 'N/A'}: ${row.boxesProduced || 0} boxes`;
              } 
            },
            { 
              key: 'totalBottles', 
              label: 'Total Bottles', 
              render: (row) => {
                if (row.producedBottles && row.producedBottles.length > 0) {
                  return row.producedBottles.reduce((acc, curr) => acc + (curr.boxesProduced * curr.bottlesPerBox), 0);
                }
                return row.details?.totalBottles || (row.boxesProduced * row.bottlesPerBox) || 0;
              }
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
              key: 'preformBatch', 
              label: 'Preform Batch', 
              render: (row) => {
                // Check if preformBatchUsage exists and has data
                if (row.details?.preformBatchUsage && row.details.preformBatchUsage.length > 0) {
                  return row.details.preformBatchUsage.map(batch => 
                    `Batch: ${batch.batchId} (${batch.quantityUsed} used)`
                  ).join(', ');
                }
                return 'N/A';
              }
            },
            { 
              key: 'shrinkRollUsed', 
              label: 'Shrink Roll Used', 
              render: (row) => row.details?.shrinkRollUsed ? `${row.details.shrinkRollUsed} Kg` : 'N/A'
            },
            {
              key: 'actions',
              label: 'Actions',
              render: (row) => (
                <button
                  onClick={() => setSelectedHistory(row)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors text-xs font-medium"
                >
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
              )
            }
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

      {/* View Details Modal */}
      {selectedHistory && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">
                Production Details
              </h3>
              <button 
                onClick={() => setSelectedHistory(null)} 
                className="p-2 text-gray-400 hover:bg-white rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Production Date</p>
                  <p className="font-medium text-gray-900">{new Date(selectedHistory.productionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Recorded By</p>
                  <p className="font-medium text-gray-900">{selectedHistory.recordedBy?.name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Preform Type</p>
                  <p className="font-medium text-gray-900">{selectedHistory.preformType?.name || selectedHistory.preformType || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Total Bottles</p>
                  <p className="font-medium text-gray-900">
                    {selectedHistory.producedBottles && selectedHistory.producedBottles.length > 0
                      ? selectedHistory.producedBottles.reduce((acc, curr) => acc + (curr.boxesProduced * curr.bottlesPerBox), 0)
                      : selectedHistory.details?.totalBottles || (selectedHistory.boxesProduced * selectedHistory.bottlesPerBox) || 0}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Produced Bottles</h4>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                  {selectedHistory.producedBottles && selectedHistory.producedBottles.length > 0 ? (
                    selectedHistory.producedBottles.map((b, i) => (
                      <div key={i} className="flex justify-between items-center pb-3 border-b border-gray-200 last:border-0 last:pb-0">
                        <div>
                          <p className="font-semibold text-gray-900">{b.bottleName}</p>
                          <p className="text-xs text-gray-500">Label: {b.labelId?.bottleName || 'N/A'} | Cap: {b.capId?.displayName || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">{b.boxesProduced} Boxes</p>
                          <p className="text-xs text-gray-500">({b.boxesProduced * b.bottlesPerBox} bottles @ {b.preformGramage}g)</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">
                      {selectedHistory.bottleCategory || 'N/A'} - {selectedHistory.boxesProduced || 0} boxes
                    </p>
                  )}
                </div>
              </div>

              {(selectedHistory.bottleRejectionKg > 0 || selectedHistory.preformRejectionKg > 0) && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider">Rejections</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <p className="text-xs text-red-600 mb-1">Bottle Rejection</p>
                      <p className="font-medium text-red-800">{selectedHistory.bottleRejectionKg || 0} Kg</p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                      <p className="text-xs text-orange-600 mb-1">Preform Rejection</p>
                      <p className="font-medium text-orange-800">{selectedHistory.preformRejectionKg || 0} Kg</p>
                    </div>
                  </div>
                </div>
              )}

              {selectedHistory.remarks && (
                <div>
                  <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Remarks</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">{selectedHistory.remarks}</p>
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end">
              <button 
                onClick={() => setSelectedHistory(null)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-medium transition-colors"
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