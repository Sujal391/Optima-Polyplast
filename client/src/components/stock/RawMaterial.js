import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Eye, X, History, Package, ArrowDownToLine } from 'lucide-react';
import {
  fetchRawMaterials, addRawMaterial, getRawMaterialById,
  updateRawMaterial, deleteRawMaterial, recordInwardEntry,
  fetchInwardEntries, adjustRawMaterialStock,
} from '../../services/api/stock';

const ROWS_OPTIONS = [5, 10, 20, 50];

function statusBadge(status) {
  if (status === 'OUT_OF_STOCK') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">Out of Stock</span>;
  if (status === 'LOW_STOCK')   return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">Low Stock</span>;
  if (status === 'NORMAL')      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">Normal</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">Unknown</span>;
}

function reorderBadge(needs) {
  if (needs) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-700 border border-orange-200">Yes</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">No</span>;
}

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function RawMaterial() {
  const [materials, setMaterials]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [currentMaterialId, setCurrentMaterialId] = useState(null);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(10);

  const [isDetailsOpen, setIsDetailsOpen]     = useState(false);
  const [detailsLoading, setDetailsLoading]   = useState(false);
  const [materialDetails, setMaterialDetails] = useState(null);
  const [detailsTab, setDetailsTab]           = useState(0);

  const [isEntryModalOpen, setIsEntryModalOpen]               = useState(false);
  const [selectedMaterialForEntry, setSelectedMaterialForEntry] = useState(null);
  const [entryFormData, setEntryFormData] = useState({ quantityKg: '', remarks: '' });

  const [isAllEntriesModalOpen, setIsAllEntriesModalOpen] = useState(false);
  const [allEntries, setAllEntries]       = useState([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [entriesPage, setEntriesPage]     = useState(0);
  const [entriesRowsPerPage, setEntriesRowsPerPage] = useState(10);

  const [searchQuery, setSearchQuery]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showInactive, setShowInactive]     = useState(false);

  const [formData, setFormData] = useState({
    itemName: '', itemCode: '', subcategory: '', unit: 'Kg',
    supplier: '', minStockLevel: 0, remarks: '',
  });
  const [stockAdjustmentData, setStockAdjustmentData] = useState({
    adjustmentType: 'addition', quantity: '', reason: '', stockRemarks: '',
  });
  const [hasStockAdjustment, setHasStockAdjustment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchMaterials(); }, [debouncedSearch, categoryFilter, showInactive]);

  const fetchMaterials = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (categoryFilter) params.category = categoryFilter;
      if (showInactive) params.showInactive = true;
      const response = await fetchRawMaterials(params);
      if (response.success) {
        const sorted = (response.data || []).sort((a, b) =>
          a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true, sensitivity: 'base' })
        );
        setMaterials(sorted);
      } else { setError('Failed to fetch raw materials'); }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch raw materials');
    } finally { setLoading(false); }
  };

  const fetchMaterialDetails = async (id) => {
    setDetailsLoading(true); setError('');
    try {
      const response = await getRawMaterialById(id);
      if (response.success) setMaterialDetails(response.data);
      else setError('Failed to fetch material details');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch material details');
    } finally { setDetailsLoading(false); }
  };

  const fetchAllEntries = async () => {
    setEntriesLoading(true); setError('');
    try {
      const response = await fetchInwardEntries();
      if (response.success) setAllEntries(response.data || []);
      else setError('Failed to fetch entries');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch entries');
    } finally { setEntriesLoading(false); }
  };

  const handleViewDetails = async (material) => {
    setIsDetailsOpen(true); setDetailsTab(0);
    await fetchMaterialDetails(material._id);
  };
  const handleCloseDetails = () => { setIsDetailsOpen(false); setMaterialDetails(null); setDetailsTab(0); };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'itemCode') v = value.toUpperCase().replace(/[^A-Z0-9_]/g, '_').replace(/_+/g, '_');
    setFormData(prev => ({ ...prev, [name]: name === 'minStockLevel' ? Number(v) : v }));
  };

  const handleStockAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setStockAdjustmentData(prev => ({ ...prev, [name]: value }));
    setHasStockAdjustment(true);
  };

  const resetForm = () => {
    setFormData({ itemName: '', itemCode: '', subcategory: '', unit: 'Kg', supplier: '', minStockLevel: 0, remarks: '' });
    setStockAdjustmentData({ adjustmentType: 'addition', quantity: '', reason: '', stockRemarks: '' });
    setHasStockAdjustment(false);
  };

  const handleOpenModal = (material = null) => {
    if (material) {
      setIsEditMode(true); setCurrentMaterialId(material._id);
      setFormData({ itemName: material.itemName, itemCode: material.itemCode, subcategory: material.subcategory || '', unit: material.unit || 'Kg', supplier: material.supplier || '', minStockLevel: material.minStockLevel || 0, remarks: material.remarks || '' });
      setStockAdjustmentData({ adjustmentType: 'addition', quantity: '', reason: '', stockRemarks: '' });
      setHasStockAdjustment(false);
    } else { setIsEditMode(false); setCurrentMaterialId(null); resetForm(); }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setIsEditMode(false); setCurrentMaterialId(null); resetForm(); setError(''); };

  const handleSubmit = async () => {
    if (!formData.itemName || !formData.itemCode) { setError('Item Name and Item Code are required'); return; }
    try {
      setLoading(true); setError('');
      let materialUpdateSuccess = false, stockAdjustmentSuccess = false;
      const materialDataChanged = isEditMode && (
        materials.find(m => m._id === currentMaterialId)?.itemName !== formData.itemName ||
        materials.find(m => m._id === currentMaterialId)?.subcategory !== formData.subcategory ||
        materials.find(m => m._id === currentMaterialId)?.unit !== formData.unit ||
        materials.find(m => m._id === currentMaterialId)?.supplier !== formData.supplier ||
        materials.find(m => m._id === currentMaterialId)?.minStockLevel !== formData.minStockLevel ||
        materials.find(m => m._id === currentMaterialId)?.remarks !== formData.remarks
      );
      if (!isEditMode || materialDataChanged) {
        const response = isEditMode ? await updateRawMaterial(currentMaterialId, formData) : await addRawMaterial(formData);
        if (response.success) materialUpdateSuccess = true;
      }
      if (isEditMode && hasStockAdjustment && stockAdjustmentData.quantity && parseFloat(stockAdjustmentData.quantity) > 0) {
        const stockResponse = await adjustRawMaterialStock(currentMaterialId, {
          adjustmentType: stockAdjustmentData.adjustmentType,
          quantity: parseFloat(stockAdjustmentData.quantity),
          reason: stockAdjustmentData.reason || 'Manual adjustment',
          remarks: stockAdjustmentData.stockRemarks || '',
        });
        if (stockResponse.success) stockAdjustmentSuccess = true;
      }
      if (isEditMode) {
        if (materialUpdateSuccess && stockAdjustmentSuccess) setSuccess('Raw material and stock updated successfully!');
        else if (materialUpdateSuccess) setSuccess('Raw material updated successfully!');
        else if (stockAdjustmentSuccess) setSuccess('Stock adjusted successfully!');
      } else { setSuccess('Raw material added successfully!'); }
      handleCloseModal(); await fetchMaterials(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      if (err.response?.status === 400) setError(err.response?.data?.message || 'Item code already exists');
      else setError(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'add'} raw material`);
    } finally { setLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this raw material? This will deactivate the item.')) return;
    try {
      setLoading(true); setError('');
      const response = await deleteRawMaterial(id);
      if (response.success) { setSuccess(response.message || 'Raw material deleted successfully!'); await fetchMaterials(); setTimeout(() => setSuccess(''), 3000); }
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to delete raw material'); }
    finally { setLoading(false); }
  };

  const handleOpenEntryModal = (material) => {
    setSelectedMaterialForEntry(material); setEntryFormData({ quantityKg: '', remarks: '' }); setIsEntryModalOpen(true);
  };
  const handleCloseEntryModal = () => { setIsEntryModalOpen(false); setSelectedMaterialForEntry(null); setEntryFormData({ quantityKg: '', remarks: '' }); setError(''); };
  const handleEntryInputChange = (e) => { const { name, value } = e.target; setEntryFormData(prev => ({ ...prev, [name]: value })); };
  const handleSaveEntry = async () => {
    if (!entryFormData.quantityKg) { setError('Quantity is required'); return; }
    const quantity = parseFloat(entryFormData.quantityKg);
    if (quantity <= 0) { setError('Quantity must be greater than 0'); return; }
    try {
      setLoading(true); setError('');
      const response = await recordInwardEntry({ rawMaterialId: selectedMaterialForEntry._id, quantityKg: quantity, remarks: entryFormData.remarks || undefined });
      setSuccess(response.message || 'Raw material entry added successfully');
      handleCloseEntryModal(); await fetchMaterials(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to record entry'); }
    finally { setLoading(false); }
  };

  const handleOpenAllEntriesModal = async () => { setIsAllEntriesModalOpen(true); await fetchAllEntries(); };
  const handleCloseAllEntriesModal = () => { setIsAllEntriesModalOpen(false); setAllEntries([]); setEntriesPage(0); };

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  const uniqueCategories = [...new Set(materials.map(m => m.subcategory).filter(Boolean))];
  const paginatedMaterials = materials.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const paginatedEntries   = allEntries.slice(entriesPage * entriesRowsPerPage, entriesPage * entriesRowsPerPage + entriesRowsPerPage);

  const Pagination = ({ total, pg, rpg, onPage, onRpg }) => {
    const pages = Math.ceil(total / rpg);
    return (
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select value={rpg} onChange={e => { onRpg(Number(e.target.value)); onPage(0); }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span>{pg * rpg + 1}–{Math.min((pg + 1) * rpg, total)} of {total}</span>
          <button disabled={pg === 0} onClick={() => onPage(pg - 1)}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
          <button disabled={pg >= pages - 1} onClick={() => onPage(pg + 1)}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">›</button>
        </div>
      </div>
    );
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
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Raw Material Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">{materials.length} items</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="h-4 w-4" /> Add Raw Material
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center justify-between">
            {success}
            <button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            {error}
            <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none min-w-[160px]"
            >
              <option value="">All Subcategories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <select
              value={showInactive}
              onChange={e => setShowInactive(e.target.value === 'true')}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="false">Active Only</option>
              <option value="true">Include Inactive</option>
            </select>
            <button
              onClick={handleOpenAllEntriesModal}
              className="flex items-center gap-2 px-4 py-2.5 border border-amber-300 bg-white text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-50 transition-colors"
            >
              <History className="h-4 w-4" /> View All Entries
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && materials.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" />
          </div>
        )}

        {/* Table */}
        {!loading && materials.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    {['Item Code', 'Item Name', 'Subcategory', 'Supplier', 'Current Stock', 'Min Level', 'Status', 'Reorder', 'Remarks', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedMaterials.map((material, idx) => (
                    <tr key={material._id}
                      className={`hover:bg-amber-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'} ${material.isActive === false ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {material.itemCode}
                        {material.isActive === false && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded text-xs bg-gray-200 text-gray-600">Inactive</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{material.itemName}</td>
                      <td className="px-4 py-3 text-gray-500">{material.subcategory || '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{material.supplier || '-'}</td>
                      <td className="px-4 py-3 text-center font-semibold text-gray-800">{material.currentStock || 0} <span className="text-gray-400 font-normal">{material.unit || 'Kg'}</span></td>
                      <td className="px-4 py-3 text-center text-gray-500">{material.minStockLevel || 0} {material.unit || 'Kg'}</td>
                      <td className="px-4 py-3">{statusBadge(material.stockStatus)}</td>
                      <td className="px-4 py-3">{reorderBadge(material.needsReorder)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{material.remarks || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenEntryModal(material)} title="Add Entry"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 transition-colors">
                            <ArrowDownToLine className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleViewDetails(material)} title="View Details"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleOpenModal(material)} title="Edit"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDelete(material._id)} title="Delete"
                            disabled={material.isActive === false}
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination total={materials.length} pg={page} rpg={rowsPerPage} onPage={setPage} onRpg={setRowsPerPage} />
          </div>
        )}

        {!loading && materials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-medium">No raw materials found. Add one to get started!</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{isEditMode ? 'Edit Raw Material' : 'Add Raw Material'}</h3>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Material Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Item Name <span className="text-red-500">*</span></label>
                  <input name="itemName" value={formData.itemName} onChange={handleInputChange} className={inputCls} placeholder="PET Chips" />
                </div>
                <div>
                  <label className={labelCls}>Item Code <span className="text-red-500">*</span></label>
                  <input name="itemCode" value={formData.itemCode} onChange={handleInputChange} className={`${inputCls} ${isEditMode ? 'bg-gray-50 text-gray-400' : ''}`} placeholder="PET_CHIPS" disabled={isEditMode} />
                  <p className="text-xs text-gray-400 mt-1">{isEditMode ? 'Cannot be changed' : 'Format: UPPERCASE_WITH_UNDERSCORES'}</p>
                </div>
                <div>
                  <label className={labelCls}>Subcategory</label>
                  <input name="subcategory" value={formData.subcategory} onChange={handleInputChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Unit</label>
                  <select name="unit" value={formData.unit} onChange={handleInputChange} className={inputCls}>
                    <optgroup label="Weight">
                      <option value="Kg">Kg</option>
                      <option value="Gm">Gm</option>
                      <option value="Mg">Mg</option>
                      <option value="Ton">Ton</option>
                    </optgroup>
                    <optgroup label="Volume">
                      <option value="L">L</option>
                      <option value="Ml">Ml</option>
                    </optgroup>
                    <optgroup label="Count">
                      <option value="Nos">Nos</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Units">Units</option>
                    </optgroup>
                    <optgroup label="Length">
                      <option value="Meter">Meter</option>
                      <option value="Cm">Cm</option>
                      <option value="Mm">Mm</option>
                    </optgroup>
                    <optgroup label="Area">
                      <option value="SqFt">SqFt</option>
                      <option value="SqM">SqM</option>
                    </optgroup>
                    <optgroup label="Volume (3D)">
                      <option value="CubicM">CubicM</option>
                    </optgroup>
                    <optgroup label="Packaging">
                      <option value="Box">Box</option>
                      <option value="Packet">Packet</option>
                      <option value="Roll">Roll</option>
                      <option value="Bag">Bag</option>
                      <option value="Drum">Drum</option>
                    </optgroup>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Supplier</label>
                  <input name="supplier" value={formData.supplier} onChange={handleInputChange} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Minimum Stock Level</label>
                  <input type="number" name="minStockLevel" value={formData.minStockLevel} onChange={handleInputChange} min="0" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>Remarks</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={2} className={`${inputCls} resize-none`} />
              </div>

              {isEditMode && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Stock Adjustment (Optional)</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className={labelCls}>Adjustment Type</label>
                      <select name="adjustmentType" value={stockAdjustmentData.adjustmentType} onChange={handleStockAdjustmentChange} className={inputCls}>
                        <option value="addition">Addition</option>
                        <option value="set">Set to Value</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Quantity</label>
                      <input type="number" name="quantity" value={stockAdjustmentData.quantity} onChange={handleStockAdjustmentChange} min="0" step="0.01" className={inputCls} placeholder="0.00" />
                      <p className="text-xs text-gray-400 mt-1">{stockAdjustmentData.adjustmentType === 'addition' ? 'Amount to add' : 'Set to this value'}</p>
                    </div>
                    <div>
                      <label className={labelCls}>Reason</label>
                      <input name="reason" value={stockAdjustmentData.reason} onChange={handleStockAdjustmentChange} className={inputCls} placeholder="e.g., Stock reconciliation" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Adjustment Remarks</label>
                    <textarea name="stockRemarks" value={stockAdjustmentData.stockRemarks} onChange={handleStockAdjustmentChange} rows={2} className={`${inputCls} resize-none`} placeholder="Additional notes" />
                  </div>
                </div>
              )}

              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleCloseModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !formData.itemName || !formData.itemCode}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inward Entry Modal ───────────────────────────────────────────── */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleCloseEntryModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative"
            onClick={e => e.stopPropagation()}>
            <button onClick={handleCloseEntryModal} className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-100 rounded-lg"><ArrowDownToLine className="h-5 w-5 text-green-600" /></div>
              <h3 className="text-lg font-semibold text-gray-800">Add Inward Entry</h3>
            </div>
            {selectedMaterialForEntry && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-sm">
                <p className="text-xs text-gray-500 mb-0.5">Selected Material</p>
                <p className="font-semibold text-gray-800">{selectedMaterialForEntry.itemName}</p>
                <p className="text-gray-500">Code: {selectedMaterialForEntry.itemCode} | Stock: {selectedMaterialForEntry.currentStock || 0} {selectedMaterialForEntry.unit}</p>
              </div>
            )}
            {error && <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Quantity ({selectedMaterialForEntry?.unit || 'Kg'}) <span className="text-red-500">*</span></label>
                <input type="number" name="quantityKg" value={entryFormData.quantityKg} onChange={handleEntryInputChange} min="0.01" step="0.01" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Remarks</label>
                <textarea name="remarks" value={entryFormData.remarks} onChange={handleEntryInputChange} rows={3} className={`${inputCls} resize-none`} placeholder="Optional remarks" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={handleCloseEntryModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSaveEntry} disabled={loading || !entryFormData.quantityKg}
                className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── All Entries Modal ─────────────────────────────────────────────── */}
      {isAllEntriesModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleCloseAllEntriesModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-800">All Inward Entries</h3>
              </div>
              <button onClick={handleCloseAllEntriesModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-auto flex-1">
              {entriesLoading ? (
                <div className="flex items-center justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" /></div>
              ) : allEntries.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-amber-500 text-white">
                    <tr>
                      {['Material', 'Item Code', 'Quantity', 'Remarks', 'Entered By', 'Date'].map(h => (
                        <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paginatedEntries.map((entry, idx) => (
                      <tr key={entry._id} className={`hover:bg-amber-50/30 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 font-medium text-gray-800">{entry.rawMaterial?.itemName || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-500">{entry.rawMaterial?.itemCode || 'N/A'}</td>
                        <td className="px-4 py-3 font-semibold text-amber-600">{entry.quantityKg} <span className="text-gray-400 font-normal">{entry.rawMaterial?.unit || 'Kg'}</span></td>
                        <td className="px-4 py-3 text-gray-500">{entry.remarks || '-'}</td>
                        <td className="px-4 py-3 text-gray-500">{entry.enteredBy?.name || 'N/A'}</td>
                        <td className="px-4 py-3 text-gray-500">{formatDate(entry.entryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <History className="h-12 w-12 mb-3 opacity-30" />
                  <p>No inward entries found</p>
                </div>
              )}
            </div>
            {allEntries.length > 0 && (
              <Pagination total={allEntries.length} pg={entriesPage} rpg={entriesRowsPerPage} onPage={setEntriesPage} onRpg={setEntriesRowsPerPage} />
            )}
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleCloseAllEntriesModal} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Details Modal ─────────────────────────────────────────────────── */}
      {isDetailsOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleCloseDetails}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">Material Details</h3>
              <button onClick={handleCloseDetails} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" /></div>
              ) : materialDetails ? (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-xl mb-5">
                    <div><p className="text-xs text-gray-400 mb-0.5">Item Code</p><p className="font-semibold text-gray-800">{materialDetails.itemCode}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Item Name</p><p className="font-semibold text-gray-800">{materialDetails.itemName}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Current Stock</p><p className="text-lg font-bold text-amber-600">{materialDetails.currentStock || 0} {materialDetails.unit}</p></div>
                    <div><p className="text-xs text-gray-400 mb-0.5">Stock Status</p>{statusBadge(materialDetails.stockStatus)}</div>
                  </div>
                  <div className="flex gap-2 mb-4 border-b border-gray-100">
                    {['Recent Entries', 'Usage History'].map((tab, i) => (
                      <button key={tab} onClick={() => setDetailsTab(i)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${detailsTab === i ? 'border-amber-500 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                        {tab} ({(i === 0 ? materialDetails.recentEntries : materialDetails.usageHistory)?.length || 0})
                      </button>
                    ))}
                  </div>
                  {detailsTab === 0 && (
                    materialDetails.recentEntries?.length > 0 ? (
                      <div className="space-y-2">
                        {materialDetails.recentEntries.map(entry => (
                          <div key={entry._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-semibold text-gray-800">{entry.quantityKg} Kg</p>
                              <p className="text-xs text-gray-500">By: {entry.enteredBy?.name || 'Unknown'}</p>
                            </div>
                            <p className="text-xs text-gray-400">{formatDate(entry.entryDate)}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-center text-gray-400 py-8">No recent entries found</p>
                  )}
                  {detailsTab === 1 && (
                    materialDetails.usageHistory?.length > 0 ? (
                      <div className="space-y-2">
                        {materialDetails.usageHistory.map(usage => (
                          <div key={usage._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-semibold text-gray-800">Used: {usage.usedRawMaterialKg} Kg</p>
                              <p className="text-xs text-gray-500">Outcomes: {usage.outcomes?.length || 0} items</p>
                            </div>
                            <p className="text-xs text-gray-400">{formatDate(usage.productionDate)}</p>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-center text-gray-400 py-8">No usage history found</p>
                  )}
                </>
              ) : <p className="text-center text-gray-400 py-8">No details available</p>}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
              <button onClick={handleCloseDetails} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}