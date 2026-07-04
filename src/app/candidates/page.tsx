"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader, Plus, Search, Phone } from "lucide-react";
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

  const initiateCall = async (candidateId: string) => {
    if (!isConfigured) {
      toast.error("Connect Bolna in Settings before starting a real AI call.");
      router.push("/settings");
      return;
    }

    setCandidates((prev) =>
      prev.map((candidate) =>
        candidate.id === candidateId ? { ...candidate, callStatus: "calling" } : candidate
      )
    );
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
      // Real status transitions are driven by the Bolna webhook, not a timer.
      fetchCandidates();
    } catch (err: any) {
      toast.error(err.message || "Call failed. Try again.", { id: toastId });
      setCandidates((prev) =>
        prev.map((candidate) =>
          candidate.id === candidateId ? { ...candidate, callStatus: "failed" } : candidate
        )
      );
      await fetch(`/api/candidates/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callStatus: "failed" }),
      });
    } finally {
      // Always clear so the Call buttons re-enable (previously only cleared on failure).
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
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header title="Candidates" subtitle="Add candidates, run AI calls, and review results" />

      <div className="space-y-6 p-6 pt-16">
        {/* HEADER */}
        <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-6">
          <div className="max-w-xl">
            <p className="text-sm text-gray-500">
              Add candidates → Start AI calls → Review results
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Add Candidate
          </button>
        </div>

        {/* SEARCH + FILTER */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-4 pl-10 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-500 focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as JobRole | "all")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm"
          >
            <option value="all">All Roles</option>
            {roles.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "date" | "name")}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm"
          >
            <option value="date">Latest</option>
            <option value="score">Score</option>
            <option value="name">Name</option>
          </select>
        </div>

        {/* STATUS FILTERS */}
        <div className="flex flex-wrap gap-2">
          {callStatusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setCallStatusFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                callStatusFilter === filter.value
                  ? "border-teal-600 bg-teal-600 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {decisionFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setDecisionFilter(filter.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs transition",
                decisionFilter === filter.value
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-100"
              )}
            >
              {filter.label}
            </button>
          ))}

          <span className="ml-auto text-xs text-gray-400">{filtered.length} results</span>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs text-gray-500">Candidate</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Job</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Decision</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Score</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Skills</th>
                <th className="px-4 py-3 text-left text-xs text-gray-500">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader className="mx-auto animate-spin text-gray-400" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-gray-500">
                    No candidates found
                  </td>
                </tr>
              ) : (
                filtered.map((candidate) => (
                  <tr
                    key={candidate.id}
                    className="cursor-pointer border-t hover:bg-gray-50"
                    onClick={() => router.push(`/candidates/${candidate.id}`)}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                          style={{ background: candidate.avatarColor }}
                        >
                          {candidate.name
                            .split(" ")
                            .map((p) => p[0])
                            .join("")}
                        </div>
                        <div>
                          <p className="font-medium">{candidate.name}</p>
                          <p className="text-xs text-gray-500">{candidate.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">{candidate.role}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {candidate.job?.title || "Direct"}
                    </td>

                    <td className="px-4 py-3">
                      <CallStatusBadge status={candidate.callStatus} />
                    </td>

                    <td className="px-4 py-3">
                      <DecisionBadge status={candidate.decisionStatus} />
                    </td>

                    <td className="px-4 py-3">
                      {candidate.score ? (
                        <ScoreBadge score={candidate.score} />
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex max-w-[140px] flex-wrap gap-1">
                        {(candidate.tags || []).slice(0, 2).map((tag) => (
                          <TagBadge key={tag} tag={tag} />
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      {candidate.callStatus === "pending" || candidate.callStatus === "failed" ? (
                        <button
                          onClick={() => initiateCall(candidate.id)}
                          disabled={Boolean(activeCallId)}
                          className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white hover:bg-teal-700"
                        >
                          <Phone className="mr-1 inline h-4 w-4" />
                          Call
                        </button>
                      ) : (
                        <button
                          onClick={() => router.push(`/candidates/${candidate.id}`)}
                          className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-700 hover:bg-gray-200"
                        >
                          View
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

      {showAddModal && (
        <AddCandidateModal
          onClose={() => {
            setShowAddModal(false);
            fetchCandidates();
          }}
        />
      )}
    </div>
  );
}
