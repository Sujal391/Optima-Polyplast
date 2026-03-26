import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from "js-cookie";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Maximize2,
  X,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Eye,
  Settings2,
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
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

const BannerManagement = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [bannerImage, setBannerImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [zoomImage, setZoomImage] = useState(null);
  const navigate = useNavigate();

  const api = axios.create({
    baseURL: process.env.REACT_APP_API,
  });

  api.interceptors.request.use(
    (config) => {
      const token = cookies.get("token");
      if (token) {
        config.headers.Authorization = token;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  const fetchBanners = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/banners");
      setBanners(response.data.banners || []);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load banners. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        showToast("Please select an image file.", "error");
        return;
      }
      setBannerImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!bannerImage) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", bannerImage);

    try {
      const response = await api.post("/admin/banners", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      showToast(response.data.message || "Banner uploaded successfully!", "success");
      fetchBanners();
      closeModal();
    } catch (error) {
      console.error("Upload Error:", error);
      showToast(error.response?.data?.error || "Failed to upload banner.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this banner?")) {
      try {
        const response = await api.delete(`/admin/banners/${id}`);
        showToast(response.data.message || "Banner deleted.", "success");
        fetchBanners();
      } catch (error) {
        console.error("Delete Error:", error);
        showToast("Failed to delete banner.", "error");
      }
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setBannerImage(null);
    setPreviewUrl(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <motion.h1
            className="text-2xl font-bold text-slate-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            Banner Management
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Upload and manage marketing banners for the application home screen
          </motion.p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 shadow-sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Banner
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            className="flex flex-col items-center justify-center h-64"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-slate-500">Loading banners...</p>
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
        ) : (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-sm overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-blue-500" />
                    Active Banners
                  </CardTitle>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100">
                    {banners.length} {banners.length === 1 ? 'Banner' : 'Banners'}
                  </Badge>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-left">
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Preview
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Sort Order
                        </th>
                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {banners.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center text-slate-400 italic">
                            No banners available. Upload one to get started.
                          </td>
                        </tr>
                      ) : (
                        banners.map((banner, index) => (
                          <motion.tr
                            key={banner._id || index}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="hover:bg-slate-50/50 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div
                                className="relative w-32 h-16 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm group-hover:shadow-md transition-all"
                                onClick={() => setZoomImage(banner.image)}
                              >
                                <img
                                  src={banner.image}
                                  alt={`Banner ${banner.order}`}
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <Maximize2 className="h-4 w-4 text-white" />
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Settings2 className="h-4 w-4 text-slate-400" />
                                {banner.order || index + 1}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="secondary"
                                className={
                                  banner.isActive !== false
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-slate-50 text-slate-500 border-slate-100"
                                }
                              >
                                {banner.isActive !== false ? "Active" : "Inactive"}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-blue-600"
                                  onClick={() => setZoomImage(banner.image)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(banner._id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
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
                  {banners.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400 italic">
                      No banners available. Upload one to get started.
                    </div>
                  ) : (
                    banners.map((banner, index) => (
                      <motion.div
                        key={banner._id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4 space-y-4"
                      >
                        <div
                          className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-slate-200 shadow-sm"
                          onClick={() => setZoomImage(banner.image)}
                        >
                          <img
                            src={banner.image}
                            alt={`Banner ${banner.order}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                             <Badge
                                variant="secondary"
                                className={
                                  banner.isActive !== false
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-slate-50 text-slate-500 border-slate-100"
                                }
                              >
                                {banner.isActive !== false ? "Active" : "Inactive"}
                              </Badge>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5">
                            <Settings2 className="h-3 w-3" /> Order: {banner.order || index + 1}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 h-9 rounded-lg text-xs"
                            onClick={() => setZoomImage(banner.image)}
                          >
                            <Eye className="h-4 w-4 mr-2" /> Preview
                          </Button>
                          <Button
                            variant="ghost"
                            className="flex-1 h-9 rounded-lg text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDelete(banner._id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload New Banner</DialogTitle>
            <DialogDescription>
              Select an image to display on the application home screen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-colors ${
                previewUrl ? "border-blue-200 bg-blue-50/30" : "border-slate-200 hover:border-blue-300"
              }`}
            >
              {previewUrl ? (
                <div className="relative w-full aspect-[21/9] rounded-lg overflow-hidden border border-blue-200 shadow-sm">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 rounded-full shadow-lg"
                    onClick={() => {
                      setBannerImage(null);
                      setPreviewUrl(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-center">
                  <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                    <Upload className="h-6 w-6 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-400 mt-1">Recommended size: 1920x800px (JPG, PNG)</p>
                  </div>
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={closeModal} disabled={uploading}>
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={uploading || !bannerImage}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                "Upload Banner"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div
            className="fixed inset-0 bg-slate-900/90 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
            onClick={() => setZoomImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setZoomImage(null)}
                className="absolute -top-12 right-0 text-white hover:text-slate-300 transition-colors"
              >
                <X className="h-8 w-8" />
              </button>
              <img
                src={zoomImage}
                alt="Zoomed Banner"
                className="w-full h-auto rounded-xl shadow-2xl border-4 border-white/10"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[110] px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              toast.type === "success"
                ? "bg-emerald-600 border-emerald-500 text-white"
                : "bg-red-600 border-red-500 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default BannerManagement;
