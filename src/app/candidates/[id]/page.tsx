"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, Calendar, Loader, Mail, MapPin, Phone } from "lucide-react";
import Header from "@/components/Layout/Header";
import { CallStatusBadge, DecisionBadge, ScoreBadge, TagBadge } from "@/components/UI/Badge";
import ScoreRing from "@/components/UI/ScoreRing";
import toast from "react-hot-toast";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
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
      toast.success(
        decisionStatus === "shortlisted" ? "Candidate shortlisted" : "Candidate rejected"
      );
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
      // Real status transitions are driven by the Bolna webhook (polled below).
      fetchCandidate();
    } catch (error: any) {
      toast.error(error.message || "Call failed. Try again.", { id: toastId });
      setCandidate((prev: any) => ({ ...prev, callStatus: "failed" }));
      await fetch(`/api/candidates/${candidate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callStatus: "failed" }),
      });
    } finally {
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
      <div className="flex min-h-screen flex-col">
        <Header title="Loading..." />
        <div className="flex items-center justify-center pt-32">
          <Loader className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Candidate Not Found" />
        <div className="flex h-full items-center justify-center pt-16">
          <div className="text-center text-white/40">
            <p className="mb-4">Candidate not found</p>
            <button
              onClick={() => router.push("/candidates")}
              className="text-indigo-400 hover:text-indigo-300"
            >
              Back to candidates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const sr = candidate.screeningResult || null;
  const radarData = sr
    ? [
        { subject: "Technical", value: sr.technicalScore || 0 },
        { subject: "Communication", value: sr.communicationScore || 0 },
        { subject: "Problem Solving", value: sr.problemSolvingScore || 0 },
        { subject: "Culture Fit", value: sr.cultureFitScore || 0 },
      ]
    : [];

  const initials = candidate.name
    .split(" ")
    .map((n: string) => n[0])
    .join("");
  const canStart = candidate.callStatus === "pending" || candidate.callStatus === "failed";
  const canDecide = candidate.callStatus === "completed";

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header title={candidate.name} subtitle={`${candidate.role} · ${candidate.location}`} />

      <div className="space-y-5 p-6 pt-16">
        {/* TOP */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => router.push("/candidates")}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Candidates
          </button>

          <div className="flex flex-wrap gap-2">
            {canStart && (
              <button
                onClick={initiateCall}
                disabled={Boolean(activeCallId)}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white hover:bg-teal-700"
              >
                <Phone className="mr-1 inline h-4 w-4" />
                Start AI Call
              </button>
            )}

            {canDecide && (
              <>
                <button
                  onClick={() => updateDecision("shortlisted")}
                  className="rounded-lg bg-emerald-500 px-4 py-2 text-sm text-white"
                >
                  Shortlist
                </button>
                <button
                  onClick={() => updateDecision("rejected")}
                  className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white"
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
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-4 text-center">
                <div
                  className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-xl text-xl font-bold text-white"
                  style={{ background: candidate.avatarColor }}
                >
                  {initials}
                </div>

                <h2 className="font-semibold">{candidate.name}</h2>
                <p className="text-sm text-gray-500">{candidate.role}</p>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                <CallStatusBadge status={candidate.callStatus} />
                <DecisionBadge status={candidate.decisionStatus} />
              </div>

              {/* ALL INFO KEPT */}
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex gap-2">
                  <Mail className="h-4 w-4" /> {candidate.email}
                </div>
                <div className="flex gap-2">
                  <Phone className="h-4 w-4" /> {candidate.phone}
                </div>
                <div className="flex gap-2">
                  <MapPin className="h-4 w-4" /> {candidate.location}
                </div>
                <div className="flex gap-2">
                  <Briefcase className="h-4 w-4" /> {candidate.job?.title || "Direct candidate"}
                </div>
                <div className="flex gap-2">
                  <Calendar className="h-4 w-4" /> Applied{" "}
                  {new Date(candidate.appliedAt).toLocaleDateString()}
                </div>
              </div>

              {candidate.tags?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {candidate.tags.map((tag: string) => (
                    <TagBadge key={tag} tag={tag} />
                  ))}
                </div>
              )}
            </div>

            {/* INTERVIEW PROGRESS (UNCHANGED LOGIC) */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="mb-3 text-xs font-semibold text-gray-500">Interview Progress</p>

              {candidate.callStatus === "calling" && (
                <p className="text-sm text-amber-500">Calling candidate...</p>
              )}
              {candidate.callStatus === "processing" && (
                <p className="text-sm text-blue-500">AI is interviewing...</p>
              )}
              {candidate.callStatus === "failed" && (
                <p className="text-sm text-red-500">Call failed. Try again.</p>
              )}
              {candidate.callStatus === "pending" && (
                <p className="text-sm text-gray-500">Ready to start call</p>
              )}
              {candidate.callStatus === "completed" && (
                <p className="text-sm text-emerald-500">Interview completed</p>
              )}
            </div>
          </div>

          {/* CENTER */}
          <div className="space-y-4">
            {candidate.score ? (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <div className="mb-4 flex justify-between">
                  <p className="text-xs text-gray-500">Final Score</p>
                  <ScoreBadge score={candidate.score} />
                </div>

                <div className="mb-4 flex justify-center">
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
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-gray-500">{item.label}</span>
                          <span>{item.value || 0}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200">
                          <div
                            className="h-full rounded-full bg-teal-500"
                            style={{ width: `${item.value || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500">
                No interview result yet
              </div>
            )}

            {/* AI SUMMARY FULLY KEPT */}
            {sr && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="mb-2 text-sm font-semibold">AI Summary</h3>
                <p className="text-sm text-gray-600">{sr.summary}</p>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-400">Availability</p>
                    <p>{sr.availability || "N/A"}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
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
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold">Interview Radar</h3>
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
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold">Transcript Highlights</h3>

              {candidate.transcript?.length ? (
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {candidate.transcript.map((msg: any, i: number) => (
                    <div key={i} className="text-sm text-gray-700">
                      <strong>{msg.role === "agent" ? "AI" : "Candidate"}:</strong> {msg.text}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Transcript will appear after interview</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
