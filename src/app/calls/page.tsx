"use client";

import { Phone, CheckCircle, XCircle, Clock, Loader, Search } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import { ScoreBadge } from "@/components/UI/Badge";
import { useState } from "react";
import { format } from "date-fns";

const statusConfig = {
  success: { label: "Completed", icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  failed: { label: "Failed", icon: XCircle, color: "text-rose-400", bg: "bg-rose-500/10" },
  "no-answer": { label: "No Answer", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  "in-progress": { label: "In Progress", icon: Loader, color: "text-blue-400", bg: "bg-blue-500/10" },
};

export default function CallLogs() {
  const { callLogs, candidates } = useApp();
  const [search, setSearch] = useState("");

  const filtered = callLogs.filter(
    (l) =>
      l.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      l.role.toLowerCase().includes(search.toLowerCase())
  );

  const successCount = callLogs.filter((l) => l.status === "success").length;
  const successRate = callLogs.length > 0 ? Math.round((successCount / callLogs.length) * 100) : 0;
  const avgDuration = "4m 12s";

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Call Logs" subtitle={`${callLogs.length} total calls · ${successRate}% success rate`} />

      <div className="pt-16 p-6 space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Calls", value: callLogs.length, color: "text-indigo-400 bg-indigo-500/10" },
            { label: "Successful", value: successCount, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "No Answer", value: callLogs.filter(l => l.status === "no-answer").length, color: "text-amber-400 bg-amber-500/10" },
            { label: "Avg Duration", value: avgDuration, color: "text-violet-400 bg-violet-500/10" },
          ].map((s) => (
            <div key={s.label} className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
              <p className="text-2xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-xs text-white/40">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search call logs..."
            className="w-full bg-[#13131f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        {/* Logs Table */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Duration</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Started At</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Call ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((log) => {
                const sc = statusConfig[log.status];
                const StatusIcon = sc.icon;
                const candidate = candidates.find((c) => c.id === log.candidateId);

                return (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {candidate && (
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                            style={{ background: candidate.avatarColor }}
                          >
                            {candidate.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-white">{log.candidateName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/50">{log.role}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full", sc.bg, sc.color)}>
                        <StatusIcon className={cn("w-3 h-3", log.status === "in-progress" && "animate-spin")} />
                        {sc.label}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-white/60">{log.duration}</p>
                    </td>
                    <td className="px-4 py-3.5">
                      {log.score ? <ScoreBadge score={log.score} /> : <span className="text-white/20 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-xs text-white/40">
                        {(() => {
                          try { return format(new Date(log.startedAt), "dd MMM, hh:mm a"); }
                          catch { return log.startedAt; }
                        })()}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-[10px] text-white/25 font-mono">{log.id.slice(0, 20)}...</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-white/30">
              <Phone className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No call logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
