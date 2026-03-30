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
  Box,
  Layers,
  Container,
  User,
  Activity,
  ChevronRight,
  TrendingDown,
  Info,
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

const StockActivityReport = () => {
  const [activities, setActivities] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  
  // Filter states
  const [fromDate, setFromDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [type, setType] = useState("all");

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

  const fetchActivities = async () => {
    setLoading(true);
    setError(null);
    try {
      const typeParam = type === "all" ? "" : `&type=${type}`;
      const response = await api.get(
        `/admin/stock/activities?fromDate=${fromDate}&toDate=${toDate}${typeParam}`
      );
      
      setActivities(response.data.data || []);
      setCount(response.data.count || 0);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Error fetching stock activities. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [fromDate, toDate, type]);

  const handleDownloadExcel = () => {
    if (activities.length === 0) return;
    setDownloading(true);

    const excelData = activities.map(activity => ({
      'Date': format(new Date(activity.date), 'dd-MM-yyyy HH:mm:ss'),
      'Type': activity.type,
      'Quantity': activity.quantity,
      'Wastage': activity.wastage || 0,
      'Preform Type': activity.preformType || 'N/A',
      'Category': activity.category || 'N/A',
      'Material': activity.material || 'N/A',
      'User': activity.user,
      'Remarks': activity.remarks
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(excelData);
    XLSX.utils.book_append_sheet(wb, ws, 'Stock Activities');
    XLSX.writeFile(wb, `Stock_Activities_${fromDate}_to_${toDate}.xlsx`);
    setDownloading(false);
  };

  const getIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "preform": return <Layers className="h-4 w-4 text-purple-500" />;
      case "bottle": return <Container className="h-4 w-4 text-blue-500" />;
      case "rawmaterial": return <Box className="h-4 w-4 text-amber-500" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
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
          <h1 className="text-2xl font-bold text-slate-800">Stock Activities</h1>
          <p className="text-slate-500 mt-1">Audit trail for production and material movements</p>
        </div>
        <div className="flex items-center gap-3">
             <Badge variant="secondary" className="px-4 py-2 text-sm font-bold bg-slate-100 text-slate-600 h-10 border-slate-200">
                Log Count: {count}
             </Badge>
             <Button
                onClick={handleDownloadExcel}
                disabled={downloading || activities.length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 h-10"
             >
                {downloading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
                Export Logs
             </Button>
        </div>
      </div>

      <Card className="mb-8 border-0 shadow-sm overflow-hidden bg-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">From Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">To Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="pl-9 h-10" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 uppercase">Activity Type</label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="All Activities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Activities</SelectItem>
                  <SelectItem value="preform">Preform Production</SelectItem>
                  <SelectItem value="bottle">Bottle Production</SelectItem>
                  <SelectItem value="rawMaterial">Raw Material Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 h-10 uppercase font-bold tracking-tight text-xs" onClick={fetchActivities}>Update Logs</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-left">
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Activity & Items</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center">Quantities</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Remarks & Notes</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">User</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></td></tr>
                ) : activities.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 italic">No activities recorded for this period.</td></tr>
                ) : (
                  activities.map((act, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 rounded-lg border border-slate-100 shrink-0">
                            {getIcon(act.type)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">{act.type.replace(/([A-Z])/g, ' $1')}</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {act.material || act.preformType || 'N/A'} {act.category ? `| ${act.category}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-bold text-slate-900">{act.quantity.toLocaleString()}</span>
                          {act.wastage > 0 && (
                            <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                              <TrendingDown className="h-2 w-2" /> {act.wastage} wastage
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-2 max-w-xs">
                           <Info className="h-3 w-3 text-slate-300 mt-1 shrink-0" />
                           <p className="text-[10px] text-slate-500 leading-relaxed italic">{act.remarks || 'No remarks provided'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                              {act.user?.charAt(0) || 'U'}
                           </div>
                           <span className="text-[10px] font-semibold text-slate-600">{act.user}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-700 font-mono tracking-tight">{format(new Date(act.date), "dd-MM-yy")}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{format(new Date(act.date), "hh:mm a")}</span>
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

export default StockActivityReport;
