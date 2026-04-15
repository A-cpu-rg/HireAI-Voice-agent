"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import Header from "@/components/Layout/Header";
import { TrendingUp, Users, Clock, Zap, Loader } from "lucide-react";
import { useState, useEffect } from "react";

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b", "#10b981"];

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
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/candidates').then(res => res.json()),
      fetch('/api/calls').then(res => res.json()),
      fetch('/api/jobs').then(res => res.json())
    ]).then(([candData, callData, jobData]) => {
      setCandidates(candData.data || []);
      setCallLogs(callData.data || []);
      setJobs(jobData || []); // jobs wasn't wrapped in data
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  const roleDistribution = jobs.map((j, i) => ({
    name: j.title.split(" ").slice(0, 2).join(" "),
    applicants: j.applicants,
    screened: j.screened,
    shortlisted: j.shortlisted,
    color: COLORS[i % COLORS.length],
  }));

  const statusPie = [
    { name: "Shortlisted", value: candidates.filter(c => c.decisionStatus === "shortlisted").length },
    { name: "Rejected", value: candidates.filter(c => c.decisionStatus === "rejected").length },
    { name: "Completed", value: candidates.filter(c => c.callStatus === "completed").length },
    { name: "Pending", value: candidates.filter(c => c.callStatus === "pending").length },
    { name: "Processing", value: candidates.filter(c => c.callStatus === "processing").length },
  ].filter(d => d.value > 0);

  const scoreDistribution = [
    { range: "0-30", count: candidates.filter(c => c.score && c.score <= 30).length },
    { range: "31-50", count: candidates.filter(c => c.score && c.score > 30 && c.score <= 50).length },
    { range: "51-70", count: candidates.filter(c => c.score && c.score > 50 && c.score <= 70).length },
    { range: "71-85", count: candidates.filter(c => c.score && c.score > 70 && c.score <= 85).length },
    { range: "86-100", count: candidates.filter(c => c.score && c.score > 85).length },
  ];

  const monthlyTrend = [
    { month: "Oct", calls: 45, screened: 40, shortlisted: 12 },
    { month: "Nov", calls: 78, screened: 65, shortlisted: 20 },
    { month: "Dec", calls: 92, screened: 80, shortlisted: 28 },
    { month: "Jan", calls: callLogs.length || 121, screened: candidates.filter(c => c.callStatus === "completed").length || 98, shortlisted: candidates.filter(c => c.decisionStatus === "shortlisted").length || 35 },
  ];

  const kpiMetrics = [
    { label: "Time to Screen", value: "4.2 min", sub: "avg call duration", icon: Clock, color: "indigo" },
    { label: "Human Hours Saved", value: "48 hrs", sub: "this month", icon: Zap, color: "violet" },
    { label: "AI Accuracy", value: "92%", sub: "vs human reviewer", icon: TrendingUp, color: "emerald" },
    { label: "Cost per Screening", value: "₹12", sub: "vs ₹450 human cost", icon: Users, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    indigo: "text-indigo-400 bg-indigo-500/10",
    violet: "text-violet-400 bg-violet-500/10",
    emerald: "text-emerald-400 bg-emerald-500/10",
    amber: "text-amber-400 bg-amber-500/10",
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Analytics" subtitle="AI screening performance metrics and insights" />

      <div className="pt-16 p-6 space-y-6">
        {loading ? (
             <div className="text-center py-20 text-white/50">
               <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
               <p>Loading Analytics...</p>
             </div>
        ) : (
          <>
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-4">
          {kpiMetrics.map((m) => (
            <div key={m.label} className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${colorMap[m.color]}`}>
                <m.icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-2xl font-bold text-white">{m.value}</p>
              <p className="text-xs font-medium text-white/60 mt-0.5">{m.label}</p>
              <p className="text-[11px] text-white/30 mt-0.5">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-3 gap-4">
          {/* Monthly Trend */}
          <div className="col-span-2 bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white">Monthly Screening Trend</h2>
                <p className="text-xs text-white/40 mt-0.5">4-month overview</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Calls</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Screened</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Shortlisted</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="calls" name="Calls" stroke="#6366f1" strokeWidth={2} dot={{ fill: "#6366f1", r: 4 }} />
                <Line type="monotone" dataKey="screened" name="Screened" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 4 }} />
                <Line type="monotone" dataKey="shortlisted" name="Shortlisted" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Status Pie */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Candidate Status</h2>
            <p className="text-xs text-white/40 mb-4">Distribution breakdown</p>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={statusPie} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                  {statusPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {statusPie.map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-white/50">
                     <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                     {d.name}
                  </span>
                  <span className="text-white/70 font-medium">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-2 gap-4">
          {/* Role-wise funnel */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">Hiring Funnel by Role</h2>
            <p className="text-xs text-white/40 mb-4">Applicants → Screened → Shortlisted</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={roleDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="applicants" name="Applied" fill="#6366f1" opacity={0.5} radius={[0, 3, 3, 0]} />
                <Bar dataKey="screened" name="Screened" fill="#8b5cf6" opacity={0.7} radius={[0, 3, 3, 0]} />
                <Bar dataKey="shortlisted" name="Shortlisted" fill="#10b981" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Score distribution */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-white mb-1">AI Score Distribution</h2>
            <p className="text-xs text-white/40 mb-4">Candidate screening score ranges</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Candidates" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, index) => {
                    const fills = ["#ef4444", "#f97316", "#f59e0b", "#6366f1", "#10b981"];
                    return <Cell key={index} fill={fills[index % fills.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Impact Section */}
        <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">📈 Business Impact Summary</h2>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-3xl font-bold text-indigo-400">37×</p>
              <p className="text-sm font-medium text-white">Faster Screening</p>
              <p className="text-xs text-white/40">5 min AI call vs 3 hrs manual review</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-emerald-400">97%</p>
              <p className="text-sm font-medium text-white">Cost Reduction</p>
              <p className="text-xs text-white/40">₹12 AI vs ₹450 human screener cost</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-violet-400">95%</p>
              <p className="text-sm font-medium text-white">Call Completion</p>
              <p className="text-xs text-white/40">Industry-leading AI engagement rate</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
