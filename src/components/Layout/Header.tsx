"use client";

import { Bell, LogOut, Search, Wifi, WifiOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";
import { useState, useEffect, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const {
    isConfigured,
    setIsConfigured,
    setBolnaConfig,
    sidebarOpen,
    currentUser,
    setCurrentUser,
  } = useApp();
  const [activeCall, setActiveCall] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  const initials = useMemo(() => {
    const source = currentUser?.name?.trim() || currentUser?.email || "User";
    return source
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("");
  }, [currentUser]);

  useEffect(() => {
    const initHeaderData = async () => {
      try {
        const [configRes, userRes] = await Promise.all([
          fetch("/api/config", { cache: "no-store" }),
          fetch("/api/auth/me", { cache: "no-store" }),
        ]);

        if (configRes.ok) {
          const data = await configRes.json();
          const configured = Boolean(data.hasKey && data.hasAgent);
          setIsConfigured(configured);
          setBolnaConfig({
            apiKey: "",
            agentId: configured ? data.agentId : "",
            webhookUrl: "",
          });
        } else {
          setIsConfigured(false);
          setBolnaConfig({ apiKey: "", agentId: "", webhookUrl: "" });
        }

        if (userRes.ok) {
          const data = await userRes.json();
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        setIsConfigured(false);
        setBolnaConfig({ apiKey: "", agentId: "", webhookUrl: "" });
        setCurrentUser(null);
      }
    };

    initHeaderData();
  }, [setBolnaConfig, setCurrentUser, setIsConfigured, pathname]);

  useEffect(() => {
    const fetchActiveCall = async () => {
      try {
        const res = await fetch("/api/calls?status=calling");
        if (res.ok) {
          const data = await res.json();
          if (data.data?.length > 0) {
            setActiveCall(data.data[0]);
            return;
          }
        }

        const fallback = await fetch("/api/calls?status=processing");
        if (!fallback.ok) {
          setActiveCall(null);
          return;
        }

        const fallbackData = await fallback.json();
        setActiveCall(fallbackData.data?.[0] || null);
      } catch {
        setActiveCall(null);
      }
    };

    fetchActiveCall();
    const interval = setInterval(fetchActiveCall, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      localStorage.removeItem("hireai-mode");
      setCurrentUser(null);
      setIsConfigured(false);
      setBolnaConfig({ apiKey: "", agentId: "", webhookUrl: "" });
      router.replace("/login");
      router.refresh();
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-30 flex items-center px-6 gap-4 transition-all duration-300",
        sidebarOpen ? "left-64" : "left-[72px]"
      )}
    >
      {/* TITLE */}
      <div className="flex-1">
        <h1 className="text-base font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
  
      {/* ACTIVE CALL */}
      {activeCall && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-600 font-medium">
            Interviewing {activeCall.candidateName}
          </span>
        </div>
      )}
  
      {/* STATUS */}
      <div
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border",
          isConfigured
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-amber-50 text-amber-600 border-amber-200"
        )}
      >
        {isConfigured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isConfigured ? "Connected" : "Setup Required"}
      </div>
  
      {/* SEARCH */}
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
        <Search className="w-4 h-4" />
      </button>
  
      {/* NOTIFICATIONS */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
      </button>
  
      {/* USER */}
      <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">
            {currentUser?.name || "Recruiter"}
          </p>
          <p className="text-xs text-gray-500">
            {currentUser?.email || ""}
          </p>
        </div>
  
        <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center text-xs font-bold text-white">
          {initials}
        </div>
  
        <button
          onClick={handleLogout}
          className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
