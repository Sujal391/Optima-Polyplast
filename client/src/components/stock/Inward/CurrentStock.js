import React, { useState, useEffect } from 'react';
import Paginator from '../../common/Paginator';
import { getCurrentStockReport } from '../../../services/api/stock';

export default function CurrentStock() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStockData();
  }, []);

  const fetchStockData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getCurrentStockReport();
      setStockData(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch stock data');
      console.error('Error fetching stock:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter by search term
  const filteredStock = stockData.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.itemCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.subcategory?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const startIdx = (page - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const paginatedStock = filteredStock.slice(startIdx, endIdx);

  return (
    <div>
      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Search and Summary */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Stock Overview</h3>
            <p className="text-sm text-gray-600 mt-1">
              Total Materials: <span className="font-semibold">{stockData.length}</span> | 
              Low Stock Alerts: <span className="font-semibold text-red-600">
                {stockData.filter(item => item.lowStockAlert).length}
              </span>
            </p>
          </div>
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by name, code, or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      )}

      {/* Stock Table */}
      {!loading && filteredStock.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Item Code</th>
                  <th className="px-6 py-3 text-left font-semibold">Item Name</th>
                  <th className="px-6 py-3 text-left font-semibold">Category</th>
                  <th className="px-6 py-3 text-left font-semibold">Supplier</th>
                  <th className="px-6 py-3 text-left font-semibold">Current Stock</th>
                  <th className="px-6 py-3 text-left font-semibold">Min Level</th>
                  <th className="px-6 py-3 text-left font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStock.map((item, index) => (
                  <tr
                    key={item._id}
                    className={`border-b hover:bg-gray-50 transition ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${item.lowStockAlert ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {item.itemCode}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.itemName}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.subcategory || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.supplier || '-'}
                    </td>
                    <td className="px-6 py-4 text-gray-700 font-semibold">
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {item.minStockLevel} {item.unit}
                    </td>
                    <td className="px-6 py-4">
                      {item.lowStockAlert ? (
                        <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-semibold">
                          ⚠️ Low Stock
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                          ✓ Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between px-6 pb-6">
            <div className="text-sm text-gray-600">
              Showing {Math.min(filteredStock.length, startIdx + 1)}–{Math.min(filteredStock.length, endIdx)} of {filteredStock.length}
            </div>
            <Paginator page={page} total={filteredStock.length} pageSize={pageSize} onPageChange={setPage} />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={pageSize}
              onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value, 10)); }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>{n} / page</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {!loading && filteredStock.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-500 text-lg">
            {searchTerm ? 'No materials found matching your search.' : 'No stock data available.'}
          </p>
        </div>
      )}
    </div>
  );
}