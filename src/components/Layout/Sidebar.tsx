"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Phone,
  Settings,
  Mic2,
  ChevronLeft,
  ChevronRight,
  Zap,
  BarChart3,
  ExternalLink,
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
  const { sidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();

  const [pendingCount, setPendingCount] = useState(0);
  const [activeCallsCount, setActiveCallsCount] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [candRes, callRes] = await Promise.all([
          fetch("/api/candidates?callStatus=pending"),
          fetch("/api/calls?status=calling"),
        ]);

        if (candRes.ok) {
          const candidates = await candRes.json();
          setPendingCount(candidates.data?.length || 0);
        }

        if (callRes.ok) {
          const calls = await callRes.json();
          setActiveCallsCount(calls.data?.length || 0);
        }
      } catch {
        // swallow polling failures
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-[#0c0c14] border-r border-white/6 flex flex-col transition-all duration-300 z-40",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      <div className={cn("flex items-center h-16 border-b border-white/6 px-4", sidebarOpen ? "gap-3" : "justify-center")}>
        <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
          <Mic2 className="w-5 h-5 text-white" />
        </div>
        {sidebarOpen && (
          <div>
            <span className="text-white font-semibold text-sm tracking-tight">HireAI</span>
            <div className="text-[10px] text-indigo-300/80 font-medium">Recruiting workflow powered by Bolna</div>
          </div>
        )}
      </div>

      <nav className="flex-1 py-5 overflow-y-auto">
        <div className={cn("px-3 mb-3", !sidebarOpen && "px-2")}>
          {sidebarOpen && <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white/25 px-2 mb-3">Workspace</p>}
          <ul className="space-y-1.5">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = to === "/" ? pathname === "/" : pathname?.startsWith(to);
              const badge =
                label === "Candidates" && pendingCount > 0
                  ? pendingCount
                  : label === "Call Logs" && activeCallsCount > 0
                    ? activeCallsCount
                    : null;

              return (
                <li key={to}>
                  <Link
                    href={to}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-indigo-600/20 text-white border border-indigo-500/20"
                        : "text-white/50 hover:text-white hover:bg-white/5 border border-transparent",
                      !sidebarOpen && "justify-center px-2"
                    )}
                  >
                    <Icon className={cn("w-[18px] h-[18px] flex-shrink-0", isActive ? "text-indigo-300" : "")} />
                    {sidebarOpen && <span className="flex-1">{label}</span>}
                    {sidebarOpen && badge !== null && (
                      <span className="bg-indigo-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
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

      {sidebarOpen && (
        <div className="mx-3 mb-4 p-4 rounded-2xl bg-gradient-to-br from-indigo-600/15 to-violet-600/15 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap className="w-3.5 h-3.5 text-indigo-300" />
            <span className="text-xs font-semibold text-indigo-200">Bolna Platform</span>
          </div>
          <p className="text-[11px] text-white/45 leading-relaxed">
            Create agents, manage numbers, and inspect raw call activity directly in Bolna.
          </p>
          <a
            href="https://platform.bolna.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-indigo-300 hover:text-indigo-200 transition-colors"
          >
            Open Platform
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      <div className="p-3 border-t border-white/6">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-all"
        >
          {sidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
