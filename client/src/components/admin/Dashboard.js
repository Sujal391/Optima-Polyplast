import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Package,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  Eye,
  Loader2,
  AlertCircle,
  Settings,
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

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/dashboard/stats");
        setStats(response.data.stats);
        setLoading(false);
      } catch (err) {
        setError(
          err.response?.status === 401
            ? "Session expired. Please login again."
            : "Error fetching stats. Please try again later."
        );
        if (err.response?.status === 401) {
          cookies.remove("token");
          window.location.href = "/";
        }
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = stats
    ? [
        {
          title: "Total Users",
          value: stats.users.total,
          description: `Active: ${stats.users.active}, Inactive: ${stats.users.inactive}`,
          icon: Users,
          color: "bg-blue-500",
          lightColor: "bg-blue-50",
          textColor: "text-blue-600",
          route: "/users",
        },
        {
          title: "Total Products",
          value: stats.products.total,
          description: `Bottles: ${stats.products.bottles}, Raw: ${stats.products.rawMaterials}`,
          icon: Package,
          color: "bg-emerald-500",
          lightColor: "bg-emerald-50",
          textColor: "text-emerald-600",
          route: "/product",
        },
        {
          title: "Total Orders",
          value:
            stats.orders.pending +
            stats.orders.confirmed +
            stats.orders.shipped +
            stats.orders.cancelled +
            stats.orders.preview +
            stats.orders.processing,
          description: `Shipped: ${stats.orders.shipped}, Pending: ${stats.orders.pending}`,
          icon: ShoppingCart,
          color: "bg-violet-500",
          lightColor: "bg-violet-50",
          textColor: "text-violet-600",
          route: "/order",
        },
      ]
    : [];

  const orderStats = stats
    ? [
        {
          status: "Pending",
          count: stats.orders.pending,
          icon: Clock,
          color: "bg-amber-500",
          lightBg: "bg-amber-50",
          textColor: "text-amber-700",
          borderColor: "border-l-amber-500",
        },
        {
          status: "Confirmed",
          count: stats.orders.confirmed,
          icon: CheckCircle2,
          color: "bg-blue-500",
          lightBg: "bg-blue-50",
          textColor: "text-blue-700",
          borderColor: "border-l-blue-500",
        },
        {
          status: "Shipped",
          count: stats.orders.shipped,
          icon: Truck,
          color: "bg-indigo-500",
          lightBg: "bg-indigo-50",
          textColor: "text-indigo-700",
          borderColor: "border-l-indigo-500",
        },
        {
          status: "Cancelled",
          count: stats.orders.cancelled,
          icon: XCircle,
          color: "bg-red-500",
          lightBg: "bg-red-50",
          textColor: "text-red-700",
          borderColor: "border-l-red-500",
        },
        {
          status: "Preview",
          count: stats.orders.preview,
          icon: Eye,
          color: "bg-slate-500",
          lightBg: "bg-slate-50",
          textColor: "text-slate-700",
          borderColor: "border-l-slate-500",
        },
        {
          status: "Processing",
          count: stats.orders.processing,
          icon: Settings,
          color: "bg-orange-500",
          lightBg: "bg-orange-50",
          textColor: "text-orange-700",
          borderColor: "border-l-orange-500",
        },
      ]
    : [];

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
            Dashboard Overview
          </motion.h1>
          <motion.p
            className="text-slate-500 mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            Welcome back! Here's what's happening with your business today.
          </motion.p>
        </div>

        {/* Dashboard Content */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              className="flex flex-col items-center justify-center h-64"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-slate-500">Loading dashboard data...</p>
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
              transition={{ staggerChildren: 0.1 }}
            >
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {cards.map((card, index) => {
                  const Icon = card.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="cursor-pointer group hover:shadow-lg transition-all duration-300 border-0 shadow-sm overflow-hidden"
                        onClick={() => navigate(card.route)}
                      >
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <CardDescription className="text-sm font-medium text-slate-500">
                              {card.title}
                            </CardDescription>
                            <div
                              className={`p-2.5 rounded-xl ${card.lightColor} group-hover:scale-110 transition-transform duration-300`}
                            >
                              <Icon className={`h-5 w-5 ${card.textColor}`} />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-end justify-between">
                            <div>
                              <CardTitle className="text-3xl font-bold text-slate-800">
                                {card.value.toLocaleString()}
                              </CardTitle>
                              <p className="text-sm text-slate-400 mt-1">
                                {card.description}
                              </p>
                            </div>
                            <Badge
                              variant="secondary"
                              className={`${card.lightColor} ${card.textColor} border-0`}
                            >
                              View →
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Order Breakdown Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold text-slate-800">
                          Order Breakdown
                        </CardTitle>
                        <CardDescription className="text-slate-500 mt-1">
                          View orders by their current status
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/order")}
                        className="text-sm"
                      >
                        View All Orders
                      </Button>
                    </div>
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {orderStats.map((order, index) => {
                        const Icon = order.icon;
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 + index * 0.05 }}
                          >
                            <Card
                              className={`cursor-pointer group hover:shadow-md transition-all duration-300 border-l-4 ${order.borderColor} bg-white`}
                              onClick={() => navigate("/order")}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`p-2 rounded-lg ${order.lightBg} group-hover:scale-110 transition-transform duration-200`}
                                    >
                                      <Icon
                                        className={`h-4 w-4 ${order.textColor}`}
                                      />
                                    </div>
                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                        {order.status}
                                      </p>
                                      <p className="text-sm text-slate-400 mt-0.5">
                                        Orders
                                      </p>
                                    </div>
                                  </div>
                                  <span
                                    className={`text-2xl font-bold ${order.textColor}`}
                                  >
                                    {order.count.toLocaleString()}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;