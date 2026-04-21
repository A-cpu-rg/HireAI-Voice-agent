"use client";

import { CheckCircle, Loader, PhoneCall, Star, Users, Zap, Play, FileUp, Bot } from "lucide-react";
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
    const completedInterviews = candidates.filter((candidate) => candidate.callStatus === "completed").length;
    const shortlisted = candidates.filter((candidate) => candidate.decisionStatus === "shortlisted").length;
    const scores = candidates.filter((candidate) => candidate.score).map((candidate) => candidate.score as number);
    const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    const activeCalls = candidates.filter((candidate) => candidate.callStatus === "calling" || candidate.callStatus === "processing").length;

    return { totalCandidates, completedInterviews, shortlisted, avgScore, activeCalls };
  }, [candidates, callLogs]);

  const topCandidates = [...candidates]
    .filter(c => c.score && c.callStatus === 'completed')
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const pendingCandidates = candidates.filter(c => c.callStatus === 'pending');

  const startBulkScreening = async () => {
    if (!isConfigured) return router.push("/settings");
    if (pendingCandidates.length === 0) return toast.error("No pending candidates to call.");
    
    setBulkCalling(true);
    toast.success(`Starting AI calls for ${pendingCandidates.length} candidates... This may take a minute.`);
    
    try {
      const res = await fetch("/api/bolna/call-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateIds: pendingCandidates.map(c => c.id) })
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
    <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">
  
      <Header title="Hiring Dashboard" subtitle="AI-powered hiring workflow" />
  
      <div className="pt-16 p-6 space-y-6">
  
        {/* 🔥 GUIDED WORKFLOW (MAIN FIX) */}
        <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
  
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">
            Workflow
          </p>
  
          <h2 className="text-2xl font-semibold mb-6">
            Run AI hiring in 3 simple steps
          </h2>
  
          <div className="grid md:grid-cols-3 gap-4">
  
            {/* STEP 1 */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 mb-1">STEP 1</p>
              <h3 className="font-semibold mb-1">Upload resumes</h3>
              <p className="text-xs text-gray-500 mb-3">
                Add candidates in bulk
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="text-sm bg-teal-600 text-white px-3 py-2 rounded-lg"
              >
                Upload
              </button>
            </div>
  
            {/* STEP 2 */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 mb-1">STEP 2</p>
              <h3 className="font-semibold mb-1">Start AI screening</h3>
              <p className="text-xs text-gray-500 mb-3">
                AI interviews candidates automatically
              </p>
              <button
                onClick={startBulkScreening}
                disabled={bulkCalling || pendingCandidates.length === 0}
                className="text-sm bg-gray-900 text-white px-3 py-2 rounded-lg disabled:opacity-50"
              >
                {bulkCalling ? "Processing..." : `Screen (${pendingCandidates.length})`}
              </button>
            </div>
  
            {/* STEP 3 */}
            <div className="p-4 rounded-2xl border border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-400 mb-1">STEP 3</p>
              <h3 className="font-semibold mb-1">Review & shortlist</h3>
              <p className="text-xs text-gray-500 mb-3">
                Check scores and select top candidates
              </p>
              <button
                onClick={() => router.push("/candidates")}
                className="text-sm bg-gray-200 px-3 py-2 rounded-lg"
              >
                View Pipeline
              </button>
            </div>
  
          </div>
        </div>
  
        {/* LOADING */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-8 h-8 animate-spin mx-auto text-gray-400" />
          </div>
        ) : candidates.length === 0 ? (
  
          /* EMPTY STATE (CLEAR ACTION) */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white border border-gray-200 rounded-3xl">
            <Bot className="w-12 h-12 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              No candidates yet
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Upload resumes to start AI screening
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-600 text-white px-5 py-3 rounded-lg flex gap-2"
            >
              <FileUp className="w-4 h-4" />
              Upload Resumes
            </button>
          </div>
  
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Candidates" value={stats.totalCandidates} icon={Users} />
              <StatCard label="Completed" value={stats.completedInterviews} icon={CheckCircle} />
              <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} />
              <StatCard label="Avg Score" value={stats.avgScore} icon={Zap} />
              <StatCard label="Active" value={stats.activeCalls} icon={PhoneCall} />
            </div>
  
            <div className="grid grid-cols-[2fr_1fr] gap-6">
  
              {/* TOP CANDIDATES */}
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-semibold">Top Candidates</h3>
                    <p className="text-xs text-gray-500">
                      Highest scored candidates
                    </p>
                  </div>
                  <button
                    onClick={() => router.push("/candidates")}
                    className="text-xs text-teal-600"
                  >
                    View All
                  </button>
                </div>
  
                {topCandidates.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-gray-200 rounded-2xl">
                    <p className="text-sm text-gray-400">
                      No completed screenings yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => router.push(`/candidates/${candidate.id}`)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition"
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
              <div className="bg-white border border-gray-200 rounded-3xl p-6">
                <h3 className="font-semibold mb-4">Pipeline Status</h3>
  
                <div className="space-y-5">
  
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Pending</span>
                      <span>{pendingCandidates.length}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-gray-500 rounded-full"
                        style={{
                          width: `${stats.totalCandidates ? (pendingCandidates.length / stats.totalCandidates) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
  
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Processing</span>
                      <span>{stats.activeCalls}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-amber-500 rounded-full"
                        style={{
                          width: `${stats.totalCandidates ? (stats.activeCalls / stats.totalCandidates) * 100 : 0}%`
                        }}
                      />
                    </div>
                  </div>
  
                  <div>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="text-gray-500">Completed</span>
                      <span>{stats.completedInterviews}</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{
                          width: `${stats.totalCandidates ? (stats.completedInterviews / stats.totalCandidates) * 100 : 0}%`
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
        <AddCandidateModal
          onClose={() => setShowAddModal(false)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
