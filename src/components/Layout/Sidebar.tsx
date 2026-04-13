"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../../context/AppContext";
import {
  LayoutDashboard, Users, Briefcase, Phone, Settings, Mic2, ChevronLeft, ChevronRight,
  Zap, BarChart3, BookOpen
} from "lucide-react";
import { cn } from "../../utils/cn";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/candidates", icon: Users, label: "Candidates" },
  { to: "/jobs", icon: Briefcase, label: "Jobs" },
  { to: "/calls", icon: Phone, label: "Call Logs" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/agent", icon: Mic2, label: "AI Agent" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen, candidates, callLogs } = useApp();
  const pathname = usePathname();

  const activeCallsCount = callLogs.filter((c) => c.status === "in-progress").length;
  const pendingCount = candidates.filter((c) => c.status === "pending").length;

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#0f0f1a] border-r border-white/5 flex flex-col transition-all duration-300 z-40",
        sidebarOpen ? "w-60" : "w-[68px]"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center h-16 border-b border-white/5 px-4", sidebarOpen ? "gap-3" : "justify-center")}>
        <div className="flex-shrink-0 w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <span className="text-white font-bold text-sm tracking-tight">HireAI</span>
            <div className="text-[10px] text-indigo-400 font-medium">Powered by Bolna</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <div className={cn("px-3 mb-2", !sidebarOpen && "px-2")}>
          {sidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-2 mb-2">Menu</p>}
          <ul className="space-y-1">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = to === "/" ? pathname === "/" : pathname?.startsWith(to);
              const badge = label === "Candidates" && pendingCount > 0 ? pendingCount
                : label === "Call Logs" && activeCallsCount > 0 ? activeCallsCount
                : null;

              return (
                <li key={to}>
                  <Link
                    href={to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-indigo-600/20 text-indigo-400 shadow-inner"
                        : "text-white/50 hover:text-white hover:bg-white/5",
                      !sidebarOpen && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive ? "text-indigo-400" : "")} />
                    {sidebarOpen && <span className="flex-1">{label}</span>}
                    {sidebarOpen && badge !== null && (
                      <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                    {!sidebarOpen && badge !== null && (
                      <span className="absolute top-1 right-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {badge}
                      </span>
                    )}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl border border-white/10">
                        {label}
                      </div>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Bolna Tag */}
      {sidebarOpen && (
        <div className="mx-3 mb-4 p-3 rounded-xl bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-300">Bolna Voice AI</span>
          </div>
          <p className="text-[10px] text-white/40 leading-relaxed">AI agent active & screening candidates</p>
          <a
            href="https://platform.bolna.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <BookOpen className="w-3 h-3" />
            Open Platform ↗
          </a>
        </div>
      )}

      {/* Toggle */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
