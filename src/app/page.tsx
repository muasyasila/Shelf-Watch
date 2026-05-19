"use client";

import { useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Link from "next/link";
import { 
  Package, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  BarChart3,
  Zap,
  Shield,
  Cloud,
  ArrowRight,
  Menu,
  X,
  Star,
  Users,
  Globe,
  Award,
  Send,
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  const features = [
    {
      icon: TrendingUp,
      title: "Predictive Analytics",
      description: "Know which products will run out before they do. Days-until-stockout forecasting with 94% accuracy.",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
    {
      icon: Target,
      title: "Competitor Intelligence",
      description: "See competitor stock levels in real-time. Identify gaps and opportunities instantly.",
      color: "text-blue-500",
      bg: "bg-blue-50",
    },
    {
      icon: BarChart3,
      title: "Closed Loop Tracking",
      description: "Detect → Act → Track → Resolve. Complete visibility from alert to resolution.",
      color: "text-purple-500",
      bg: "bg-purple-50",
    },
    {
      icon: Zap,
      title: "Instant Alerts",
      description: "SMS and email notifications when stock hits critical levels. Never miss a stockout.",
      color: "text-orange-500",
      bg: "bg-orange-50",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Bank-grade encryption. Your data is safe with us.",
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      icon: Cloud,
      title: "Cloud Native",
      description: "Access from anywhere. Real-time sync across all devices.",
      color: "text-cyan-500",
      bg: "bg-cyan-50",
    },
  ];

  const stats = [
    { value: "10,000+", label: "Stores Tracked", icon: Users },
    { value: "98%", label: "Stockout Reduction", icon: Star },
    { value: "500+", label: "Active Brands", icon: Award },
    { value: "12+", label: "African Markets", icon: Globe },
  ];

  const testimonials = [
    {
      name: "James Mwangi",
      role: "CEO, RetailChain Africa",
      content: "ShelfWatch transformed how we track retail inventory. The predictive alerts alone saved us thousands in lost sales.",
      avatar: "J",
    },
    {
      name: "Sarah Ochieng",
      role: "Operations Director, FreshMart",
      content: "Finally, a tool that actually helps prevent stockouts instead of just reporting them after the fact.",
      avatar: "S",
    },
    {
      name: "Michael Otieno",
      role: "Supply Chain Lead, CityRetail",
      content: "The competitor intelligence feature is a game-changer. We're winning shelf space we didn't know existed.",
      avatar: "M",
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-[#0e2820]" />
              <span className="font-bold text-xl text-[#0e2820]">ShelfWatch</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-[#0e2820] transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-[#0e2820] transition-colors">How It Works</a>
              <a href="#testimonials" className="text-gray-600 hover:text-[#0e2820] transition-colors">Testimonials</a>
              <Link 
                href="/login"
                className="px-4 py-2 bg-[#0e2820] text-white rounded-lg hover:bg-[#1a4a38] transition-all"
              >
                Sign In
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden bg-white border-b border-gray-100"
          >
            <div className="px-4 py-4 space-y-3">
              <a href="#features" className="block text-gray-600 hover:text-[#0e2820] py-2">Features</a>
              <a href="#how-it-works" className="block text-gray-600 hover:text-[#0e2820] py-2">How It Works</a>
              <a href="#testimonials" className="block text-gray-600 hover:text-[#0e2820] py-2">Testimonials</a>
              <Link 
                href="/login"
                className="block px-4 py-2 bg-[#0e2820] text-white rounded-lg text-center"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section - FIXED CONTRAST */}
      <section className="relative pt-32 pb-20 bg-gradient-to-br from-[#0e2820] via-[#1a4a38] to-[#0e2820] overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#dbfe7a]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#dbfe7a]/10 rounded-full blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-sm text-[#dbfe7a] mb-6">
              <Zap className="w-3 h-3" />
              Real-time Stockout Intelligence
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6"
          >
            Stop losing sales to
            <span className="text-[#dbfe7a]"> empty shelves</span>
          </motion.h1>
          
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg text-white/80 max-w-2xl mx-auto mb-10"
          >
            Real-time stockout intelligence for FMCG brands. Predict, prevent, and track stockouts before they impact your revenue.
          </motion.p>
          
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link 
              href="/login"
              className="px-6 py-3 bg-[#dbfe7a] text-[#0e2820] rounded-xl font-semibold hover:bg-[#c8ed6a] transition-all inline-flex items-center gap-2 justify-center"
            >
              Start Free Trial
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a 
              href="#features"
              className="px-6 py-3 bg-white text-[#0e2820] rounded-xl font-semibold hover:bg-gray-100 transition-all inline-flex items-center gap-2 justify-center"
            >
              Learn More
            </a>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 bg-[#dbfe7a]/20 rounded-full mb-3">
                  <stat.icon className="w-5 h-5 text-[#0e2820]" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to prevent stockouts</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Built for FMCG brands in emerging markets. Real-time data, predictive analytics, and actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 ${feature.bg} rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Detect. Act. Track. Resolve.</h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              A complete closed-loop system for stockout management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: "01", title: "Detect", desc: "AI identifies critical stockouts before they happen", icon: AlertCircle, color: "text-red-500" },
              { step: "02", title: "Act", desc: "One-click dispatch orders and SMS alerts to store managers", icon: Send, color: "text-blue-500" },
              { step: "03", title: "Track", desc: "Monitor resolution progress in real-time", icon: Clock, color: "text-yellow-500" },
              { step: "04", title: "Resolve", desc: "Close the loop with verification and reporting", icon: CheckCircle, color: "text-green-500" },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 relative">
                  <item.icon className={`w-6 h-6 ${item.color}`} />
                  <span className="absolute -top-2 -right-2 w-6 h-6 bg-[#0e2820] text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-[#0e2820] rounded-2xl p-8 max-w-3xl mx-auto">
              <p className="text-white/80 text-sm mb-4">Trusted by leading retail brands across Africa</p>
              <div className="flex justify-center gap-8 flex-wrap">
                <span className="text-white/60 text-sm">RetailChain Africa</span>
                <span className="text-white/60 text-sm">FreshMart</span>
                <span className="text-white/60 text-sm">CityRetail</span>
                <span className="text-white/60 text-sm">SmartStores</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Loved by retail leaders</h2>
            <p className="text-gray-500">See what our customers are saying</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <motion.div
                key={testimonial.name}
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#0e2820] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium">{testimonial.avatar}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    <p className="text-xs text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm italic">"{testimonial.content}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0e2820] to-[#1a4a38]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to stop losing sales?</h2>
          <p className="text-white/70 mb-8 max-w-md mx-auto">
            Join hundreds of brands using ShelfWatch to prevent stockouts
          </p>
          <Link 
            href="/login"
            className="px-6 py-3 bg-[#dbfe7a] text-[#0e2820] rounded-xl font-semibold hover:bg-[#c8ed6a] transition-all inline-flex items-center gap-2"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white/60 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-[#dbfe7a]" />
                <span className="font-bold text-white">ShelfWatch</span>
              </div>
              <p className="text-sm">Real-time stockout intelligence for African retail.</p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 text-center text-sm">
            <p>&copy; 2026 ShelfWatch. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}