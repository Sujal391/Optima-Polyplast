import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from "js-cookie";
import {
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Shield,
  Mail,
  Phone,
  User,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  X,
  ChevronRight,
  ChevronLeft,
  Settings2,
  Lock,
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
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import Paginator from "../shared/Paginator";

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
  (error) => {
    return Promise.reject(error);
  }
);

const CreatedUsers = () => {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    role: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  
  const [roles] = useState([
    "reception",
    "stock",
    "dispatch",
    "marketing",
    "miscellaneous",
    "sales",
  ]);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/staff");
      setStaff(response.data.staff || []);
      setError(null);
    } catch (err) {
      console.error("Fetch Error:", err);
      if (err.response?.status === 401) {
        setError("Session expired. Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setError("Failed to load staff accounts.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => ({ ...prev, role }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.role) {
      showToast("Please select a role.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/auth/register/staff", formData);
      showToast("Staff user created successfully!", "success");
      fetchStaff();
      closeModal();
    } catch (error) {
      console.error("Error:", error);
      showToast(error.response?.data?.message || "Failed to create user.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) {
      try {
        await api.delete(`/admin/staff/${id}`);
        showToast("User deleted successfully.", "success");
        fetchStaff();
      } catch (error) {
        console.error("Delete Error:", error);
        showToast("Failed to delete user.", "error");
      }
    }
  };

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      role: "",
      password: "",
    });
    setShowPassword(false);
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startIndex = (page - 1) * pageSize;
  const pagedStaff = filteredStaff.slice(startIndex, startIndex + pageSize);

  const getRoleBadgeColor = (role) => {
    const colors = {
      reception: "bg-blue-50 text-blue-700 border-blue-100",
      stock: "bg-amber-50 text-amber-700 border-amber-100",
      dispatch: "bg-purple-50 text-purple-700 border-purple-100",
      marketing: "bg-emerald-50 text-emerald-700 border-emerald-100",
      sales: "bg-indigo-50 text-indigo-700 border-indigo-100",
      miscellaneous: "bg-slate-50 text-slate-700 border-slate-100",
    };
    return colors[role.toLowerCase()] || "bg-slate-50 text-slate-700 border-slate-100";
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
            Panel User Management
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Create and manage administrative accounts for different departments
          </motion.p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-primary hover:bg-primary/90 shadow-sm"
        >
          <UserPlus className="h-4 w-4 mr-2" />
          Create New User
        </Button>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Administrative Staff
            </CardTitle>
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, email or role..."
                className="pl-9 bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-slate-500 font-medium">Loading staff accounts...</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase">
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Staff Member
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Contact Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Assigned Role
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 uppercase font-medium">
                    {filteredStaff.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                          No staff members found matching your search.
                        </td>
                      </tr>
                    ) : (
                      pagedStaff.map((member, index) => (
                        <motion.tr
                          key={member._id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50/50 transition-colors group"
                        >
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                                <User className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">ID: {member._id.slice(-6)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Mail className="h-3.5 w-3.5 text-slate-400" />
                                {member.email}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600">
                                <Phone className="h-3.5 w-3.5 text-slate-400" />
                                {member.phoneNumber}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={`capitalize px-2.5 py-0.5 text-[11px] font-semibold border-2 ${getRoleBadgeColor(member.role)}`}>
                              {member.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                              onClick={() => handleDelete(member._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-slate-100 uppercase">
                {filteredStaff.length === 0 ? (
                  <div className="px-6 py-12 text-center text-slate-400 text-sm italic">
                    No staff members found matching your search.
                  </div>
                ) : (
                  pagedStaff.map((member, index) => (
                    <motion.div
                      key={member._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 space-y-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shrink-0">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 leading-tight">{member.name}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wider">ID: {member._id.slice(-6)}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full shrink-0"
                          onClick={() => handleDelete(member._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 bg-slate-50/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Mail className="h-3.5 w-3.5 text-slate-400" />
                          {member.email}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Phone className="h-3.5 w-3.5 text-slate-400" />
                          {member.phoneNumber}
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assigned Role</span>
                        <Badge variant="outline" className={`capitalize px-2.5 py-0.5 text-[11px] font-bold border-2 ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </Badge>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
          
          {/* Pagination */}
          {!loading && filteredStaff.length > 0 && (
            <div className="p-6 border-t border-slate-100 bg-slate-50/30">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs font-medium text-slate-500">
                  Showing <span className="text-slate-900">{startIndex + 1}</span> to{" "}
                  <span className="text-slate-900">{Math.min(startIndex + pageSize, filteredStaff.length)}</span> of{" "}
                  <span className="text-slate-900">{filteredStaff.length}</span> staff members
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Rows per page:</span>
                    <Select
                      value={pageSize.toString()}
                      onValueChange={(val) => {
                        setPageSize(Number(val));
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="h-8 w-16 text-xs border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Paginator
                    page={page}
                    total={filteredStaff.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">Create Panel User</DialogTitle>
            <DialogDescription>
              Assign role and credentials for a new administrative staff member.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="e.g. John Doe"
                      className="pl-9"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-9"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phoneNumber"
                        placeholder="+91 12345 67890"
                        className="pl-9"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Department</Label>
                  <Select onValueChange={handleRoleChange} value={formData.role}>
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <SelectValue placeholder="Select a department role" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role} value={role} className="capitalize italic">
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-slate-500">Access Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      className="pl-9 pr-10"
                      value={formData.password}
                      onChange={handleInputChange}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 pt-2 bg-slate-50/50">
              <Button type="button" variant="ghost" onClick={closeModal} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-primary hover:bg-primary/90 min-w-[120px]">
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
            <span className="font-medium text-sm">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-70">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CreatedUsers;
