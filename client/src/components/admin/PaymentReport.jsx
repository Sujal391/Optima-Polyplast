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
  Search,
  ArrowUpRight,
  ArrowDownRight,
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
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [fromDate, setFromDate] = useState("2026-03-11");
  const [toDate, setToDate] = useState("2026-12-31");
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
    try {
      const modeParam = paymentMode === "all" ? "" : `&paymentMode=${paymentMode}`;
      const response = await api.get(
        `/admin/payments/history?fromDate=${fromDate}&toDate=${toDate}${modeParam}`
      );
      
      setPayments(response.data.payments || []);
      setSummary(response.data.summary);
      setTotalRecords(response.data.totalRecords);
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(
        err.response?.status === 401
          ? "Session expired. Please login again."
          : "Error fetching payment history. Please try again later."
      );
      if (err.response?.status === 401) {
        cookies.remove("token");
        window.location.href = "/";
      }
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
      'Submitted Amount (₹)': payment.submittedAmount,
      'Paid Amount (₹)': payment.paidAmount,
      'Payment Date': format(new Date(payment.paymentDate), 'dd-MM-yyyy HH:mm:ss'),
      'Order Status': payment.orderStatus
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    
    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 20 },
      { wch: 15 }, { wch: 12 }, { wch: 18 }, { wch: 15 }, { wch: 20 }, { wch: 12 }
    ];
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Payment History');
    XLSX.writeFile(wb, `Payment_Report_${fromDate}_to_${toDate}.xlsx`);
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-12"
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl font-bold text-slate-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Payment Reports
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Track and analyze financial transactions and order payments
          </motion.p>
        </div>
        <Button
          onClick={handleDownloadExcel}
          disabled={downloading || payments.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Export to Excel
        </Button>
      </div>

      {/* Filters Section */}
      <Card className="mb-8 border-0 shadow-sm overflow-hidden bg-white">
        <CardHeader className="py-4 px-6 bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter Records
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="pl-9 h-10 border-slate-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="pl-9 h-10 border-slate-200"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Payment Channel</label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger className="h-10 border-slate-200">
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="online">Online Banking</SelectItem>
                  <SelectItem value="cash">Cash Collection</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              className="bg-blue-600 hover:bg-blue-700 h-10"
              onClick={fetchPayments}
            >
              Update View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Transactions", val: totalRecords, icon: History, color: "blue" },
          { label: "Total Volume", val: `₹${summary?.totalSubmittedAmount.toLocaleString() || 0}`, icon: TrendingUp, color: "emerald" },
          { label: "Cash Collections", val: `₹${summary?.totalCash.toLocaleString() || 0}`, icon: Wallet, color: "purple" },
          { label: "Online Payments", val: `₹${summary?.totalOnline.toLocaleString() || 0}`, icon: Globe, color: "blue" }
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</p>
                    <h3 className="text-xl font-bold mt-2 text-slate-800">{item.val}</h3>
                  </div>
                  <div className={`p-2.5 rounded-lg bg-${item.color}-50 text-${item.color}-600`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Payments Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Transaction Logs
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">Customer Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Amounts (₹)</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-center">Status & Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                      <p className="text-sm text-slate-500 italic">Compiling payment reports...</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">
                      No matching records found for the selected period.
                    </td>
                  </tr>
                ) : (
                  payments.map((payment, index) => (
                    <motion.tr
                      key={payment._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            #{payment.paymentId.slice(-8).toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-mono">
                            ORD: {payment.orderId.slice(-8).toUpperCase()}
                            <ChevronRight className="h-2 w-2" />
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{payment.customerName}</span>
                          <span className="text-xs text-slate-500 mt-0.5">{payment.firmName}</span>
                          <span className="text-[10px] text-slate-400 mt-0.5">{payment.userCode} | {payment.phoneNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm font-bold text-slate-900">
                            ₹{payment.paidAmount.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1">
                            of ₹{payment.totalAmount.toLocaleString()} total
                          </span>
                          {payment.remainingAmount > 0 && (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-1">
                              ₹{payment.remainingAmount.toLocaleString()} Pending
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          {getStatusBadge(payment.orderStatus)}
                          <Badge variant="outline" className={`capitalize text-[10px] ${
                            payment.paymentMode === 'online' ? 'bg-blue-50/50 text-blue-600 border-blue-100' : 'bg-purple-50/50 text-purple-600 border-purple-100'
                          }`}>
                            {payment.paymentMode}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className="text-sm text-slate-700 font-medium">
                            {format(new Date(payment.paymentDate), "dd MMM yyyy")}
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {format(new Date(payment.paymentDate), "hh:mm a")}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm text-slate-500 italic">Compiling payment reports...</p>
              </div>
            ) : payments.length === 0 ? (
              <div className="px-6 py-12 text-center text-slate-400 italic">
                No matching records found for the selected period.
              </div>
            ) : (
              payments.map((payment, index) => (
                <motion.div
                  key={payment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="p-4 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Transaction ID</span>
                      <span className="text-sm font-bold text-slate-900 font-mono">
                        #{payment.paymentId.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      {getStatusBadge(payment.orderStatus)}
                      <Badge variant="outline" className={`capitalize text-[10px] font-bold ${
                        payment.paymentMode === 'online' ? 'bg-blue-50/50 text-blue-600 border-blue-100' : 'bg-purple-50/50 text-purple-600 border-purple-100'
                      }`}>
                        {payment.paymentMode}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Customer</span>
                      <span className="text-sm font-bold text-slate-800 leading-tight">{payment.customerName}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">{payment.firmName}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Paid Amount</span>
                      <span className="text-sm font-bold text-slate-900">₹{payment.paidAmount.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-500 mt-0.5">of ₹{payment.totalAmount.toLocaleString()} total</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px]">
                    <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                      <Clock className="h-3 w-3" />
                      {format(new Date(payment.paymentDate), "dd MMM yyyy, hh:mm a")}
                    </div>
                    {payment.remainingAmount > 0 && (
                      <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        ₹{payment.remainingAmount.toLocaleString()} Balance
                      </span>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PaymentHistory;