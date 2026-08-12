import { useState, useRef, useEffect } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";

const OrderActions = ({ order, updateOrderStatus, handleOrderSelection }) => {
  const [open, setOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const menuRef = useRef(null);

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
      >
        <BsThreeDotsVertical size={20} className="text-gray-600" />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="p-2 text-sm">
            <label className="block text-gray-700 mb-1">Update Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-1 border rounded-md bg-gray-50 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              {["confirmed", "shipped", "cancelled"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
            <button
              onClick={() => {
                updateOrderStatus(order._id, selectedStatus);
                setOpen(false);
              }}
              disabled={!selectedStatus || selectedStatus === order.orderStatus}
              className="mt-2 w-full px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors text-sm"
            >
              Update
            </button>
          </div>

          <button
            onClick={() => {
              handleOrderSelection(order);
              setOpen(false);
            }}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Create Challan
          </button>

          {/* {order.paymentMethod === "COD" && (
            <button
              onClick={() => {
                handleCODSelection(order);
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              COD
            </button>
          )} */}
        </div>
      )}
    </div>
  );
};

export default OrderActions;
