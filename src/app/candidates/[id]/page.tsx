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
    <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">
  
      <Header title={candidate.name} subtitle={`${candidate.role} · ${candidate.location}`} />
  
      <div className="pt-16 p-6 space-y-5">
  
        {/* TOP */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => router.push("/candidates")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Candidates
          </button>
  
          <div className="flex gap-2 flex-wrap">
            {canStart && (
              <button
                onClick={initiateCall}
                disabled={Boolean(activeCallId)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                <Phone className="w-4 h-4 mr-1 inline" />
                Start AI Call
              </button>
            )}
  
            {canDecide && (
              <>
                <button
                  onClick={() => updateDecision("shortlisted")}
                  className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => updateDecision("rejected")}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm"
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
  
        <div className="grid grid-cols-3 gap-5">
  
          {/* LEFT */}
          <div className="space-y-4">
  
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
  
              <div className="text-center mb-4">
                <div
                  className="w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-xl font-bold text-white mb-3"
                  style={{ background: candidate.avatarColor }}
                >
                  {initials}
                </div>
  
                <h2 className="font-semibold">{candidate.name}</h2>
                <p className="text-sm text-gray-500">{candidate.role}</p>
              </div>
  
              <div className="flex gap-2 flex-wrap mb-4">
                <CallStatusBadge status={candidate.callStatus} />
                <DecisionBadge status={candidate.decisionStatus} />
              </div>
  
              {/* ALL INFO KEPT */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2"><Mail className="w-4 h-4" /> {candidate.email}</div>
                <div className="flex gap-2"><Phone className="w-4 h-4" /> {candidate.phone}</div>
                <div className="flex gap-2"><MapPin className="w-4 h-4" /> {candidate.location}</div>
                <div className="flex gap-2"><Briefcase className="w-4 h-4" /> {candidate.job?.title || "Direct candidate"}</div>
                <div className="flex gap-2"><Calendar className="w-4 h-4" /> Applied {new Date(candidate.appliedAt).toLocaleDateString()}</div>
              </div>
  
              {candidate.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {candidate.tags.map((tag: string) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>
  
            {/* INTERVIEW PROGRESS (UNCHANGED LOGIC) */}
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-xs font-semibold text-gray-500 mb-3">Interview Progress</p>
  
              {candidate.callStatus === "calling" && <p className="text-sm text-amber-500">Calling candidate...</p>}
              {candidate.callStatus === "processing" && <p className="text-sm text-blue-500">AI is interviewing...</p>}
              {candidate.callStatus === "failed" && <p className="text-sm text-red-500">Call failed. Try again.</p>}
              {candidate.callStatus === "pending" && <p className="text-sm text-gray-500">Ready to start call</p>}
              {candidate.callStatus === "completed" && <p className="text-sm text-emerald-500">Interview completed</p>}
            </div>
  
          </div>
  
          {/* CENTER */}
          <div className="space-y-4">
  
            {candidate.score ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-5">
  
                <div className="flex justify-between mb-4">
                  <p className="text-xs text-gray-500">Final Score</p>
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
                          <span className="text-gray-500">{item.label}</span>
                          <span>{item.value || 0}</span>
                        </div>
                        <div className="h-1.5 bg-gray-200 rounded-full">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${item.value || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center text-gray-500">
                No interview result yet
              </div>
            )}
  
            {/* AI SUMMARY FULLY KEPT */}
            {sr && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-2">AI Summary</h3>
                <p className="text-sm text-gray-600">{sr.summary}</p>
  
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-400">Availability</p>
                    <p>{sr.availability || "N/A"}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-400">Salary</p>
                    <p>{sr.salaryExpectation || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}
  
          </div>
  
          {/* RIGHT */}
          <div className="space-y-4">
  
            {/* RADAR KEPT */}
            {sr && radarData.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <h3 className="text-sm font-semibold mb-3">Interview Radar</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <Radar dataKey="value" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
  
            {/* TRANSCRIPT FULLY KEPT */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4">
              <h3 className="text-sm font-semibold mb-3">Transcript Highlights</h3>
  
              {candidate.transcript?.length ? (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {candidate.transcript.map((msg: any, i: number) => (
                    <div key={i} className="text-sm text-gray-700">
                      <strong>{msg.role === "agent" ? "AI" : "Candidate"}:</strong> {msg.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">
                  Transcript will appear after interview
                </p>
              )}
            </div>
  
          </div>
  
        </div>
      </div>
    </div>
  );
}
