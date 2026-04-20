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
    <div className="flex flex-col min-h-screen">
      <Header title="Hiring Dashboard" subtitle="B2B AI Screening Layer: Upload, Screen, Decide" />

      <div className="pt-16 p-6 space-y-6">
        <div className="bg-gradient-to-br from-indigo-600/15 via-sky-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-3xl p-7">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-xl">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300/70 mb-3">Core Workflow</p>
              <h2 className="text-2xl font-semibold text-white mb-3">Scale your outreach effortlessly.</h2>
              <p className="text-sm text-white/60 leading-relaxed mb-5">
                Bulk upload resumes to generate candidates. Start a bulk AI screening campaign. Review scores and shortlist the best.
              </p>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px]">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-colors shadow-lg"
              >
                <FileUp className="w-4 h-4" />
                Bulk Upload Resumes
              </button>
              
              <button
                onClick={startBulkScreening}
                disabled={bulkCalling || pendingCandidates.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-white/10 hover:bg-white/15 text-white disabled:opacity-50 text-sm font-semibold px-5 py-3 rounded-2xl transition-colors backdrop-blur-sm border border-white/10"
              >
                {bulkCalling ? <Loader className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Screen {pendingCandidates.length} Pending
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-8 h-8 animate-spin mx-auto opacity-50 text-indigo-500" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-[#13131f] border border-white/5 rounded-3xl">
            <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Start your first AI screening</h2>
            <p className="text-sm text-white/50 max-w-sm mb-8 mx-auto">Upload resumes in bulk to extract candidate profiles and trigger intelligent Bolna AI voice interviews instantly.</p>
            <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3.5 rounded-xl transition-all shadow-lg flex items-center gap-2 mx-auto">
              <FileUp className="w-5 h-5" />
              Upload Resumes
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Candidates" value={stats.totalCandidates} icon={Users} color="indigo" />
              <StatCard label="Screened" value={stats.completedInterviews} icon={CheckCircle} color="emerald" />
              <StatCard label="Shortlisted" value={stats.shortlisted} icon={Star} color="cyan" />
              <StatCard label="Avg. Score" value={stats.avgScore} icon={Zap} color="amber" suffix="/100" />
              <StatCard label="Active Calls" value={stats.activeCalls} icon={PhoneCall} color="violet" />
            </div>

            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div className="bg-[#13131f] border border-white/5 rounded-3xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-base font-semibold text-white">Top Candidates</h3>
                    <p className="text-xs text-white/40 mt-1">Highest scored candidates ready for human review.</p>
                  </div>
                  <button onClick={() => router.push("/candidates")} className="text-xs text-indigo-400">View All Pipeline</button>
                </div>
                
                {topCandidates.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                     <p className="text-sm text-white/40">No completed screenings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topCandidates.map(candidate => (
                       <button
                         key={candidate.id}
                         onClick={() => router.push(`/candidates/${candidate.id}`)}
                         className="w-full text-left flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 transition border border-transparent hover:border-white/5"
                       >
                         <div className="flex items-center gap-4">
                           <ScoreBadge score={candidate.score} />
                           <div>
                             <p className="text-sm font-semibold text-white mb-0.5">{candidate.name}</p>
                             <p className="text-xs text-white/40">{candidate.role}</p>
                           </div>
                         </div>
                         <DecisionBadge status={candidate.decisionStatus} />
                       </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-[#13131f] border border-white/5 rounded-3xl p-6">
                 <h3 className="text-base font-semibold text-white mb-4">Pipeline Status</h3>
                 <div className="space-y-5">
                   <div>
                     <div className="flex justify-between text-xs mb-2">
                       <span className="text-white/50">Pending Call</span>
                       <span className="text-white font-medium">{pendingCandidates.length}</span>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-slate-500 rounded-full" style={{width: `${stats.totalCandidates ? (pendingCandidates.length/stats.totalCandidates)*100 : 0}%`}}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs mb-2">
                       <span className="text-white/50">Calling / Processing</span>
                       <span className="text-white font-medium">{stats.activeCalls}</span>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-amber-500 rounded-full" style={{width: `${stats.totalCandidates ? (stats.activeCalls/stats.totalCandidates)*100 : 0}%`}}></div>
                     </div>
                   </div>
                   <div>
                     <div className="flex justify-between text-xs mb-2">
                       <span className="text-white/50">Completed Interviews</span>
                       <span className="text-white font-medium">{stats.completedInterviews}</span>
                     </div>
                     <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{width: `${stats.totalCandidates ? (stats.completedInterviews/stats.totalCandidates)*100 : 0}%`}}></div>
                     </div>
                   </div>
                 </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showAddModal && <AddCandidateModal onClose={() => setShowAddModal(false)} onSuccess={fetchData} />}
    </div>
  );
}
