"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Phone, Mail, MapPin, Briefcase, Calendar, MessageSquare, Star, CheckCircle, XCircle, AlertCircle, Download } from "lucide-react";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import { StatusBadge, TagBadge } from "@/components/UI/Badge";
import ScoreRing from "@/components/UI/ScoreRing";
import { cn } from "@/utils/cn";
import toast from "react-hot-toast";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function CandidateDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { candidates, initiateCall, updateCandidateStatus, activeCallId } = useApp();
  const candidate = candidates.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Candidate Not Found" />
        <div className="pt-16 flex items-center justify-center h-full">
          <div className="text-center text-white/40">
            <p className="mb-4">Candidate not found</p>
            <button onClick={() => router.push("/candidates")} className="text-indigo-400 hover:text-indigo-300">← Back to candidates</button>
          </div>
        </div>
      </div>
    );
  }

  const sr = candidate.screeningResult;
  const radarData = sr ? [
    { subject: "Technical", value: sr.technicalScore },
    { subject: "Communication", value: sr.communicationScore },
    { subject: "Problem Solving", value: sr.problemSolvingScore },
    { subject: "Culture Fit", value: sr.cultureFitScore },
  ] : [];

  const initials = candidate.name.split(" ").map((n) => n[0]).join("");

  return (
    <div className="flex flex-col min-h-screen">
      <Header title={candidate.name} subtitle={`${candidate.role} · ${candidate.location}`} />

      <div className="pt-16 p-6 space-y-5">
        {/* Back + Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push("/candidates")}
            className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </button>
          <div className="flex items-center gap-2">
            {candidate.status === "calling" && process.env.NODE_ENV === "development" && (
              <button
                onClick={async () => {
                  const toastId = toast.loading("Simulating Webhook Completion...");
                  try {
                    const res = await fetch("/api/test/simulate", { 
                      method: "POST", 
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ candidateId: candidate.id }) 
                    });
                    if (res.ok) {
                      toast.success("Simulation Webhook Fired!", { id: toastId });
                      window.location.reload();
                    } else { throw new Error("Simulation failed") }
                  } catch (e: any) {
                    toast.error(e.message, { id: toastId });
                  }
                }}
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-pink-500/50 bg-pink-600/20 text-pink-400 hover:bg-pink-600/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]"
              >
                Mock Webhook Response
              </button>
            )}
            {(candidate.status === "pending" || candidate.status === "scheduled" || candidate.status === "failed") && (
              <button
                onClick={() => initiateCall(candidate.id)}
                disabled={activeCallId !== null}
                className={cn(
                  "flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all",
                  activeCallId
                    ? "bg-white/5 text-white/30 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                )}
              >
                <Phone className="w-4 h-4" />
                Start AI Screening
              </button>
            )}
            {candidate.status === "completed" && (
              <>
                <button
                  onClick={() => updateCandidateStatus(candidate.id, "shortlisted")}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 transition-all"
                >
                  <CheckCircle className="w-4 h-4" /> Shortlist
                </button>
                <button
                  onClick={() => updateCandidateStatus(candidate.id, "rejected")}
                  className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30 transition-all"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-5">
          {/* Left: Profile */}
          <div className="space-y-4">
            {/* Profile Card */}
            <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
              <div className="flex flex-col items-center text-center mb-4">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white mb-3 shadow-lg"
                  style={{ background: candidate.avatarColor }}
                >
                  {initials}
                </div>
                <h2 className="text-base font-semibold text-white">{candidate.name}</h2>
                <p className="text-sm text-white/40 mt-0.5">{candidate.role}</p>
                <div className="mt-2">
                  <StatusBadge status={candidate.status} />
                </div>
              </div>

              <div className="space-y-2.5 mt-4">
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
                  {candidate.experience} years experience
                </div>
                <div className="flex items-center gap-2.5 text-sm text-white/50">
                  <Calendar className="w-4 h-4 text-white/30" />
                  Applied {candidate.appliedAt}
                </div>
              </div>

              {candidate.tags && candidate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {candidate.tags.map((t) => <TagBadge key={t} tag={t} />)}
                </div>
              )}
            </div>

            {/* Score */}
            {candidate.score && (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5 flex flex-col items-center">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">AI Score</p>
                <ScoreRing score={candidate.score} size={100} strokeWidth={8} />
                {sr && (
                  <div className="w-full mt-4 space-y-2">
                    {[
                      { label: "Technical", value: sr.technicalScore },
                      { label: "Communication", value: sr.communicationScore },
                      { label: "Problem Solving", value: sr.problemSolvingScore },
                      { label: "Culture Fit", value: sr.cultureFitScore },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-white/40">{item.label}</span>
                          <span className="text-white/70 font-medium">{item.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Middle: Screening Results */}
          <div className="space-y-4">
            {sr ? (
              <>
                {/* Recommendation */}
                <div className={cn(
                  "rounded-2xl p-4 border",
                  sr.recommendation === "Shortlist" ? "bg-emerald-500/10 border-emerald-500/20" :
                  sr.recommendation === "Reject" ? "bg-rose-500/10 border-rose-500/20" :
                  "bg-amber-500/10 border-amber-500/20"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    {sr.recommendation === "Shortlist" ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                     sr.recommendation === "Reject" ? <XCircle className="w-4 h-4 text-rose-400" /> :
                     <AlertCircle className="w-4 h-4 text-amber-400" />}
                    <p className="text-sm font-semibold text-white">AI Recommendation: {sr.recommendation}</p>
                  </div>
                  <p className="text-xs text-white/50 leading-relaxed">{sr.summary}</p>
                </div>

                {/* Key details */}
                <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Call Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Availability</span>
                      <span className="text-white font-medium">{sr.availability}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/40">Salary Expectation</span>
                      <span className="text-white font-medium">{sr.salaryExpectation}</span>
                    </div>
                  </div>
                </div>

                {/* Strengths & Concerns */}
                <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4 space-y-4">
                  <div>
                    <h3 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">✅ Strengths</h3>
                    <ul className="space-y-1">
                      {sr.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <span className="text-emerald-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2">⚠️ Concerns</h3>
                    <ul className="space-y-1">
                      {sr.concerns.map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <span className="text-rose-500 mt-0.5">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Key Skills */}
                <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Key Skills Detected</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {sr.keySkills.map((s) => <TagBadge key={s} tag={s} />)}
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                <Phone className="w-10 h-10 text-white/20 mb-3" />
                <p className="text-sm font-medium text-white/50 mb-1">No screening data yet</p>
                <p className="text-xs text-white/30 mb-4">Start an AI screening call to see results here</p>
                {(candidate.status === "pending" || candidate.status === "scheduled") && (
                  <button
                    onClick={() => initiateCall(candidate.id)}
                    disabled={activeCallId !== null}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Start Screening Call
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right: Radar + Transcript */}
          <div className="space-y-4">
            {sr && radarData.length > 0 && (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Skill Radar</h3>
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

            {/* Transcript */}
            {candidate.transcript && candidate.transcript.length > 0 && (
              <div className="bg-[#13131f] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Call Transcript
                  </h3>
                  <button className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300">
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
                <div className="space-y-3 max-h-72 overflow-y-auto pr-1 custom-scroll">
                  {candidate.transcript.map((msg, i) => (
                    <div key={i} className={cn("flex gap-2.5", msg.role === "candidate" && "flex-row-reverse")}>
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5",
                        msg.role === "agent"
                          ? "bg-indigo-600/30 text-indigo-400"
                          : "bg-white/10 text-white/60"
                      )}>
                        {msg.role === "agent" ? "AI" : initials}
                      </div>
                      <div className={cn("flex-1", msg.role === "candidate" && "flex flex-col items-end")}>
                        <div className={cn(
                          "text-xs leading-relaxed p-2.5 rounded-xl max-w-full",
                          msg.role === "agent"
                            ? "bg-indigo-600/10 text-white/70 border border-indigo-500/10"
                            : "bg-white/5 text-white/70 border border-white/5"
                        )}>
                          {msg.text}
                        </div>
                        <p className="text-[9px] text-white/20 mt-1 px-0.5">{msg.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
