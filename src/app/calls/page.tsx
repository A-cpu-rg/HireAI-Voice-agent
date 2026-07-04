"use client";

import { useState, useEffect } from "react";
import { Loader, Phone, Search } from "lucide-react";
import Header from "@/components/Layout/Header";
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
  const activeCount = callLogs.filter(
    (log) => log.status === "calling" || log.status === "processing"
  ).length;
  const failedCount = callLogs.filter((log) => log.status === "failed").length;

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header
        title="AI Calls"
        subtitle={`${callLogs.length} total calls · ${activeCount} active`}
      />

      <div className="space-y-6 p-6 pt-16">
        {/* STATS */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Total Calls", value: callLogs.length },
            { label: "Active", value: activeCount },
            { label: "Completed", value: completedCount },
            { label: "Failed", value: failedCount },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-4">
              <p className="text-xl font-semibold">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search calls..."
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs text-gray-500">Candidate</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Duration</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Score</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Started</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Loader className="mx-auto mb-2 h-6 w-6 animate-spin" />
                    Loading calls...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-gray-400">
                    <Phone className="mx-auto mb-3 h-8 w-8 opacity-50" />
                    <p>No AI calls yet</p>
                  </td>
                </tr>
              ) : (
                filtered.map((log) => {
                  const config =
                    statusConfig[log.status as keyof typeof statusConfig] || statusConfig.pending;

                  return (
                    <tr key={log.id} className="border-t transition hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <p className="font-medium">{log.candidateName}</p>
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">{log.role}</td>

                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                          {config.label}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-gray-600">{log.duration}</td>

                      <td className="px-4 py-3">
                        {log.score ? (
                          <ScoreBadge score={log.score} />
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs text-gray-500">
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
