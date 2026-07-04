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
        "fixed top-0 right-0 z-30 flex h-16 items-center gap-4 border-b border-gray-200 bg-white px-6 transition-all duration-300",
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
        <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
          </span>
          <span className="text-xs font-medium text-green-600">
            Interviewing {activeCall.candidateName}
          </span>
        </div>
      )}

      {/* STATUS */}
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
          isConfigured
            ? "border-emerald-200 bg-emerald-50 text-emerald-600"
            : "border-amber-200 bg-amber-50 text-amber-600"
        )}
      >
        {isConfigured ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
        {isConfigured ? "Connected" : "Setup Required"}
      </div>

      {/* SEARCH */}
      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
        <Search className="h-4 w-4" />
      </button>

      {/* NOTIFICATIONS */}
      <button className="relative flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
        <Bell className="h-4 w-4" />
        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-teal-500"></span>
      </button>

      {/* USER */}
      <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{currentUser?.name || "Recruiter"}</p>
          <p className="text-xs text-gray-500">{currentUser?.email || ""}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
          {initials}
        </div>

        <button
          onClick={handleLogout}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
