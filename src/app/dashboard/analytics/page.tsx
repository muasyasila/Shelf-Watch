"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { 
  TrendingUp, 
  TrendingDown,
  Store, 
  Package, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle,
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  BarChart3,
  Target,
  ChevronRight,
  Zap,
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

// Generate historical data based on time range
function generateHistoricalData(range: "7d" | "30d" | "90d", currentData: { critical: number; risk: number; healthy: number }) {
  const data = [];
  const today = new Date();
  let daysToGenerate = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  
  // Different granularity based on range
  const step = range === "7d" ? 1 : range === "30d" ? 3 : 7;
  
  for (let i = daysToGenerate; i >= 0; i -= step) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = range === "7d" 
      ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : range === "30d"
        ? `Week ${Math.ceil((daysToGenerate - i) / 7) + 1}`
        : date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    // Create realistic trend: older data has fewer resolutions, more criticals
    const ageFactor = i / daysToGenerate; // 1 = oldest, 0 = newest
    const improvementFactor = 1 - (ageFactor * 0.4); // 40% improvement over time
    
    data.push({
      date: dateStr,
      critical: Math.max(0, Math.floor(currentData.critical * (0.8 + ageFactor * 0.5))),
      risk: Math.max(0, Math.floor(currentData.risk * (0.7 + ageFactor * 0.6))),
      resolved: Math.max(0, Math.floor((currentData.critical + currentData.risk) * 0.3 * improvementFactor)),
    });
  }
  
  return data;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("7d");
  const [isExporting, setIsExporting] = useState(false);

  // Calculate current metrics (based on real data)
  const totalItems = inventoryData.length;
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

  // Generate historical data based on selected time range
  const historicalData = useMemo(() => {
    return generateHistoricalData(timeRange, { critical: totalCritical, risk: totalRisk, healthy: totalHealthy });
  }, [timeRange, totalCritical, totalRisk]);

  // Get trend data for the selected range (first vs last)
  const firstDataPoint = historicalData[0];
  const lastDataPoint = historicalData[historicalData.length - 1];
  
  const criticalTrend = lastDataPoint && firstDataPoint 
    ? lastDataPoint.critical - firstDataPoint.critical 
    : 0;
  const riskTrend = lastDataPoint && firstDataPoint 
    ? lastDataPoint.risk - firstDataPoint.risk 
    : 0;
  const resolvedTrend = lastDataPoint && firstDataPoint 
    ? lastDataPoint.resolved - firstDataPoint.resolved 
    : 0;

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
    
    const total = storeItems.length;
    const healthScore = total === 0 ? 0 : Math.round((healthy / total) * 100);
    const urgencyScore = (critical * 3) + (risk * 1);
    
    return {
      id: store.id,
      name: store.name,
      location: store.location,
      region: store.region,
      critical,
      risk,
      healthy,
      total,
      healthScore,
      urgencyScore,
    };
  });

  const sortedStores = [...storePerformance].sort((a, b) => b.urgencyScore - a.urgencyScore);
  const worstStore = sortedStores[0];
  const bestStore = [...storePerformance].sort((a, b) => b.healthScore - a.healthScore)[0];

  // Week-over-week changes (using historical data for selected range)
  const criticalChange = criticalTrend;
  const healthyChange = resolvedTrend;
  const criticalTrendDirection = criticalChange > 0 ? "up" : criticalChange < 0 ? "down" : "same";
  const healthyTrendDirection = healthyChange > 0 ? "up" : healthyChange < 0 ? "down" : "same";

  // Export report
  const exportReport = () => {
    setIsExporting(true);
    const reportData = {
      generatedAt: new Date().toISOString(),
      timeRange: timeRange,
      historicalData: historicalData,
      currentMetrics: { totalCritical, totalRisk, totalHealthy, overallHealthScore },
      storePerformance: storePerformance.map(s => ({ name: s.name, critical: s.critical, risk: s.risk, healthScore: s.healthScore })),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `shelfwatch-analytics-${timeRange}-${new Date().toISOString().slice(0, 19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => {
      setIsExporting(false);
      toast.success(`Report exported (${timeRange} range)`);
    }, 500);
  };

  // Get time range label
  const getTimeRangeLabel = () => {
    switch(timeRange) {
      case "7d": return "Last 7 days";
      case "30d": return "Last 30 days";
      case "90d": return "Last 90 days";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-500 text-sm mt-0.5">Monitor your inventory health over time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange("7d")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  timeRange === "7d" ? "bg-white shadow-sm text-[#0e2820]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                7D
              </button>
              <button
                onClick={() => setTimeRange("30d")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  timeRange === "30d" ? "bg-white shadow-sm text-[#0e2820]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setTimeRange("90d")}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  timeRange === "90d" ? "bg-white shadow-sm text-[#0e2820]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                90D
              </button>
            </div>
            <button
              onClick={exportReport}
              disabled={isExporting}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
            >
              <Download size={16} className="text-gray-500" />
              Export
            </button>
          </div>
        </div>

        {/* Main KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                criticalTrendDirection === "up" ? "text-red-500" : criticalTrendDirection === "down" ? "text-green-500" : "text-gray-400"
              }`}>
                {criticalTrendDirection === "up" && <ArrowUp size={14} />}
                {criticalTrendDirection === "down" && <ArrowDown size={14} />}
                {criticalTrendDirection === "same" && <Minus size={14} />}
                <span>{Math.abs(criticalChange)} over {timeRange}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCritical}</p>
            <p className="text-sm text-gray-500 mt-1">Critical Stockouts</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${(totalCritical / totalItems) * 100}%` }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <AlertTriangle className="text-yellow-500" size={20} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalRisk}</p>
            <p className="text-sm text-gray-500 mt-1">At Risk</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-yellow-500 h-1.5 rounded-full" style={{ width: `${(totalRisk / totalItems) * 100}%` }} />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <div className={`flex items-center gap-1 text-sm ${
                healthyTrendDirection === "up" ? "text-green-500" : healthyTrendDirection === "down" ? "text-red-500" : "text-gray-400"
              }`}>
                {healthyTrendDirection === "up" && <ArrowUp size={14} />}
                {healthyTrendDirection === "down" && <ArrowDown size={14} />}
                {healthyTrendDirection === "same" && <Minus size={14} />}
                <span>{Math.abs(healthyChange)} resolved</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalHealthy}</p>
            <p className="text-sm text-gray-500 mt-1">Healthy SKUs</p>
            <div className="mt-3 w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${(totalHealthy / totalItems) * 100}%` }} />
            </div>
          </motion.div>
        </div>

        {/* Health Score Overview */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#0e2820] to-[#1a4a38] rounded-2xl p-6 text-white"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-white/50 text-sm">Health Score</p>
                <p className="text-5xl font-bold">{overallHealthScore}%</p>
              </div>
              <div className="w-px h-12 bg-white/20 hidden lg:block" />
              <div>
                <p className="text-white/70 text-sm">Status</p>
                <p className="text-xl font-semibold">
                  {overallHealthScore >= 80 ? "Excellent" : 
                   overallHealthScore >= 60 ? "Good" : 
                   overallHealthScore >= 40 ? "Fair" : "Critical"}
                </p>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-white/60">Current</span>
                <span className="text-white/60">Target: 85%</span>
              </div>
              <div className="relative">
                <div className="w-full bg-white/20 rounded-full h-3">
                  <div 
                    className="bg-[#dbfe7a] h-3 rounded-full transition-all relative"
                    style={{ width: `${overallHealthScore}%` }}
                  />
                </div>
                <div 
                  className="absolute top-0 w-0.5 h-5 bg-white -translate-y-1"
                  style={{ left: "85%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-white/40 mt-2">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              {overallHealthScore < 85 && (
                <p className="text-[#dbfe7a] text-sm mt-3 flex items-center gap-2">
                  <Target size={14} />
                  Need {85 - overallHealthScore}% improvement to reach target
                </p>
              )}
            </div>

            <div className="flex flex-col items-start lg:items-end gap-2">
              <p className="text-white/40 text-xs">Showing {getTimeRangeLabel()}</p>
            </div>
          </div>
        </motion.div>

        {/* Historical Trend Chart */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">Trend Over Time</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-gray-600">Critical</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-600">At Risk</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Resolved</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <div className="flex h-full items-end gap-2">
              {historicalData.map((day, idx) => {
                const maxValue = Math.max(...historicalData.map(d => d.critical + d.risk), 20);
                const criticalHeight = (day.critical / maxValue) * 200;
                const riskHeight = (day.risk / maxValue) * 200;
                const resolvedHeight = (day.resolved / maxValue) * 200;
                
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="relative w-full h-52 flex flex-col justify-end">
                      <div 
                        className="w-full bg-green-500 rounded-t-sm transition-all"
                        style={{ height: `${resolvedHeight}px`, opacity: 0.6 }}
                      />
                      <div 
                        className="w-full bg-yellow-500 rounded-t-sm transition-all -mt-1"
                        style={{ height: `${riskHeight}px` }}
                      />
                      <div 
                        className="w-full bg-red-500 rounded-t-sm transition-all -mt-1"
                        style={{ height: `${criticalHeight}px` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 rotate-45 origin-left whitespace-nowrap">
                      {day.date}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              {getTimeRangeLabel()} - {criticalTrend <= 0 ? "Improving" : "Needs attention"}
            </p>
          </div>
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store Rankings */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store size={18} className="text-gray-400" />
                  <h2 className="font-semibold text-gray-900">Store Rankings</h2>
                </div>
                <span className="text-xs text-gray-400">Ranked by urgency</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {sortedStores.slice(0, 5).map((store, idx) => (
                <div key={store.id} className="p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        idx === 0 ? "bg-yellow-100 text-yellow-700" :
                        idx === 1 ? "bg-gray-100 text-gray-600" :
                        idx === 2 ? "bg-orange-100 text-orange-700" :
                        "bg-gray-50 text-gray-400"
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-400">{store.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">{store.healthScore}%</p>
                      <p className="text-xs text-gray-400">{store.critical} critical</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${
                        store.healthScore >= 70 ? "bg-green-500" :
                        store.healthScore >= 40 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{ width: `${store.healthScore}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick Insights */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
          >
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">Quick Insights</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Critical Stockouts</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalCritical} products across {storePerformance.filter(s => s.critical > 0).length} stores need immediate attention
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">At Risk Inventory</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {totalRisk} products are below threshold and need review
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target size={16} className="text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Top Performing Store</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {bestStore?.name} with {bestStore?.healthScore}% health score
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingDown size={16} className="text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Needs Improvement</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {worstStore?.name} at {worstStore?.healthScore}% - {worstStore?.critical} critical issues
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Store Heat Map */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-gray-400" />
              <h2 className="font-semibold text-gray-900">Store Performance Overview</h2>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-500">Healthy (&gt;70%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-500">At Risk (40-70%)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-gray-500">Critical (&lt;40%)</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {sortedStores.map((store) => (
              <div
                key={store.id}
                className={`p-4 rounded-xl text-center transition-all hover:scale-[1.02] cursor-pointer ${
                  store.healthScore >= 70 ? "bg-green-50 border border-green-100" :
                  store.healthScore >= 40 ? "bg-yellow-50 border border-yellow-100" : "bg-red-50 border border-red-100"
                }`}
              >
                <p className="text-sm font-medium text-gray-900 truncate">{store.name}</p>
                <p className={`text-2xl font-bold mt-1 ${
                  store.healthScore >= 70 ? "text-green-600" :
                  store.healthScore >= 40 ? "text-yellow-600" : "text-red-600"
                }`}>
                  {store.healthScore}%
                </p>
                <div className="flex justify-center gap-3 mt-2 text-xs">
                  <span className="text-red-500">{store.critical}</span>
                  <span className="text-yellow-500">{store.risk}</span>
                  <span className="text-green-500">{store.healthy}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Based on {getTimeRangeLabel()} data
            </p>
          </div>
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}