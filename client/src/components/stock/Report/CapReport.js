import React, { useState } from "react";
import { Shield } from "lucide-react";
import { getCapProductionReport } from "../../../services/api/stock";

const CapReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    period: "daily",
    startDate: "",
    endDate: "",
  });

  const fetchReport = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = {};

      if (filters.period) params.period = filters.period;
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;

      const result = await getCapProductionReport(params);

      if (result.success) {
        setReportData(result);
      } else {
        setError(result.message || "Failed to fetch cap production report");
      }
    } catch (err) {
      setError(err.message || "Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: value });

    // Clear custom dates when selecting a predefined period
    if (name === "period" && value !== "custom") {
      setFilters((prev) => ({ ...prev, startDate: "", endDate: "" }));
    }
  };

  // Calculate wastage percentage
  const calculateWastagePercentage = (summary) => {
    if (!summary) return 0;
    const totalProduced = summary.totalQuantityProduced || 0;
    const totalWastage = summary.totalWastage || 0;
    return totalProduced > 0 ? (totalWastage / totalProduced) * 100 : 0;
  };

  // Convert byCapType object to array for breakdown display
  const getCapTypeBreakdown = (byCapType) => {
    if (!byCapType) return [];
    return Object.entries(byCapType).map(([capType, data]) => ({
      capType,
      quantityProduced: data.quantityProduced || 0,
      wastage: data.wastage || 0,
      usedInBottles: data.usedInBottles || 0,
    }));
  };

  // Convert byColor object to array for breakdown display
  const getColorBreakdown = (byColor) => {
    if (!byColor) return [];
    return Object.entries(byColor).map(([color, data]) => ({
      color: color === "undefined" ? "Not Specified" : color,
      quantityProduced: data.quantityProduced || 0,
      wastage: data.wastage || 0,
    }));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Cap Production Report
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

          {filters.period === "custom" && (
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="text-sm text-blue-600 font-medium">
                  Total Productions
                </div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {reportData.summary.totalProductions || 0}
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <div className="text-sm text-green-600 font-medium">
                  Quantity Produced
                </div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {reportData.summary.totalQuantityProduced || 0}
                </div>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                <div className="text-sm text-indigo-600 font-medium">
                  Used in Bottles
                </div>
                <div className="text-2xl font-bold text-indigo-900 mt-1">
                  {reportData.summary.totalUsedInBottles || 0}
                </div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="text-sm text-red-600 font-medium">
                  Total Wastage
                </div>
                <div className="text-2xl font-bold text-red-900 mt-1">
                  {reportData.summary.totalWastage || 0}
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="text-sm text-purple-600 font-medium">
                  Wastage %
                </div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {calculateWastagePercentage(reportData.summary).toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Wastage Type Details */}
          {reportData.summary && (reportData.summary.totalWastageType1 > 0 || reportData.summary.totalWastageType2 > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <div className="text-sm text-orange-600 font-medium">
                  Wastage Type 1
                </div>
                <div className="text-2xl font-bold text-orange-900 mt-1">
                  {reportData.summary.totalWastageType1 || 0}
                </div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                <div className="text-sm text-amber-600 font-medium">
                  Wastage Type 2
                </div>
                <div className="text-2xl font-bold text-amber-900 mt-1">
                  {reportData.summary.totalWastageType2 || 0}
                </div>
              </div>
            </div>
          )}

          {/* Breakdown by Cap Type */}
          {reportData.summary?.byCapType && Object.keys(reportData.summary.byCapType).length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold mb-3">
                Breakdown by Cap Type
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {getCapTypeBreakdown(reportData.summary.byCapType).map((item, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200"
                  >
                    <div className="text-base font-semibold text-blue-900 mb-3">
                      {item.capType}
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Produced:</span>
                        <span className="text-sm font-bold text-blue-900">
                          {item.quantityProduced}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Wastage:</span>
                        <span className="text-sm font-bold text-red-700">
                          {item.wastage}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-blue-700">Used in Bottles:</span>
                        <span className="text-sm font-bold text-green-700">
                          {item.usedInBottles}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Breakdown by Color */}
          {reportData.summary?.byColor && Object.keys(reportData.summary.byColor).length > 0 && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h4 className="text-md font-semibold mb-3">
                Breakdown by Color
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {getColorBreakdown(reportData.summary.byColor).map((item, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-5 h-5 rounded-full border-2 border-gray-300 shadow-sm"
                        style={{ 
                          backgroundColor: item.color === "Not Specified" ? "#9ca3af" : item.color.toLowerCase()
                        }}
                      ></span>
                      <span className="text-sm font-semibold text-gray-800">
                        {item.color}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Produced:</span>
                        <span className="text-sm font-bold text-gray-900">
                          {item.quantityProduced}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Wastage:</span>
                        <span className="text-sm font-bold text-red-600">
                          {item.wastage}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Report Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="px-4 py-3 border-b border-gray-200">
              <h4 className="text-md font-semibold">Detailed Production Records</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Production Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cap Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Produced
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wastage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Used in Bottles
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Raw Materials
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Packaging
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {reportData.data && reportData.data.length > 0 ? (
                    reportData.data.map((item, index) => (
                      <tr key={item._id || index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(item.productionDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.capType || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-4 h-4 rounded-full border border-gray-300"
                              style={{ 
                                backgroundColor: item.capColor ? item.capColor.toLowerCase() : "#ccc"
                              }}
                            ></span>
                            {item.capColor || "Not Specified"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-700">
                          {item.quantityProduced || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">
                          {item.wastage || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.usedInBottles || 0}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {item.rawMaterials && item.rawMaterials.length > 0 ? (
                            <div className="space-y-1">
                              {item.rawMaterials.map((rm, rmIndex) => (
                                <div key={rmIndex} className="text-xs">
                                  <span className="font-medium">
                                    {rm.material?.itemName || "N/A"}
                                  </span>
                                  {" - "}
                                  <span className="text-gray-500">
                                    {rm.quantityUsed} {rm.material?.unit || ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            "N/A"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          <div className="text-xs space-y-1">
                            <div>Boxes: {item.packagingUsed?.boxes || 0}</div>
                            <div>Bags: {item.packagingUsed?.bags || 0}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.recordedBy?.name || "N/A"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="px-6 py-8 text-center text-gray-500 text-sm"
                      >
                        No cap production data available for the selected period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
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

export default CapReport;