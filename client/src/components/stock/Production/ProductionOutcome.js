// import React, { useState, useEffect } from 'react';
// import { Button } from '../../ui/button';
// import Paginator from '../../common/Paginator';
// import {
//   fetchRawMaterials,
//   fetchProductionOutcomes,
//   recordProductionOutcome,
//   fetchOutcomeItems
// } from '../../../services/api/stock';
// import { Trash2, Plus } from 'lucide-react';

// export default function ProductionOutcome() {
//   const [materials, setMaterials] = useState([]);
//   const [outcomes, setOutcomes] = useState([]);
//   const [outcomeItems, setOutcomeItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(10);

//   // Form state - updated for multiple raw materials
//   const [formData, setFormData] = useState({
//     rawMaterials: [], // Array of { materialId, quantityUsed, materialName }
//     wastageKg: '',
//     remarks: '',
//     outcomes: [],
//     productionDate: new Date().toISOString().split('T')[0],
//   });

//   // Raw material input form state
//   const [rawMaterialForm, setRawMaterialForm] = useState({
//     materialId: '',
//     quantityUsed: '',
//   });

//   // Outcome item form state
//   const [outcomeForm, setOutcomeForm] = useState({
//     outcomeItemId: '',
//     quantityCreatedKg: '',
//   });

//   // Fetch data on mount
//   useEffect(() => {
//     fetchData();
//   }, []);

//   const fetchData = async () => {
//     setLoading(true);
//     setError('');
//     try {
//       const [materialsRes, outcomesRes, outcomeItemsRes] = await Promise.all([
//         fetchRawMaterials(),
//         fetchProductionOutcomes(),
//         fetchOutcomeItems(),
//       ]);

//       setMaterials(materialsRes.materials || materialsRes.data || []);
//       setOutcomes(outcomesRes.outcomes || outcomesRes.data || []);
//       setOutcomeItems(outcomeItemsRes.data || []);
//     } catch (err) {
//       setError(err.message || 'Failed to fetch data');
//       console.error('Error fetching data:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   // Raw material input handlers
//   const handleRawMaterialInputChange = (e) => {
//     const { name, value } = e.target;
//     setRawMaterialForm(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleAddRawMaterial = () => {
//     if (!rawMaterialForm.materialId || !rawMaterialForm.quantityUsed) {
//       setError('Raw Material and Quantity are required');
//       return;
//     }

//     // Check if material already added
//     if (formData.rawMaterials.some(m => m.materialId === rawMaterialForm.materialId)) {
//       setError('This raw material is already added');
//       return;
//     }

//     const selectedMaterial = materials.find(
//       m => m._id === rawMaterialForm.materialId
//     );

//     setFormData(prev => ({
//       ...prev,
//       rawMaterials: [
//         ...prev.rawMaterials,
//         {
//           materialId: rawMaterialForm.materialId,
//           materialName: selectedMaterial?.itemName || 'Unknown',
//           materialCode: selectedMaterial?.itemCode || '',
//           quantityUsed: parseFloat(rawMaterialForm.quantityUsed),
//         }
//       ]
//     }));

//     setRawMaterialForm({ materialId: '', quantityUsed: '' });
//     setError('');
//   };

//   const handleRemoveRawMaterial = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       rawMaterials: prev.rawMaterials.filter((_, i) => i !== index)
//     }));
//   };

//   // Outcome input handlers
//   const handleOutcomeInputChange = (e) => {
//     const { name, value } = e.target;
//     setOutcomeForm(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleAddOutcome = () => {
//     if (!outcomeForm.outcomeItemId || !outcomeForm.quantityCreatedKg) {
//       setError('Outcome Item and Quantity are required');
//       return;
//     }

//     const selectedOutcomeItem = outcomeItems.find(
//       i => i._id === outcomeForm.outcomeItemId
//     );

