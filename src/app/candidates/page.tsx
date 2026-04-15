"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, Plus, Search, Phone, ChevronDown, Filter } from "lucide-react";
import Header from "@/components/Layout/Header";
import { CallStatusBadge, DecisionBadge, ScoreBadge, TagBadge } from "@/components/UI/Badge";
import { CallStatus, Candidate, DecisionStatus, JobRole } from "@/types";
import { cn } from "@/utils/cn";
import AddCandidateModal from "@/components/Candidates/AddCandidateModal";
import toast from "react-hot-toast";
import { useApp } from "@/context/AppContext";

const callStatusFilters: { label: string; value: CallStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Ready", value: "pending" },
  { label: "Calling", value: "calling" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Failed", value: "failed" },
];

const decisionFilters: { label: string; value: DecisionStatus | "all" }[] = [
  { label: "All Decisions", value: "all" },
  { label: "Awaiting Decision", value: "undecided" },
  { label: "Shortlisted", value: "shortlisted" },
  { label: "Rejected", value: "rejected" },
];

export default function Candidates() {
  const router = useRouter();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCallId, setActiveCallId, isConfigured } = useApp();

  const [search, setSearch] = useState("");
  const [callStatusFilter, setCallStatusFilter] = useState<CallStatus | "all">("all");
  const [decisionFilter, setDecisionFilter] = useState<DecisionStatus | "all">("all");
  const [roleFilter, setRoleFilter] = useState<JobRole | "all">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<"score" | "date" | "name">("date");

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (callStatusFilter !== "all") params.set("callStatus", callStatusFilter);
      if (decisionFilter !== "all") params.set("decisionStatus", decisionFilter);
      const res = await fetch(`/api/candidates${params.toString() ? `?${params.toString()}` : ""}`);
      if (res.ok) {
        const json = await res.json();
        setCandidates(json.data || []);
      }
    } catch {
      toast.error("Failed to load candidates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [callStatusFilter, decisionFilter]);

  const moveCandidateToProcessing = async (candidateId: string) => {
    setTimeout(async () => {
      try {
        await fetch(`/api/candidates/${candidateId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callStatus: "processing" }),
        });
        await fetchCandidates();
      } catch {
        // no-op
      }
    }, 3000);
  };

  const initiateCall = async (candidateId: string) => {
    if (!isConfigured) {
      toast.error("Connect Bolna in Settings before starting a real AI call.");
      router.push("/settings");
      return;
    }

    setCandidates((prev) => prev.map((candidate) => (
      candidate.id === candidateId ? { ...candidate, callStatus: "calling" } : candidate
    )));
    setActiveCallId(candidateId);

    const toastId = toast.loading("Calling candidate...");

    try {
      const response = await fetch("/api/bolna/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      toast.success("AI call started. Interview is in progress.", { id: toastId });
      moveCandidateToProcessing(candidateId);
      fetchCandidates();
    } catch (err: any) {
      toast.error(err.message || "Call failed. Try again.", { id: toastId });
      setCandidates((prev) => prev.map((candidate) => (
        candidate.id === candidateId ? { ...candidate, callStatus: "failed" } : candidate
      )));
      await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callStatus: "failed" }),
      });
      setActiveCallId(null);
    }
  };

  const filtered = candidates
    .filter((candidate) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        candidate.name.toLowerCase().includes(searchLower) ||
        candidate.email.toLowerCase().includes(searchLower) ||
        candidate.role.toLowerCase().includes(searchLower);
      const matchRole = roleFilter === "all" || candidate.role === roleFilter;
      return matchSearch && matchRole;
    })
    .sort((a, b) => {
      if (sortBy === "score") return (b.score || 0) - (a.score || 0);
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime();
    });

  const roles = Array.from(new Set(candidates.map((candidate) => candidate.role)));

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Candidates" subtitle="Add candidates, start AI calls, and review interview outcomes" />

      <div className="pt-16 p-6 space-y-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <p className="text-sm text-white/55">
              Add a candidate directly for the fastest workflow, or optionally attach them to a job. Every candidate should always have one clear next step.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Add Candidate
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full bg-[#13131f] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as JobRole | "all")}
              className="appearance-none bg-[#13131f] border border-white/5 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="all">All Roles</option>
              {roles.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "score" | "date" | "name")}
              className="appearance-none bg-[#13131f] border border-white/5 rounded-xl pl-4 pr-8 py-2.5 text-sm text-white/70 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="date">Sort: Latest</option>
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {callStatusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCallStatusFilter(filter.value)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                callStatusFilter === filter.value
                  ? "bg-indigo-600/30 text-indigo-300 border-indigo-500/50"
                  : "bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {decisionFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDecisionFilter(filter.value)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all",
                decisionFilter === filter.value
                  ? "bg-emerald-600/20 text-emerald-300 border-emerald-500/40"
                  : "bg-transparent text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
              )}
            >
              {filter.label}
            </button>
          ))}
          <span className="ml-auto text-xs text-white/30">{filtered.length} results</span>
        </div>

        <div className="bg-[#13131f] border border-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-5 py-3">Candidate</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Role</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Job</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Call Status</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Decision</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Score</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Skills</th>
                <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-wider px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-white/50">
                    <Loader className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                    Loading candidates...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-white/30">
                    <Filter className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium text-white/45 mb-1">No candidates match these filters</p>
                    <p className="text-xs">Add a candidate, connect Bolna, and start the first real AI call.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                    onClick={() => router.push(`/candidates/${candidate.id}`)}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                          style={{ background: candidate.avatarColor }}
                        >
                          {candidate.name.split(" ").map((part) => part[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white group-hover:text-indigo-300 transition-colors">{candidate.name}</p>
                          <p className="text-xs text-white/40">{candidate.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-white/70">{candidate.role}</td>
                    <td className="px-4 py-3.5 text-xs text-white/45">{candidate.job?.title || "Direct candidate"}</td>
                    <td className="px-4 py-3.5"><CallStatusBadge status={candidate.callStatus} /></td>
                    <td className="px-4 py-3.5"><DecisionBadge status={candidate.decisionStatus} /></td>
                    <td className="px-4 py-3.5">
                      {candidate.score ? <ScoreBadge score={candidate.score} /> : <span className="text-xs text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex gap-1 flex-wrap max-w-[140px]">
                        {(candidate.tags || []).slice(0, 2).map((tag) => <TagBadge key={tag} tag={tag} />)}
                        {(candidate.tags || []).length > 2 && (
                          <span className="text-[10px] text-white/30">+{(candidate.tags || []).length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                      {(candidate.callStatus === "pending" || candidate.callStatus === "failed") ? (
                        <button
                          onClick={() => initiateCall(candidate.id)}
                          disabled={Boolean(activeCallId)}
                          className={cn(
                            "inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl transition-all",
                            activeCallId
                              ? "bg-white/5 text-white/30 cursor-not-allowed"
                              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                          )}
                        >
                          <Phone className="w-4 h-4" />
                          Start AI Call
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/candidates/${candidate.id}`)}
                          className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 transition-all"
                        >
                          View Result
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && <AddCandidateModal onClose={() => {
        setShowAddModal(false);
        fetchCandidates();
      }} />}
    </div>
  );
}
