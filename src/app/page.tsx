"use client";

import { CheckCircle, Loader, PhoneCall, Star, Users, Zap, FileUp, Bot } from "lucide-react";
import Header from "@/components/Layout/Header";
import StatCard from "@/components/UI/StatCard";
import { CallStatusBadge, DecisionBadge, ScoreBadge } from "@/components/UI/Badge";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";
import AddCandidateModal from "@/components/Candidates/AddCandidateModal";

export default function Dashboard() {
  const { isConfigured } = useApp();
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [bulkCalling, setBulkCalling] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me");
      if (res.status === 401) {
        router.push("/login");
        return;
      }

      const [candRes, callRes] = await Promise.all([
        fetch("/api/candidates").then((r) => r.json()),
        fetch("/api/calls").then((r) => r.json()),
      ]);
      setCandidates(candRes.data || []);
      setCallLogs(callRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalCandidates = candidates.length;
    const completedInterviews = candidates.filter(
      (candidate) => candidate.callStatus === "completed"
    ).length;
    const shortlisted = candidates.filter(
      (candidate) => candidate.decisionStatus === "shortlisted"
    ).length;
    const scores = candidates
      .filter((candidate) => candidate.score)
      .map((candidate) => candidate.score as number);
    const avgScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
    const activeCalls = candidates.filter(
      (candidate) => candidate.callStatus === "calling" || candidate.callStatus === "processing"
    ).length;

    return { totalCandidates, completedInterviews, shortlisted, avgScore, activeCalls };
  }, [candidates, callLogs]);

  const topCandidates = [...candidates]
    .filter((c) => c.score && c.callStatus === "completed")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const pendingCandidates = candidates.filter((c) => c.callStatus === "pending");

  const startBulkScreening = async () => {
    if (!isConfigured) return router.push("/settings");
    if (pendingCandidates.length === 0) return toast.error("No pending candidates to call.");

    setBulkCalling(true);
    toast.success(
      `Starting AI calls for ${pendingCandidates.length} candidates... This may take a minute.`
    );

    try {
      const res = await fetch("/api/bolna/call-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: pendingCandidates.map((c) => c.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Bulk screening initiated via queue.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to start bulk screening");
    } finally {
      setBulkCalling(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header title="Hiring Dashboard" subtitle="AI-powered hiring workflow" />

      <div className="space-y-6 p-6 pt-16">
        {/* 🔥 GUIDED WORKFLOW (MAIN FIX) */}
        <div className="rounded-3xl border border-gray-200 bg-white p-7 shadow-sm">
          <p className="mb-3 text-xs tracking-widest text-gray-400 uppercase">Workflow</p>

          <h2 className="mb-6 text-2xl font-semibold">Run AI hiring in 3 simple steps</h2>

          <div className="grid gap-4 md:grid-cols-3">
            {/* STEP 1 */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-400">STEP 1</p>
              <h3 className="mb-1 font-semibold">Upload resumes</h3>
              <p className="mb-3 text-xs text-gray-500">Add candidates in bulk</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="rounded-lg bg-teal-600 px-3 py-2 text-sm text-white"
              >
                Upload
              </button>
            </div>

            {/* STEP 2 */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-400">STEP 2</p>
              <h3 className="mb-1 font-semibold">Start AI screening</h3>
              <p className="mb-3 text-xs text-gray-500">AI interviews candidates automatically</p>
              <button
                onClick={startBulkScreening}
                disabled={bulkCalling || pendingCandidates.length === 0}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
              >
                {bulkCalling ? "Processing..." : `Screen (${pendingCandidates.length})`}
              </button>
            </div>

            {/* STEP 3 */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-400">STEP 3</p>
              <h3 className="mb-1 font-semibold">Review & shortlist</h3>
              <p className="mb-3 text-xs text-gray-500">Check scores and select top candidates</p>
              <button
                onClick={() => router.push("/candidates")}
                className="rounded-lg bg-gray-200 px-3 py-2 text-sm"
              >
                View Pipeline
              </button>
            </div>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader className="mx-auto h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : candidates.length === 0 ? (
          /* EMPTY STATE (CLEAR ACTION) */
          <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white py-24 text-center">
            <Bot className="mb-4 h-12 w-12 text-gray-400" />
            <h2 className="mb-2 text-xl font-semibold">No candidates yet</h2>
            <p className="mb-6 text-sm text-gray-500">Upload resumes to start AI screening</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex gap-2 rounded-lg bg-teal-600 px-5 py-3 text-white"
            >
              <FileUp className="h-4 w-4" />
              Upload Resumes
            </button>
          </div>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
              <StatCard label="Candidates" value={stats.totalCandidates} icon={Users} />
              <StatCard label="Completed" value={stats.completedInterviews} icon={CheckCircle} />
              <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} />
              <StatCard label="Avg Score" value={stats.avgScore} icon={Zap} />
              <StatCard label="Active" value={stats.activeCalls} icon={PhoneCall} />
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              {/* TOP CANDIDATES */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Top Candidates</h3>
                    <p className="text-xs text-gray-500">Highest scored candidates</p>
                  </div>
                  <button
                    onClick={() => router.push("/candidates")}
                    className="text-xs text-teal-600"
                  >
                    View All
                  </button>
                </div>

                {topCandidates.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center">
                    <p className="text-sm text-gray-400">No completed screenings yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => router.push(`/candidates/${candidate.id}`)}
                        className="flex w-full items-center justify-between rounded-xl p-3 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <ScoreBadge score={candidate.score} />
                          <div>
                            <p className="text-sm font-medium">{candidate.name}</p>
                            <p className="text-xs text-gray-500">{candidate.role}</p>
                          </div>
                        </div>
                        <DecisionBadge status={candidate.decisionStatus} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PIPELINE */}
              <div className="rounded-3xl border border-gray-200 bg-white p-6">
                <h3 className="mb-4 font-semibold">Pipeline Status</h3>

                <div className="space-y-5">
                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-500">Pending</span>
                      <span>{pendingCandidates.length}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-gray-500"
                        style={{
                          width: `${stats.totalCandidates ? (pendingCandidates.length / stats.totalCandidates) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-500">Processing</span>
                      <span>{stats.activeCalls}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-amber-500"
                        style={{
                          width: `${stats.totalCandidates ? (stats.activeCalls / stats.totalCandidates) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-500">Completed</span>
                      <span>{stats.completedInterviews}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-200">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${stats.totalCandidates ? (stats.completedInterviews / stats.totalCandidates) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddModal && (
        <AddCandidateModal onClose={() => setShowAddModal(false)} onSuccess={fetchData} />
      )}
    </div>
  );
}
