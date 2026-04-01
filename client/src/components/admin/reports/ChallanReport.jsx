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
  Truck,
  User,
  MapPin,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronRight,
  Package,
  TrendingUp,
  Wallet,
  Receipt,
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

const ChallanReport = () => {
  const [challans, setChallans] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [revenue, setRevenue] = useState(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);
  
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

  const fetchChallans = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = status === "all" ? "" : `&status=${status}`;
      const response = await api.get(
        `/admin/challans?startDate=${startDate}&endDate=${endDate}${statusParam}`
      );
      
      setChallans(response.data.challans || []);
      setCount(response.data.count || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Error fetching challan reports. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenue = async () => {
    setLoadingRevenue(true);
    try {
      const response = await api.get(
        `/admin/revenue/challan-report?startDate=${startDate}&endDate=${endDate}`
      );
      if (response.data && response.data.summary) {
        setRevenue(response.data.summary);
      }
    } catch (err) {
      console.error("Fetch Revenue Error:", err);
    } finally {
      setLoadingRevenue(false);
    }
  };

  useEffect(() => {
    fetchChallans();
    fetchRevenue();
  }, [startDate, endDate, status]);

  const handleDownloadExcel = () => {
    if (challans.length === 0) return;
    setDownloading(true);

    const excelData = challans.map(challan => ({
      'Challan ID': challan.challanId,
      'Invoice No': challan.invoiceNo,
      'DC No': challan.dcNo,
      'Receiver Name': challan.receiverName,
      'User Code': challan.userCode,
      'Vehicle No': challan.vehicleNo,
      'Driver Name': challan.driverName,
      'Total Amount (₹)': challan.totalAmountWithDelivery,
      'Status': challan.status,
      'Delivery Choice': challan.deliveryChoice,
      'Challan Date': format(new Date(challan.challanDate), 'dd-MM-yyyy'),
      'Created At': format(new Date(challan.createdAt), 'dd-MM-yyyy HH:mm:ss')
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Challan Report');
    XLSX.writeFile(wb, `Challan_Report_${startDate}_to_${endDate}.xlsx`);
    setDownloading(false);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 uppercase tracking-widest text-[10px] font-bold">Delivered</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100 uppercase tracking-widest text-[10px] font-bold">Pending</Badge>;
      case "shipped":
        return <Badge className="bg-blue-50 text-blue-700 border-blue-100 uppercase tracking-widest text-[10px] font-bold">Shipped</Badge>;
      default:
        return <Badge variant="outline" className="capitalize text-[10px] font-bold">{status}</Badge>;
    }
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
          <h1 className="text-2xl font-bold text-slate-800">Challan Reports</h1>
          <p className="text-slate-500 mt-1">Detailed logistics and delivery tracking</p>
        </div>
        <div className="flex items-center gap-3">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-bold bg-slate-100 text-slate-700 border-slate-200 h-10 flex items-center">
               Logs: {count} Records
            </Badge>
            <Button
              onClick={handleDownloadExcel}
              disabled={downloading || challans.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 h-10"
            >
              {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
              Save CSV
            </Button>
        </div>
      </div>

      {/* Revenue Summary Section */}
      {revenue && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <FileText className="w-24 h-24 text-blue-600" />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="z-10 relative">
                  <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Total Challans</p>
                  {loadingRevenue ? (
                    <div className="h-9 w-16 bg-blue-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <h3 className="text-3xl font-bold text-blue-900">{revenue.totalChallans || 0}</h3>
                  )}
                </div>
                <div className="p-2 bg-blue-200/50 rounded-lg z-10 relative">
                  <FileText className="w-5 h-5 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-emerald-100 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Wallet className="w-24 h-24 text-emerald-600" />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="z-10 relative">
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">Total Amount</p>
                  {loadingRevenue ? (
                    <div className="h-9 w-32 bg-emerald-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <h3 className="text-2xl font-bold text-emerald-900 flex items-center">
                      <span className="text-lg mr-1">₹</span>
                      {revenue.totalAmountWithGSTAndDelivery?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                    </h3>
                  )}
                </div>
                <div className="p-2 bg-emerald-200/50 rounded-lg z-10 relative">
                  <Wallet className="w-5 h-5 text-emerald-700" />
                </div>
              </div>
              <p className="text-[10px] text-emerald-700 mt-2 font-bold uppercase tracking-wider z-10 relative">Incl. GST & Delivery</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-amber-100 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Receipt className="w-24 h-24 text-amber-600" />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="z-10 relative">
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">Total GST</p>
                  {loadingRevenue ? (
                    <div className="h-9 w-24 bg-amber-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <h3 className="text-2xl font-bold text-amber-900 flex items-center">
                      <span className="text-lg mr-1">₹</span>
                      {revenue.totalGST?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                    </h3>
                  )}
                </div>
                <div className="p-2 bg-amber-200/50 rounded-lg z-10 relative">
                  <Receipt className="w-5 h-5 text-amber-700" />
                </div>
              </div>
              <p className="text-[10px] text-amber-700 mt-2 font-bold uppercase tracking-wider z-10 relative">Base: ₹{revenue.totalAmount?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}</p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden relative">
            <div className="absolute -right-4 -top-4 opacity-10">
              <Truck className="w-24 h-24 text-purple-600" />
            </div>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="z-10 relative">
                  <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">Delivery Chgs</p>
                  {loadingRevenue ? (
                    <div className="h-9 w-24 bg-purple-200 animate-pulse rounded mt-1"></div>
                  ) : (
                    <h3 className="text-2xl font-bold text-purple-900 flex items-center">
                      <span className="text-lg mr-1">₹</span>
                      {revenue.totalDeliveryCharge?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) || '0'}
                    </h3>
                  )}
                </div>
                <div className="p-2 bg-purple-200/50 rounded-lg z-10 relative">
                  <Truck className="w-5 h-5 text-purple-700" />
                </div>
              </div>
              <p className="text-[10px] text-purple-700 mt-2 font-bold uppercase tracking-wider z-10 relative opacity-0">Hidden</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mb-8 border-0 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 h-10" onClick={() => { fetchChallans(); fetchRevenue(); }}>Fetch Reports</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Shipment Info</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Fleet Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Receiver</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Value (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : challans.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No delivery records found.</td></tr>
                ) : (
                  challans.map((c, idx) => (
                    <tr key={c.challanId || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase mb-1">
                            <FileText className="h-3 w-3 text-blue-500" /> {c.dcNo || 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">Inv: {c.invoiceNo || 'N/A'}</span>
                          <span className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-tighter">ID: {c.challanId.slice(-6)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase"><Truck className="h-3 w-3 text-slate-400" /> {c.vehicleNo}</span>
                          <span className="text-[10px] font-semibold text-slate-500 mt-1">{c.driverName}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{c.mobileNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5"><User className="h-3 w-3 text-slate-400" /> {c.receiverName}</span>
                          <span className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                            <MapPin className="h-3 w-3 shrink-0" /> 
                            {typeof c.shippingAddress === 'object' ? (
                              `${c.shippingAddress.address}, ${c.shippingAddress.city}, ${c.shippingAddress.state} - ${c.shippingAddress.pinCode}`
                            ) : (
                              c.shippingAddress || 'N/A'
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(c.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">₹{c.totalAmountWithDelivery.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 mt-1">{format(new Date(c.challanDate), "dd MMM yyyy")}</span>
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

export default ChallanReport;
