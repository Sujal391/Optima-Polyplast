import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../layout/Sidebar";
import cookies from "js-cookie";

const Attendance = () => {
  const [attendanceData, setAttendanceData] = useState({
    attendance: [],
    summary: {},
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0], // Default to 7 days back
    endDate: new Date().toISOString().split("T")[0],
    panel: "",
    includeImages: false,
  });
  const [zoomedInImage, setZoomedInImage] = useState(null); // State for the zoomed-in image

  // const api = axios.create({ baseURL: "https://rewa-project.onrender.com/api" });

  const api = axios.create({
    baseURL: process.env.REACT_APP_API,
  });

  api.interceptors.request.use(
    (config) => {
      // const token = localStorage.getItem("token");
      const token = cookies.get("token");
      if (token) config.headers.Authorization = token;
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Fetch attendance data when filters change
  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = Object.fromEntries(
        Object.entries(filters).filter(
          ([_, value]) => value !== "" && value !== null
        )
      );

      const response = await api.get("/admin/attendance", {
        params: queryParams,
      });
      setAttendanceData(response.data);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Error fetching attendance data"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openImageModal = (imageUrl) => {
    setZoomedInImage(imageUrl);
  };

  const closeImageModal = () => {
    setZoomedInImage(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
          <button
            onClick={fetchAttendance}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex">
      {/* Sidebar */}
      <div className="w-full lg:w-64 bg-gray-800 text-white h-auto lg:h-screen">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-6">Attendance Dashboard</h1>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-gray-300 p-4 rounded-lg">
          <div>
            <label className="block text-lg font-medium mb-1">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">Panel</label>
            <select
              name="panel"
              value={filters.panel}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value="">All Panels</option>
              <option value="reception">Reception</option>
              <option value="marketing">Marketing</option>
              <option value="stock">Stock</option>
              <option value="dispatch">Dispatch</option>
            </select>
          </div>
          <div>
            <label className="block text-lg font-medium mb-1">
              Include Images
            </label>
            <select
              name="includeImages"
              value={filters.includeImages}
              onChange={handleFilterChange}
              className="w-full p-2 border rounded"
            >
              <option value={false}>No</option>
              <option value={true}>Yes</option>
            </select>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Total Records</h3>
            <p className="text-2xl font-bold text-blue-900">
              {attendanceData.summary.totalRecords}
            </p>
          </div>
          <div className="bg-green-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Total Hours</h3>
            <p className="text-2xl font-bold text-green-900">
              {attendanceData.summary.totalHours?.toFixed(2)}
            </p>
          </div>
          <div className="bg-purple-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-purple-800">
              Average Hours/Day
            </h3>
            <p className="text-2xl font-bold text-purple-900">
              {attendanceData.summary.averageHoursPerDay?.toFixed(2)}
            </p>
          </div>
          <div className="bg-yellow-200 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-yellow-800">
              Active Panels
            </h3>
            <p className="text-2xl font-bold text-yellow-900">
              {Object.keys(attendanceData.summary.byPanel || {}).length}
            </p>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="overflow-x-auto bg-white rounded-xl shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-indigo-500">
              <tr>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  User
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Panel
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Check In
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Check Out
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Hours
                </th>
                <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                  Status
                </th>
                {filters.includeImages && (
                  <th className="px-6 py-3 text-left text-lg font-large text-white uppercase">
                    Image
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendanceData.attendance.map((record, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-lg font-medium text-gray-900">
                      {record.user?.name}
                    </div>
                    <div className="text-sm text-blue-500">
                      {record.user?.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-sm font-semibold rounded-full bg-blue-300 text-blue-800">
                      {record.panel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-black">
                    {new Date(record.selectedDate).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap  text-lg text-red-500">
                    {new Date(record.checkInTime).toLocaleTimeString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-red-500">
                    {record.checkOutTime
                      ? new Date(record.checkOutTime).toLocaleTimeString()
                      : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-lg text-blue-500">
                    {record.totalHours?.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 inline-flex text-sm font-semibold rounded-full ${
                        record.status === "checked-out"
                          ? "bg-green-400 text-green-900"
                          : "bg-yellow-300 text-yellow-900"
                      }`}
                    >
                      {record.status}
                    </span>
                  </td>
                  {filters.includeImages && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.checkInImage ? (
                        <img
                          src={record.checkInImage}
                          alt="Check-in"
                          className="h-10 w-10 rounded-full cursor-pointer"
                          onClick={() => openImageModal(record.checkInImage)} // Open image on click
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Image Modal */}
        {zoomedInImage && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={closeImageModal} // Close modal on overlay click
          >
            <div className="relative">
              <img
                src={zoomedInImage}
                alt="Zoomed Image"
                className="max-w-full max-h-screen object-contain"
              />
              <button
                className="absolute top-0 right-0 m-4 text-white text-2xl"
                onClick={closeImageModal}
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Attendance;
