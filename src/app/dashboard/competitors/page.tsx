"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { 
  TrendingUp, 
  TrendingDown,
  Store, 
  Package, 
  Target,
  Trophy,
  AlertCircle,
  CheckCircle,
  Download,
  Filter,
  Search,
  ChevronRight,
  Shield,
  Zap,
  Eye,
  Minus,
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

export default function CompetitorsPage() {
  const [selectedStore, setSelectedStore] = useState<number | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"all" | "advantage" | "risk">("all");

  // Build competitor comparison data
  const comparisonData = inventoryData.map(item => {
    const store = storesData.find(s => s.id === item.storeId);
    const sku = skusData.find(s => s.id === item.skuId);
    const status = getStockStatus(item.stock, sku?.reorderPoint || 0);
    
    const yourStock = item.stock;
    const competitorStock = sku?.competitorStock || 0;
    const difference = yourStock - competitorStock;
    const advantage = difference > 0 ? "win" : difference < 0 ? "loss" : "tie";
    const advantageAmount = Math.abs(difference);
    
    return {
      storeId: item.storeId,
      storeName: store?.name || "Unknown",
      storeLocation: store?.location || "Unknown",
      skuId: item.skuId,
      skuName: sku?.name || "Unknown",
      skuCategory: sku?.category || "Unknown",
      competitorName: sku?.competitorName || "Competitor",
      yourStock,
      competitorStock,
      difference,
      advantage,
      advantageAmount,
      yourStatus: status,
      threshold: sku?.reorderPoint || 0,
    };
  });

  // Apply filters
  let filteredData = [...comparisonData];
  
  if (selectedStore !== "all") {
    filteredData = filteredData.filter(item => item.storeId === selectedStore);
  }
  
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = filteredData.filter(item => 
      item.skuName.toLowerCase().includes(query) ||
      item.storeName.toLowerCase().includes(query) ||
      item.competitorName.toLowerCase().includes(query)
    );
  }
  
  if (viewMode === "advantage") {
    filteredData = filteredData.filter(item => item.advantage === "win");
  }
  if (viewMode === "risk") {
    filteredData = filteredData.filter(item => item.advantage === "loss");
  }

  // Calculate summary stats
  const totalWins = comparisonData.filter(i => i.advantage === "win").length;
  const totalLosses = comparisonData.filter(i => i.advantage === "loss").length;
  const totalTies = comparisonData.filter(i => i.advantage === "tie").length;
  const winRate = comparisonData.length === 0 ? 0 : Math.round((totalWins / comparisonData.length) * 100);
  
  // Find opportunities (where you have low stock but competitor has high stock)
  const opportunities = comparisonData
    .filter(i => i.advantage === "loss" && i.competitorStock > i.threshold * 2)
    .slice(0, 5);
  
  // Find strengths (where you dominate)
  const strengths = comparisonData
    .filter(i => i.advantage === "win" && i.yourStock > i.threshold * 2)
    .slice(0, 5);

  // Export data
  const exportData = () => {
    const exportContent = filteredData.map(i => ({
      store: i.storeName,
      product: i.skuName,
      yourStock: i.yourStock,
      competitor: i.competitorName,
      competitorStock: i.competitorStock,
      advantage: i.advantage === "win" ? "You win" : i.advantage === "loss" ? "Competitor wins" : "Tie",
      difference: i.difference,
    }));
    const blob = new Blob([JSON.stringify(exportContent, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `competitor-analysis-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Competitor analysis exported");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Intelligence</h1>
            <p className="text-gray-500 text-sm mt-0.5">See how you stack up against competitors</p>
          </div>
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
          >
            <Download size={16} className="text-gray-500" />
            Export Analysis
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Trophy className="text-green-600" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalWins}</p>
            <p className="text-sm text-gray-500">Products where you lead</p>
            <div className="mt-2 text-xs text-green-600">{winRate}% win rate</div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <Target className="text-red-600" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalLosses}</p>
            <p className="text-sm text-gray-500">Products where competitor leads</p>
            <div className="mt-2 text-xs text-red-600">Opportunities to capture</div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                <Package className="text-gray-600" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{totalTies}</p>
            <p className="text-sm text-gray-500">Products where you're tied</p>
            <div className="mt-2 text-xs text-gray-500">Room to differentiate</div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Shield className="text-blue-600" size={20} />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{opportunities.length}</p>
            <p className="text-sm text-gray-500">High-value opportunities</p>
            <div className="mt-2 text-xs text-blue-600">Ready to capture</div>
          </motion.div>
        </div>

        {/* Opportunities Section */}
        {opportunities.length > 0 && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="text-blue-600" size={20} />
                <h2 className="font-semibold text-gray-900">High-Value Opportunities</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  Act now
                </span>
              </div>
            </div>
            <div className="space-y-3">
              {opportunities.map((opp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{opp.skuName}</p>
                    <p className="text-xs text-gray-500">{opp.storeName} • Competitor: {opp.competitorName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-red-600">-{opp.advantageAmount} units</p>
                    <p className="text-xs text-gray-400">Competitor leads by {opp.advantageAmount}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products or stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-1 focus:ring-[#0e2820]"
                />
              </div>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
              >
                <option value="all">All Stores</option>
                {storesData.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode("all")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  viewMode === "all" ? "bg-[#0e2820] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setViewMode("advantage")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  viewMode === "advantage" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Advantage
              </button>
              <button
                onClick={() => setViewMode("risk")}
                className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                  viewMode === "risk" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                At Risk
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Store</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Your Stock</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Competitor</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Competitor Stock</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No competitor data found</p>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <p className="font-medium text-gray-900">{item.skuName}</p>
                        <p className="text-xs text-gray-400">{item.skuCategory}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">{item.storeName}</p>
                        <p className="text-xs text-gray-400">{item.storeLocation}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className={`text-sm font-semibold ${
                          item.yourStatus === "critical" ? "text-red-600" :
                          item.yourStatus === "risk" ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {item.yourStock} units
                        </p>
                        {item.yourStock < item.threshold && (
                          <p className="text-xs text-red-500">Below threshold</p>
                        )}
                       </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-700">{item.competitorName}</p>
                       </td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-700">{item.competitorStock} units</p>
                       </td>
                      <td className="px-5 py-4">
                        {item.advantage === "win" ? (
                          <div className="flex items-center gap-1">
                            <TrendingUp size={14} className="text-green-500" />
                            <span className="text-sm font-medium text-green-600">+{item.advantageAmount} advantage</span>
                          </div>
                        ) : item.advantage === "loss" ? (
                          <div className="flex items-center gap-1">
                            <TrendingDown size={14} className="text-red-500" />
                            <span className="text-sm font-medium text-red-600">-{item.advantageAmount} behind</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Minus size={14} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Tied</span>
                          </div>
                        )}
                       </td>
                      <td className="px-5 py-4">
                        {item.advantage === "loss" && (
                          <button className="text-xs font-medium bg-[#dbfe7a] text-[#0e2820] px-3 py-1.5 rounded-lg hover:bg-[#c8ed6a] transition-all">
                            Respond
                          </button>
                        )}
                        {item.advantage === "win" && (
                          <button className="text-xs font-medium text-gray-400 cursor-default">
                            Protected
                          </button>
                        )}
                        {item.advantage === "tie" && (
                          <button className="text-xs font-medium text-blue-600 hover:text-blue-800">
                            Differentiate →
                          </button>
                        )}
                       </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <p>Showing {filteredData.length} of {comparisonData.length} comparisons</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>You lead</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span>Competitor leads</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Tied</span>
            </div>
          </div>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}