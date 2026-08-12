import React, { useState } from 'react';
// import ProductionOutcome from './ProductionOutcome';
import PreformProduction from './PreformProduction';
import CapProduction from './CapProduction';
import BottleProduction from './BottleProduction';
import DirectUsage from './DirectUsage';

export default function Production() {
  const [activeTab, setActiveTab] = useState(0);

  const tabs = [
    // { id: 0, label: 'Production Outcome', component: ProductionOutcome },
    { id: 0, label: 'Preform Production', component: PreformProduction },
    { id: 1, label: 'Cap Production', component: CapProduction },
    { id: 2, label: 'Bottle Production', component: BottleProduction },
    { id: 3, label: 'Direct Usage', component: DirectUsage },
  ];

  const ActiveComponent = tabs[activeTab].component;

  return (
    <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-amber-100 rounded-xl">
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Production Management</h2>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
          <div className="flex overflow-x-auto border-b border-gray-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-max px-5 py-3.5 text-center text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-amber-50 hover:text-amber-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Active Tab Content */}
        <div>
          <ActiveComponent />
        </div>
      </div>
    </div>
  );
}
