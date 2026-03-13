import React, { useState } from 'react';
import { FileText, Package, Factory, TrendingUp } from 'lucide-react';
import StockReportTab from './StockReport';
// import ProductionReportTab from './ProductionReport';
import UsageReportTab from './UsageReport';
import PreformReport from './PreformReport';
import CapReport from './CapReport';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('stock');

  const tabs = [
    { id: 'stock', name: 'Stock Report', icon: Package },
    // { id: 'production', name: 'Production Report', icon: Factory },
    { id: 'usage', name: 'Usage Report', icon: TrendingUp },
    { id: 'preform', name: 'Preform Report', icon: Package },
    { id: 'cap', name: 'Cap Report', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Reporting & Analytics
            </h1>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'stock' && <StockReportTab />}
            {/* {activeTab === 'production' && <ProductionReportTab />} */}
            {activeTab === 'usage' && <UsageReportTab />}
            {activeTab === 'preform' && <PreformReport />}
            {activeTab === 'cap' && <CapReport />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;