//     setFormData(prev => ({
//       ...prev,
//       outcomes: [
//         ...prev.outcomes,
//         {
//           outcomeItemId: outcomeForm.outcomeItemId,
//           outcomeItemName: selectedOutcomeItem?.itemName || 'Unknown',
//           quantityCreatedKg: parseFloat(outcomeForm.quantityCreatedKg),
//         }
//       ]
//     }));

//     setOutcomeForm({ outcomeItemId: '', quantityCreatedKg: '' });
//     setError('');
//   };

//   const handleRemoveOutcome = (index) => {
//     setFormData(prev => ({
//       ...prev,
//       outcomes: prev.outcomes.filter((_, i) => i !== index)
//     }));
//   };

//   // Calculate total raw materials used
//   const totalRawMaterialsKg = formData.rawMaterials.reduce(
//     (sum, m) => sum + (m.quantityUsed || 0), 0
//   );

//   const handleRecordProduction = async () => {
//     // Validate required fields
//     if (formData.rawMaterials.length === 0 || formData.outcomes.length === 0) {
//       setError('At least one Raw Material and one Outcome are required');
//       return;
//     }

//     try {
//       setLoading(true);
//       setError('');

//       // Build payload with new structure supporting multiple raw materials
//       const payload = {
//         rawMaterials: formData.rawMaterials.map(m => ({
//           materialId: m.materialId.trim(),
//           quantityUsed: parseFloat(m.quantityUsed),
//         })),
//         outcomes: formData.outcomes.map(o => ({
//           outcomeItemId: o.outcomeItemId.trim(),
//           quantityCreatedKg: parseFloat(o.quantityCreatedKg),
//         })),
//         wastageKg: formData.wastageKg ? parseFloat(formData.wastageKg) : 0,
//         remarks: formData.remarks || '',
//         productionDate: formData.productionDate || new Date().toISOString().split('T')[0],
//       };

//       // Validate payload before sending
//       console.log('Sending payload:', JSON.stringify(payload, null, 2));

//       // Validate raw materials
//       for (const material of payload.rawMaterials) {
//         if (!material.materialId || material.quantityUsed <= 0) {
//           setError('All raw materials must have valid item and quantity');
//           return;
//         }
//       }

//       // Validate each outcome
//       for (const outcome of payload.outcomes) {
//         if (!outcome.outcomeItemId || outcome.quantityCreatedKg <= 0) {
//           setError('All outcomes must have valid item and quantity');
//           return;
//         }
//       }

//       const response = await recordProductionOutcome(payload);

//       console.log('Response:', response);

//       setSuccess('Production outcome recorded successfully!');

//       // Reset form
//       setFormData({
//         rawMaterials: [],
//         wastageKg: '',
//         remarks: '',
//         outcomes: [],
//         productionDate: new Date().toISOString().split('T')[0],
//       });

//       await fetchData();
//       setTimeout(() => setSuccess(''), 3000);
//     } catch (err) {
//       console.error('Error recording production:', err);
//       setError(err.message || err.response?.data?.message || 'Failed to record production');
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Pagination
//   const startIdx = (page - 1) * pageSize;
//   const endIdx = startIdx + pageSize;
//   const paginatedOutcomes = outcomes.slice(startIdx, endIdx);

//   return (
//     <div>
//       {/* Success Message */}
//       {success && (
//         <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
//           {success}
//         </div>
//       )}

//       {/* Error Message */}
//       {error && (
//         <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
//           {error}
//         </div>
//       )}

//       {/* Form Section */}
//       <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
//         <h3 className="text-xl font-semibold text-gray-800 mb-4">Record Production Outcome</h3>

