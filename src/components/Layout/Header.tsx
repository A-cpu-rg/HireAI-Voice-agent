import { Bell, Search, Wifi, WifiOff } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../utils/cn";
import { useState, useEffect } from "react";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { isConfigured, setIsConfigured, setBolnaConfig, sidebarOpen } = useApp();
  const [activeCall, setActiveCall] = useState<any>(null);

  useEffect(() => {
    // Initial fetch for config
    const initConfig = async () => {
      try {
        const res = await fetch('/api/config');
        if (res.ok) {
          const data = await res.json();
          if (data.isNewUser) {
            // User was just created, not configured
             setIsConfigured(false);
          } else {
             const configured = Boolean(data.hasKey && data.hasAgent);
             setIsConfigured(configured);
             if (configured) {
                setBolnaConfig({ apiKey: data.apiKey, agentId: data.agentId, webhookUrl: '' });
             }
          }
        }
      } catch (e) {
        console.error("Failed to load config", e);
      }
    };
    initConfig();
  }, [setIsConfigured, setBolnaConfig]);

  useEffect(() => {
    // Poll for active calls
    const fetchActiveCall = async () => {
       try {
         const res = await fetch('/api/calls?status=in-progress');
         if (res.ok) {
            const data = await res.json();
            if (data.data?.length > 0) {
               setActiveCall(data.data[0]);
            } else {
               setActiveCall(null);
            }
         }
       } catch (e) {
         // silently fail
       }
    };

    fetchActiveCall();
    const interval = setInterval(fetchActiveCall, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-[#0b0b14]/90 backdrop-blur-xl border-b border-white/5 z-30 flex items-center px-6 gap-4 transition-all duration-300",
        sidebarOpen ? "left-60" : "left-[68px]"
      )}
    >
      <div className="flex-1">
        <h1 className="text-base font-semibold text-white">{title}</h1>
        {subtitle && <p className="text-xs text-white/40">{subtitle}</p>}
      </div>

      {/* Active call indicator */}
      {activeCall && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-green-400 font-medium">Screening {activeCall.candidateName}</span>
        </div>
      )}

      {/* API Status */}
      <div className={cn(
        "flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
        isConfigured
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
      )}>
        {isConfigured ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
        {isConfigured ? "Bolna Connected" : "Demo Mode"}
      </div>

      {/* Search */}
      <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
        <Search className="w-4 h-4" />
      </button>

      {/* Notifications */}
      <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
        <Bell className="w-4 h-4" />
        <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full"></span>
      </button>

      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-lg">
        AB
      </div>
    </header>
  );
}
