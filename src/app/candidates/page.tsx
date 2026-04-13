"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, Phone, Plus, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import { StatusBadge, ScoreBadge, TagBadge } from "@/components/UI/Badge";
import { CandidateStatus, JobRole } from "@/types";
import { cn } from "@/utils/cn";
import AddCandidateModal from "@/components/Candidates/AddCandidateModal";

const statusFilters: { label: string; value: CandidateStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Scheduled", value: "scheduled" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

export default function Candidates() {
  const { candidates, initiateCall, activeCallId } = useApp();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CandidateStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<JobRole | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("date");

  const filtered = candidates
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.role.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" || c.status === statusFilter;
      const matchRole = roleFilter === "all" || c.role === roleFilter;
      return matchSearch && matchStatus && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.score || 0) - (a.score || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });

  const roles = Array.from(new Set(candidates.map((c) => c.role)));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Candidates" subtitle={`${candidates.length} total candidates · ${candidates.filter(c => c.status === 'shortlisted').length} shortlisted`} />

      <div className="pt-16 p-6 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full bg-[#13131f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Role filter */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="appearance-none bg-[#13131f] border border-white/5 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          {/* Sort */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="appearance-none bg-[#13131f] border border-white/5 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="date">Sort: Latest</option>
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {statusFilters.map((s) => {
            const count = s.value === "all" ? candidates.length : candidates.filter(c => c.status === s.value).length;
            return (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                  statusFilter === s.value
                    ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                    : "bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
                )}
              >
                {s.label}
                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                  statusFilter === s.value ? "bg-indigo-500 text-white" : "bg-white/10 text-white/40"
                )}>{count}</span>
              </button>
            );
          })}
          <span className="ml-auto text-xs text-white/30">{filtered.length} results</span>
        </div>

        {/* Table */}
        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Exp.</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Location</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Skills</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Status</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                  onClick={() => router.push(`/candidates/${c.id}`)}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                        style={{ background: c.avatarColor }}
                      >
                        {c.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{c.name}</p>
                        <p className="text-xs text-white/40">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/70 whitespace-nowrap">{c.role}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/70">{c.experience}y</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-sm text-white/50 whitespace-nowrap">{c.location}</p>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex gap-1 flex-wrap max-w-[140px]">
                      {(c.tags || []).slice(0, 2).map((t) => <TagBadge key={t} tag={t} />)}
                      {(c.tags || []).length > 2 && (
                        <span className="text-[10px] text-white/30">+{(c.tags || []).length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    {c.score ? <ScoreBadge score={c.score} /> : <span className="text-xs text-white/20">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-2">
                      {(c.status === "pending" || c.status === "scheduled" || c.status === "failed") && (
                        <button
                          onClick={() => initiateCall(c.id)}
                          disabled={activeCallId !== null}
                          className={cn(
                            "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all",
                            activeCallId
                              ? "bg-white/5 text-white/30 cursor-not-allowed"
                              : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 border border-indigo-500/30"
                          )}
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Screen
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/candidates/${c.id}`)}
                        className="text-xs text-white/30 hover:text-white/60 transition-colors px-2 py-1.5"
                      >
                        View →
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Filter className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No candidates match your filters</p>
            </div>
          )}
        </div>
      </div>

      {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} />}
    </div>
  );
}