//         {/* Raw Materials Section */}
//         <div className="border-b pb-4 mb-4">
//           <h4 className="text-lg font-semibold text-gray-800 mb-3">Raw Materials Used</h4>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Select Raw Material *
//               </label>
//               <select
//                 name="materialId"
//                 value={rawMaterialForm.materialId}
//                 onChange={handleRawMaterialInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">-- Select Material --</option>
//                 {materials.map(material => (
//                   <option key={material._id} value={material._id}>
//                     {material.itemName} ({material.itemCode})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Quantity Used (Kg) *
//               </label>
//               <input
//                 type="number"
//                 name="quantityUsed"
//                 value={rawMaterialForm.quantityUsed}
//                 onChange={handleRawMaterialInputChange}
//                 placeholder="0.00"
//                 step="0.01"
//                 min="0"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="flex items-end">
//               <Button
//                 onClick={handleAddRawMaterial}
//                 className="w-full bg-blue-600 hover:bg-blue-700 text-white"
//               >
//                 <Plus size={16} className="mr-1" /> Add Material
//               </Button>
//             </div>
//           </div>

//           {/* Added Raw Materials List */}
//           {formData.rawMaterials.length > 0 && (
//             <div className="bg-blue-50 rounded-lg p-3">
//               <div className="flex justify-between items-center mb-2">
//                 <h5 className="font-semibold text-gray-700">Added Raw Materials:</h5>
//                 <span className="text-sm font-medium text-blue-600">
//                   Total: {totalRawMaterialsKg.toFixed(2)} Kg
//                 </span>
//               </div>
//               <div className="space-y-2">
//                 {formData.rawMaterials.map((material, index) => (
//                   <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-blue-200">
//                     <span className="text-sm text-gray-700">
//                       {material.materialName} ({material.materialCode}) - {material.quantityUsed} Kg
//                     </span>
//                     <button
//                       onClick={() => handleRemoveRawMaterial(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         {/* Other Form Fields */}
//         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Wastage (Kg)
//             </label>
//             <input
//               type="number"
//               name="wastageKg"
//               value={formData.wastageKg}
//               onChange={handleInputChange}
//               placeholder="0.00"
//               step="0.01"
//               min="0"
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Production Date
//             </label>
//             <input
//               type="date"
//               name="productionDate"
//               value={formData.productionDate}
//               onChange={handleInputChange}
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Remarks
//             </label>
//             <input
//               type="text"
//               name="remarks"
//               value={formData.remarks}
//               onChange={handleInputChange}
//               placeholder="Optional remarks"
//               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//             />
//           </div>
//         </div>

//         {/* Outcomes Section */}
//         <div className="border-t pt-4 mt-4">
//           <h4 className="text-lg font-semibold text-gray-800 mb-3">Production Outcomes</h4>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">

//             {/* Outcome Item Dropdown */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Outcome Item *
//               </label>
//               <select
//                 name="outcomeItemId"
//                 value={outcomeForm.outcomeItemId}
//                 onChange={handleOutcomeInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">-- Select Item --</option>
//                 {outcomeItems.map(item => (
//                   <option key={item._id} value={item._id}>
//                     {item.itemName} ({item.itemCode})
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">
//                 Quantity Created (Kg) *
//               </label>
//               <input
//                 type="number"
//                 name="quantityCreatedKg"
//                 value={outcomeForm.quantityCreatedKg}
//                 onChange={handleOutcomeInputChange}
//                 placeholder="0.00"
//                 step="0.01"
//                 min="0"
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//               />
//             </div>

//             <div className="flex items-end">
//               <Button
//                 onClick={handleAddOutcome}
//                 className="w-full bg-green-600 hover:bg-green-700 text-white"
//               >
//                 Add Outcome
//               </Button>
//             </div>
//           </div>

//           {/* Outcomes List */}
//           {formData.outcomes.length > 0 && (
//             <div className="bg-gray-50 rounded-lg p-3 mb-4">
//               <h5 className="font-semibold text-gray-700 mb-2">Added Outcomes:</h5>
//               <div className="space-y-2">
//                 {formData.outcomes.map((outcome, index) => (
//                   <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200">
//                     <span className="text-sm text-gray-700">
//                       {outcome.outcomeItemName} - {outcome.quantityCreatedKg} Kg
//                     </span>
//                     <button
//                       onClick={() => handleRemoveOutcome(index)}
//                       className="text-red-500 hover:text-red-700"
//                     >
//                       <Trash2 size={16} />
//                     </button>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>

