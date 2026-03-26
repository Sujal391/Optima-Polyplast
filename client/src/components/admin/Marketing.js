import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import cookies from "js-cookie";
import {
  Megaphone,
  Download,
  Calendar,
  User,
  Mail,
  MapPin,
  MessageSquare,
  CheckCircle2,
  Clock,
  Loader2,
  AlertCircle,
  X,
  Maximize2,
  Phone,
  Building2,
  Tag,
  FileText,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";

const Marketing = () => {
  const [marketingData, setMarketingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const navigate = useNavigate();

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

  const fetchMarketingData = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/marketing-activities");
      if (response.status === 200) {
        setMarketingData(response.data);
      } else {
        setError("Error fetching marketing data. Please try again later.");
      }
    } catch (err) {
      console.error("Error fetching marketing data:", err);
      setError("Error fetching marketing data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  const handleReview = async (activityId) => {
    if (
      marketingData?.activities?.some(
        (activity) =>
          activity._id === activityId && activity.status === "reviewed"
      )
    ) {
      toast.info("This activity has already been reviewed.");
      return;
    }

    setReviewing(activityId);
    
    try {
      const response = await api.patch(
        `/admin/marketing-activities/${activityId}/review`,
        {}
      );
      if (response.status === 200) {
        toast.success("Review submitted successfully!");
        setMarketingData((prevData) => ({
          ...prevData,
          activities: prevData.activities.map((activity) =>
            activity._id === activityId
              ? {
                  ...activity,
                  status: "reviewed",
                  reviewedAt: new Date(),
                  reviewedBy: response.data.activity.reviewedBy,
                }
              : activity
          ),
        }));
      }
    } catch (err) {
      console.error("Error in handleReview:", err);
      toast.error("Error submitting review. Please try again.");
    } finally {
      setReviewing(null);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await api.get("admin/download-marketing-activities", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Marketing_Activities.xlsx");
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Marketing activities downloaded successfully!");
    } catch (err) {
      console.error("Error downloading marketing activities:", err);
      toast.error("Error downloading marketing activities.");
    }
  };

  const filteredActivities = filterDate
    ? marketingData?.activities?.filter(
        (activity) =>
          new Date(activity.createdAt).toLocaleDateString() ===
          filterDate.toLocaleDateString()
      )
    : marketingData?.activities;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="pb-12"
    >
      <ToastContainer position="bottom-right" />
      
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl font-bold text-slate-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Marketing Activities
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Monitor visited shops, companies, and field marketing performance
          </motion.p>
        </div>
        <Button
          onClick={handleDownload}
          variant="default"
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Download All Activities
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-8 border-0 shadow-sm">
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Filter by Date:</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 z-10" />
              <DatePicker
                selected={filterDate}
                onChange={(date) => setFilterDate(date)}
                dateFormat="MMMM d, yyyy"
                placeholderText="Select a date"
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-[200px]"
              />
            </div>
          </div>
          {filterDate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterDate(null)}
              className="text-red-500 h-9 hover:text-red-600 hover:bg-red-50"
            >
              Clear Filter
            </Button>
          )}
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500">Loading marketing activities...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-3 py-6">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <p className="text-red-700 font-medium">{error}</p>
              </CardContent>
            </Card>
          </motion.div>
        ) : filteredActivities?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300"
          >
            <Megaphone className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-lg">No activities found for this period.</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredActivities.map((activity, index) => (
              <motion.div
                key={activity._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 lg:grid-cols-12">
                    {/* Left Panel: Person Info */}
                    <div className="lg:col-span-3 bg-slate-50 p-6 border-r border-slate-100">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg">
                          {activity.marketingUser?.name?.charAt(0) || "M"}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-tight">
                            {activity.marketingUser?.name || "N/A"}
                          </p>
                          <Badge variant="outline" className="mt-1 text-[10px] h-4 px-1.5 uppercase tracking-wider text-slate-500 bg-white">
                            Marketing
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <Mail className="h-3.5 w-3.5 mt-0.5 text-slate-400" />
                          <span className="break-all">{activity.marketingUser?.email || "N/A"}</span>
                        </div>
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <Building2 className="h-3.5 w-3.5 mt-0.5 text-slate-400" />
                          <span>{activity.marketingUser?.customerDetails?.firmName || "N/A"}</span>
                        </div>
                        <Separator className="my-3" />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Captured At</span>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            {new Date(activity.createdAt).toLocaleString("en-IN", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Middle Panel: Customer Info */}
                    <div className="lg:col-span-6 p-6">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{activity.customerName}</h3>
                          <div className="flex items-center gap-2 mt-1 text-slate-500 text-sm">
                            <MapPin className="h-3.5 w-3.5 text-red-500" />
                            {activity.location}
                          </div>
                        </div>
                        <Badge
                          variant="secondary"
                          className={
                            activity.status === "reviewed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100"
                          }
                        >
                          {activity.status === "reviewed" ? (
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> Reviewed
                            </span>
                          ) : (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Pending Review
                            </span>
                          )}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-6 mb-6">
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Mobile Number</p>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {activity.customerMobile}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Visit Type</p>
                          <p className="text-sm font-medium flex items-center gap-2 capitalize">
                            <Tag className="h-3.5 w-3.5 text-slate-400" />
                            {activity.visitType?.replace("_", " ") || "N/A"}
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <MessageSquare className="h-3 w-3" /> Discussion Summary
                        </p>
                        <p className="text-sm text-slate-700 leading-relaxed italic">
                          "{activity.discussion}"
                        </p>
                        {(activity.inquiryType || activity.remarks) && (
                          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-2 gap-4">
                            {activity.inquiryType && (
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Inquiry</p>
                                <p className="text-xs font-medium text-slate-600">{activity.inquiryType}</p>
                              </div>
                            )}
                            {activity.remarks && (
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Remarks</p>
                                <p className="text-xs font-medium text-slate-600">{activity.remarks}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Panel: Media & Review */}
                    <div className="lg:col-span-3 p-6 bg-slate-50/50 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">Activity Photos</p>
                        {activity.images?.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            {activity.images.slice(0, 4).map((image, idx) => (
                              <div
                                key={idx}
                                className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-slate-200 border border-slate-100"
                                onClick={() => setZoomedImage(image)}
                              >
                                <img
                                  src={image}
                                  alt={`Visit ${idx + 1}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Maximize2 className="h-5 w-5 text-white" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-square bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 italic text-xs mb-6">
                            No photos
                          </div>
                        )}
                      </div>

                      <div>
                        {activity.status === "reviewed" ? (
                          <div className="space-y-4">
                            <Separator />
                            <div>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Reviewed By</p>
                              <p className="text-xs font-bold text-slate-700">{activity.reviewedBy || "Admin"}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                {new Date(activity.reviewedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button className="w-full bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-100 shadow-none cursor-default" disabled>
                              <CheckCircle2 className="h-4 w-4 mr-2" />
                              Review Complete
                            </Button>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleReview(activity._id)}
                            disabled={reviewing === activity._id}
                            className="w-full bg-blue-600 hover:bg-blue-700 shadow-md"
                          >
                            {reviewing === activity._id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <FileText className="h-4 w-4 mr-2" />
                            )}
                            {reviewing === activity._id ? "Reviewing..." : "Review Activity"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Image Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
          onClick={() => setZoomedImage(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img
              src={zoomedImage}
              alt="Zoomed"
              className="w-full h-auto rounded-xl shadow-2xl border-4 border-white/10"
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default Marketing;
