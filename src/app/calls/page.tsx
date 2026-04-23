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
  <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">

    <Header
      title="AI Calls"
      subtitle={`${callLogs.length} total calls · ${activeCount} active`}
    />

    <div className="pt-16 p-6 space-y-6">

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Calls", value: callLogs.length },
          { label: "Active", value: activeCount },
          { label: "Completed", value: completedCount },
          { label: "Failed", value: failedCount },
        ].map((stat) => (
          <div key={stat.label} className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-xl font-semibold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search calls..."
          className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-teal-500"
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">

        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-5 py-3 text-xs text-gray-500">Candidate</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500">Role</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500">Duration</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500">Score</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500">Started</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading calls...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400">
                  <Phone className="w-8 h-8 mx-auto mb-3 opacity-50" />
                  <p>No AI calls yet</p>
                </td>
              </tr>
            ) : (
              filtered.map((log) => {
                const config =
                  statusConfig[log.status as keyof typeof statusConfig] ||
                  statusConfig.pending;

                return (
                  <tr
                    key={log.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium">{log.candidateName}</p>
                    </td>

                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {log.role}
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                        {config.label}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {log.duration}
                    </td>

                    <td className="px-4 py-3">
                      {log.score ? (
                        <ScoreBadge score={log.score} />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-gray-500">
                      {(() => {
                        try {
                          return format(
                            new Date(log.startedAt),
                            "dd MMM, hh:mm a"
                          );
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
