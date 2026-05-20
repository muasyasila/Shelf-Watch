"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import { 
  FileText, 
  Download, 
  Calendar,
  Clock,
  Eye,
  Trash2,
  Share2,
  Mail,
  Plus,
  Search,
  Filter,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Package,
  Store,
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

// Generate a unique ID
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ============================================
// MAIN COMPONENT
// ============================================

export default function ReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState<"all" | "stockout" | "competitor" | "analytics">("all");
  const [generating, setGenerating] = useState(false);

  // Mock saved reports
  const [savedReports, setSavedReports] = useState([
    {
      id: generateId(),
      name: "Weekly Stockout Summary",
      type: "stockout",
      date: "2026-05-19",
      size: "245 KB",
      status: "ready",
    },
    {
      id: generateId(),
      name: "Competitor Analysis - May",
      type: "competitor",
      date: "2026-05-15",
      size: "1.2 MB",
      status: "ready",
    },
    {
      id: generateId(),
      name: "Store Performance Report",
      type: "analytics",
      date: "2026-05-10",
      size: "890 KB",
      status: "ready",
    },
    {
      id: generateId(),
      name: "Critical Stockouts Alert",
      type: "stockout",
      date: "2026-05-05",
      size: "156 KB",
      status: "ready",
    },
  ]);

  // Calculate current stats for reports
  const totalItems = inventoryData.length;
  const totalCritical = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return getStockStatus(item.stock, sku?.reorderPoint || 0) === "critical";
  }).length;
  const totalRisk = inventoryData.filter(item => {
    const sku = skusData.find(s => s.id === item.skuId);
    return getStockStatus(item.stock, sku?.reorderPoint || 0) === "risk";
  }).length;
  const overallHealthScore = totalItems === 0 ? 0 : Math.round(((totalItems - totalCritical - totalRisk) / totalItems) * 100);

  // Filter reports
  const filteredReports = savedReports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = reportType === "all" || report.type === reportType;
    return matchesSearch && matchesType;
  });

  // Generate a new report
  const generateReport = (type: "stockout" | "competitor" | "analytics") => {
    setGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const newReport = {
        id: generateId(),
        name: type === "stockout" ? "Stockout Report" :
              type === "competitor" ? "Competitor Analysis" : "Analytics Summary",
        type: type,
        date: new Date().toISOString().slice(0, 10),
        size: "~500 KB",
        status: "ready",
      };
      setSavedReports([newReport, ...savedReports]);
      setGenerating(false);
      toast.success(`${newReport.name} generated successfully`);
    }, 1500);
  };

  // Download report
  const downloadReport = (report: any) => {
    // Mock download - in real app, this would fetch the actual file
    const content = {
      reportName: report.name,
      generatedAt: report.date,
      type: report.type,
      data: {
        totalCritical,
        totalRisk,
        overallHealthScore,
        stores: storesData.length,
        skus: skusData.length,
      },
    };
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.name.toLowerCase().replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded ${report.name}`);
  };

  // Delete report
  const deleteReport = (id: string) => {
    setSavedReports(prev => prev.filter(r => r.id !== id));
    toast.success("Report deleted");
  };

  // Share report (mock)
  const shareReport = (report: any) => {
    navigator.clipboard.writeText(`${window.location.origin}/reports/${report.id}`);
    toast.success("Share link copied to clipboard");
  };

  const getReportTypeIcon = (type: string) => {
    switch(type) {
      case "stockout": return <AlertCircle size={16} className="text-red-500" />;
      case "competitor": return <TrendingUp size={16} className="text-blue-500" />;
      default: return <Package size={16} className="text-green-500" />;
    }
  };

  const getReportTypeLabel = (type: string) => {
    switch(type) {
      case "stockout": return "Stockout";
      case "competitor": return "Competitor";
      default: return "Analytics";
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-500 text-sm mt-0.5">Generate, download, and manage your reports</p>
          </div>
        </div>

        {/* Quick Generate Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.05 }}
            onClick={() => generateReport("stockout")}
            disabled={generating}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="text-red-500" size={20} />
              </div>
              <Plus size={18} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900">Stockout Report</p>
            <p className="text-xs text-gray-500 mt-1">Critical items, at-risk products, recommendations</p>
          </motion.button>

          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            onClick={() => generateReport("competitor")}
            disabled={generating}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={20} />
              </div>
              <Plus size={18} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900">Competitor Analysis</p>
            <p className="text-xs text-gray-500 mt-1">Market position, win/loss analysis, opportunities</p>
          </motion.button>

          <motion.button
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            onClick={() => generateReport("analytics")}
            disabled={generating}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-md transition-all disabled:opacity-50"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <Package className="text-green-500" size={20} />
              </div>
              <Plus size={18} className="text-gray-400" />
            </div>
            <p className="font-semibold text-gray-900">Analytics Summary</p>
            <p className="text-xs text-gray-500 mt-1">Store performance, trends, health score</p>
          </motion.button>
        </div>

        {/* Current Snapshot Card */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-gray-50 to-white rounded-2xl p-5 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Current Snapshot</h2>
            <span className="text-xs text-gray-400">Real-time data</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalCritical}</p>
              <p className="text-xs text-gray-500">Critical Stockouts</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{totalRisk}</p>
              <p className="text-xs text-gray-500">At Risk</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{storesData.length}</p>
              <p className="text-xs text-gray-500">Active Stores</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{overallHealthScore}%</p>
              <p className="text-xs text-gray-500">Health Score</p>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl w-64 focus:outline-none focus:ring-1 focus:ring-[#0e2820]"
              />
            </div>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white"
            >
              <option value="all">All Types</option>
              <option value="stockout">Stockout</option>
              <option value="competitor">Competitor</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">
            {filteredReports.length} reports available
          </p>
        </div>

        {/* Reports List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredReports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No reports found</p>
              <p className="text-xs text-gray-400 mt-1">Generate a report to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filteredReports.map((report, idx) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                        {getReportTypeIcon(report.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{report.name}</p>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                            {getReportTypeLabel(report.type)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{report.date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText size={12} className="text-gray-400" />
                            <span className="text-xs text-gray-500">{report.size}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => downloadReport(report)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => shareReport(report)}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Share"
                      >
                        <Share2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteReport(report.id)}
                        className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Schedule Section */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Schedule Reports</h2>
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Coming soon</span>
          </div>
          <p className="text-sm text-gray-500">
            Get reports delivered to your inbox automatically on a schedule.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <select className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-400 cursor-not-allowed" disabled>
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
            <button className="px-4 py-2 text-sm bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed" disabled>
              Set Schedule
            </button>
          </div>
        </motion.div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}