//         <div className="mt-4 flex justify-end">
//           <Button
//             onClick={handleRecordProduction}
//             disabled={loading}
//             className="bg-blue-600 hover:bg-blue-700 text-white"
//           >
//             {loading ? 'Recording...' : 'Record Production'}
//           </Button>
//         </div>
//       </div>

//       {/* Loading State */}
//       {loading && (
//         <div className="flex justify-center items-center h-64">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
//         </div>
//       )}

//       {/* Production Outcomes Table */}
//       {!loading && outcomes.length > 0 && (
//         <div className="bg-white rounded-lg shadow-lg overflow-hidden">
//           <div className="overflow-x-auto">
//             <table className="w-full">
//               <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
//                 <tr>
//                   <th className="px-6 py-3 text-left font-semibold">Raw Materials</th>
//                   <th className="px-6 py-3 text-left font-semibold">Total Used (Kg)</th>
//                   <th className="px-6 py-3 text-left font-semibold">Outcomes</th>
//                   <th className="px-6 py-3 text-left font-semibold">Wastage (Kg)</th>
//                   <th className="px-6 py-3 text-left font-semibold">Remarks</th>
//                   <th className="px-6 py-3 text-left font-semibold">Date</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {paginatedOutcomes.map((outcome, index) => (
//                   <tr
//                     key={outcome._id}
//                     className={`border-b hover:bg-gray-50 transition ${
//                       index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
//                     }`}
//                   >
//                     <td className="px-6 py-4 font-medium text-gray-800">
//                       <div className="text-sm">
//                         {/* Handle new rawMaterials array format */}
//                         {outcome.rawMaterials && outcome.rawMaterials.length > 0 ? (
//                           outcome.rawMaterials.map((m, i) => (
//                             <div key={m._id || i} className="mb-1">
//                               <span className="font-medium">{m.material?.itemName || 'N/A'}</span>
//                               <span className="text-gray-500 ml-1">({m.quantityUsed} Kg)</span>
//                             </div>
//                           ))
//                         ) : (
//                           /* Fallback for old single rawMaterial format */
//                           outcome.rawMaterial?.itemName || 'N/A'
//                         )}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-gray-700">{outcome.usedRawMaterialKg} Kg</td>
//                     <td className="px-6 py-4 text-gray-700">
//                       <div className="text-sm">
//                         {outcome.outcomes?.map((o, i) => (
//                           <div key={i}>
//                             {o.outcomeItem?.itemName || 'N/A'}: {o.quantityCreatedKg} Kg
//                           </div>
//                         )) || '-'}
//                       </div>
//                     </td>
//                     <td className="px-6 py-4 text-gray-700">{outcome.wastageKg || 0} Kg</td>
//                     <td className="px-6 py-4 text-gray-700">{outcome.remarks || '-'}</td>
//                     <td className="px-6 py-4 text-gray-700">
//                       {new Date(outcome.productionDate).toLocaleDateString()}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>

//           {/* Pagination */}
//           <div className="mt-4 flex items-center justify-between px-6 pb-6">
//             <div className="text-sm text-gray-600">
//               Showing {Math.min(outcomes.length, startIdx + 1)}–
//               {Math.min(outcomes.length, endIdx)} of {outcomes.length}
//             </div>
//             <Paginator page={page} total={outcomes.length} pageSize={pageSize} onPageChange={setPage} />
//             <select
//               className="border rounded px-2 py-1 text-sm"
//               value={pageSize}
//               onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
//             >
//               {[5, 10, 20, 50].map((n) => (
//                 <option key={n} value={n}>{n} / page</option>
//               ))}
//             </select>
//           </div>
//         </div>
//       )}

//       {!loading && outcomes.length === 0 && (
//         <div className="bg-white rounded-lg shadow-lg p-8 text-center">
//           <p className="text-gray-500 text-lg">No production outcomes found. Record one to get started!</p>
//         </div>
//       )}
//     </div>
//   );
// }
