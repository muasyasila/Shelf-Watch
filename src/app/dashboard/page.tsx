"use client";

import { motion } from "framer-motion";
import { Package, TrendingUp, Target, CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function DashboardHome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back! Here's what's happening with your inventory today.</p>
      </div>

      {/* Stats Grid - Mock data for now */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <AlertCircle className="text-red-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">4</p>
          <p className="text-sm text-gray-500 mt-1">Critical stockouts</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Clock className="text-yellow-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">6</p>
          <p className="text-sm text-gray-500 mt-1">At risk</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <Package className="text-green-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">45</p>
          <p className="text-sm text-gray-500 mt-1">Healthy SKUs</p>
        </div>
        
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <CheckCircle className="text-blue-500" size={20} />
          </div>
          <p className="text-2xl font-semibold text-gray-900">78%</p>
          <p className="text-sm text-gray-500 mt-1">Resolution rate</p>
        </div>
      </div>

      {/* Placeholder for main content - we'll move the full dashboard here next */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Your full inventory dashboard will appear here.</p>
        <p className="text-sm text-gray-400 mt-1">Navigate to Inventory to see detailed stockout tracking.</p>
      </div>
    </motion.div>
  );
}