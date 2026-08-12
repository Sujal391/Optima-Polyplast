import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Download, FileText } from 'lucide-react';

/**
 * Reusable Production List Component
 * Displays paginated production records with filtering, sorting, and reports
 */
export default function ProductionList({
  title,
  data = [],
  columns = [],
  loading = false,
  error = null,
  pagination = null,
  onPageChange = () => {},
  onFilterChange = () => {},
  onSortChange = () => {},
  // onGenerateReport = null,
  filters = {},
  filterOptions = [],
  sortBy = '',
  sortOrder = 'desc',
  sortableColumns = [],
  showDateFilters = false,
  showPeriodFilter = false,
  showReportButton = false,
  reportSummary = null
}) {
  // Period options for report generation
  const periodOptions = [
    { value: '', label: 'All Time' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  // Handle sort click
  const handleSortClick = (columnKey) => {
    if (!sortableColumns.includes(columnKey)) return;

    if (sortBy === columnKey) {
      // Toggle sort order
      onSortChange(columnKey, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, default to desc
      onSortChange(columnKey, 'desc');
    }
  };

  // Render sort indicator
  const renderSortIndicator = (columnKey) => {
    if (!sortableColumns.includes(columnKey)) return null;

    return (
      <span className="ml-1 inline-flex flex-col">
        <ChevronUp
          size={12}
          className={`${sortBy === columnKey && sortOrder === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
        <ChevronDown
          size={12}
          className={`-mt-1 ${sortBy === columnKey && sortOrder === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
        />
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">{title}</h3>
        <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-800">{title}</h3>

        {/* Report Button */}
        {/* {showReportButton && onGenerateReport && (
          <button
            onClick={onGenerateReport}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FileText size={18} />
            Generate Report
          </button>
        )} */}
      </div>

      {/* Date Filters Row */}
      {showDateFilters && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate || ''}
              onChange={(e) => onFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate || ''}
              onChange={(e) => onFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {showPeriodFilter && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Period
              </label>
              <select
                value={filters.period || ''}
                onChange={(e) => onFilterChange('period', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periodOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Items per page
            </label>
            <select
              value={filters.limit || 10}
              onChange={(e) => onFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      )}

      {/* Custom Filters Row */}
      {filterOptions.length > 0 && (
        <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {filterOptions.map((option) => (
            <div key={option.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {option.label}
              </label>
              {option.type === 'select' ? (
                <select
                  value={filters[option.key] || ''}
                  onChange={(e) => onFilterChange(option.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  {option.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={option.type}
                  value={filters[option.key] || ''}
                  onChange={(e) => onFilterChange(option.key, e.target.value)}
                  placeholder={option.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Report Summary (when downloadReport is enabled) */}
      {reportSummary && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-md font-semibold text-blue-800 mb-2">Report Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {reportSummary.totalProductions !== undefined && (
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-600">Total Productions</p>
                <p className="text-lg font-bold text-gray-800">{reportSummary.totalProductions}</p>
              </div>
            )}
            {reportSummary.totalQuantityProduced !== undefined && (
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-600">Total Quantity</p>
                <p className="text-lg font-bold text-gray-800">{reportSummary.totalQuantityProduced}</p>
              </div>
            )}
            {reportSummary.totalWastage !== undefined && (
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-600">Total Wastage</p>
                <p className="text-lg font-bold text-gray-800">{reportSummary.totalWastage}</p>
              </div>
            )}
            {reportSummary.totalWastageType1 !== undefined && (
              <div className="bg-white p-3 rounded border">
                <p className="text-xs text-gray-600">Reusable Wastage</p>
                <p className="text-lg font-bold text-gray-800">{reportSummary.totalWastageType1}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      {data.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No production records found
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSortClick(col.key)}
                    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      sortableColumns.includes(col.key) ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                  >
                    <div className="flex items-center">
                      {col.label}
                      {renderSortIndicator(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {data.map((row, idx) => (
                <tr key={row._id || idx} className="hover:bg-gray-50">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.currentPage || pagination.page} of {pagination.totalPages} ({pagination.totalRecords || pagination.total} total)
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange((pagination.currentPage || pagination.page) - 1)}
              disabled={!(pagination.hasPrevPage ?? (pagination.currentPage || pagination.page) > 1)}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => onPageChange((pagination.currentPage || pagination.page) + 1)}
              disabled={!(pagination.hasNextPage ?? (pagination.currentPage || pagination.page) < pagination.totalPages)}
              className="p-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

