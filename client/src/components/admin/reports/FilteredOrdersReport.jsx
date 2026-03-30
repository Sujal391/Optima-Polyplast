import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from 'js-cookie';
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import {
  Download,
  Filter,
  Calendar,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Package,
  ArrowRight,
  User,
  Phone,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../ui/card";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Input } from "../../ui/input";
import { Separator } from "../../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";

const FilteredOrdersReport = () => {
  const [orders, setOrders] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [status, setStatus] = useState("all");

  const api = axios.create({
    baseURL: process.env.REACT_APP_API,
  });

  api.interceptors.request.use(
    (config) => {
      const token = cookies.get("token");
      if (token) {
        config.headers.Authorization = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = status === "all" ? "" : `&status=${status}`;
      const response = await api.get(
        `/admin/orders/filter?startDate=${startDate}&endDate=${endDate}${statusParam}`
      );
      
      setOrders(response.data.orders || []);
      setCount(response.data.count || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Error fetching order reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [startDate, endDate, status]);

  const handleDownloadExcel = () => {
    if (orders.length === 0) return;
    setDownloading(true);

    const excelData = orders.map(order => ({
      'Order ID': order.orderId,
      'Customer Name': order.customerName,
      'Firm Name': order.firmName,
      'Phone': order.phone,
      'Total Amount (₹)': order.totalAmount,
      'Total With Delivery (₹)': order.totalAmountWithDelivery,
      'Payment Status': order.paymentStatus,
      'Order Status': order.orderStatus,
      'Delivery Choice': order.deliveryChoice,
      'Created At': format(new Date(order.createdAt), 'dd-MM-yyyy HH:mm:ss'),
      'Type': order.type
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Filtered Orders');
    XLSX.writeFile(wb, `Order_Report_${startDate}_to_${endDate}.xlsx`);
    setDownloading(false);
  };

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('pending')) return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
    if (s.includes('processing')) return <Badge className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
    if (s.includes('delivered') || s.includes('completed')) return <Badge className="bg-green-50 text-green-700 border-green-200">Completed</Badge>;
    if (s.includes('rejected') || s.includes('cancelled')) return <Badge className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
    return <Badge variant="outline" className="capitalize">{status}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-12"
    >
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Order Analysis</h1>
          <p className="text-slate-500 mt-1">Filter and export order records</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-bold bg-blue-50 text-blue-700 border-blue-100 h-10 flex items-center">
              Total: {count} Orders
            </Badge>
            <Button
              onClick={handleDownloadExcel}
              disabled={downloading || orders.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 h-10"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Export XLS
            </Button>
        </div>
      </div>

      <Card className="mb-8 border-0 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 h-10" onClick={fetchOrders}>Filter Data</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Order Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer & Contact</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Billing</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No orders found for selected criteria.</td></tr>
                ) : (
                  orders.map((order, idx) => (
                    <tr key={order.orderId || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 mb-1 flex items-center gap-1.5 uppercase">
                            <Package className="h-3 w-3 text-blue-500" /> #{order.orderId.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full inline-block w-fit uppercase font-semibold">{order.type}</span>
                          <span className="text-[10px] text-slate-400 mt-1 lowercase italic">via {order.paymentMethod}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><User className="h-3 w-3 text-slate-400" /> {order.customerName}</span>
                          <span className="text-[10px] font-semibold text-slate-500 mt-1">{order.firmName}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1"><Phone className="h-3 w-3" /> {order.phone}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">₹{order.totalAmountWithDelivery.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500">Subtotal: ₹{order.totalAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-emerald-600 font-semibold mt-1 uppercase tracking-tight">{order.paymentStatus}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(order.orderStatus)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{format(new Date(order.createdAt), "dd MMM yyyy")}</span>
                          <span className="text-[10px] text-slate-400">{format(new Date(order.createdAt), "hh:mm a")}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FilteredOrdersReport;
