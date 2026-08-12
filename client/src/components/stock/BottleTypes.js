import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Box } from 'lucide-react';
import { getBottleTypes, updateBottleType } from '../../services/api/stock';

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors";
const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";

export default function BottleTypes() {
  const [bottleTypes, setBottleTypes] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState('');



  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    setLoading(true); setError('');
    try {
      const res = await getBottleTypes();
      setBottleTypes(res?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch bottle types');
    } finally { setLoading(false); }
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentId, setCurrentId]     = useState(null);
  const [formData, setFormData]       = useState({ bottleName: '', category: '', bottlesPerBox: '', preformGramage: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (item) => {
    setCurrentId(item._id);
    setFormData({ 
      bottleName: item.bottleName, 
      category: item.category, 
      bottlesPerBox: item.bottlesPerBox, 
      preformGramage: item.preformGramage 
    });
    setError(''); setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setFormData({ bottleName: '', category: '', bottlesPerBox: '', preformGramage: '' }); setError(''); };

  const handleSubmit = async () => {
    if (!formData.bottlesPerBox || formData.preformGramage === '') {
      setError('Bottles per box and Preform Gramage are required'); return; 
    }
    try {
      setLoading(true); setError('');
      const payload = {
        bottlesPerBox: parseInt(formData.bottlesPerBox, 10),
        preformGramage: parseFloat(formData.preformGramage)
      };

      await updateBottleType(currentId, payload);
      setSuccess('Bottle formula updated successfully!');

      closeModal(); await fetchTypes(); setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || `Failed to update bottle formula`);
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Box className="w-6 h-6 text-amber-500" />
            Bottle Types
          </h2>
          <p className="text-sm text-gray-500 mt-1">Manage bottle formulas and conversions</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium">
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50/50 text-gray-500 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Bottle Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Bottles per Box</th>
                <th className="px-6 py-4">Preform Gramage (g)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
              ) : bottleTypes.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-400">No bottle types found</td></tr>
              ) : (
                bottleTypes.map(item => (
                  <tr key={item._id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.bottleName}</td>
                    <td className="px-6 py-4">{item.category}</td>
                    <td className="px-6 py-4">{item.bottlesPerBox}</td>
                    <td className="px-6 py-4">{item.preformGramage}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 transition-opacity">
                        <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-semibold text-gray-900">Edit Formula: {formData.bottleName}</h3>
              <button onClick={closeModal} className="p-2 text-gray-400 hover:bg-white rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-y-auto">
              <div>
                <label className={labelCls}>Bottles per Box <span className="text-red-500">*</span></label>
                <input type="number" name="bottlesPerBox" value={formData.bottlesPerBox} onChange={handleInputChange} className={inputCls} placeholder="24" min="1" />
              </div>
              <div>
                <label className={labelCls}>Preform Gramage (g) <span className="text-red-500">*</span></label>
                <input type="number" name="preformGramage" value={formData.preformGramage} onChange={handleInputChange} className={inputCls} placeholder="9.12" min="0" step="0.01" />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex gap-3">
              <button onClick={closeModal} className="flex-1 px-4 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium">Cancel</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium shadow-sm">
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
}
