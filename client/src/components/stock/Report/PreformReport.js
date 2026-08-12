import React, { useState } from 'react';
import { Package, TrendingUp } from 'lucide-react';
import { getPreformProductionReport } from '../../../services/api/stock';

const PreformReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    period: 'weekly',
    startDate: '',
    endDate: ''
  });

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (filters.period) params.period = filters.period;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const result = await getPreformProductionReport(params);

      if (result.success) {
        setReportData(result);
      } else {
        setError(result.message || 'Failed to fetch preform production report');
      }
    } catch (err) {
      setError(err.message || 'Error fetching report');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });
    
    if (name === 'period' && value !== 'custom') {
      setFilters(prev => ({ ...prev, startDate: '', endDate: '' }));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="w-5 h-5" />
          Preform Production Report
        </h3>
      </div>

      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Period
            </label>
            <select
              name="period"
              value={filters.period}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
          
          {filters.period === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}
          
          <div className="flex items-end">
            <button
              onClick={fetchReport}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : reportData ? (
        <>
          {/* Summary Statistics */}
          {reportData.summary && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-600 font-medium">Total Productions</div>
                  <div className="text-2xl font-bold text-blue-900 mt-1">
                    {reportData.summary.totalProductions || 0}
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm text-green-600 font-medium">Quantity Produced</div>
                  <div className="text-2xl font-bold text-green-900 mt-1">
                    {reportData.summary.totalQuantityProduced?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm text-purple-600 font-medium">Used in Bottles</div>
                  <div className="text-2xl font-bold text-purple-900 mt-1">
                    {reportData.summary.totalUsedInBottles?.toLocaleString() || 0}
                  </div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-sm text-red-600 font-medium">Total Wastage</div>
                  <div className="text-2xl font-bold text-red-900 mt-1">
                    {reportData.summary.totalWastage || 0}
                  </div>
                </div>
              </div>

              {/* Preform Type Breakdown */}
              {reportData.summary.byPreformType && Object.keys(reportData.summary.byPreformType).length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h4 className="text-md font-semibold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Production by Preform Type
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(reportData.summary.byPreformType).map(([type, data]) => (
                      <div key={type} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="text-sm font-semibold text-gray-700 mb-2">{type}</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Produced:</span>
                            <span className="font-medium">{data.quantityProduced?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Used:</span>
                            <span className="font-medium text-green-600">{data.usedInBottles?.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Wastage:</span>
                            <span className="font-medium text-red-600">{data.wastage || 0}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Detailed Report Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 rounded-lg">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Production Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preform Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Raw Materials
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Produced
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Used in Bottles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wastage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recorded By
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reportData.data && reportData.data.length > 0 ? (
                  reportData.data.map((item, index) => (
                    <tr key={item._id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(item.productionDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.outcomeType || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.rawMaterials && item.rawMaterials.length > 0 ? (
                          <div className="space-y-1">
                            {item.rawMaterials.map((rm, rmIndex) => (
                              <div key={rmIndex} className="text-xs">
                                <span className="font-medium">{rm.material?.itemName || 'N/A'}</span>
                                <span className="text-gray-500"> ({rm.material?.itemCode || 'N/A'})</span>
                                <span className="text-blue-600 ml-1">
                                  - {rm.quantityUsed} {rm.material?.unit || 'Kg'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantityProduced?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {item.usedInBottles?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        {item.wastage || 0}
                        {(item.wastageType1 > 0 || item.wastageType2 > 0) && (
                          <div className="text-xs text-gray-500">
                            (T1: {item.wastageType1 || 0}, T2: {item.wastageType2 || 0})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.recordedBy?.name || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-8 text-center text-gray-500 text-sm"
                    >
                      No production data available for the selected period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Report Metadata */}
          {reportData.generatedAt && (
            <div className="text-xs text-gray-500 text-right">
              Report generated at: {new Date(reportData.generatedAt).toLocaleString()}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Click "Generate Report" to view production data
        </div>
      )}
    </div>
  );
};

export default PreformReport;