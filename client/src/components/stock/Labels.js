import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, Tag, AlertTriangle } from 'lucide-react';
import { addLabel, getLabels, updateLabelStock, deleteLabel } from '../../services/api/stock';
import { getBottleProductionCategories } from '../../services/api/stock';

const ROWS_OPTIONS = [5, 10, 20, 50];

function statusBadge(status) {
  if (status === 'OUT_OF_STOCK') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">Out of Stock</span>;
  if (status === 'LOW_STOCK')   return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">Low Stock</span>;
  if (status === 'NORMAL')      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">Normal</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">Unknown</span>;
}

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function LabelManagement() {
  const [labels, setLabels]             = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [currentLabelId, setCurrentLabelId] = useState(null);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(10);

  // Bottles (categories) from API
  const [bottles, setBottles]           = useState([]);
  const [bottlesLoading, setBottlesLoading] = useState(false);

  const [searchQuery, setSearchQuery]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Add form: select bottle by productId
  const [formData, setFormData] = useState({ productId: '', quantityAvailable: 0, remarks: '' });
  const [stockAdjustmentData, setStockAdjustmentData] = useState({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
  const [hasStockAdjustment, setHasStockAdjustment] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [labelToDelete, setLabelToDelete]       = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchLabels(); }, [debouncedSearch, categoryFilter]);

  useEffect(() => {
    const loadBottles = async () => {
      setBottlesLoading(true);
      try {
        const res = await getBottleProductionCategories();
        setBottles(res?.data || []);
      } catch (err) {
        console.error('Failed to load bottles:', err);
      } finally {
        setBottlesLoading(false);
      }
    };
    loadBottles();
  }, []);

  const fetchLabels = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (categoryFilter) params.bottleCategory = categoryFilter;
      const response = await getLabels(params);
      if (response.success) {
        let data = response.data || [];
        if (debouncedSearch) {
          data = data.filter(l =>
            l.bottleName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            l.bottleCategory?.toLowerCase().includes(debouncedSearch.toLowerCase())
          );
        }
        setLabels(data.sort((a, b) => (a.bottleName || '').localeCompare(b.bottleName || '', undefined, { sensitivity: 'base' })));
      } else { setError('Failed to fetch labels'); }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch labels');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'quantityAvailable' ? Number(value) : value }));
  };

  const handleStockAdjustmentChange = (e) => {
    const { name, value } = e.target;
    setStockAdjustmentData(prev => ({ ...prev, [name]: value }));
    setHasStockAdjustment(true);
  };

  const resetModal = () => {
    setFormData({ productId: '', quantityAvailable: 0, remarks: '' });
    setStockAdjustmentData({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
    setHasStockAdjustment(false);
  };

  const handleOpenModal = (label = null) => {
    if (label) {
      setIsEditMode(true); setCurrentLabelId(label._id);
      setFormData({ productId: label.product || '', quantityAvailable: label.quantityAvailable || 0, remarks: label.remarks || '' });
      setStockAdjustmentData({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
      setHasStockAdjustment(false);
    } else { setIsEditMode(false); setCurrentLabelId(null); resetModal(); }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setIsEditMode(false); setCurrentLabelId(null); resetModal(); setError(''); };

  const handleSubmit = async () => {
    if (!isEditMode && !formData.productId) { setError('Please select a bottle'); return; }
    try {
      setLoading(true); setError('');

      if (!isEditMode) {
        const payload = {
          productId: formData.productId,
          quantityAvailable: formData.quantityAvailable,
          remarks: formData.remarks,
        };
        const response = await addLabel(payload);
        if (response.success) { setSuccess(response.message || 'Label added successfully!'); }
      }

      if (isEditMode && hasStockAdjustment && stockAdjustmentData.quantityChange && parseFloat(stockAdjustmentData.quantityChange) > 0) {
        const stockResponse = await updateLabelStock(currentLabelId, {
          changeType: stockAdjustmentData.changeType,
          quantityChange: parseFloat(stockAdjustmentData.quantityChange),
          remarks: stockAdjustmentData.stockRemarks || 'Manual adjustment',
        });
        if (stockResponse.success) setSuccess('Label stock updated successfully!');
      } else if (isEditMode) {
        setSuccess('No changes made');
      }

      handleCloseModal(); await fetchLabels(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'add'} label`);
    } finally { setLoading(false); }
  };

  const handleDeleteClick = (label) => { setLabelToDelete(label); setDeleteDialogOpen(true); };
  const handleDeleteCancel = () => { setDeleteDialogOpen(false); setLabelToDelete(null); };
  const handleDeleteConfirm = async () => {
    if (!labelToDelete) return;
    try {
      setLoading(true); setError('');
      const response = await deleteLabel(labelToDelete._id);
      if (response.success) { setSuccess(response.message || 'Label deleted successfully!'); await fetchLabels(); setTimeout(() => setSuccess(''), 3000); }
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to delete label'); }
    finally { setLoading(false); setDeleteDialogOpen(false); setLabelToDelete(null); }
  };

  const uniqueCategories = [...new Set(labels.map(l => l.bottleCategory).filter(Boolean))];
  const paginatedLabels = labels.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const Pagination = () => {
    const pages = Math.ceil(labels.length / rowsPerPage);
    return (
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span>Rows per page:</span>
          <select value={rowsPerPage} onChange={e => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
            className="border border-gray-200 rounded-lg px-2 py-1 text-sm">
            {ROWS_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, labels.length)} of {labels.length}</span>
          <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
            className="px-2 py-1 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed">‹</button>
          <button disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}
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
            <div className="p-2.5 bg-amber-100 rounded-xl"><Tag className="h-6 w-6 text-amber-600" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Label Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">{labels.length} labels</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Label
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center justify-between">
            {success}<button onClick={() => setSuccess('')}><X className="h-4 w-4" /></button>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center justify-between">
            {error}<button onClick={() => setError('')}><X className="h-4 w-4" /></button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-5">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search by name or category..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none min-w-[160px]">
              <option value="">All Categories</option>
              {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && labels.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" />
          </div>
        )}

        {/* Table */}
        {!loading && labels.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    {['Bottle Name', 'Category', 'Available Qty', 'Status', 'Remarks', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedLabels.map((label, idx) => (
                    <tr key={label._id} className={`hover:bg-amber-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{label.bottleName}</td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">{label.bottleCategory}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{label.quantityAvailable || 0} <span className="text-gray-400 font-normal text-xs">Nos</span></td>
                      <td className="px-4 py-3">{statusBadge(label.stockStatus)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[160px] truncate">{label.remarks || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenModal(label)} title="Edit"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(label)} title="Delete"
                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination />
          </div>
        )}

        {!loading && labels.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Tag className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-medium">No labels found. Add one to get started!</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleCloseModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{isEditMode ? 'Edit Label' : 'Add Label'}</h3>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Label Details</p>

              {/* Bottle selector (only for Add mode) */}
              {!isEditMode ? (
                <div>
                  <label className={labelCls}>Select Bottle <span className="text-red-500">*</span></label>
                  <select name="productId" value={formData.productId} onChange={handleInputChange} className={inputCls}
                    disabled={bottlesLoading}>
                    <option value="">{bottlesLoading ? 'Loading bottles...' : '-- Select Bottle --'}</option>
                    {bottles.map(b => (
                      <option key={b._id} value={b._id}>
                        {b.name} — {b.category}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">The bottle name and category will be auto-assigned from the selected bottle.</p>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
                  <p className="text-xs text-gray-500 mb-0.5">Linked Bottle</p>
                  <p className="font-semibold text-gray-800">
                    {/* show from labels list */}
                    {labels.find(l => l._id === currentLabelId)?.bottleName} — {labels.find(l => l._id === currentLabelId)?.bottleCategory}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">Cannot be changed</p>
                </div>
              )}

              {!isEditMode && (
                <div>
                  <label className={labelCls}>Initial Quantity Available</label>
                  <input type="number" name="quantityAvailable" value={formData.quantityAvailable} onChange={handleInputChange} min="0" className={inputCls} />
                  <p className="text-xs text-gray-400 mt-1">Number of labels (in Nos)</p>
                </div>
              )}

              <div>
                <label className={labelCls}>Remarks</label>
                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} rows={2} className={`${inputCls} resize-none`} />
              </div>

              {isEditMode && (
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">Stock Adjustment</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Change Type</label>
                      <select name="changeType" value={stockAdjustmentData.changeType} onChange={handleStockAdjustmentChange} className={inputCls}>
                        <option value="addition">Addition</option>
                        <option value="reduction">Reduction</option>
                        <option value="set">Set to Value</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Quantity Change</label>
                      <input type="number" name="quantityChange" value={stockAdjustmentData.quantityChange} onChange={handleStockAdjustmentChange} min="0" className={inputCls} />
                      <p className="text-xs text-gray-400 mt-1">
                        {stockAdjustmentData.changeType === 'addition' ? 'Amount to add' : stockAdjustmentData.changeType === 'reduction' ? 'Amount to subtract' : 'Set stock to this value'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Remarks</label>
                    <textarea name="stockRemarks" value={stockAdjustmentData.stockRemarks} onChange={handleStockAdjustmentChange} rows={2} className={`${inputCls} resize-none`} placeholder="Additional notes" />
                  </div>
                </div>
              )}

              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleCloseModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || (!isEditMode && !formData.productId)}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Dialog ──────────────────────────────────── */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleDeleteCancel}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this label?</p>
            {labelToDelete && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm">
                <p className="font-semibold text-gray-800">{labelToDelete.bottleName}</p>
                <p className="text-gray-500">{labelToDelete.bottleCategory} · {labelToDelete.quantityAvailable || 0} Nos</p>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 mb-4">
              <AlertTriangle className="h-4 w-4" /> This action cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={handleDeleteCancel} disabled={loading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-60">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60">
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}