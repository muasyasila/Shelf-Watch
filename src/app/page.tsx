"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { 
  Store, 
  Package, 
  AlertTriangle, 
  AlertCircle,
  RefreshCw,
  TrendingUp,
  Target,
  Send,
  CheckCircle,
  Clock,
  PlayCircle,
  CheckSquare,
  BarChart3,
} from "lucide-react";
import storesData from "@/lib/stores";
import skusData from "@/lib/skus";
import inventoryData from "@/lib/inventory";

// Helper function to determine stock status based on days remaining (for simulator)
function getStockStatusFromDays(daysUntilStockout: string) {
  if (daysUntilStockout === "Out of stock" || daysUntilStockout === "0 days") {
    return { status: "critical", label: "Out of stock", color: "bg-red-100 text-red-700" };
  }
  if (daysUntilStockout === "1 day") {
    return { status: "critical", label: "Critical", color: "bg-red-100 text-red-700" };
  }
  if (daysUntilStockout === "2 days" || daysUntilStockout === "3 days") {
    return { status: "risk", label: "At risk", color: "bg-yellow-100 text-yellow-700" };
  }
  return { status: "ok", label: "Healthy", color: "bg-green-100 text-green-700" };
}

// Helper function to determine stock status from threshold
function getStockStatus(stock: number, threshold: number) {
  if (stock === 0) return { status: "critical", label: "Out of stock", color: "bg-red-100 text-red-700" };
  if (stock < threshold * 0.5) return { status: "critical", label: "Critical", color: "bg-red-100 text-red-700" };
  if (stock < threshold) return { status: "risk", label: "At risk", color: "bg-yellow-100 text-yellow-700" };
  return { status: "ok", label: "Healthy", color: "bg-green-100 text-green-700" };
}

