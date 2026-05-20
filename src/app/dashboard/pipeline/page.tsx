"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Database, 
  Zap, 
  Clock, 
  Smartphone, 
  Store, 
  Cloud,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Wifi,
  WifiOff,
  RefreshCw,
  Activity,
  BarChart3,
  Server,
  Cpu,
  HardDrive,
  TrendingUp,
  TrendingDown,
  Play,
  Pause,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

// ============================================
// TYPES
// ============================================

interface DataSource {
  id: number;
  name: string;
  integrationType: string;
  status: "active" | "syncing" | "pending" | "stale" | "error";
  lastIngestion: string;
  dataFreshness: string;
  apiEndpoint?: string;
  storeId: number;
}

interface PipelineMetric {
  name: string;
  value: number;
  unit: string;
  trend: "up" | "down" | "stable";
  change: number;
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function PipelinePage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  
  // Mock data sources with realistic integration types
  const [dataSources, setDataSources] = useState<DataSource[]>([
    {
      id: 1,
      name: "Naivas CBD",
      integrationType: "RACK POS API",
      status: "active",
      lastIngestion: "30 seconds ago",
      dataFreshness: "real-time",
      apiEndpoint: "https://api.naivas.co.ke/v1/inventory",
      storeId: 1,
    },
    {
      id: 2,
      name: "QuickMart Westlands",
      integrationType: "Direct API",
      status: "active",
      lastIngestion: "2 minutes ago",
      dataFreshness: "near real-time",
      storeId: 2,
    },
    {
      id: 3,
      name: "Carrefour Junction",
      integrationType: "Field Agent App",
      status: "pending",
      lastIngestion: "2 days ago",
      dataFreshness: "stale",
      storeId: 3,
    },
    {
      id: 4,
      name: "Tuskys Thika Road",
      integrationType: "CSV Upload",
      status: "stale",
      lastIngestion: "3 days ago",
      dataFreshness: "stale",
      storeId: 4,
    },
    {
      id: 5,
      name: "Chandarana ABC",
      integrationType: "Field Agent App",
      status: "syncing",
      lastIngestion: "1 hour ago",
      dataFreshness: "1h delay",
      storeId: 5,
    },
  ]);

  // Pipeline metrics
  const [metrics, setMetrics] = useState<PipelineMetric[]>([
    { name: "Active API Connections", value: 2, unit: "stores", trend: "stable", change: 0 },
    { name: "Data Freshness", value: 87, unit: "%", trend: "up", change: 5 },
    { name: "ETL Success Rate", value: 99.2, unit: "%", trend: "up", change: 0.3 },
    { name: "Avg Ingestion Latency", value: 45, unit: "sec", trend: "down", change: 12 },
  ]);

  // Kafka stream status
  const [kafkaStatus, setKafkaStatus] = useState({
    status: "active",
    messagesPerMinute: 1247,
    consumers: 3,
    lag: 42,
  });

