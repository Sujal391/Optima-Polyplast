import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from 'js-cookie';
import { format } from "date-fns";
import * as XLSX from 'xlsx';
import {
  CreditCard,
  Download,
  Filter,
  Calendar,
  Wallet,
  Globe,
  Loader2,
  AlertCircle,
  ChevronRight,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  TrendingUp,
  Building2,
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

const PaymentHistoryReport = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [fromDate, setFromDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMode, setPaymentMode] = useState("all");

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

  const fetchPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const modeParam = paymentMode === "all" ? "" : `&paymentMode=${paymentMode}`;
      const response = await api.get(
        `/admin/payments/history?fromDate=${fromDate}&toDate=${toDate}${modeParam}`
      );
      
      setPayments(response.data.payments || []);
      setSummary(response.data.summary);
      setTotalRecords(response.data.totalRecords);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(
        err.response?.status === 401
          ? "Session expired. Please login again."
          : "Error fetching payment history. Please try again later."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [fromDate, toDate, paymentMode]);

  const handleDownloadExcel = () => {
    if (payments.length === 0) return;
    setDownloading(true);

    const excelData = payments.map(payment => ({
      'Payment ID': payment.paymentId,
      'Order ID': payment.orderId,
      'Firm Name': payment.firmName,
      'User Code': payment.userCode,
      'Customer Name': payment.customerName,
      'Phone Number': payment.phoneNumber,
      'Payment Mode': payment.paymentMode,
      'Bank Name': payment.bankName || 'N/A',
      'Submitted Amount (₹)': payment.submittedAmount,
      'Verified Amount (₹)': payment.verifiedAmount,
      'Paid Amount (₹)': payment.paidAmount,
      'Payment Status': payment.paymentStatus,
      'Payment Date': format(new Date(payment.paymentDate), 'dd-MM-yyyy HH:mm:ss'),
      'Order Status': payment.orderStatus
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');
    XLSX.writeFile(wb, `Payment_History_${fromDate}_to_${toDate}.xlsx`);
    setDownloading(false);
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100"><CheckCircle2 className="h-3 w-3 mr-1" /> Verified</Badge>;
      case "pending":
        return <Badge className="bg-amber-50 text-amber-700 border-amber-100"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-50 text-red-700 border-red-100"><AlertTriangle className="h-3 w-3 mr-1" /> Failed</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
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
          <h1 className="text-2xl font-bold text-slate-800">Payment History</h1>
          <p className="text-slate-500 mt-1">Detailed financial logs and audit trail</p>
        </div>
        <Button
          onClick={handleDownloadExcel}
          disabled={downloading || payments.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
          Export History
        </Button>
      </div>

      <Card className="mb-8 border-0 shadow-sm overflow-hidden bg-white">
        <CardHeader className="py-4 px-6 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Mode</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 h-10" onClick={fetchPayments}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Submitted", val: summary?.totalSubmittedAmount, icon: History, color: "blue" },
          { label: "Verified", val: summary?.totalVerifiedAmount, icon: CheckCircle2, color: "emerald" },
          { label: "Cash", val: summary?.totalCash, icon: Wallet, color: "purple" },
          { label: "Online", val: summary?.totalOnline, icon: Globe, color: "blue" },
          { label: "HDFC", val: summary?.totalHDFC, icon: Building2, color: "amber" },
          { label: "IDFC", val: summary?.totalIDFC, icon: Building2, color: "rose" },
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-lg bg-${item.color}-50 text-${item.color}-600 mb-2`}>
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.label}</p>
                <h3 className="text-sm font-bold mt-1 text-slate-800">₹{item.val?.toLocaleString() || 0}</h3>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Payment Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Amounts (₹)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : payments.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No records found.</td></tr>
                ) : (
                  payments.map((p, idx) => (
                    <tr key={p.paymentId || idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900 uppercase">#{p.paymentId.slice(-6)}</span>
                          <span className="text-[10px] text-slate-400">Ord: #{p.orderId.slice(-6)}</span>
                          <span className="text-[10px] text-blue-600 font-bold uppercase mt-1">{p.paymentMode} {p.bankName ? `(${p.bankName})` : ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{p.customerName}</span>
                          <span className="text-[10px] text-slate-500">{p.firmName}</span>
                          <span className="text-[10px] text-slate-400">{p.userCode}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-900">₹{p.submittedAmount.toLocaleString()}</span>
                          <span className="text-[10px] text-slate-500">Verified: ₹{p.verifiedAmount.toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(p.paymentStatus)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700">{format(new Date(p.paymentDate), "dd MMM yy")}</span>
                          <span className="text-[10px] text-slate-400">{format(new Date(p.paymentDate), "hh:mm a")}</span>
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

export default PaymentHistoryReport;
