import apiClient from './client';
import axios from 'axios';

// ============ RAW MATERIAL APIs ============

/**
 * Fetch all raw materials
 * GET /raw-materials
 */
export const fetchRawMaterials = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/raw-materials', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Add a new raw material
 * POST /raw-material/add
 * @param {Object} data - { itemName, itemCode, subcategory?, unit?, supplier?, minStockLevel?, remarks? }
 */
export const addRawMaterial = async (data) => {
  try {
    const response = await apiClient.post('stock/raw-material/add', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get raw material by ID
 * GET /raw-material/:id
 * @param {string} id - Raw material ID
 */
export const getRawMaterialById = async (id) => {
  try {
    const response = await apiClient.get(`stock/raw-material/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update raw material info
 * PUT /raw-material/:id
 * @param {string} id - Raw material ID
 * @param {Object} data - Updated fields
 */
export const updateRawMaterial = async (id, data) => {
  try {
    const response = await apiClient.put(`stock/raw-material/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Soft delete (inactivate) raw material
 * DELETE /raw-material/:id
 * @param {string} id - Raw material ID
 */
export const deleteRawMaterial = async (id) => {
  try {
    const response = await apiClient.delete(`stock/raw-material/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Record an inward entry
 * POST /raw-material/entry
 * @param {Object} data - { rawMaterialId, quantityKg, remarks }
*/
export const recordInwardEntry = async (data) => {
  try {
    const response = await apiClient.post('stock/raw-material/entry', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Fetch all inward entries
 * GET /raw-material/entries
 */
export const fetchInwardEntries = async () => {
  try {
    const response = await apiClient.get('stock/raw-material/entries');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Manual stock adjustment
 * PUT /raw-material/:id/stock
 * @param {string} id - Raw material ID
 * @param {Object} data - { adjustmentType, quantity, reason, remarks? }
 * adjustmentType: 'addition' | 'reduction' | 'set'
 */

export const adjustRawMaterialStock = async (id, data) => {
  try {
    const response = await apiClient.put(`stock/raw-material/${id}/stock`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get current stock report
 * GET /current-stock
 */
export const getCurrentStockReport = async () => {
  try {
    const response = await apiClient.get('stock/current-stock');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ PRODUCTION APIs ============

/**
 * Fetch all production outcomes
 * GET /production/outcomes
 */
export const fetchProductionOutcomes = async () => {
  try {
    const response = await apiClient.get('stock/production/outcomes');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Record a production batch (General production outcome)
 * POST /production/outcome
 * @param {Object} data - {
 *   rawMaterials: [{materialId, quantityUsed}],
 *   outcomes: [{outcomeItemId, quantityCreatedKg}],
 *   wastageKg,
 *   remarks?,
 *   productionDate?
 * }
 */
export const recordProductionOutcome = async (data) => {
  try {
    const response = await apiClient.post('stock/production/outcome', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// <---------------------------PREFORM PRODUCTION APIs----------------------------------->

/**
 * Record preform production (UPDATED)
 * POST /api/stock/production/preform
 * 
 * @param {Object} data - {
 *   rawMaterials: [
 *     { materialId: string, quantityUsed: number }
 *   ],
 *   preformType: string,
 *   quantityProduced: number,
 *   wastageType1?: number,   // Reusable wastage
 *   wastageType2?: number,   // Non-reusable / Scrap wastage
 *   remarks?: string,
 *   productionDate?: string (YYYY-MM-DD)
 * }
 */
export const recordPreformProduction = async (data) => {
  try {
    const response = await apiClient.post('stock/production/preform', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Preform Productions (with optional reports)
 * GET /api/stock/production/preform
 * 
 * Available Query Params:
 * preformType?: string
 * startDate?: string (YYYY-MM-DD)
 * endDate?: string (YYYY-MM-DD)
 * period?: 'daily' | 'weekly' | 'monthly'
 * downloadReport?: boolean
 * page?: number
 * limit?: number
 * sortBy?: string
 * sortOrder?: 'asc' | 'desc'
 */
export const getPreformProductions = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/production/preform', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getPreformProductionById = async (id) => {
  try {
    const response = await apiClient.get(`stock/production/preform/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// <-----------------------CAP MANAGEMENT APIs-------------------->

/**
 * Add a new cap
 * POST /api/stock/cap/add
 * @param {Object} data - { neckType, size, color, quantityAvailable, remarks? }
 */
export const addCap = async (data) => {
  try {
    const response = await apiClient.post('stock/cap/add', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get caps with optional filters
 * GET /api/stock/caps
 * @param {Object} params - { neckType?, size?, color? }
 */
export const getCaps = async (params) => {
  try {
    const response = await apiClient.get('stock/caps', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Record cap production (UPDATED)
 * POST /api/stock/production/cap
 *
 * @param {Object} data - {
 *   rawMaterials: [
 *     { materialId: string, quantityUsed: number }
 *   ],
 *   capType: string,         // e.g., "28mm"
 *   capColor: string,        // e.g., "black"
 *   quantityProduced: number,
 *   boxesUsed?: number,
 *   bagsUsed?: number,
 *   wastageType1?: number,   // Reusable wastage
 *   wastageType2?: number,   // Non-reusable / Scrap wastage
 *   remarks?: string,
 *   productionDate?: string  // YYYY-MM-DD
 * }
 */
export const recordCapProduction = async (data) => {
  try {
    const response = await apiClient.post('stock/production/cap', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update cap stock
 * PUT /api/stock/cap/:id/stock
 * @param {String} id - Cap ID
 * @param {Object} data - { quantityChange, changeType, remarks? }
 */
export const updateCapStock = async (id, data) => {
  try {
    const response = await apiClient.put(`stock/cap/${id}/stock`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete cap
 * DELETE /api/stock/cap/:id
 * @param {String} id - Cap ID
 */
export const deleteCap = async (id) => {
  try {
    const response = await apiClient.delete(`stock/cap/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// <-----------------------------------LABEL PRODUCTION APIs------------------------------------>

/**
 * Add a new label
 * POST /api/stock/label/add
 * @param {Object} data - { bottleCategory, bottleName, quantityAvailable, remarks? }
 */
export const addLabel = async (data) => {
  try {
    const response = await apiClient.post('stock/label/add', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get labels with optional filters
 * GET /api/stock/labels
 * @param {Object} params - { bottleCategory? }
 */
export const getLabels = async (params) => {
  try {
    const response = await apiClient.get('stock/labels', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update label stock
 * PUT /api/stock/label/:id/stock
 * @param {String} id - Label ID
 * @param {Object} data - { quantityChange, changeType, remarks? }
 */
export const updateLabelStock = async (id, data) => {
  try {
    const response = await apiClient.put(`stock/label/${id}/stock`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete label
 * DELETE /api/stock/label/:id
 * @param {String} id - Label ID
 */
export const deleteLabel = async (id) => {
  try {
    const response = await apiClient.delete(`stock/label/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// <---------------------------------BOTTLE PRODUCTION APIs--------------------------------------->

/**
 * Record bottle production (UPDATED)
 * POST /api/stock/production/bottle
 *
 * @param {Object} data - {
 *   preformType: string,
 *   boxesProduced: number,
 *   bottlesPerBox: number,
 *   bottleCategory: string,
 *   labelId: string,    // required
 *   capId: string,      // required
 *   remarks?: string,
 *   productionDate?: string  // YYYY-MM-DD
 * }
 */
export const recordBottleProduction = async (data) => {
  try {
    const response = await apiClient.post('stock/production/bottle', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Available Preform Types
 * GET /preforms/available-types
 */
export const getAvailablePreformTypes = async () => {
  try {
    const response = await apiClient.get('stock/preforms/available-types');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Available Preforms (Detailed availability)
 * GET /preforms/available?type=
 */
export const getAvailablePreforms = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/preforms/available', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Available Caps (Detailed availability)
 * GET /caps/available?type=
 */
export const getAvailableCaps = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/caps/available', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Preform Types (ALL types, for dropdown)
 * GET /preforms/types
 */
export const getPreformTypes = async () => {
  try {
    const response = await apiClient.get('stock/preforms/types');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Cap Types (ALL types, for dropdown)
 * GET /caps/types
 */
export const getCapTypes = async () => {
  try {
    const response = await apiClient.get('stock/caps/types');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Cap Productions (with optional reports)
 * GET /api/stock/production/cap
 *
 * @param {Object} params - {
 *   capType?: string,
 *   capColor?: string,
 *   startDate?: string,        // YYYY-MM-DD
 *   endDate?: string,          // YYYY-MM-DD
 *   period?: 'daily' | 'weekly' | 'monthly',
 *   downloadReport?: boolean,
 *   page?: number,
 *   limit?: number,
 *   sortBy?: string,
 *   sortOrder?: 'asc' | 'desc'
 * }
 */
export const getCapProductions = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/production/cap', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Fetch bottle production categories for selection/dropdown
 * Used to populate bottle category selection fields
 */
export const getBottleProductionCategories = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/production/bottle/category', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check Material Availability for Bottle Production
 * GET /production/check-availability
 */
export const checkMaterialAvailability = async (params) => {
  try {
    // Remove the extra { params } wrapper - send params directly
    const response = await apiClient.post('stock/production/check-availability', params);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Check Bottle Production Availability (explicit capType)
 * GET /production/check-bottle-availability
 */
export const checkBottleAvailability = async (params) => {
  try {
    const response = await apiClient.get('stock/production/check-bottle-availability', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Production Batches
 * GET /production/batches
 */
export const getProductionBatches = async () => {
  try {
    const response = await apiClient.get('stock/production/batches');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Bottle Productions (with filters, pagination, sorting)
 * GET /api/stock/production/bottle
 *
 * @param {Object} params - {
 *   bottleCategory?: string,
 *   startDate?: string,      // YYYY-MM-DD
 *   endDate?: string,        // YYYY-MM-DD
 *   page?: number,
 *   limit?: number,
 *   sortBy?: string,
 *   sortOrder?: 'asc' | 'desc'
 * }
 */
export const getBottleProductions = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/production/bottle', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ OUTCOME ITEMS APIs ============

/**
 * Add outcome item
 * POST /outcome-item/add
 * @param {Object} data - { itemName, itemCode, type, subcategory?, remarks? }
 */
export const addOutcomeItem = async (data) => {
  try {
    const response = await apiClient.post('stock/outcome-item/add', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all outcome items
 * GET /outcome-items
 */
export const fetchOutcomeItems = async () => {
  try {
    const response = await apiClient.get('stock/outcome-items');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ WASTAGE MANAGEMENT APIs ============

/**
 * Record wastage (UPDATED)
 * POST /api/stock/wastage
 *
 * @param {Object} data - {
 *   source: string,             // e.g., "Preform", "Cap", "Bottle"
 *   quantityType1?: number,     // Reusable wastage
 *   quantityType2?: number,     // Scrap / Non-reusable
 *   remarks?: string,
 *   date?: string               // YYYY-MM-DD
 * }
 */
export const recordWastage = async (data) => {
  try {
    const response = await apiClient.post('stock/wastage', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update wastage reuse
 * PUT /wastage/reuse
 * @param {Object} data - { wastageId, quantityReused, reuseReference?, remarks? }
 */
export const updateWastageReuse = async (data) => {
  try {
    const response = await apiClient.put('stock/wastage/reuse', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get wastage report
 * GET /wastage-report
 * @param {Object} params - { startDate?, endDate?, source?, wastageType? }
 */
export const getWastageReport = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/wastage-report', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ DIRECT USAGE APIs ============

/**
 * Record direct material usage
 * POST /direct-usage
 * @param {Object} data - { materialId, quantity, purpose, remarks?, usageDate? }
 */
export const recordDirectUsage = async (data) => {
  try {
    const response = await apiClient.post('stock/direct-usage', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ REPORTS & ANALYTICS APIs ============

/**
 * Get stock summary report
 * GET /stock-report
 */
export const getStockReport = async () => {
  try {
    const response = await apiClient.get('stock/stock-report');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get production report
 * GET /production-report
 * @param {Object} params - { startDate?, endDate?, type? }
 */
export const getProductionReport = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/production-report', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get direct usage report
 * GET /usage-report
 * @param {Object} params - { startDate?, endDate? }
 */
export const getUsageReport = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/usage-report', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Preform Production Report
 * GET /api/stock/report/preform-production
 *
 * @param {Object} params - {
 *   period?: 'daily' | 'weekly' | 'monthly',
 *   startDate?: string,   // YYYY-MM-DD
 *   endDate?: string      // YYYY-MM-DD
 * }
 */
export const getPreformProductionReport = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/report/preform-production', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get Cap Production Report
 * GET /api/stock/report/cap-production
 *
 * @param {Object} params - {
 *   period?: 'daily' | 'weekly' | 'monthly',
 *   startDate?: string,   // YYYY-MM-DD
 *   endDate?: string      // YYYY-MM-DD
 * }
 */
export const getCapProductionReport = async (params = {}) => {
  try {
    const response = await apiClient.get('stock/report/cap-production', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};


// ============ ADMIN FUNCTIONS APIs ============

/**
 * Fetch raw material summary (admin only)
 * GET /admin/raw-material/summary
 * Returns: { success, data: { summary: [...], overall: { totalWastageKg, totalProducedKg } } }
 */
export const getRawMaterialSummary = async () => {
  try {
    const response = await apiClient.get('admin/raw-material/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Add new category
 * POST /admin/category
 * @param {Object} data - { type, name, code }
 */
export const addCategory = async (data) => {
  try {
    const response = await apiClient.post('admin/category', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get categories
 * GET /admin/categories
 * @param {Object} params - { type? }
 */
export const getCategories = async (params = {}) => {
  try {
    const response = await apiClient.get('admin/categories', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Add formula
 * POST /admin/formula
 * @param {Object} data - { name, formula, unit, description? }
 */
export const addFormula = async (data) => {
  try {
    const response = await apiClient.post('admin/formula', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get formulas
 * GET /admin/formulas
 */
export const getFormulas = async () => {
  try {
    const response = await apiClient.get('admin/formulas');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ EXPORT FUNCTIONS APIs ============

/**
 * Export stock report
 * GET /admin/export/stock-report
 * @param {string} format - 'csv' or 'excel'
 */
export const exportStockReport = async (format = 'csv') => {
  try {
    const response = await apiClient.get('admin/export/stock-report', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Export production report
 * GET /admin/export/production-report
 * @param {Object} params - { startDate?, endDate?, type?, format? }
 */
export const exportProductionReport = async (params = {}) => {
  try {
    const response = await apiClient.get('admin/export/production-report', {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Export wastage report
 * GET /admin/export/wastage-report
 * @param {Object} params - { startDate?, endDate?, source?, wastageType?, format? }
 */
export const exportWastageReport = async (params = {}) => {
  try {
    const response = await apiClient.get('admin/export/wastage-report', {
      params,
      responseType: 'blob'
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ============ PREFORM TYPE MANAGEMENT APIs ============

/**
 * Get all preform types
 * GET /stock/preform-type/
 */
export const getPreformTypeList = async () => {
  try {
    const response = await apiClient.get('stock/preform-type/');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Add a new preform type
 * POST /stock/preform-type/add
 * @param {Object} data - { name, description? }
 */
export const addPreformType = async (data) => {
  try {
    const response = await apiClient.post('stock/preform-type/add', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Update a preform type
 * PATCH /stock/preform-type/:id
 * @param {string} id
 * @param {Object} data - { name?, description? }
 */
export const updatePreformType = async (id, data) => {
  try {
    const response = await apiClient.patch(`stock/preform-type/${id}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Delete a preform type
 * DELETE /stock/preform-type/:id
 * @param {string} id
 */
export const deletePreformType = async (id) => {
  try {
    const response = await apiClient.delete(`stock/preform-type/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
