import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Layers } from 'lucide-react';
import { getPreformTypeList, addPreformType, updatePreformType, deletePreformType } from '../../services/api/stock';

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function PreformTypes() {
  const [preformTypes, setPreformTypes] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [success, setSuccess]           = useState('');

  // Add/Edit modal
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [isEditMode, setIsEditMode]     = useState(false);
  const [currentId, setCurrentId]       = useState(null);
  const [formData, setFormData]         = useState({ name: '', description: '' });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete]         = useState(null);

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    setLoading(true); setError('');
    try {
      const res = await getPreformTypeList();
      // The API returns { success: true, data: [...] }
      const data = res?.data || [];
      setPreformTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to fetch preform types');
    } finally { setLoading(false); }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setIsEditMode(false); setCurrentId(null);
    setFormData({ name: '', description: '' });
    setError(''); setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setIsEditMode(true);
    setCurrentId(item._id);
    setFormData({ name: item.name, description: item.description || '' });
    setError(''); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setFormData({ name: '', description: '' }); setError(''); };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { setError('Preform type name is required'); return; }
    try {
      setLoading(true); setError('');
      if (isEditMode) {
        await updatePreformType(currentId, formData);
        setSuccess('Preform type updated successfully!');
      } else {
        await addPreformType(formData);
        setSuccess('Preform type added successfully!');
      }
      closeModal(); await fetchTypes(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'add'} preform type`);
    } finally { setLoading(false); }
  };

  const handleDeleteClick = (item) => { setItemToDelete(item); setDeleteDialogOpen(true); };
  const handleDeleteCancel = () => { setDeleteDialogOpen(false); setItemToDelete(null); };
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true); setError('');
      await deletePreformType(itemToDelete._id);
      setSuccess('Preform type deleted!');
      await fetchTypes(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to delete preform type');
    } finally { setLoading(false); setDeleteDialogOpen(false); setItemToDelete(null); }
  };

  // Simplified normalization
  const normalizeItem = (item) => {
    if (typeof item === 'string') return { _id: item, name: item, description: '', isActive: true };
    return {
      ...item,
      _id: item._id,
      name: item.name || item.type,
      description: item.description || ''
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 rounded-xl"><Layers className="h-6 w-6 text-amber-600" /></div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">Preform Types</h1>
              <p className="text-sm text-slate-500 mt-0.5">{preformTypes.length} types defined</p>
            </div>
          </div>
          <button onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Preform Type
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

        {/* Loading */}
        {loading && preformTypes.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin h-8 w-8 border-4 border-amber-200 border-t-amber-500 rounded-full" />
          </div>
        )}

        {/* Cards Grid */}
        {!loading && preformTypes.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {preformTypes.map((raw, idx) => {
              const item = normalizeItem(raw);
              return (
                <div key={item._id || idx} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-amber-100 rounded-lg shrink-0">
                        <Layers className="h-4 w-4 text-amber-600" />
                      </div>
                      <p className="font-bold text-gray-800 text-base">{item.name}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditModal(item)}
                        className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDeleteClick(item)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">{item.description}</p>
                  )}
                  {item.totalAvailable !== undefined && (
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs border-t border-gray-100 pt-3">
                      <div>
                        <span className="text-gray-400 block mb-0.5">Available (boxes)</span>
                        <span className="font-semibold text-green-600">{item.totalAvailable}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block mb-0.5">Total Produced</span>
                        <span className="font-semibold text-blue-600">{item.totalProduced}</span>
                      </div>
                    </div>
                  )}
                  {item.isActive !== undefined && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!loading && preformTypes.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Layers className="h-14 w-14 mb-4 opacity-30" />
            <p className="font-medium">No preform types defined. Add one to get started!</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800">{isEditMode ? 'Edit Preform Type' : 'Add Preform Type'}</h3>
              <button onClick={closeModal} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Name <span className="text-red-500">*</span></label>
                <input name="name" value={formData.name} onChange={handleInputChange}
                  className={inputCls} placeholder="e.g. 28mm" />
                <p className="text-xs text-gray-400 mt-1">Unique identifier for this preform type</p>
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  rows={3} className={`${inputCls} resize-none`} placeholder="e.g. Standard bottle neck preform" />
              </div>
              {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>}
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={closeModal} className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={handleSubmit} disabled={loading || !formData.name.trim()}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {loading ? 'Saving...' : isEditMode ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ── */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4"
          onClick={handleDeleteCancel}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-xl"><Trash2 className="h-5 w-5 text-red-600" /></div>
              <h3 className="text-lg font-semibold text-gray-800">Confirm Deletion</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Delete preform type <strong>{itemToDelete?.name}</strong>?</p>
            <div className="flex items-center gap-1.5 text-sm font-medium text-red-600 mb-5">
              <AlertTriangle className="h-4 w-4" /> This action cannot be undone.
            </div>
            <div className="flex gap-3">
              <button onClick={handleDeleteCancel} disabled={loading}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-60">Cancel</button>
              <button onClick={handleDeleteConfirm} disabled={loading}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium disabled:opacity-60">
                {loading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
