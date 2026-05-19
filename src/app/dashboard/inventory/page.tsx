"use client";

import { useState } from "react";
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
  Download,
  Mail,
  Filter,
  ChevronDown,
  HelpCircle,
} from "lucide-react";
import storesData from "@/lib/stores";
import skusData from "@/lib/skus";
import inventoryData from "@/lib/inventory";
import OnboardingTour from "@/components/OnboardingTour";

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function getDaysUntilStockout(stock: number, dailySalesRate: number, salesIncreasePercent: number = 0) {
  if (dailySalesRate === 0) return "N/A";
  const adjustedRate = dailySalesRate * (1 + salesIncreasePercent / 100);
  const days = Math.floor(stock / adjustedRate);
  if (days <= 0) return "Out of stock";
  if (days === 1) return "1 day";
  return `${days} days`;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function InventoryPage() {
  // Filters
  const [storeFilter, setStoreFilter] = useState<number | "all">("all");
  const [riskFilter, setRiskFilter] = useState<"all" | "critical" | "risk" | "ok">("all");
  const [salesIncreasePercent, setSalesIncreasePercent] = useState(0);
  const [showCompetitor, setShowCompetitor] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Tracking
  const [resolvedItems, setResolvedItems] = useState<Set<string>>(new Set());
  const [inProgressItems, setInProgressItems] = useState<Set<string>>(new Set());
  const [sentAlerts, setSentAlerts] = useState<string[]>([]);
  
  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [dispatchQuantity, setDispatchQuantity] = useState(50);
  
  // Refresh
  const [refreshKey, setRefreshKey] = useState(0);

  // ============================================
  // TRACKING HELPERS
  // ============================================

  const getItemTrackingStatus = (itemKey: string) => {
    if (resolvedItems.has(itemKey)) return { status: "resolved", label: "Resolved", color: "bg-green-100 text-green-700", icon: <CheckCircle size={14} className="text-green-600" /> };
    if (inProgressItems.has(itemKey)) return { status: "in-progress", label: "In Progress", color: "bg-blue-100 text-blue-700", icon: <Clock size={14} className="text-blue-600" /> };
    return { status: "pending", label: "Pending", color: "bg-orange-100 text-orange-700", icon: <AlertCircle size={14} className="text-orange-600" /> };
  };

  const markInProgress = (itemKey: string) => {
    setInProgressItems(prev => new Set(prev).add(itemKey));
    toast.success("Stock dispatch marked as In Progress");
  };

  const markResolved = (itemKey: string) => {
    setResolvedItems(prev => new Set(prev).add(itemKey));
    setInProgressItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemKey);
      return newSet;
    });
    toast.success("Stockout marked as Resolved");
  };

  // ============================================
  // DATA PROCESSING
  // ============================================

  const getFilteredInventory = () => {
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
    
    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.skuName.toLowerCase().includes(query) ||
        item.storeName.toLowerCase().includes(query)
      );
    }
    
    return items;
  };

  const filteredInventory = getFilteredInventory();

  // Stats
  const criticalCount = filteredInventory.filter(i => i.status === "critical").length;
  const riskCount = filteredInventory.filter(i => i.status === "risk").length;
  const healthyCount = filteredInventory.filter(i => i.status === "ok").length;
  const pendingCount = filteredInventory.filter(i => i.trackingStatus === "pending").length;
  const inProgressCount = filteredInventory.filter(i => i.trackingStatus === "in-progress").length;
  const resolvedCount = filteredInventory.filter(i => i.trackingStatus === "resolved").length;
  const resolutionRate = filteredInventory.length === 0 ? 0 : Math.round((resolvedCount / filteredInventory.length) * 100);

  // ============================================
  // ACTIONS
  // ============================================

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
    markInProgress(selectedItem.itemKey);
    
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const sendSMSAlert = (item: any) => {
    console.log("SMS sent to store manager:", {
      to: `+2547XX XXX ${item.storeName.slice(0, 4)}`,
      message: `ALERT: ${item.storeName} has ${item.stock} units of ${item.skuName} remaining`,
      timestamp: new Date().toISOString(),
    });
    
    const alertKey = `${item.storeName}-${item.skuName}-${Date.now()}`;
    setSentAlerts(prev => [alertKey, ...prev].slice(0, 5));
    toast.success(`SMS alert sent to ${item.storeName} manager`);
  };

  const exportToExcel = () => {
    const headers = ["Store", "Product", "Stock", "Daily Sales", "Days Until Stockout", "Status", "Resolution"];
    const rows = filteredInventory.map(item => [
      item.storeName,
      item.skuName,
      item.stock,
      item.dailySalesRate,
      item.daysUntilStockout,
      item.statusLabel,
      item.trackingLabel,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shelfwatch-export-${new Date().toISOString().slice(0, 19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  };

  const emailReport = () => {
    const subject = encodeURIComponent("ShelfWatch Stockout Report");
    const body = encodeURIComponent(`
ShelfWatch Stockout Report
Generated: ${new Date().toLocaleString()}

Summary:
- Critical Stockouts: ${criticalCount}
- At Risk: ${riskCount}
- Resolution Rate: ${resolutionRate}%

Top Critical Items:
${filteredInventory.filter(i => i.status === "critical").slice(0, 5).map(i => `- ${i.storeName}: ${i.skuName} (${i.stock} units left, ${i.daysUntilStockout})`).join("\n")}

View full dashboard: ${window.location.href}
    `);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    toast.success("Opening email client...");
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    toast.success("Data refreshed");
  };

  const startTour = () => {
    localStorage.removeItem("shelfwatch_tour_completed");
    localStorage.removeItem("shelfwatch_tour_shown");
    window.location.href = "/dashboard/inventory?tour=true";
  };

  const lastUpdated = new Date().toLocaleTimeString();

  return (
    <>
      <OnboardingTour />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Intelligence</h1>
            <p className="text-gray-500 text-sm mt-1">Real-time stockout tracking and predictive analytics</p>
          </div>
          <div className="flex items-center gap-3 tour-export">
            <button
              id="tour-restart-button"
              onClick={startTour}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#0e2820] text-white rounded-lg hover:bg-[#1a4a38] transition-all tour-restart-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Tour
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Download size={16} />
              Export
            </button>
            <button
              onClick={emailReport}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Mail size={16} />
              Email Report
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-[#0e2820] text-white rounded-lg hover:bg-[#1a4a38] transition-all"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 tour-stats">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="text-red-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{criticalCount}</p>
            <p className="text-sm text-gray-500">Critical Stockouts</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle className="text-yellow-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{riskCount}</p>
            <p className="text-sm text-gray-500">At Risk</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Package className="text-green-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{healthyCount}</p>
            <p className="text-sm text-gray-500">Healthy SKUs</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="text-blue-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{resolutionRate}%</p>
            <p className="text-sm text-gray-500">Resolution Rate</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <Clock className="text-purple-500" size={18} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{pendingCount + inProgressCount}</p>
            <p className="text-sm text-gray-500">Open Actions</p>
          </div>
        </div>

        {/* Filters Bar with Search */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 tour-filters">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Search Input */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products or stores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg w-64 focus:outline-none focus:ring-1 focus:ring-[#0e2820]"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <Filter size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">Filters:</span>
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e2820]"
              >
                <option value="all">All Stores</option>
                {storesData.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "all" | "critical" | "risk" | "ok")}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#0e2820]"
              >
                <option value="all">All Risks</option>
                <option value="critical">Critical Only</option>
                <option value="risk">At Risk Only</option>
                <option value="ok">Healthy Only</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group tour-competitor">
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={showCompetitor}
                    onChange={(e) => setShowCompetitor(e.target.checked)}
                    className="rounded border-gray-300 text-[#0e2820] focus:ring-[#0e2820]"
                  />
                  Show Competitor Data
                  <div className="w-4 h-4 rounded-full bg-gray-200 text-gray-500 text-xs inline-flex items-center justify-center cursor-help">
                    ?
                  </div>
                </label>
                <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10">
                  <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap">
                    See how your stock compares to competitors
                    <br />
                    <span className="text-gray-400">Green = Advantage | Red = Risk</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 tour-simulator">
                <span className="text-xs text-gray-500">Sales Increase:</span>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={salesIncreasePercent}
                  onChange={(e) => setSalesIncreasePercent(Number(e.target.value))}
                  className="w-32 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#0e2820]"
                />
                <span className="text-sm font-medium text-[#0e2820]">{salesIncreasePercent}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Messaging / Alerts Panel */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 tour-alerts">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Send size={16} className="text-[#0e2820]" />
              <h3 className="font-semibold text-gray-900">Recent Alerts</h3>
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                {sentAlerts.length} sent
              </span>
            </div>
            <button 
              onClick={() => setSentAlerts([])}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Clear all
            </button>
          </div>
          
          {sentAlerts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Send size={20} className="text-gray-400" />
              </div>
              <p className="text-sm text-gray-500">No alerts sent yet</p>
              <p className="text-xs text-gray-400 mt-1">Click the SMS button on any row to send an alert</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sentAlerts.slice(0, 5).map((alert, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={12} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-700">
                      {alert.startsWith('dispatch-') 
                        ? `Dispatch order created for ${alert.split('-')[1]}`
                        : `SMS alert sent to ${alert.split('-')[0]}`
                      }
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {idx === 0 ? "Just now" : "Earlier"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Quick actions:</span>
              <div className="flex gap-2">
                <button className="text-[#0e2820] hover:underline">Send test alert</button>
                <button className="text-[#0e2820] hover:underline">View history</button>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden tour-table">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Store</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Product</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Stock</th>
                  {showCompetitor && (
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Competitor</th>
                  )}
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Daily Sales</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Days Left</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Resolution</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={showCompetitor ? 9 : 8} className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No inventory items match your filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900">{item.storeName}</p>
                        <p className="text-xs text-gray-400">{item.storeLocation}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700">{item.skuName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${
                          item.status === "critical" ? "text-red-600" : 
                          item.status === "risk" ? "text-yellow-600" : "text-gray-700"
                        }`}>
                          {item.stock} units
                        </p>
                      </td>
                      {showCompetitor && (
                        <td className="px-4 py-3">
                          <p className={`text-sm font-semibold ${
                            item.stock > item.competitorStock ? "text-green-600" :
                            item.stock < item.competitorStock ? "text-red-600" : "text-gray-600"
                          }`}>
                            {item.competitorStock} units
                          </p>
                          <p className="text-xs text-gray-400">{item.competitorName}</p>
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600">{item.dailySalesRate}/day</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-semibold ${
                          item.daysUntilStockout === "Out of stock" ? "text-red-600" :
                          item.daysUntilStockout === "1 day" ? "text-orange-500" :
                          item.daysUntilStockout === "N/A" ? "text-gray-400" :
                          parseInt(item.daysUntilStockout) <= 2 ? "text-red-600" :
                          parseInt(item.daysUntilStockout) <= 5 ? "text-yellow-600" : "text-green-600"
                        }`}>
                          {item.daysUntilStockout}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${item.statusColor}`}>
                          {item.statusLabel}
                        </span>
                      </td>
                      <td className="px-4 py-3 tour-resolution">
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
                              Start
                            </button>
                          )}
                          {item.trackingStatus === "in-progress" && (
                            <button
                              onClick={() => markResolved(item.itemKey)}
                              className="text-xs text-green-600 hover:text-green-800 text-left flex items-center gap-1"
                            >
                              <CheckSquare size={12} />
                              Resolve
                            </button>
                          )}
                          {item.trackingStatus === "resolved" && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <CheckCircle size={12} />
                              Done
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => sendSMSAlert(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tour-sms"
                            title="Send SMS Alert"
                          >
                            <Send size={14} />
                          </button>
                          <button
                            onClick={() => handleDispatch(item)}
                            className="px-3 py-1.5 text-xs font-medium bg-[#dbfe7a] text-[#0e2820] rounded-lg hover:bg-[#c8ed6a] transition-all tour-dispatch"
                          >
                            Dispatch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <p>Showing {filteredInventory.length} of {inventoryData.length} items</p>
          <p>Last updated: {lastUpdated}</p>
        </div>
      </div>

      {/* Dispatch Modal */}
      {isModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
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
                <p className="font-semibold text-red-600">{selectedItem.stock} units ({selectedItem.daysUntilStockout} remaining)</p>
              </div>
              <div className="mb-4">
                <label className="text-sm text-gray-500 block mb-2">Quantity to Dispatch</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDispatchQuantity(Math.max(10, dispatchQuantity - 10))}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >-</button>
                  <input
                    type="number"
                    value={dispatchQuantity}
                    onChange={(e) => setDispatchQuantity(Number(e.target.value))}
                    className="w-24 text-center px-3 py-1 border border-gray-200 rounded-lg"
                  />
                  <button
                    onClick={() => setDispatchQuantity(dispatchQuantity + 10)}
                    className="px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >+</button>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmDispatch}
                className="px-4 py-2 text-sm font-medium bg-[#dbfe7a] text-[#0e2820] rounded-lg hover:bg-[#c8ed6a]"
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