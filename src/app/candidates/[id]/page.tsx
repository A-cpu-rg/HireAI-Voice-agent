"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Loader, Mail, MapPin, MessageSquare, Phone, XCircle } from "lucide-react";
import Header from "@/components/Layout/Header";
import { CallStatusBadge, DecisionBadge, ScoreBadge, TagBadge } from "@/components/UI/Badge";
import ScoreRing from "@/components/UI/ScoreRing";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";

export default function CandidateDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { isConfigured, activeCallId, setActiveCallId } = useApp();

  const [candidate, setCandidate] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchCandidate = async () => {
    try {
      const res = await fetch(`/api/candidates/${id}`);
      if (res.ok) {
        const json = await res.json();
        setCandidate(json.candidate);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidate();
    const interval = setInterval(fetchCandidate, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const updateDecision = async (decisionStatus: "shortlisted" | "rejected") => {
    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionStatus }),
      });
      if (!res.ok) {
        throw new Error("Failed to update decision");
      }
      setCandidate((prev: any) => ({ ...prev, decisionStatus }));
      toast.success(decisionStatus === "shortlisted" ? "Candidate shortlisted" : "Candidate rejected");
    } catch {
      toast.error("Failed to update decision");
    }
  };

  const startLiveCall = async () => {
    setCandidate((prev: any) => ({ ...prev, callStatus: "calling" }));
    setActiveCallId(candidate.id);
    const toastId = toast.loading("Calling candidate...");

    try {
      const response = await fetch("/api/bolna/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: candidate.id }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).error);
      }

      toast.success("AI is interviewing the candidate...", { id: toastId });
      setTimeout(async () => {
        await fetch(`/api/candidates/${candidate.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ callStatus: "processing" }),
        });
        fetchCandidate();
      }, 3000);
    } catch (error: any) {
      toast.error(error.message || "Call failed. Try again.", { id: toastId });
      setCandidate((prev: any) => ({ ...prev, callStatus: "failed" }));
      await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callStatus: "failed" }),
      });
      setActiveCallId(null);
    }
  };

  const initiateCall = async () => {
    if (!isConfigured) {
      toast.error("Connect Bolna in Settings before starting a real AI call.");
      router.push("/settings");
      return;
    }
    await startLiveCall();
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Loading..." />
        <div className="pt-32 flex items-center justify-center">
          <Loader className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Candidate Not Found" />
        <div className="pt-16 flex items-center justify-center h-full">
          <div className="text-center text-white/40">
            <p className="mb-4">Candidate not found</p>
            <button onClick={() => router.push("/candidates")} className="text-indigo-400 hover:text-indigo-300">Back to candidates</button>
          </div>
        </div>
      </div>
    );
  }

  const sr = candidate.screeningResult || null;
  const radarData = sr ? [
    { subject: "Technical", value: sr.technicalScore || 0 },
    { subject: "Communication", value: sr.communicationScore || 0 },
    { subject: "Problem Solving", value: sr.problemSolvingScore || 0 },
    { subject: "Culture Fit", value: sr.cultureFitScore || 0 },
  ] : [];

  const initials = candidate.name.split(" ").map((n: string) => n[0]).join("");
  const canStart = candidate.callStatus === "pending" || candidate.callStatus === "failed";
  const canDecide = candidate.callStatus === "completed";

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={candidate.name} subtitle={`${candidate.role} · ${candidate.location}`} />

      <div className="pt-16 p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button onClick={() => router.push("/candidates")} className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            {canStart && (
              <button
                onClick={initiateCall}
                disabled={Boolean(activeCallId)}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all",
                  activeCallId ? "bg-white/5 text-white/30 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                )}
              >
                <Phone className="w-4 h-4" />
                Start AI Call
              </button>
            )}
            {canDecide && (
              <>
                <button
                  onClick={() => updateDecision("shortlisted")}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
                >
                  <CheckCircle className="w-4 h-4" />
                  Shortlist
                </button>
                <button
                  onClick={() => updateDecision("rejected")}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          <div className="space-y-4">
            <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg" style={{ background: candidate.avatarColor }}>
                  {initials}
                </div>
                <h2 className="text-base font-semibold text-white">{candidate.name}</h2>
                <p className="text-sm text-white/40 mt-0.5">{candidate.role}</p>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <CallStatusBadge status={candidate.callStatus} />
                <DecisionBadge status={candidate.decisionStatus} />
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Mail className="w-4 h-4 text-white/30" />
                  <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Phone className="w-4 h-4 text-white/30" />
                  {candidate.phone}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <MapPin className="w-4 h-4 text-white/30" />
                  {candidate.location}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Briefcase className="w-4 h-4 text-white/30" />
                  {candidate.job?.title || "Direct candidate"}
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Calendar className="w-4 h-4 text-white/30" />
                  Applied {new Date(candidate.appliedAt).toLocaleDateString()}
                </div>
              </div>

              {candidate.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {candidate.tags.map((tag: string) => <TagBadge key={tag} tag={tag} />)}
                </div>
              )}
            </div>

            <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
              <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Interview Progress</p>
              {candidate.callStatus === "calling" && <p className="text-sm text-amber-400">Calling candidate...</p>}
              {candidate.callStatus === "processing" && <p className="text-sm text-blue-400">AI is interviewing and processing results...</p>}
              {candidate.callStatus === "failed" && <p className="text-sm text-rose-400">Call failed. Try again.</p>}
              {candidate.callStatus === "pending" && <p className="text-sm text-white/50">Ready to start the first AI call.</p>}
              {candidate.callStatus === "completed" && <p className="text-sm text-emerald-400">Interview completed. Review the summary and choose a decision.</p>}
            </div>
          </div>

          <div className="space-y-4">
            {candidate.score ? (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Final Score</p>
                  <ScoreBadge score={candidate.score} />
                </div>
                <div className="flex justify-center mb-4">
                  <ScoreRing score={candidate.score} size={110} strokeWidth={8} />
                </div>
                {sr && (
                  <div className="space-y-2">
                    {[
                      { label: "Technical", value: sr.technicalScore },
                      { label: "Communication", value: sr.communicationScore },
                      { label: "Problem Solving", value: sr.problemSolvingScore },
                      { label: "Culture Fit", value: sr.cultureFitScore },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40">{item.label}</span>
                          <span className="text-white/70">{item.value || 0}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: `${item.value || 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-8 text-center">
                <Phone className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-sm font-medium text-white/50 mb-1">No interview result yet</p>
                <p className="text-xs text-white/30">Start the AI call to generate score, summary, and transcript highlights.</p>
              </div>
            )}

            {sr && (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">AI Summary</h3>
                <p className="text-sm text-white/65 leading-relaxed">{sr.summary}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/35 text-xs mb-1">Availability</p>
                    <p className="text-white">{sr.availability || "N/A"}</p>
                  </div>
                  <div className="bg-white/[0.03] rounded-xl p-3">
                    <p className="text-white/35 text-xs mb-1">Salary Expectation</p>
                    <p className="text-white">{sr.salaryExpectation || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {sr && radarData.length > 0 && (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Interview Radar</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
                    <Radar name="Score" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }}
                      labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <MessageSquare className="w-3.5 h-3.5 text-white/40" />
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Transcript Highlights</h3>
              </div>
              {candidate.transcript?.length ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {candidate.transcript.map((msg: any, index: number) => (
                    <div key={index} className={cn("flex gap-2.5", msg.role === "candidate" && "flex-row-reverse")}>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5",
                        msg.role === "agent" ? "bg-indigo-600/30 text-indigo-400" : "bg-white/10 text-white/60"
                      )}>
                        {msg.role === "agent" ? "AI" : initials}
                      </div>
                      <div className={cn("flex-1", msg.role === "candidate" && "flex flex-col items-end")}>
                        <div className={cn(
                          "text-xs leading-relaxed p-2.5 rounded-xl max-w-full",
                          msg.role === "agent" ? "bg-indigo-600/10 text-white/70 border border-indigo-500/10" : "bg-white/5 text-white/70 border border-white/5"
                        )}>
                          {msg.text}
                        </div>
                        <p className="text-[9px] text-white/20 mt-1 px-0.5">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/35">Transcript highlights will appear here after the interview completes.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
