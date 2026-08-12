// Inward.js - Main Component
import React, { useState } from 'react';
import InwardEntries from './InwardEntries';
import CurrentStock from './CurrentStock';

export default function Inward() {
  const [activeTab, setActiveTab] = useState('inward'); // 'inward' or 'stock'

  return (
    <div className="bg-gradient-to-r from-blue-50 to-blue-100 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-800 mb-6">Stock Management</h2>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('inward')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'inward'
                  ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Inward Entries
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex-1 px-6 py-4 text-center font-semibold transition ${
                activeTab === 'stock'
                  ? 'bg-blue-600 text-white border-b-4 border-blue-700'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              Current Stock
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'inward' && <InwardEntries />}
        {activeTab === 'stock' && <CurrentStock />}
      </div>
    </div>
  );
}