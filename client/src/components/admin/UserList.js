import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from "js-cookie";
import { cn } from "../../lib/utils";
import {
  Users as UsersIcon,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  Building2,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Separator } from "../ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import Paginator from "../shared/Paginator";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [popupMessage, setPopupMessage] = useState(null);
  const [popupType, setPopupType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isDeleting, setIsDeleting] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/users");
      setUsers(response.data.users || []);
      setError(null);
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Failed to load users. Please try again later."
      );
      if (error.response?.status === 401) {
        cookies.remove("token");
        window.location.href = "/";
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const name = user.name || "";
    const email = user.email || "";
    const matchesSearch =
      searchTerm === "" ||
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "All" ||
      (user.isActive ? "Active" : "Inactive") === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pagedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleStatusToggle = async (userCode, currentStatus) => {
    try {
      if (!userCode) throw new Error("Invalid User ID.");

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userCode === userCode ? { ...user, isBeingToggled: true } : user
        )
      );

      const response = await api.patch(
        `/admin/users/${userCode}/toggle-status`
      );

      if (response.status === 200) {
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.userCode === userCode
              ? {
                  ...user,
                  isActive: !currentStatus,
                  isBeingToggled: false,
                }
              : user
          )
        );
        setPopupType("success");
        setPopupMessage(
          currentStatus
            ? "User deactivated successfully!"
            : "User activated successfully!"
        );
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      console.error("Error toggling user status:", error);
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.userCode === userCode
            ? { ...user, isBeingToggled: false }
            : user
        )
      );
      setPopupType("error");
      setPopupMessage("Failed to update status. Please try again later.");
    } finally {
      setTimeout(() => setPopupMessage(null), 3000);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    try {
      const response = await api.delete(`/admin/users/${userToDelete.userCode}`);

      if (response.status === 200) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.userCode !== userToDelete.userCode));
        setPopupType("success");
        setPopupMessage("User and related data deleted successfully");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      setPopupType("error");
      setPopupMessage(error.response?.data?.message || "Failed to delete user. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setUserToDelete(null);
      setTimeout(() => setPopupMessage(null), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <div className="mb-8">
        <motion.h1
          className="text-2xl font-bold text-slate-800"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          User Management
        </motion.h1>
        <motion.p
          className="text-slate-500 mt-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Manage all registered users, their roles, and account status
        </motion.p>
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
            <p className="text-slate-500">Loading user data...</p>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 max-w-md relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <Select
                      value={filterStatus}
                      onValueChange={setFilterStatus}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Status</SelectItem>
                        <SelectItem value="Active">Active</SelectItem>
                        <SelectItem value="Inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          User Details
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Contact
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Firm
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Joined
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-widest">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedUsers.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                            No users found matching your search
                          </td>
                        </tr>
                      ) : (
                        pagedUsers.map((user, index) => (
                          <motion.tr
                            key={user._id || index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                                  {user.name?.charAt(0) || "U"}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-slate-800">
                                    {user.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Code: {user.userCode}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Mail className="h-3 w-3" />
                                  {user.email}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                                  <Phone className="h-3 w-3" />
                                  {user.phoneNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-sm text-slate-600 font-medium">
                                <Building2 className="h-3.5 w-3.5 text-slate-400" />
                                {user.firmName || "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <Badge
                                variant="secondary"
                                className={
                                  user.isActive
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : "bg-red-50 text-red-700 border-red-100"
                                }
                              >
                                {user.isActive ? (
                                  <span className="flex items-center gap-1">
                                    <UserCheck className="h-3 w-3" /> Active
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1">
                                    <UserX className="h-3 w-3" /> Inactive
                                  </span>
                                )}
                              </Badge>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar className="h-3 w-3" />
                                {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-3">
                                <span className={cn(
                                  "text-xs font-medium transition-colors",
                                  user.isActive ? "text-emerald-600" : "text-slate-400"
                                )}>
                                  {user.isActive ? "Active" : "Inactive"}
                                </span>
                                <Switch
                                  checked={user.isActive}
                                  onCheckedChange={() => handleStatusToggle(user.userCode, user.isActive)}
                                  disabled={user.isBeingToggled}
                                />
                                {user.isBeingToggled && (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteDialog(true);
                                  }}
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
                  {pagedUsers.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-400">
                      No users found matching your search
                    </div>
                  ) : (
                    pagedUsers.map((user, index) => (
                      <motion.div
                        key={user._id || index}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="p-4 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                              {user.name?.charAt(0) || "U"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 leading-tight">
                                {user.name}
                              </p>
                              <p className="text-[10px] uppercase tracking-wider text-slate-400 font-mono mt-0.5">
                                Code: {user.userCode}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              user.isActive
                                ? "bg-emerald-50 text-emerald-700 border-emerald-100 rounded-full px-2"
                                : "bg-red-50 text-red-700 border-red-100 rounded-full px-2"
                            }
                          >
                            {user.isActive ? <UserCheck className="h-3 w-3 mr-1" /> : <UserX className="h-3 w-3 mr-1" />}
                            <span className="text-[10px] font-semibold">{user.isActive ? "Active" : "Inactive"}</span>
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 gap-2 border-t border-slate-50 pt-3">
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Building2 className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-medium">{user.firmName || "No Firm Assigned"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {user.phoneNumber}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400">
                            <Calendar className="h-3 w-3" />
                            Joined on {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Access</span>
                            <span className={cn(
                              "text-xs font-bold transition-colors",
                              user.isActive ? "text-emerald-600" : "text-slate-400"
                            )}>
                              {user.isActive ? "Enabled" : "Disabled"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            {user.isBeingToggled && (
                              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                            )}
                            <Switch
                              checked={user.isActive}
                              onCheckedChange={() => handleStatusToggle(user.userCode, user.isActive)}
                              disabled={user.isBeingToggled}
                              className="scale-110"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500"
                              onClick={() => {
                                setUserToDelete(user);
                                setShowDeleteDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {filteredUsers.length > 0 && (
                  <div className="px-6 py-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-slate-500 order-2 sm:order-1">
                      Showing {startIndex + 1}–{Math.min(endIndex, filteredUsers.length)} of{" "}
                      {filteredUsers.length} users
                    </div>
                    <div className="order-1 sm:order-2">
                      <Paginator
                        page={page}
                        total={filteredUsers.length}
                        pageSize={pageSize}
                        onPageChange={setPage}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Popup Notification */}
      <AnimatePresence>
        {popupMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 50, x: "-50%" }}
            className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 border ${
              popupType === "success"
                ? "bg-emerald-600 border-emerald-500 text-white"
                : "bg-red-600 border-red-500 text-white"
            }`}
          >
            {popupType === "success" ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}
            <span className="font-medium">{popupMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Delete User Account
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{userToDelete?.name}</strong>?
              <br /><br />
              This action is <strong>permanent</strong> and will delete:
              <ul className="list-disc ml-6 mt-2 space-y-1 text-xs">
                <li>User profile and credentials</li>
                <li>All order history and payments</li>
                <li>All associated challans</li>
                <li>Restores product stock levels</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteUser();
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Decletion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default Users;
