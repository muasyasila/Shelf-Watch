"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Package, 
  Store, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  ArrowRight,
  ChevronRight,
  Clock,
  Zap,
  BarChart3,
  Eye,
  FileText,
} from "lucide-react";
import storesData from "@/lib/stores";
import skusData from "@/lib/skus";
import inventoryData from "@/lib/inventory";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return "critical";
  if (stock < threshold * 0.5) return "critical";
  if (stock < threshold) return "risk";
  return "ok";
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardOverview() {
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    // Set greeting based on time of day
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Get user name from localStorage
    const user = localStorage.getItem("shelfwatch_user");
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserName(parsedUser.name);
    }
  }, []);

  // Calculate metrics
  const totalItems = inventoryData.length;
  const totalStores = storesData.length;
  const totalSkus = skusData.length;
  
  const totalCritical = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return getStockStatus(item.stock, sku?.reorderPoint || 0) === "critical";
  }).length;
  
  const totalRisk = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return getStockStatus(item.stock, sku?.reorderPoint || 0) === "risk";
  }).length;
  
  const totalHealthy = totalItems - totalCritical - totalRisk;
  const overallHealthScore = totalItems === 0 ? 0 : Math.round((totalHealthy / totalItems) * 100);

  // Calculate store performance
  const storePerformance = storesData.map(store => {
    const storeItems = inventoryData.filter(item => item.storeId === store.id);
    let critical = 0;
    let risk = 0;
    let healthy = 0;
    
    storeItems.forEach(item => {
      const sku = skusData.find(s => s.id === item.skuId);
      const status = getStockStatus(item.stock, sku?.reorderPoint || 0);
      if (status === "critical") critical++;
      else if (status === "risk") risk++;
      else healthy++;
    });
    
    const healthScore = storeItems.length === 0 ? 0 : Math.round((healthy / storeItems.length) * 100);
    return { name: store.name, location: store.location, critical, risk, healthy, healthScore };
  });

  const worstStore = [...storePerformance].sort((a, b) => b.critical - a.critical)[0];
  const bestStore = [...storePerformance].sort((a, b) => b.healthScore - a.healthScore)[0];

  // Calculate competitor wins
  const competitorWins = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return (sku?.competitorStock || 0) > item.stock;
  }).length;

  const yourWins = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return item.stock > (sku?.competitorStock || 0);
  }).length;

  // Recent activity (mock)
  const recentActivities = [
    { type: "alert", message: "Milk running low at Carrefour Junction", time: "5 min ago", icon: AlertCircle, color: "text-red-500" },
    { type: "dispatch", message: "Dispatched 50 units of Cooking Oil to Naivas CBD", time: "1 hour ago", icon: Package, color: "text-green-500" },
    { type: "resolved", message: "Stockout resolved at QuickMart Westlands", time: "3 hours ago", icon: CheckCircle, color: "text-blue-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {userName || "Guest"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Here's what's happening with your inventory today</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full">
            {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
              <AlertCircle className="text-red-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalCritical}</p>
          <p className="text-sm text-gray-500 mt-1">Critical Stockouts</p>
          {totalCritical > 0 && (
            <Link href="/dashboard/inventory?risk=critical" className="text-xs text-red-500 mt-2 inline-flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-yellow-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalRisk}</p>
          <p className="text-sm text-gray-500 mt-1">At Risk</p>
          {totalRisk > 0 && (
            <Link href="/dashboard/inventory?risk=risk" className="text-xs text-yellow-500 mt-2 inline-flex items-center gap-1 hover:underline">
              View all <ChevronRight size={12} />
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <CheckCircle className="text-green-500" size={20} />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalHealthy}</p>
          <p className="text-sm text-gray-500 mt-1">Healthy SKUs</p>
        </motion.div>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#0e2820] to-[#1a4a38] rounded-2xl p-5 text-white"
        >
          <p className="text-white/60 text-sm">Health Score</p>
          <p className="text-3xl font-bold">{overallHealthScore}%</p>
          <div className="mt-2 w-full bg-white/20 rounded-full h-1.5">
            <div className="bg-[#dbfe7a] h-1.5 rounded-full" style={{ width: `${overallHealthScore}%` }} />
          </div>
        </motion.div>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Store Spotlight */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store size={18} className="text-gray-400" />
                <h2 className="font-semibold text-gray-900">Store Spotlight</h2>
              </div>
              <Link href="/dashboard/analytics" className="text-xs text-[#0e2820] hover:underline">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {worstStore && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{worstStore.name}</p>
                  <p className="text-xs text-gray-500">Needs attention</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{worstStore.critical}</p>
                  <p className="text-xs text-red-500">critical issues</p>
                </div>
              </div>
            )}
            {bestStore && (
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-900">{bestStore.name}</p>
                  <p className="text-xs text-gray-500">Top performer</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{bestStore.healthScore}%</p>
                  <p className="text-xs text-green-500">health score</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-600">Total stores active</p>
              <p className="text-xl font-semibold text-gray-900">{totalStores}</p>
            </div>
          </div>
        </motion.div>

        {/* Competitor Summary */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target size={18} className="text-gray-400" />
                <h2 className="font-semibold text-gray-900">Competitor Edge</h2>
              </div>
              <Link href="/dashboard/competitors" className="text-xs text-[#0e2820] hover:underline">
                View all →
              </Link>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Your Advantages</p>
                <p className="text-xs text-gray-500">Products where you lead</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600">{yourWins}</p>
                <p className="text-xs text-green-500">products</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-900">Competitor Advantages</p>
                <p className="text-xs text-gray-500">Products where they lead</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-red-600">{competitorWins}</p>
                <p className="text-xs text-red-500">opportunities</p>
              </div>
            </div>
            <Link href="/dashboard/competitors" className="block w-full py-2 text-center text-sm text-[#0e2820] font-medium hover:underline">
              Analyze competitor data →
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/inventory"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Eye size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">View Inventory</span>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
            <Link
              href="/dashboard/reports"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Generate Report</span>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <BarChart3 size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">View Analytics</span>
              </div>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 lg:col-span-2"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="space-y-3">
            {recentActivities.map((activity, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className={`w-8 h-8 bg-${activity.color === 'text-red-500' ? 'red' : activity.color === 'text-green-500' ? 'green' : 'blue'}-50 rounded-lg flex items-center justify-center`}>
                  <activity.icon size={16} className={activity.color} />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">{activity.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <Link href="#" className="block text-center text-sm text-gray-500 mt-4 hover:text-[#0e2820]">
            View all activity →
          </Link>
        </motion.div>
      </div>
    </div>
  );
}