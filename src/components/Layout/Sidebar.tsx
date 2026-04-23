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
        "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300 z-40",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      {/* HEADER */}
      <div className={cn(
        "flex items-center h-16 border-b border-gray-200 px-4",
        sidebarOpen ? "gap-3" : "justify-center"
      )}>
        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white">
          <Mic2 className="w-5 h-5" />
        </div>
  
        {sidebarOpen && (
          <div>
            <span className="font-semibold text-sm">HireAI</span>
            <div className="text-[10px] text-gray-400">
              AI hiring workflow
            </div>
          </div>
        )}
      </div>
  
      {/* NAV */}
      <nav className="flex-1 py-5 overflow-y-auto">
        <div className={cn("px-3", !sidebarOpen && "px-2")}>
  
          {sidebarOpen && (
            <p className="text-[10px] uppercase tracking-widest text-gray-400 px-2 mb-3">
              Workspace
            </p>
          )}
  
          <ul className="space-y-1">
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
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition group relative",
                      isActive
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-600 hover:bg-gray-100",
                      !sidebarOpen && "justify-center px-2"
                    )}
                  >
                    <Icon className="w-5 h-5" />
  
                    {sidebarOpen && <span className="flex-1">{label}</span>}
  
                    {/* BADGE */}
                    {badge !== null && (
                      <span className={cn(
                        "text-xs font-semibold rounded-full flex items-center justify-center",
                        sidebarOpen
                          ? "bg-teal-600 text-white min-w-5 h-5 px-1"
                          : "absolute top-1 right-1 w-4 h-4 bg-teal-600 text-white text-[9px]"
                      )}>
                        {badge}
                      </span>
                    )}
  
                    {/* TOOLTIP */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
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
  
      {/* FOOTER CARD */}
      {sidebarOpen && (
        <div className="mx-3 mb-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-xs font-semibold text-gray-700">
              Bolna Platform
            </span>
          </div>
  
          <p className="text-[11px] text-gray-500">
            Manage agents and calls directly on Bolna.
          </p>
  
          <a
            href="https://platform.bolna.ai"
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal-600"
          >
            Open Platform <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
  
      {/* TOGGLE */}
      <div className="p-3 border-t border-gray-200">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full flex items-center justify-center p-2 rounded-lg text-gray-500 hover:bg-gray-100"
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
    </aside>
  );
}
