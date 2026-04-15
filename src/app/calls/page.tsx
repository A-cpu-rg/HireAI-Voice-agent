"use client";

import { useState, useEffect } from "react";
import { Loader, Phone, Search } from "lucide-react";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import { ScoreBadge } from "@/components/UI/Badge";
import { format } from "date-fns";

const statusConfig = {
  pending: { label: "Queued", color: "text-slate-300", bg: "bg-slate-500/10" },
  calling: { label: "Calling", color: "text-amber-400", bg: "bg-amber-500/10" },
  processing: { label: "Processing", color: "text-blue-400", bg: "bg-blue-500/10" },
  completed: { label: "Completed", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { label: "Failed", color: "text-rose-400", bg: "bg-rose-500/10" },
};

export default function CallLogs() {
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/calls")
      .then((res) => res.json())
      .then((data) => {
        setCallLogs(data.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = callLogs.filter(
    (log) =>
      log.candidateName?.toLowerCase().includes(search.toLowerCase()) ||
      log.role?.toLowerCase().includes(search.toLowerCase())
  );

  const completedCount = callLogs.filter((log) => log.status === "completed").length;
  const activeCount = callLogs.filter((log) => log.status === "calling" || log.status === "processing").length;
  const failedCount = callLogs.filter((log) => log.status === "failed").length;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AI Calls" subtitle={`${callLogs.length} total calls · ${activeCount} active right now`} />

      <div className="pt-16 p-6 space-y-5">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Calls", value: callLogs.length },
            { label: "Active Calls", value: activeCount },
            { label: "Completed", value: completedCount },
            { label: "Failed", value: failedCount },
          ].map((stat) => (
            <div key={stat.label} className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-white/40">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search calls..."
            className="w-full bg-[#13131f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Call Status</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Duration</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/50">
                    <Loader className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Loading calls...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-white/30">
                    <Phone className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No AI calls yet</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const config = statusConfig[log.status as keyof typeof statusConfig] || statusConfig.pending;

                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{log.candidateName}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-xs text-white/50">{log.role}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", config.bg, config.color)}>
                          {config.label}
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-white/60">{log.duration}</td>
                      <td className="px-4 py-3.5">
                        {log.score ? <ScoreBadge score={log.score} /> : <span className="text-white/20 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-white/40">
                        {(() => {
                          try {
                            return format(new Date(log.startedAt), "dd MMM, hh:mm a");
                          } catch {
                            return log.startedAt;
                          }
                        })()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