// Helper function to calculate days until stockout with sales increase factor
function getDaysUntilStockout(stock: number, dailySalesRate: number, salesIncreasePercent: number = 0) {
  if (dailySalesRate === 0) return "N/A";
  const adjustedRate = dailySalesRate * (1 + salesIncreasePercent / 100);
  const days = Math.floor(stock / adjustedRate);
  if (days <= 0) return "Out of stock";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function Home() {
  const [storeFilter, setStoreFilter] = useState<number | "all">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "critical" | "risk" | "ok">("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [animatedNumbers, setAnimatedNumbers] = useState({ critical: 0, risk: 0 });
  
  // Modal state for dispatch feature
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dispatchQuantity, setDispatchQuantity] = useState(50);
  
  // SMS Alert Panel state
  const [showAlertPanel, setShowAlertPanel] = useState(true);
  const [sentAlerts, setSentAlerts] = useState<string[]>([]);
  
  // "What If" Simulator state
  const [salesIncreasePercent, setSalesIncreasePercent] = useState(0);
  
  // Competitor Intelligence state
  const [showCompetitor, setShowCompetitor] = useState(false);
  
  // Closed Loop Tracking state
  const [resolvedItems, setResolvedItems] = useState<Set<string>>(new Set());
  const [inProgressItems, setInProgressItems] = useState<Set<string>>(new Set());
  
  // Helper function to get the current status of an item
  const getItemTrackingStatus = (itemKey: string) => {
    if (resolvedItems.has(itemKey)) return { status: "resolved", label: "Resolved", color: "bg-green-100 text-green-700", icon: <CheckCircle size={14} className="text-green-600" /> };
    if (inProgressItems.has(itemKey)) return { status: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700", icon: <Clock size={14} className="text-blue-600" /> };
    return { status: "pending", label: "Pending", color: "bg-orange-100 text-orange-700", icon: <AlertCircle size={14} className="text-orange-600" /> };
  };

  // Mark an item as In Progress (after dispatch)
  const markInProgress = (itemKey: string) => {
    setInProgressItems(prev => new Set(prev).add(itemKey));
    toast.success("Stock dispatch marked as In Progress");
  };

  // Mark an item as Resolved
  const markResolved = (itemKey: string) => {
    setResolvedItems(prev => new Set(prev).add(itemKey));
    setInProgressItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemKey);
      return newSet;
    });
    toast.success("Stockout marked as Resolved");
  };
  
  // Generate filtered inventory for the table (WITH simulator)
  const getFilteredInventoryWithSimulator = () => {
    let items = inventoryData.map(item => {
      const store = storesData.find(s => s.id === item.storeId);
      const sku = skusData.find(s => s.id === item.skuId);
      const daysUntilStockout = getDaysUntilStockout(item.stock, sku?.dailySalesRate || 0, salesIncreasePercent);
      const statusInfo = getStockStatusFromDays(daysUntilStockout);
      const itemKey = `${store?.name}-${sku?.name}`;
      const trackingStatus = getItemTrackingStatus(itemKey);
      
      return {
        storeName: store?.name || "Unknown",
        storeLocation: store?.location || "Unknown",
        storeRegion: store?.region || "Unknown",
        skuName: sku?.name || "Unknown",
        skuId: item.skuId,
        stock: item.stock,
        threshold: sku?.reorderPoint || 0,
        dailySalesRate: sku?.dailySalesRate || 0,
        daysUntilStockout: daysUntilStockout,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        competitorStock: sku?.competitorStock || 0,
        competitorName: sku?.competitorName || "Competitor",
        itemKey: itemKey,
        trackingStatus: trackingStatus.status,
        trackingLabel: trackingStatus.label,
        trackingColor: trackingStatus.color,
        trackingIcon: trackingStatus.icon,
      };
    });
    
    if (storeFilter !== "all") {
      const store = storesData.find(s => s.id === storeFilter);
      items = items.filter(item => item.storeName === store?.name);
    }
    
    if (riskFilter !== "all") {
      items = items.filter(item => item.status === riskFilter);
    }
    
    return items;
  };
  
  // Generate filtered inventory WITHOUT simulator (for static displays)
  const getFilteredInventoryStatic = () => {
    let items = inventoryData.map(item => {
      const store = storesData.find(s => s.id === item.storeId);
      const sku = skusData.find(s => s.id === item.skuId);
      const statusInfo = getStockStatus(item.stock, sku?.reorderPoint || 0);
      const daysUntilStockout = getDaysUntilStockout(item.stock, sku?.dailySalesRate || 0, 0);
      const itemKey = `${store?.name}-${sku?.name}`;
      const trackingStatus = getItemTrackingStatus(itemKey);
      
      return {
        storeName: store?.name || "Unknown",
        storeLocation: store?.location || "Unknown",
        storeRegion: store?.region || "Unknown",
        skuName: sku?.name || "Unknown",
        skuId: item.skuId,
        stock: item.stock,
        threshold: sku?.reorderPoint || 0,
        dailySalesRate: sku?.dailySalesRate || 0,
        daysUntilStockout: daysUntilStockout,
        status: statusInfo.status,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        competitorStock: sku?.competitorStock || 0,
        competitorName: sku?.competitorName || "Competitor",
        itemKey: itemKey,
        trackingStatus: trackingStatus.status,
        trackingLabel: trackingStatus.label,
        trackingColor: trackingStatus.color,
        trackingIcon: trackingStatus.icon,
      };
    });
    
    if (storeFilter !== "all") {
      const store = storesData.find(s => s.id === storeFilter);
      items = items.filter(item => item.storeName === store?.name);
    }
    
    if (riskFilter !== "all") {
      items = items.filter(item => item.status === riskFilter);
    }
    
    return items;
  };
  
  const filteredInventory = getFilteredInventoryWithSimulator();
  const staticInventory = getFilteredInventoryStatic();
  
  // Calculate dynamic stats based on simulator
  const getDynamicStats = () => {
    let critical = 0;
    let risk = 0;
    
    inventoryData.forEach(item => {
      const sku = skusData.find(s => s.id === item.skuId);
      const daysUntilStockout = getDaysUntilStockout(item.stock, sku?.dailySalesRate || 0, salesIncreasePercent);
      if (daysUntilStockout === "Out of stock" || daysUntilStockout === "0 days" || daysUntilStockout === "1 day") {
        critical++;
      } else if (daysUntilStockout === "2 days" || daysUntilStockout === "3 days") {
        risk++;
      }
    });
    
    return { critical, risk };
  };
  
  const dynamicStats = getDynamicStats();
  
  // Animate numbers on load and when simulator changes
  useEffect(() => {
    let startTime: number;
    const duration = 500;
    
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimatedNumbers({
        critical: Math.floor(dynamicStats.critical * progress),
        risk: Math.floor(dynamicStats.risk * progress),
      });
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [dynamicStats.critical, dynamicStats.risk, refreshKey, salesIncreasePercent]);
  
  // Calculate store health scores (static, based on threshold)
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

  const handleDispatch = (item: any) => {
    setSelectedItem(item);
    setDispatchQuantity(Math.max(item.threshold * 2, 50));
    setIsModalOpen(true);
  };

  const confirmDispatch = () => {
    console.log("Dispatch order created:", {
      store: selectedItem.storeName,
      product: selectedItem.skuName,
      quantity: dispatchQuantity,
      priority: selectedItem.daysUntilStockout === "1 day" ? "URGENT" : "Normal",
      timestamp: new Date().toISOString(),
    });
    
    toast.success(`Dispatched ${dispatchQuantity} units of ${selectedItem.skuName} to ${selectedItem.storeName}`);
    
    const alertKey = `dispatch-${selectedItem.storeName}-${selectedItem.skuName}-${Date.now()}`;
    setSentAlerts(prev => [alertKey, ...prev].slice(0, 5));
    
    // Mark as in progress automatically
    const itemKey = `${selectedItem.storeName}-${selectedItem.skuName}`;
    markInProgress(itemKey);
    
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const sendSMSAlert = (item: any) => {
    const alertMessage = `STOCKOUT ALERT: ${item.storeName} has ${item.stock} units of ${item.skuName} remaining (${item.daysUntilStockout} left). Dispatch immediately to prevent lost sales.`;
    
    console.log("SMS sent to store manager:", {
      to: `+2547XX XXX ${item.storeName.slice(0, 4)}`,
      message: alertMessage,
      timestamp: new Date().toISOString(),
    });
    
    const alertKey = `${item.storeName}-${item.skuName}-${Date.now()}`;
    setSentAlerts(prev => [alertKey, ...prev].slice(0, 5));
    
    toast.success(`SMS alert sent to ${item.storeName} manager`);
  };

  // Calculate tracking stats
  const pendingCount = filteredInventory.filter(i => i.trackingStatus === "pending").length;
  const inProgressCount = filteredInventory.filter(i => i.trackingStatus === "in-progress").length;
  const resolvedCount = filteredInventory.filter(i => i.trackingStatus === "resolved").length;
  const resolutionRate = filteredInventory.length === 0 ? 0 : Math.round((resolvedCount / filteredInventory.length) * 100);

  return (
    <>
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
              {salesIncreasePercent > 0 && (
                <p className="text-xs text-red-400 mt-1">
                  ↑ {dynamicStats.critical - (staticInventory.filter(i => i.status === "critical").length)} from normal
                </p>
              )}
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
              {salesIncreasePercent > 0 && (
                <p className="text-xs text-yellow-400 mt-1">
                  ↑ {dynamicStats.risk - (staticInventory.filter(i => i.status === "risk").length)} from normal
                </p>
              )}
            </motion.div>
          </div>

          {/* Closed Loop Summary Card */}
          <div className="mb-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.22 }}
              className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 shadow-sm border border-blue-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <BarChart3 size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Closed Loop Tracking</h3>
                    <p className="text-sm text-gray-600">Detect → Act → Track → Resolve</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{pendingCount}</p>
                    <p className="text-xs text-gray-500">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{inProgressCount}</p>
                    <p className="text-xs text-gray-500">In Progress</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                    <p className="text-xs text-gray-500">Resolved</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-xs text-gray-500">Resolution rate</p>
                  <p className="text-lg font-bold text-gray-900">{resolutionRate}%</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${resolutionRate}%` }}
                />
              </div>
            </motion.div>
          </div>

          {/* "What If" Simulator */}
          <div className="mb-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="bg-gradient-to-r from-[#0e2820] to-[#1a4a38] rounded-xl p-5 shadow-sm"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={20} className="text-white" />
                    <h3 className="text-white font-semibold">"What If" Simulator</h3>
                    <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">Pro</span>
                  </div>
                  <p className="text-white/70 text-sm">
                    Sales increase by <span className="text-[#dbfe7a] font-bold">{salesIncreasePercent}%</span>
                  </p>
                </div>
                
                <div className="flex-1">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="5"
                    value={salesIncreasePercent}
                    onChange={(e) => setSalesIncreasePercent(Number(e.target.value))}
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#dbfe7a]"
                  />
                  <div className="flex justify-between text-white/50 text-xs mt-1">
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                    <span>30%</span>
                    <span>40%</span>
                    <span>50%</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-white/50 text-xs">Impact</p>
                  <p className="text-[#dbfe7a] font-semibold text-sm">
                    {salesIncreasePercent === 0 ? "Current forecast" : 
                     salesIncreasePercent <= 20 ? "Critical stockouts increased" :
                     salesIncreasePercent <= 40 ? "Major stockout risk" : "Severe stockout crisis"}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Competitor Intelligence Toggle */}
          <div className="mb-10">
            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.27 }}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-100"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0e2820] rounded-full flex items-center justify-center">
                    <Target size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Competitor Intelligence</h3>
                    <p className="text-sm text-gray-500">See how your stock compares to competitors</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500">Off</span>
                  <button
                    onClick={() => setShowCompetitor(!showCompetitor)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showCompetitor ? "bg-[#0e2820]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showCompetitor ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-500">On</span>
                  {showCompetitor && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      Intelligence Active
                    </span>
                  )}
                </div>
              </div>
              
              {showCompetitor && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100"
                >
                  <p className="text-xs text-blue-700">
                    Showing competitor stock levels. <span className="font-semibold">Green highlight</span> = You have more stock than competitor (advantage). 
                    <span className="font-semibold text-red-600"> Red highlight</span> = Competitor has more stock than you (risk).
                  </p>
                </motion.div>
              )}
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
                    {salesIncreasePercent > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-400">If +{salesIncreasePercent}% sales</p>
                          <p className={`text-xs font-medium ${
                            healthScore - salesIncreasePercent/2 < 40 ? "text-red-500" :
                            healthScore - salesIncreasePercent/2 < 60 ? "text-yellow-500" :
                            "text-green-500"
                          }`}>
                            {Math.max(0, Math.min(100, healthScore - Math.floor(salesIncreasePercent/2)))}%
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* SMS Alert Panel */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-gray-600" />
                <h2 className="text-base font-semibold text-gray-900">Stockout Alerts</h2>
                <button 
                  onClick={() => setShowAlertPanel(!showAlertPanel)}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  {showAlertPanel ? "Hide" : "Show"}
                </button>
              </div>
              {sentAlerts.length > 0 && (
                <p className="text-xs text-gray-400">{sentAlerts.length} alerts sent this session</p>
              )}
            </div>
            
            {showAlertPanel && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                  {filteredInventory.filter(item => item.status === "critical").length === 0 ? (
                    <div className="p-6 text-center">
                      <CheckCircle size={32} className="text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No critical stockouts right now</p>
                      <p className="text-xs text-gray-400 mt-1">All stores have healthy inventory levels</p>
                    </div>
                  ) : (
                    filteredInventory
                      .filter(item => item.status === "critical")
                      .map((item, idx) => (
                        <motion.div 
                          key={`alert-${idx}`}
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 hover:bg-red-50/30 transition-colors"
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                <p className="font-medium text-gray-900 text-sm">{item.storeName}</p>
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                                  {item.daysUntilStockout}
                                </span>
                              </div>
                              <p className="text-sm text-gray-700 mb-1">
                                <span className="font-medium">{item.skuName}</span> — only {item.stock} units left
                              </p>
                              <p className="text-xs text-gray-400">
                                Selling {item.dailySalesRate} units/day • Threshold: {item.threshold} units
                              </p>
                            </div>
                            <button
                              onClick={() => sendSMSAlert(item)}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                            >
                              <Send size={12} />
                              Send Alert
                            </button>
                          </div>
                        </motion.div>
                      ))
                  )}
                </div>
                
                {sentAlerts.length > 0 && (
                  <div className="bg-gray-50 border-t border-gray-100 px-4 py-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Recent alerts sent</p>
                    <div className="space-y-1">
                      {sentAlerts.slice(0, 3).map((alert, idx) => (
                        <p key={idx} className="text-xs text-gray-600">
                          <CheckCircle size={10} className="inline mr-1 text-green-500" />
                          {alert.startsWith('dispatch-') ? 'Dispatch order' : 'SMS alert'} sent {idx === 0 ? "just now" : "earlier"}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Filters and Table Section */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <h2 className="text-base font-semibold text-gray-900">Inventory details</h2>
              
              <div className="flex gap-3">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Store</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Product</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Stock</th>
                      {showCompetitor && (
                        <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Competitor Stock</th>
                      )}
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Daily Sales</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Days Until Stockout</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Resolution</th>
                      <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td colSpan={showCompetitor ? 9 : 8} className="text-center py-12">
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
                          {showCompetitor && (
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <p className={`text-sm font-semibold ${
                                  item.stock > item.competitorStock ? "text-green-600" :
                                  item.stock < item.competitorStock ? "text-red-600" :
                                  "text-gray-600"
                                }`}>
                                  {item.competitorStock} units
                                </p>
                                {item.stock > item.competitorStock ? (
                                  <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">Advantage</span>
                                ) : item.stock < item.competitorStock ? (
                                  <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Risk</span>
                                ) : null}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{item.competitorName}</p>
                            </td>
                          )}
                          <td className="px-5 py-3">
                            <p className="text-sm text-gray-600">{item.dailySalesRate} units/day</p>
                          </td>
                          <td className="px-5 py-3">
                            <p className={`text-sm font-semibold ${
                              item.daysUntilStockout === "Out of stock" ? "text-red-600" :
                              item.daysUntilStockout === "1 day" ? "text-orange-500" :
                              item.daysUntilStockout === "N/A" ? "text-gray-400" :
                              parseInt(item.daysUntilStockout) <= 2 ? "text-red-600" :
                              parseInt(item.daysUntilStockout) <= 5 ? "text-yellow-600" :
                              "text-green-600"
                            }`}>
                              {item.daysUntilStockout}
                            </p>
                          </td>
                          <td className="px-5 py-3">
                            <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.statusColor}`}>
                              {item.statusLabel}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1">
                                {item.trackingIcon}
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.trackingColor}`}>
                                  {item.trackingLabel}
                                </span>
                              </div>
                              {item.trackingStatus === "pending" && (
                                <button
                                  onClick={() => markInProgress(item.itemKey)}
                                  className="text-xs text-blue-600 hover:text-blue-800 text-left flex items-center gap-1"
                                >
                                  <PlayCircle size={12} />
                                  Start resolution
                                </button>
                              )}
                              {item.trackingStatus === "in-progress" && (
                                <button
                                  onClick={() => markResolved(item.itemKey)}
                                  className="text-xs text-green-600 hover:text-green-800 text-left flex items-center gap-1"
                                >
                                  <CheckSquare size={12} />
                                  Mark resolved
                                </button>
                              )}
                              {item.trackingStatus === "resolved" && (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle size={12} />
                                  Completed
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <button 
                              onClick={() => handleDispatch(item)}
                              className="text-xs font-medium bg-[#dbfe7a] text-[#0e2820] px-3 py-1.5 rounded-lg hover:bg-[#c8ed6a] transition-all hover:scale-105"
                            >
                              Dispatch
                            </button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="mt-4 text-right">
              <p className="text-xs text-gray-400">
                Showing {filteredInventory.length} of {inventoryData.length} items
                {salesIncreasePercent > 0 && (
                  <span className="text-[#0e2820] ml-2">
                    (Simulating {salesIncreasePercent}% sales increase)
                  </span>
                )}
                {showCompetitor && (
                  <span className="text-[#0e2820] ml-2">
                    (Competitor intelligence active)
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </motion.main>

      {/* Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            <div className="bg-[#0e2820] px-6 py-4">
              <h3 className="text-white font-semibold">Dispatch Restock Order</h3>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-500">Store</p>
                <p className="font-medium text-gray-900">{selectedItem.storeName}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium text-gray-900">{selectedItem.skuName}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">Current Stock</p>
                <p className={`font-semibold ${
                  selectedItem.stock < selectedItem.threshold * 0.5 ? "text-red-600" : "text-yellow-600"
                }`}>
                  {selectedItem.stock} units ({selectedItem.daysUntilStockout} remaining)
                </p>
              </div>
              
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2">Quantity to Dispatch</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setDispatchQuantity(Math.max(10, dispatchQuantity - 10))}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input 
                    type="number" 
                    value={dispatchQuantity}
                    onChange={(e) => setDispatchQuantity(Number(e.target.value))}
                    className="w-24 text-center px-3 py-1 border border-gray-200 rounded-lg"
                  />
                  <button 
                    onClick={() => setDispatchQuantity(dispatchQuantity + 10)}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p className="text-xs text-yellow-700">
                  This order will be prioritized. Estimated delivery: Tomorrow
                </p>
              </div>
            </div>
            
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDispatch}
                className="px-4 py-2 text-sm font-medium bg-[#dbfe7a] text-[#0e2820] rounded-lg hover:bg-[#c8ed6a] transition-colors"
              >
                Confirm Dispatch
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <Toaster position="top-right" />
    </>
  );
}