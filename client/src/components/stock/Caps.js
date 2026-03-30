import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X, AlertTriangle } from 'lucide-react';
import { addCap, getCaps, updateCapStock, deleteCap } from '../../services/api/stock';

const ROWS_OPTIONS = [5, 10, 20, 50];

function statusBadge(status) {
  if (status === 'OUT_OF_STOCK') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 whitespace-nowrap">Out of Stock</span>;
  if (status === 'LOW_STOCK')   return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200 whitespace-nowrap">Low Stock</span>;
  if (status === 'NORMAL')      return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200 whitespace-nowrap">Normal</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 whitespace-nowrap">Unknown</span>;
}

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

const neckTypes = ['narrow neck', 'wide neck'];
const sizes     = ['20mm', '24mm', '28mm', '32mm', '38mm', '45mm', '53mm'];
const colors    = ['White', 'Blue', 'Red', 'Green', 'Yellow', 'Black', 'Transparent', 'Other'];

export default function CapManagement() {
  const [caps, setCaps]                 = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [currentCapId, setCurrentCapId] = useState(null);
  const [page, setPage]                 = useState(0);
  const [rowsPerPage, setRowsPerPage]   = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [capToDelete, setCapToDelete]   = useState(null);

  const [searchQuery, setSearchQuery]       = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [neckTypeFilter, setNeckTypeFilter] = useState('');
  const [sizeFilter, setSizeFilter]         = useState('');
  const [colorFilter, setColorFilter]       = useState('');

  const [formData, setFormData] = useState({ neckType: '', size: '', color: '', quantityAvailable: 0, remarks: '' });
  const [stockAdjustmentData, setStockAdjustmentData] = useState({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
  const [hasStockAdjustment, setHasStockAdjustment] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => { fetchCaps(); }, [debouncedSearch, neckTypeFilter, sizeFilter, colorFilter]);

  const fetchCaps = async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (neckTypeFilter) params.neckType = neckTypeFilter;
      if (sizeFilter) params.size = sizeFilter;
      if (colorFilter) params.color = colorFilter;
      const response = await getCaps(params);
      if (response.success) {
        let data = response.data || [];
        if (debouncedSearch) {
          data = data.filter(cap =>
            cap.displayName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            cap.neckType.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            cap.size.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            cap.color.toLowerCase().includes(debouncedSearch.toLowerCase())
          );
        }
        setCaps(data.sort((a, b) => (a.displayName || '').localeCompare(b.displayName || '', undefined, { sensitivity: 'base' })));
      } else { setError('Failed to fetch caps'); }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch caps');
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
    setFormData({ neckType: '', size: '', color: '', quantityAvailable: 0, remarks: '' });
    setStockAdjustmentData({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
    setHasStockAdjustment(false);
  };

  const handleOpenModal = (cap = null) => {
    if (cap) {
      setIsEditMode(true); setCurrentCapId(cap._id);
      setFormData({ neckType: cap.neckType, size: cap.size, color: cap.color, quantityAvailable: cap.quantityAvailable || 0, remarks: cap.remarks || '' });
      setStockAdjustmentData({ changeType: 'addition', quantityChange: '', stockRemarks: '' });
      setHasStockAdjustment(false);
    } else { setIsEditMode(false); setCurrentCapId(null); resetModal(); }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setIsEditMode(false); setCurrentCapId(null); resetModal(); setError(''); };

  const handleSubmit = async () => {
    if (!formData.neckType || !formData.size || !formData.color) { setError('Neck Type, Size, and Color are required'); return; }
    if (!isEditMode && (formData.quantityAvailable === '' || formData.quantityAvailable < 0)) { setError('Initial quantity is required and cannot be negative'); return; }
    try {
      setLoading(true); setError('');
      let capUpdateSuccess = false, stockAdjustmentSuccess = false;
      if (!isEditMode) {
        const response = await addCap(formData);
        if (response.success) { capUpdateSuccess = true; setSuccess(response.message || 'Cap added successfully!'); }
      }
      if (isEditMode && hasStockAdjustment && stockAdjustmentData.quantityChange !== '' && parseFloat(stockAdjustmentData.quantityChange) >= 0) {
        const stockResponse = await updateCapStock(currentCapId, {
          changeType: stockAdjustmentData.changeType,
          quantityChange: parseFloat(stockAdjustmentData.quantityChange),
          remarks: stockAdjustmentData.stockRemarks || 'Manual adjustment',
        });
        if (stockResponse.success) stockAdjustmentSuccess = true;
      }
      if (isEditMode) {
        if (stockAdjustmentSuccess) setSuccess('Cap stock updated successfully!');
        else setSuccess('No changes made');
      } else { if (capUpdateSuccess) setSuccess('Cap added successfully!'); }
      handleCloseModal(); await fetchCaps(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || `Failed to ${isEditMode ? 'update' : 'add'} cap`);
    } finally { setLoading(false); }
  };

  const handleDeleteClick  = (cap) => { setCapToDelete(cap); setDeleteDialogOpen(true); };
  const handleDeleteCancel = () => { setDeleteDialogOpen(false); setCapToDelete(null); };
  const handleDeleteConfirm = async () => {
    if (!capToDelete) return;
    try {
      setLoading(true); setError('');
      const response = await deleteCap(capToDelete._id);
      if (response.success) { setSuccess(response.message || 'Cap deleted successfully!'); await fetchCaps(); setTimeout(() => setSuccess(''), 3000); }
    } catch (err) { setError(err.response?.data?.message || err.message || 'Failed to delete cap'); }
    finally { setLoading(false); setDeleteDialogOpen(false); setCapToDelete(null); }
  };

  const paginatedCaps = caps.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const Pagination = () => {
    const pages = Math.ceil(caps.length / rowsPerPage);
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
          <span>{page * rowsPerPage + 1}–{Math.min((page + 1) * rowsPerPage, caps.length)} of {caps.length}</span>
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
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="2"/><circle cx="12" cy="12" r="3" strokeWidth="2"/></svg>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Cap Management</h1>
              <p className="text-sm text-slate-500 mt-0.5">{caps.length} caps</p>
            </div>
          </div>
          <button onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Cap
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
              <input type="text" placeholder="Search caps..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
            </div>
            <select value={neckTypeFilter} onChange={e => setNeckTypeFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
              <option value="">All Neck Types</option>
              {neckTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={sizeFilter} onChange={e => setSizeFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
              <option value="">All Sizes</option>
              {sizes.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={colorFilter} onChange={e => setColorFilter(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none">
              <option value="">All Colors</option>
              {colors.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && caps.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" />
          </div>
        )}

        {/* Table */}
        {!loading && caps.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-amber-500 text-white">
                    {['Display Name', 'Neck Type', 'Size', 'Color', 'Available Qty', 'Status', 'Remarks', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {paginatedCaps.map((cap, idx) => (
                    <tr key={cap._id} className={`hover:bg-amber-50/40 transition-colors ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-800">{cap.displayName}</td>
                      <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-100 capitalize">{cap.neckType}</span></td>
                      <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full text-xs bg-purple-50 text-purple-700 border border-purple-100">{cap.size}</span></td>
                      <td className="px-4 py-3"><span className="px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700">{cap.color}</span></td>
                      <td className="px-4 py-3 font-semibold text-gray-800">{cap.quantityAvailable || 0} <span className="text-gray-400 font-normal text-xs">Nos</span></td>
                      <td className="px-4 py-3">{statusBadge(cap.stockStatus)}</td>
                      <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{cap.remarks || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleOpenModal(cap)} title="Edit"
                            className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(cap)} title="Delete"
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

        {!loading && caps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <svg className="h-14 w-14 mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="9" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" strokeWidth="1.5"/></svg>
            <p className="font-medium">No caps found. Add one to get started!</p>
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
              <h3 className="text-lg font-semibold text-gray-800">{isEditMode ? 'Edit Cap' : 'Add Cap'}</h3>
              <button onClick={handleCloseModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">Cap Details</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Neck Type <span className="text-red-500">*</span></label>
                  <select name="neckType" value={formData.neckType} onChange={handleInputChange} disabled={isEditMode}
                    className={`${inputCls} ${isEditMode ? 'bg-gray-50 text-gray-400' : ''}`}>
                    <option value="">Select Neck Type</option>
                    {neckTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  {isEditMode && <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>}
                </div>
                <div>
                  <label className={labelCls}>Size <span className="text-red-500">*</span></label>
                  <select name="size" value={formData.size} onChange={handleInputChange} disabled={isEditMode}
                    className={`${inputCls} ${isEditMode ? 'bg-gray-50 text-gray-400' : ''}`}>
                    <option value="">Select Size</option>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {isEditMode && <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>}
                </div>
                <div>
                  <label className={labelCls}>Color <span className="text-red-500">*</span></label>
                  <select name="color" value={formData.color} onChange={handleInputChange} disabled={isEditMode}
                    className={`${inputCls} ${isEditMode ? 'bg-gray-50 text-gray-400' : ''}`}>
                    <option value="">Select Color</option>
                    {colors.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {isEditMode && <p className="text-xs text-gray-400 mt-1">Cannot be changed</p>}
                </div>
                {!isEditMode && (
                  <div>
                    <label className={labelCls}>Initial Quantity (Nos)</label>
                    <input type="number" name="quantityAvailable" value={formData.quantityAvailable} onChange={handleInputChange} min="0" className={inputCls} />
                  </div>
                )}
              </div>
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
                        {stockAdjustmentData.changeType === 'addition' ? 'Amount to add' : stockAdjustmentData.changeType === 'reduction' ? 'Amount to subtract' : 'Set to this value'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <label className={labelCls}>Adjustment Remarks</label>
                    <textarea name="stockRemarks" value={stockAdjustmentData.stockRemarks} onChange={handleStockAdjustmentChange} rows={2} className={`${inputCls} resize-none`} placeholder="Notes" />
                  </div>
                </div>
              )}
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={handleCloseModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !formData.neckType || !formData.size || !formData.color}
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
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to delete this cap?</p>
            {capToDelete && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div><p className="text-xs text-gray-400">Neck Type</p><p className="font-semibold text-gray-800">{capToDelete.neckType}</p></div>
                  <div><p className="text-xs text-gray-400">Size</p><p className="font-semibold text-gray-800">{capToDelete.size}</p></div>
                  <div><p className="text-xs text-gray-400">Color</p><p className="font-semibold text-gray-800">{capToDelete.color}</p></div>
                  <div><p className="text-xs text-gray-400">Available</p><p className="font-semibold text-gray-800">{capToDelete.quantityAvailable || 0} Nos</p></div>
                </div>
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