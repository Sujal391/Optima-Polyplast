const fs = require('fs');
let content = fs.readFileSync('client/src/components/stock/Outcome.js', 'utf8');

// Replace colors
content = content.replace(/blue-500/g, 'amber-500');
content = content.replace(/blue-600/g, 'amber-600');
content = content.replace(/blue-700/g, 'amber-700');
content = content.replace(/blue-50/g, 'amber-50');
content = content.replace(/blue-100/g, 'amber-100');
content = content.replace(/blue-200/g, 'amber-200');
content = content.replace(/blue-800/g, 'amber-800');

// Replace layout structure
content = content.replace(/className="bg-gradient-to-r from-amber-50 to-amber-100 min-h-screen p-6"/g, 'className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4 sm:p-6"');
content = content.replace(/className="text-3xl font-bold text-gray-800"/g, 'className="text-2xl sm:text-3xl font-bold text-slate-800"');
content = content.replace(/className="bg-white rounded-lg shadow-lg p-6"/g, 'className="bg-white/80 backdrop-blur-sm shadow-xl border border-white/20 rounded-2xl p-6"');

fs.writeFileSync('client/src/components/stock/Outcome.js', content);
console.log('Outcome updated successfully');