  // ETL job status
  const [etlStatus, setEtlStatus] = useState({
    status: "running",
    lastRun: "2 minutes ago",
    nextRun: "in 3 minutes",
    successRate: 99.2,
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Pipeline status refreshed");
    }, 1500);
  };

  const triggerSync = (sourceId: number) => {
    toast.success(`Triggering sync for source ${sourceId}...`);
    // Simulate sync
    setTimeout(() => {
      setDataSources(prev => prev.map(s => 
        s.id === sourceId ? { ...s, status: "syncing", lastIngestion: "Just now" } : s
      ));
      toast.success("Sync completed");
    }, 2000);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case "active": return "text-green-600 bg-green-50";
      case "syncing": return "text-blue-600 bg-blue-50";
      case "pending": return "text-yellow-600 bg-yellow-50";
      case "stale": return "text-red-600 bg-red-50";
      case "error": return "text-red-600 bg-red-50";
      default: return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case "active": return <Wifi size={14} className="text-green-600" />;
      case "syncing": return <RefreshCw size={14} className="text-blue-600 animate-spin" />;
      case "pending": return <Clock size={14} className="text-yellow-600" />;
      case "stale": return <WifiOff size={14} className="text-red-600" />;
      default: return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getFreshnessColor = (freshness: string) => {
    if (freshness === "real-time") return "text-green-600";
    if (freshness.includes("delay")) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Pipeline</h1>
            <p className="text-gray-500 text-sm mt-0.5">Real-time data ingestion from stores</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-[#0e2820] text-white rounded-lg hover:bg-[#1a4a38] transition-all"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Refreshing..." : "Refresh Pipeline"}
          </button>
        </div>

        {/* Architecture Overview */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Server size={18} className="text-gray-400" />
            <h2 className="font-semibold">Data Pipeline Architecture</h2>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center">
            <div className="flex-1">
              <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Store size={20} className="text-blue-400" />
              </div>
              <p className="text-xs text-gray-400">Store POS</p>
              <p className="text-[10px] text-gray-500">Naivas, QuickMart, etc.</p>
            </div>
            <ArrowRight size={20} className="text-gray-600 hidden sm:block" />
            <div className="flex-1">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Cloud size={20} className="text-purple-400" />
              </div>
              <p className="text-xs text-gray-400">API Gateway</p>
              <p className="text-[10px] text-gray-500">REST + WebSocket</p>
            </div>
            <ArrowRight size={20} className="text-gray-600 hidden sm:block" />
            <div className="flex-1">
              <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Database size={20} className="text-orange-400" />
              </div>
              <p className="text-xs text-gray-400">Kafka Stream</p>
              <p className="text-[10px] text-gray-500">Real-time queue</p>
            </div>
            <ArrowRight size={20} className="text-gray-600 hidden sm:block" />
            <div className="flex-1">
              <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <Cpu size={20} className="text-green-400" />
              </div>
              <p className="text-xs text-gray-400">ETL Worker</p>
              <p className="text-[10px] text-gray-500">dbt + Python</p>
            </div>
            <ArrowRight size={20} className="text-gray-600 hidden sm:block" />
            <div className="flex-1">
              <div className="w-10 h-10 bg-[#dbfe7a]/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                <BarChart3 size={20} className="text-[#dbfe7a]" />
              </div>
              <p className="text-xs text-gray-400">Warehouse</p>
              <p className="text-[10px] text-gray-500">PostgreSQL</p>
            </div>
          </div>
        </div>

        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, idx) => (
            <motion.div
              key={metric.name}
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-500">{metric.name}</p>
                {metric.trend === "up" && <TrendingUp size={14} className="text-green-500" />}
                {metric.trend === "down" && <TrendingDown size={14} className="text-red-500" />}
              </div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}{metric.unit}</p>
              <p className="text-xs text-gray-400 mt-1">
                {metric.change > 0 ? `+${metric.change}` : metric.change < 0 ? `${metric.change}` : "0"} from last week
              </p>
            </motion.div>
          ))}
        </div>

        {/* Kafka & ETL Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Kafka Stream Status */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-gray-500" />
                <h2 className="font-semibold text-gray-900">Kafka Stream</h2>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(kafkaStatus.status)}`}>
                {kafkaStatus.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{kafkaStatus.messagesPerMinute}</p>
                <p className="text-xs text-gray-500">msg/min</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{kafkaStatus.consumers}</p>
                <p className="text-xs text-gray-500">consumers</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{kafkaStatus.lag}</p>
                <p className="text-xs text-gray-500">lag (msgs)</p>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-1.5">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: "98%" }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">Consumer lag: healthy</p>
          </motion.div>

          {/* ETL Job Status */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={18} className="text-gray-500" />
                <h2 className="font-semibold text-gray-900">ETL Pipeline</h2>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600">RUNNING</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last run</span>
                <span className="text-sm text-gray-900">{etlStatus.lastRun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Next run</span>
                <span className="text-sm text-gray-900">{etlStatus.nextRun}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Success rate (7d)</span>
                <span className="text-sm font-semibold text-green-600">{etlStatus.successRate}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${etlStatus.successRate}%` }} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Data Sources Table */}
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
                <h2 className="font-semibold text-gray-900">Connected Data Sources</h2>
              </div>
              <span className="text-xs text-gray-400">{dataSources.length} stores</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Store</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Integration</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Status</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Last Ingestion</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3">Data Freshness</th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dataSources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-900">{source.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {source.integrationType === "RACK POS API" && <Cloud size={14} className="text-blue-500" />}
                        {source.integrationType === "Direct API" && <Wifi size={14} className="text-green-500" />}
                        {source.integrationType === "Field Agent App" && <Smartphone size={14} className="text-purple-500" />}
                        {source.integrationType === "CSV Upload" && <Database size={14} className="text-gray-500" />}
                        <span className="text-sm text-gray-700">{source.integrationType}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(source.status)}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusColor(source.status)}`}>
                          {source.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-700">{source.lastIngestion}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${getFreshnessColor(source.dataFreshness)}`}>
                        {source.dataFreshness}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {source.status !== "active" && (
                        <button
                          onClick={() => triggerSync(source.id)}
                          className="text-xs bg-[#dbfe7a] text-[#0e2820] px-3 py-1.5 rounded-lg hover:bg-[#c8ed6a] transition-all"
                        >
                          Sync Now
                        </button>
                      )}
                      {source.status === "active" && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle size={12} />
                          Auto-sync
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Real-time Data Flow Visualization */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Zap size={18} className="text-blue-600" />
            <h2 className="font-semibold text-gray-900">How Data Flows</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cloud size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-gray-900">1. POS API</span>
              </div>
              <p className="text-xs text-gray-500">
                Store POS systems push transaction data to Duck's API every 30 seconds
              </p>
              <code className="text-xs text-gray-400 block mt-2 font-mono">
                POST /api/v1/ingest/pos
              </code>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={16} className="text-orange-500" />
                <span className="text-sm font-medium text-gray-900">2. Kafka Queue</span>
              </div>
              <p className="text-xs text-gray-500">
                Data is queued in Kafka for processing and deduplication
              </p>
              <code className="text-xs text-gray-400 block mt-2 font-mono">
                topic: pos_transactions
              </code>
            </div>
            <div className="bg-white rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Database size={16} className="text-green-500" />
                <span className="text-sm font-medium text-gray-900">3. Data Warehouse</span>
              </div>
              <p className="text-xs text-gray-500">
                ETL jobs transform and load data into your dashboard
              </p>
              <code className="text-xs text-gray-400 block mt-2 font-mono">
                warehouse.duck.africa:5432
              </code>
            </div>
          </div>
        </motion.div>

        {/* Pipeline Stats Footer */}
        <div className="flex justify-between items-center text-xs text-gray-400">
          <p>Pipeline health: {dataSources.filter(s => s.status === "active").length}/{dataSources.length} stores live</p>
          <p>Last pipeline run: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>
      <Toaster position="top-right" />
    </>
  );
}