"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { 
  Mail, 
  Lock, 
  LogIn,
  Eye,
  EyeOff,
  Package,
  TrendingUp,
  Target,
} from "lucide-react";
import { checkPassword, getUserByEmail } from "@/lib/users";
import { generateToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Check credentials
    if (checkPassword(email, password)) {
      const user = getUserByEmail(email);
      if (user) {
        const token = generateToken({
          userId: user.id,
          email: user.email,
          name: user.name,
        });
        
        // Store in localStorage
        localStorage.setItem("shelfwatch_token", token);
        localStorage.setItem("shelfwatch_user", JSON.stringify(user));
        
        // Set cookie for middleware
        document.cookie = `shelfwatch_token=${token}; path=/; max-age=604800`;
        
        router.push("/dashboard");
      } else {
        setError("User not found");
      }
    } else {
      setError("Invalid email or password. Try: demo@shelfwatch.com / demo123");
    }
    setIsLoading(false);
  };

  const handleDemoLogin = () => {
    setEmail("demo@shelfwatch.com");
    setPassword("demo123");
    // Auto-submit after a short delay
    setTimeout(() => {
      handleSubmit(new Event("submit") as any);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e2820] via-[#1a4a38] to-[#0e2820] flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-[#dbfe7a]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#dbfe7a]/5 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl backdrop-blur-sm mb-4">
            <Package className="w-8 h-8 text-[#dbfe7a]" />
          </div>
          <h1 className="text-3xl font-bold text-white">ShelfWatch</h1>
          <p className="text-white/60 mt-2">Real-time stockout intelligence</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Welcome back</h2>
              <p className="text-sm text-gray-500 mt-1">Sign in to access your dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e2820] focus:border-transparent transition-all"
                    placeholder="demo@shelfwatch.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0e2820] focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-gray-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500 bg-red-50 p-3 rounded-lg"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0e2820] text-white py-2.5 rounded-xl font-semibold hover:bg-[#1a4a38] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign in
                  </>
                )}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-white text-gray-500">Or</span>
              </div>
            </div>

            <button
              onClick={handleDemoLogin}
              className="w-full border-2 border-[#0e2820] text-[#0e2820] py-2.5 rounded-xl font-semibold hover:bg-[#0e2820] hover:text-white transition-all"
            >
              Try Demo Account
            </button>
          </div>

          {/* Features preview */}
          <div className="bg-gray-50 px-8 py-4 border-t border-gray-100">
            <div className="flex justify-center gap-6 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                <span>Predictive Alerts</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                <span>Competitor Intel</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="w-3 h-3" />
                <span>Closed Loop</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          Demo credentials: demo@shelfwatch.com / demo123
        </p>
      </motion.div>
    </div>
  );
}