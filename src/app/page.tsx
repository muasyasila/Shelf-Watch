"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Store, 
  Package, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import storesData from "@/lib/stores";
import skusData from "@/lib/skus";
import inventoryData from "@/lib/inventory";

// Helper function to determine stock status
function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return { status: "critical", label: "Out of stock", color: "bg-red-100 text-red-700" };
  if (stock < threshold * 0.5) return { status: "critical", label: "Critical", color: "bg-red-100 text-red-700" };
  if (stock < threshold) return { status: "risk", label: "At risk", color: "bg-yellow-100 text-yellow-700" };
  return { status: "ok", label: "Healthy", color: "bg-green-100 text-green-700" };
}

export default function Home() {
  const [storeFilter, setStoreFilter] = useState<number | "all">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "critical" | "risk" | "ok">("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [animatedNumbers, setAnimatedNumbers] = useState({ critical: 0, risk: 0 });
  
  // Calculate real stats from data
  const getStats = () => {
    let critical = 0;
    let risk = 0;
    
    inventoryData.forEach(item => {
      const sku = skusData.find(s => s.id === item.skuId);
      if (sku && item.stock < sku.reorderPoint) {
        const percentage = (item.stock / sku.reorderPoint) * 100;
        if (percentage < 50) {
          critical++;
        } else {
          risk++;
        }
      }
    });
    
    return { critical, risk, total: inventoryData.length };
  };
  
  const stats = getStats();
  
  // Animate numbers on load and refresh
  useEffect(() => {
    let startTime: number;
    const duration = 800;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimatedNumbers({
        critical: Math.floor(stats.critical * progress),
        risk: Math.floor(stats.risk * progress),
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [stats.critical, stats.risk, refreshKey]);
  
  // Generate filtered inventory for the table
  const getFilteredInventory = () => {
    // Join inventory with store and SKU data
    let items = inventoryData.map(item => {
      const store = storesData.find(s => s.id === item.storeId);
      const sku = skusData.find(s => s.id === item.skuId);
      const statusInfo = getStockStatus(item.stock, sku?.reorderPoint || 0);
      
      return {
        storeName: store?.name || "Unknown",
        storeLocation: store?.location || "Unknown",
        storeRegion: store?.region || "Unknown",
        skuName: sku?.name || "Unknown",
        skuId: item.skuId,
        stock: item.stock,
        threshold: sku?.reorderPoint || 0,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
      };
    });
    
    // Apply store filter
    if (storeFilter !== "all") {
      const store = storesData.find(s => s.id === storeFilter);
      items = items.filter(item => item.storeName === store?.name);
    }
    
    // Apply risk filter
    if (riskFilter !== "all") {
      items = items.filter(item => item.status === riskFilter);
    }
    
    return items;
  };
  
  const filteredInventory = getFilteredInventory();
  
  // Calculate store health scores
  const getStoreHealth = (storeId: number) => {
    const storeItems = inventoryData.filter(item => item.storeId === storeId);
    let healthyCount = 0;
    
    storeItems.forEach(item => {
      const sku = skusData.find(s => s.id === item.skuId);
      if (sku && item.stock >= sku.reorderPoint) {
        healthyCount++;
      }
    });
    
    return Math.round((healthyCount / storeItems.length) * 100);
  };
  
  const lastUpdated = new Date().toLocaleTimeString();
  
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <motion.main 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-[#0e2820] border-b border-white/10 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight">ShelfWatch</h1>
              <p className="text-sm text-white/60 mt-0.5">Real-time stockout intelligence</p>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={handleRefresh}
                className="text-white/70 hover:text-white transition-colors"
              >
                <RefreshCw size={18} />
              </button>
              <div className="text-right">
                <p className="text-xs text-white/50">Last update</p>
                <p className="text-sm text-white font-medium">{lastUpdated}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <Store className="text-[#0e2820] opacity-60" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{storesData.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total stores</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <Package className="text-[#0e2820] opacity-60" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{skusData.length}</p>
            <p className="text-sm text-gray-500 mt-1">Total SKUs</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <AlertCircle className="text-red-500" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{animatedNumbers.critical}</p>
            <p className="text-sm text-gray-500 mt-1">Critical stockouts</p>
          </motion.div>
          
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-3">
              <AlertTriangle className="text-yellow-500" size={20} />
            </div>
            <p className="text-2xl font-semibold text-gray-900">{animatedNumbers.risk}</p>
            <p className="text-sm text-gray-500 mt-1">At risk</p>
          </motion.div>
        </div>

        {/* Store Health Section */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Store health</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {storesData.map((store, idx) => {
              const healthScore = getStoreHealth(store.id);
              return (
                <motion.div
                  key={store.id}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <Store size={16} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-400">{store.region}</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{store.name}</h3>
                  <p className="text-xs text-gray-400 mb-4">{store.location}</p>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-500">Health score</span>
                    <span className="text-sm font-semibold text-gray-900">{healthScore}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        healthScore >= 70 ? "bg-green-500" : 
                        healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${healthScore}%` }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Filters and Table Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
            <h2 className="text-base font-semibold text-gray-900">Inventory details</h2>
            
            <div className="flex gap-3">
              {/* Store filter */}
              <select 
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e2820] cursor-pointer"
              >
                <option value="all">All stores</option>
                {storesData.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              
              {/* Risk filter */}
              <select 
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "all" | "critical" | "risk" | "ok")}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e2820] cursor-pointer"
              >
                <option value="all">All risks</option>
                <option value="critical">Critical only</option>
                <option value="risk">At risk only</option>
                <option value="ok">Healthy only</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Store</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Product</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Stock</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Threshold</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredInventory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <div className="text-gray-400 text-sm">No inventory items match your filters</div>
                      </td>
                    </tr>
                  ) : (
                    filteredInventory.map((item, idx) => (
                      <motion.tr 
                        key={`${item.storeName}-${item.skuId}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: idx * 0.01 }}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{item.storeName}</p>
                            <p className="text-xs text-gray-400">{item.storeLocation}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-gray-700">{item.skuName}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className={`text-sm font-semibold ${
                            item.status === "critical" ? "text-red-600" : 
                            item.status === "risk" ? "text-yellow-600" : "text-gray-700"
                          }`}>
                            {item.stock} units
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-gray-500">{item.threshold} units</p>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.statusColor}`}>
                            {item.statusLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button className="text-xs font-medium text-[#0e2820] hover:opacity-70 transition-opacity">
                            Assign →
                          </button>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Table footer with count */}
          <div className="mt-4 text-right">
            <p className="text-xs text-gray-400">
              Showing {filteredInventory.length} of {inventoryData.length} items
            </p>
          </div>
        </div>
      </div>
    </motion.main>
  );
}