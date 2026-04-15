"use client";

import { CheckCircle, Loader, PhoneCall, Plus, Star, Users, Zap } from "lucide-react";
import Header from "@/components/Layout/Header";
import StatCard from "@/components/UI/StatCard";
import { CallStatusBadge, DecisionBadge, ScoreBadge } from "@/components/UI/Badge";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import toast from "react-hot-toast";

export default function Dashboard() {
  const { isConfigured } = useApp();
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [candRes, callRes] = await Promise.all([
        fetch("/api/candidates").then((res) => res.json()),
        fetch("/api/calls").then((res) => res.json()),
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
    const activeCalls = callLogs.filter((call) => call.status === "calling" || call.status === "processing").length;

    return { totalCandidates, completedInterviews, shortlisted, avgScore, activeCalls };
  }, [candidates, callLogs]);

  const recentCandidates = [...candidates]
    .sort((a, b) => new Date(b.completedAt || b.appliedAt).getTime() - new Date(a.completedAt || a.appliedAt).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Hiring automation powered by Bolna, designed for recruiter decisions" />

      <div className="pt-16 p-6 space-y-6">
        <div className="bg-gradient-to-br from-indigo-600/15 via-sky-500/10 to-emerald-500/10 border border-indigo-500/20 rounded-3xl p-7">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300/70 mb-3">HireAI MVP</p>
              <h2 className="text-3xl font-semibold text-white mb-3">Add a candidate, start an AI call, and get a clear hiring summary.</h2>
              <p className="text-sm text-white/60 leading-relaxed">
                HireAI is the recruiter workflow layer. Bolna handles the voice call. HireAI helps you move from candidate intake to scored interview result to shortlist or reject, without jumping across tools.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => router.push("/settings")}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-2xl transition-colors"
              >
                <Zap className="w-4 h-4" />
                Connect Bolna
              </button>
              <button
                onClick={() => router.push("/candidates")}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-sm font-medium px-5 py-3 rounded-2xl transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Candidate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { step: "1", title: "Connect Bolna", desc: isConfigured ? "Connection active" : "Setup required" },
              { step: "2", title: "Add Candidate", desc: "Directly or under a job" },
              { step: "3", title: "Start AI Call", desc: "Calling, then processing" },
              { step: "4", title: "Review Result", desc: "Score, summary, transcript" },
            ].map((item) => (
              <div key={item.step} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-bold tracking-widest text-indigo-300 mb-2">STEP {item.step}</div>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="text-xs text-white/45 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
            <p>Loading dashboard...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard label="Total Candidates" value={stats.totalCandidates} icon={Users} color="indigo" />
              <StatCard label="Completed Interviews" value={stats.completedInterviews} icon={PhoneCall} color="cyan" />
              <StatCard label="Shortlisted" value={stats.shortlisted} icon={CheckCircle} color="emerald" />
              <StatCard label="Avg. Score" value={stats.avgScore} icon={Star} color="amber" suffix="/100" />
              <StatCard label="Active Calls" value={stats.activeCalls} icon={Zap} color="violet" />
            </div>

            {candidates.length === 0 ? (
              <div className="bg-[#13131f] border border-white/5 rounded-3xl p-10 text-center">
                <Users className="w-12 h-12 text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No candidates yet</h3>
                <p className="text-sm text-white/45 max-w-xl mx-auto mb-6">
                  Add your first candidate, connect Bolna, and launch a real screening workflow from one place.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => router.push("/settings")} className="bg-white text-black px-4 py-2.5 rounded-xl text-sm font-semibold">Connect Bolna</button>
                  <button onClick={() => router.push("/candidates")} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold">Add Candidate</button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Recent Candidate Activity</h3>
                    <button onClick={() => router.push("/candidates")} className="text-xs text-indigo-400 hover:text-indigo-300">View all</button>
                  </div>
                  <div className="space-y-3">
                    {recentCandidates.map((candidate) => (
                      <button
                        key={candidate.id}
                        onClick={() => router.push(`/candidates/${candidate.id}`)}
                        className="w-full text-left flex items-center gap-3 group"
                      >
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: candidate.avatarColor }}>
                          {candidate.name.split(" ").map((part: string) => part[0]).join("")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{candidate.name}</p>
                          <p className="text-xs text-white/40 truncate">{candidate.role}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <CallStatusBadge status={candidate.callStatus} />
                          <DecisionBadge status={candidate.decisionStatus} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-white">Decision Queue</h3>
                    <button onClick={() => router.push("/candidates")} className="text-xs text-indigo-400 hover:text-indigo-300">Open pipeline</button>
                  </div>
                  <div className="space-y-3">
                    {candidates
                      .filter((candidate) => candidate.callStatus === "completed")
                      .slice(0, 5)
                      .map((candidate) => (
                        <button
                          key={candidate.id}
                          onClick={() => router.push(`/candidates/${candidate.id}`)}
                          className="w-full text-left flex items-center gap-3 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{candidate.name}</p>
                            <p className="text-xs text-white/40 truncate">{candidate.screeningResult?.summary || "Interview completed and ready for review."}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {candidate.score && <ScoreBadge score={candidate.score} />}
                            <DecisionBadge status={candidate.decisionStatus} />
                          </div>
                        </button>
                      ))}
                    {candidates.filter((candidate) => candidate.callStatus === "completed").length === 0 && (
                      <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center">
                        <p className="text-sm text-white/45">No completed interviews yet. Start the first AI call to generate decision-ready results.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
