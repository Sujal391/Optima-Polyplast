import React, { useEffect } from 'react';

const ToastNotification = ({ message, type, onClose }) => {
  // Dynamically set the background color based on the type
  const toastStyles = {
    success: 'bg-gradient-to-r from-green-400 to-green-600',
    error: 'bg-gradient-to-r from-red-400 to-red-600',
    info: 'bg-gradient-to-r from-blue-400 to-blue-600',
    warning: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
  };

  const backgroundColor = toastStyles[type] || 'bg-gradient-to-r from-gray-400 to-gray-600'; // Default gradient if the type is unknown

  useEffect(() => {
    // Auto close the toast after 3 seconds
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer); // Cleanup the timer on unmount
  }, [onClose]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div
        className={`p-6 max-w-md mx-auto rounded-lg shadow-xl text-white ${backgroundColor} flex items-center space-x-4 transform scale-100 pointer-events-auto`}
        style={{
          animation: 'fadeIn 0.3s ease-out, slideIn 0.5s ease-out',
        }}
      >
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-10">
            {/* Icon for success, error, info, or warning */}
            <span className="text-2xl">{type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'info' ? 'ℹ️' : '⚠️'}</span>
          </div>
          <span className="text-lg font-medium">{message}</span>
        </div>
        <button
          onClick={onClose}
          className="text-white font-bold text-2xl ml-4 cursor-pointer transform hover:scale-110 transition-transform duration-150"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ToastNotification;
