"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import Header from "@/components/Layout/Header";
import { TrendingUp, Users, Clock, Zap, Loader } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981"];

const MANUAL_REVIEW_MINUTES = 180;
const MANUAL_SCREENING_COST = 450;
const AI_SCREENING_COST = 12;

function parseDurationToMinutes(duration: string | null | undefined) {
  if (!duration) return 0;

  const minutesMatch = duration.match(/(\d+)\s*m/i);
  const secondsMatch = duration.match(/(\d+)\s*s/i);

  const minutes = minutesMatch ? Number(minutesMatch[1]) : 0;
  const seconds = secondsMatch ? Number(secondsMatch[1]) : 0;

  return minutes + seconds / 60;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">{p.name}: {p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Analytics() {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/candidates').then(res => res.json()),
      fetch('/api/calls').then(res => res.json()),
    ]).then(([candData, callData]) => {
      setCandidates(candData.data || []);
      setCallLogs(callData.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const analytics = useMemo(() => {
    const completedCalls = callLogs.filter((call) => call.status === "completed");
    const completedCandidates = candidates.filter((candidate) => candidate.callStatus === "completed");
    const shortlistedCandidates = candidates.filter((candidate) => candidate.decisionStatus === "shortlisted");
    const rejectedCandidates = candidates.filter((candidate) => candidate.decisionStatus === "rejected");
    const pendingCandidates = candidates.filter((candidate) => candidate.callStatus === "pending");
    const processingCandidates = candidates.filter((candidate) => candidate.callStatus === "processing");
    const callingCandidates = candidates.filter((candidate) => candidate.callStatus === "calling");

    const averageDurationMinutes = completedCalls.length
      ? completedCalls.reduce((sum, call) => sum + parseDurationToMinutes(call.duration), 0) / completedCalls.length
      : 0;

    const avgDurationLabel = averageDurationMinutes
      ? `${averageDurationMinutes.toFixed(1)} min`
      : "0.0 min";

    const humanHoursSaved = completedCalls.length
      ? Math.round(((MANUAL_REVIEW_MINUTES - averageDurationMinutes) * completedCalls.length) / 60)
      : 0;

    const averageScore = completedCandidates.length
      ? Math.round(
          completedCandidates.reduce((sum, candidate) => sum + (candidate.score || 0), 0) / completedCandidates.length
        )
      : 0;

    const completionRate = callLogs.length
      ? Math.round((completedCalls.length / callLogs.length) * 100)
      : 0;

    const statusPie = [
      { name: "Completed", value: completedCandidates.length },
      { name: "Pending", value: pendingCandidates.length },
      { name: "Calling", value: callingCandidates.length },
      { name: "Processing", value: processingCandidates.length },
      { name: "Shortlisted", value: shortlistedCandidates.length },
      { name: "Rejected", value: rejectedCandidates.length },
    ].filter((item) => item.value > 0);

    const scoreDistribution = [
      { range: "0-30", count: candidates.filter((c) => typeof c.score === "number" && c.score <= 30).length },
      { range: "31-50", count: candidates.filter((c) => typeof c.score === "number" && c.score > 30 && c.score <= 50).length },
      { range: "51-70", count: candidates.filter((c) => typeof c.score === "number" && c.score > 50 && c.score <= 70).length },
      { range: "71-85", count: candidates.filter((c) => typeof c.score === "number" && c.score > 70 && c.score <= 85).length },
      { range: "86-100", count: candidates.filter((c) => typeof c.score === "number" && c.score > 85).length },
    ];

    const roleMap = new Map<string, { name: string; applicants: number; screened: number; shortlisted: number }>();
    for (const candidate of candidates) {
      const key = candidate.job?.title || candidate.role || "Unassigned";
      const current = roleMap.get(key) || {
        name: String(key).split(" ").slice(0, 2).join(" "),
        applicants: 0,
        screened: 0,
        shortlisted: 0,
      };
      current.applicants += 1;
      if (candidate.callStatus === "completed") current.screened += 1;
      if (candidate.decisionStatus === "shortlisted") current.shortlisted += 1;
      roleMap.set(key, current);
    }

    const roleDistribution = Array.from(roleMap.values())
      .sort((a, b) => b.applicants - a.applicants)
      .slice(0, 6);

    const monthBuckets = Array.from({ length: 4 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (3 - index), 1);
      date.setHours(0, 0, 0, 0);

      return {
        month: date.toLocaleString("en-US", { month: "short" }),
        monthKey: `${date.getFullYear()}-${date.getMonth()}`,
        calls: 0,
        screened: 0,
        shortlisted: 0,
      };
    });

    for (const call of callLogs) {
      const startedAt = new Date(call.startedAt);
      const monthKey = `${startedAt.getFullYear()}-${startedAt.getMonth()}`;
      const bucket = monthBuckets.find((item) => item.monthKey === monthKey);
      if (bucket) {
        bucket.calls += 1;
      }
    }

    for (const candidate of candidates) {
      const completedSource = candidate.completedAt || candidate.appliedAt;
      const completedDate = new Date(completedSource);
      const monthKey = `${completedDate.getFullYear()}-${completedDate.getMonth()}`;
      const bucket = monthBuckets.find((item) => item.monthKey === monthKey);
      if (!bucket) continue;

      if (candidate.callStatus === "completed") {
        bucket.screened += 1;
      }
      if (candidate.decisionStatus === "shortlisted") {
        bucket.shortlisted += 1;
      }
    }

    return {
      statusPie,
      scoreDistribution,
      roleDistribution,
      monthlyTrend: monthBuckets.map(({ month, calls, screened, shortlisted }) => ({ month, calls, screened, shortlisted })),
      kpiMetrics: [
        { label: "Time to Screen", value: avgDurationLabel, sub: `${completedCalls.length} completed call${completedCalls.length === 1 ? "" : "s"}`, icon: Clock, color: "indigo" },
        { label: "Human Hours Saved", value: `${humanHoursSaved} hrs`, sub: "based on completed screenings", icon: Zap, color: "violet" },
        { label: "Avg. AI Score", value: averageScore ? `${averageScore}%` : "0%", sub: "from completed interviews", icon: TrendingUp, color: "emerald" },
        { label: "Cost per Screening", value: `₹${AI_SCREENING_COST}`, sub: `vs ₹${MANUAL_SCREENING_COST} manual review`, icon: Users, color: "amber" },
      ],
      impactSummary: [
        {
          value: averageDurationMinutes ? `${Math.max(1, Math.round(MANUAL_REVIEW_MINUTES / averageDurationMinutes))}×` : "0×",
          title: "Faster Screening",
          description: averageDurationMinutes
            ? `${avgDurationLabel} AI interview vs ${Math.round(MANUAL_REVIEW_MINUTES / 60)} hrs manual review`
            : "Starts once real call data is available",
          color: "text-indigo-400",
        },
        {
          value: `${Math.round(((MANUAL_SCREENING_COST - AI_SCREENING_COST) / MANUAL_SCREENING_COST) * 100)}%`,
          title: "Cost Reduction",
          description: `₹${AI_SCREENING_COST} AI screening vs ₹${MANUAL_SCREENING_COST} manual screening`,
          color: "text-emerald-400",
        },
        {
          value: `${completionRate}%`,
          title: "Call Completion",
          description: `${completedCalls.length} of ${callLogs.length} calls finished successfully`,
          color: "text-violet-400",
        },
      ],
    };
  }, [candidates, callLogs]);

  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">
  
      <Header title="Analytics" subtitle="AI screening performance metrics and insights" />
  
      <div className="pt-16 p-6 space-y-6">
  
        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading Analytics...</p>
          </div>
        ) : (
          <>
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.kpiMetrics.map((m) => (
                <div key={m.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3 bg-gray-100">
                    <m.icon className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-xl font-semibold">{m.value}</p>
                  <p className="text-xs text-gray-500">{m.label}</p>
                  <p className="text-[11px] text-gray-400 mt-1">{m.sub}</p>
                </div>
              ))}
            </div>
  
            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  
              {/* Monthly */}
              <div className="md:col-span-2 bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-1">Monthly Screening Trend</h2>
                <p className="text-xs text-gray-500 mb-4">4-month overview</p>
  
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="calls" stroke="#14b8a6" strokeWidth={2} />
                    <Line type="monotone" dataKey="screened" stroke="#6366f1" strokeWidth={2} />
                    <Line type="monotone" dataKey="shortlisted" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
  
              {/* Pie */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-1">Candidate Status</h2>
                <p className="text-xs text-gray-500 mb-4">Distribution</p>
  
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={analytics.statusPie} dataKey="value" innerRadius={40} outerRadius={65}>
                      {analytics.statusPie.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
  
            </div>
  
            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  
              {/* Funnel */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-1">Hiring Funnel</h2>
                <p className="text-xs text-gray-500 mb-4">Applicants → Shortlisted</p>
  
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.roleDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="applicants" fill="#14b8a6" />
                    <Bar dataKey="screened" fill="#6366f1" />
                    <Bar dataKey="shortlisted" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
  
              {/* Score */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h2 className="text-sm font-semibold mb-1">Score Distribution</h2>
                <p className="text-xs text-gray-500 mb-4">AI score ranges</p>
  
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analytics.scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
  
            </div>
  
            {/* IMPACT */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-sm font-semibold mb-4">Business Impact</h2>
  
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {analytics.impactSummary.map((item) => (
                  <div key={item.title} className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-teal-600">{item.value}</p>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-gray-500">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
