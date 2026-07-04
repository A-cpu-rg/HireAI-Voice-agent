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
        "fixed top-0 left-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300",
        sidebarOpen ? "w-64" : "w-[72px]"
      )}
    >
      {/* HEADER */}
      <div
        className={cn(
          "flex h-16 items-center border-b border-gray-200 px-4",
          sidebarOpen ? "gap-3" : "justify-center"
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Mic2 className="h-5 w-5" />
        </div>

        {sidebarOpen && (
          <div>
            <span className="text-sm font-semibold">HireAI</span>
            <div className="text-[10px] text-gray-400">AI hiring workflow</div>
          </div>
        )}
      </div>

      {/* NAV */}
      <nav className="flex-1 overflow-y-auto py-5">
        <div className={cn("px-3", !sidebarOpen && "px-2")}>
          {sidebarOpen && (
            <p className="mb-3 px-2 text-[10px] tracking-widest text-gray-400 uppercase">
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
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                      isActive ? "bg-teal-50 text-teal-600" : "text-gray-600 hover:bg-gray-100",
                      !sidebarOpen && "justify-center px-2"
                    )}
                  >
                    <Icon className="h-5 w-5" />

                    {sidebarOpen && <span className="flex-1">{label}</span>}

                    {/* BADGE */}
                    {badge !== null && (
                      <span
                        className={cn(
                          "flex items-center justify-center rounded-full text-xs font-semibold",
                          sidebarOpen
                            ? "h-5 min-w-5 bg-teal-600 px-1 text-white"
                            : "absolute top-1 right-1 h-4 w-4 bg-teal-600 text-[9px] text-white"
                        )}
                      >
                        {badge}
                      </span>
                    )}

                    {/* TOOLTIP */}
                    {!sidebarOpen && (
                      <div className="absolute left-full ml-2 rounded-md bg-gray-900 px-2 py-1 text-xs whitespace-nowrap text-white opacity-0 transition group-hover:opacity-100">
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
        <div className="mx-3 mb-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-1 flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-xs font-semibold text-gray-700">Bolna Platform</span>
          </div>

          <p className="text-[11px] text-gray-500">Manage agents and calls directly on Bolna.</p>

          <a
            href="https://platform.bolna.ai"
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 text-[11px] text-teal-600"
          >
            Open Platform <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* TOGGLE */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="flex w-full items-center justify-center rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </button>
      </div>
    </aside>
  );
}
