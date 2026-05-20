"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard, 
  Package, 
  TrendingUp, 
  Target, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  User,
  Menu,
  X,
  Database,
} from "lucide-react";
import { logout } from "@/lib/logout";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("shelfwatch_token");
    const user = localStorage.getItem("shelfwatch_user");
    
    if (!token) {
      router.push("/login");
      return;
    }
    
    if (user) {
      const parsedUser = JSON.parse(user);
      setUserName(parsedUser.name);
      setUserEmail(parsedUser.email);
    }
  }, [router]);

const navItems = [
  { name: "Overview", icon: LayoutDashboard, href: "/dashboard", current: pathname === "/dashboard" },
   { name: "Pipeline", icon: Database, href: "/dashboard/pipeline", current: pathname === "/dashboard/pipeline" },
  { name: "Inventory", icon: Package, href: "/dashboard/inventory", current: pathname === "/dashboard/inventory" },
  { name: "Analytics", icon: TrendingUp, href: "/dashboard/analytics", current: false },
  { name: "Competitors", icon: Target, href: "/dashboard/competitors", current: false },
  { name: "Reports", icon: FileText, href: "/dashboard/reports", current: false },
  { name: "Settings", icon: Settings, href: "/dashboard/settings", current: false },
];

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-30 w-64 h-full bg-[#0e2820] transition-transform duration-300
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-5 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Package className="w-6 h-6 text-[#dbfe7a]" />
              <span className="text-white font-semibold text-lg">ShelfWatch</span>
            </div>
            <p className="text-white/40 text-xs mt-1">Real-time intelligence</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all
                  ${item.current 
                    ? "bg-[#dbfe7a] text-[#0e2820]" 
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </a>
            ))}
          </nav>

          {/* User info + Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 bg-[#dbfe7a]/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-[#dbfe7a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{userName || "User"}</p>
                <p className="text-white/40 text-xs truncate">{userEmail || "user@example.com"}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top header */}
        <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-3 ml-auto">
              <button className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-gray-500" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="w-8 h-8 bg-gradient-to-r from-[#0e2820] to-[#1a4a38] rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userName ? userName.charAt(0).toUpperCase() : "A"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}