import React, { useState } from "react";
import { FaTimes, FaCheck } from "react-icons/fa";
import { toast } from "react-toastify";

const RescheduleModal = ({ challan, onClose, onConfirm, loading }) => {
  const [newDate, setNewDate] = useState("");
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!newDate) {
      toast.error("Please select a new date");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please provide a reason for rescheduling");
      return;
    }

    const newDateObj = new Date(newDate);
    const currentDateObj = new Date(challan.scheduledDate);

    if (newDateObj <= currentDateObj) {
      toast.error("New date must be after the current scheduled date");
      return;
    }

    onConfirm({
      challanId: challan._id,
      newDate: newDateObj.toISOString(),
      reason,
    });
  };

  const currentDate = new Date(challan.scheduledDate).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300">
        <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6 text-white rounded-t-2xl">
          <h2 className="text-2xl font-bold">Reschedule Challan</h2>
          <p className="text-orange-100 mt-1">Challan No: {challan.dcNo || challan._id}</p>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">Current Date</label>
            <div className="p-3 bg-gray-100 rounded-md text-gray-700 font-medium">
              {currentDate}
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">New Date</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">Reason for Rescheduling</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Material not ready, Weather conditions, etc."
              rows="4"
              className="w-full p-3 border-2 border-gray-300 rounded-md focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FaTimes /> Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <FaCheck /> {loading ? "Rescheduling..." : "Confirm Reschedule"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RescheduleModal;

