"use client";

import { Users, Phone, CheckCircle, TrendingUp, Clock, Zap, PhoneCall, Star, Loader } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useApp } from "@/context/AppContext";
import Header from "@/components/Layout/Header";
import StatCard from "@/components/UI/StatCard";
import { StatusBadge, ScoreBadge } from "@/components/UI/Badge";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-3 text-xs shadow-xl">
        <p className="text-white/60 mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color }} className="font-semibold">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const { isConfigured } = useApp();
  const router = useRouter();

  const [candidates, setCandidates] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/candidates').then(res => res.json()),
      fetch('/api/calls').then(res => res.json())
    ]).then(([candData, callData]) => {
      setCandidates(candData.data || []);
      setCallLogs(callData.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const total = candidates.length;
  const screened = candidates.filter((c) => c.status !== "pending" && c.status !== "scheduled").length;
  const shortlisted = candidates.filter((c) => c.status === "shortlisted").length;
  const scores = candidates.filter((c) => c.score).map((c) => c.score as number);
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const successRate = screened > 0 ? Math.round((shortlisted / screened) * 100) : 0;
  const todayCalls = callLogs.filter((c) => c.startedAt.startsWith(new Date().toISOString().split("T")[0])).length;

  const weeklyScreeningData = [
    { day: "Mon", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 1).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 1).length },
    { day: "Tue", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 2).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 2).length },
    { day: "Wed", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 3).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 3).length },
    { day: "Thu", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 4).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 4).length },
    { day: "Fri", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 5).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 5).length },
    { day: "Sat", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 6).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 6).length },
    { day: "Sun", screened: candidates.filter(c => c.status !== 'pending' && new Date(c.appliedAt).getDay() === 0).length, shortlisted: candidates.filter(c => c.status === 'shortlisted' && new Date(c.appliedAt).getDay() === 0).length },
  ];

  const scoreDistribution = [
    { range: "0-30", count: candidates.filter(c => c.score && c.score <= 30).length },
    { range: "31-50", count: candidates.filter(c => c.score && c.score > 30 && c.score <= 50).length },
    { range: "51-70", count: candidates.filter(c => c.score && c.score > 50 && c.score <= 70).length },
    { range: "71-85", count: candidates.filter(c => c.score && c.score > 70 && c.score <= 85).length },
    { range: "86-100", count: candidates.filter(c => c.score && c.score > 85).length },
  ];

  const recentCandidates = [...candidates]
    .filter((c) => c.status !== "pending")
    .sort((a, b) => new Date(b.completedAt || b.appliedAt).getTime() - new Date(a.completedAt || a.appliedAt).getTime())
    .slice(0, 5);

  const topCandidates = [...candidates]
    .filter((c) => c.score)
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 4);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="AI Recruitment Overview — Powered by Bolna Voice AI" />

      <div className="pt-16 p-6 space-y-6">
        {/* Config Warning */}
        {!isConfigured && !loading && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
            <Zap className="w-5 h-5 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-amber-300 font-medium">Demo Mode Active</p>
              <p className="text-xs text-amber-400/70 mt-0.5">Configure your Bolna API key in Settings to make real screening calls. All data shown is simulated.</p>
            </div>
            <button
              onClick={() => router.push("/settings")}
              className="flex-shrink-0 bg-amber-500 hover:bg-amber-600 text-black text-xs font-bold px-4 py-2 rounded-xl transition-colors"
            >
              Configure →
            </button>
          </div>
        )}

        {loading ? (
             <div className="text-center py-20 text-white/50">
               <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
               <p>Loading Dashboard...</p>
             </div>
        ) : (
            <>
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Candidates" value={total} icon={Users} color="indigo" trend={{ value: 12, label: "vs last week" }} />
          <StatCard label="Screened by AI" value={screened} icon={PhoneCall} color="violet" trend={{ value: 8, label: "vs last week" }} />
          <StatCard label="Shortlisted" value={shortlisted} icon={CheckCircle} color="emerald" trend={{ value: 15, label: "vs last week" }} />
          <StatCard label="Avg. Score" value={avgScore} icon={Star} color="amber" suffix="/100" trend={{ value: 3, label: "vs last week" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Success Rate" value={`${successRate}%`} icon={TrendingUp} color="cyan" />
          <StatCard label="Calls Today" value={todayCalls} icon={Phone} color="indigo" />
          <StatCard label="Time Saved" value="48" icon={Clock} color="violet" suffix="hrs" trend={{ value: 22, label: "this month" }} />
          <StatCard label="Active Jobs" value={5} icon={Zap} color="emerald" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-5 gap-4">
          {/* Area Chart */}
          <div className="col-span-3 bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-sm font-semibold text-white">Weekly Screening Activity</h2>
                <p className="text-xs text-white/40 mt-0.5">AI calls made vs shortlisted</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" /> Screened</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Shortlisted</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weeklyScreeningData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScreened" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorShortlisted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="screened" name="Screened" stroke="#6366f1" strokeWidth={2} fill="url(#colorScreened)" />
                <Area type="monotone" dataKey="shortlisted" name="Shortlisted" stroke="#10b981" strokeWidth={2} fill="url(#colorShortlisted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Score Distribution */}
          <div className="col-span-2 bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-white">Score Distribution</h2>
              <p className="text-xs text-white/40 mt-0.5">Candidate AI scores</p>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoreDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Candidates" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-4">
          {/* Recent Screenings */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">Recent Screenings</h2>
              <button onClick={() => router.push("/candidates")} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
            </div>
            <div className="space-y-3">
              {recentCandidates.map((c) => (
                <div key={c.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push(`/candidates/${c.id}`)}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: c.avatarColor }}>
                    {c.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{c.name}</p>
                    <p className="text-xs text-white/40 truncate">{c.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {c.score && <ScoreBadge score={c.score} />}
                    <StatusBadge status={c.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Candidates */}
          <div className="bg-[#13131f] border border-white/5 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white">🏆 Top Candidates</h2>
              <button onClick={() => router.push("/candidates")} className="text-xs text-indigo-400 hover:text-indigo-300">View all →</button>
            </div>
            <div className="space-y-3">
              {topCandidates.map((c, i) => (
                <div key={c.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push(`/candidates/${c.id}`)}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                    i === 0 ? "bg-amber-500 text-black" : i === 1 ? "bg-slate-300 text-black" : i === 2 ? "bg-amber-700 text-white" : "bg-white/10 text-white/60"
                  }`}>{i + 1}</div>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: c.avatarColor }}>
                    {c.name.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate group-hover:text-indigo-300 transition-colors">{c.name}</p>
                    <p className="text-xs text-white/40 truncate">{c.role} · {c.experience}y exp</p>
                  </div>
                  {c.score && <ScoreBadge score={c.score} />}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-gradient-to-br from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-white mb-4">🎯 How HireAI + Bolna Works</h2>
          <div className="grid grid-cols-4 gap-4">
            {[
              { step: "01", title: "Upload Candidates", desc: "Add candidate profiles with phone numbers and role details", icon: "👤" },
              { step: "02", title: "Trigger AI Call", desc: "Bolna Voice AI agent calls candidates automatically via phone", icon: "📞" },
              { step: "03", title: "AI Screening", desc: "Aria (AI agent) conducts structured 5-min screening interviews", icon: "🎙️" },
              { step: "04", title: "Get Results", desc: "AI extracts scores, transcript, and recommendation instantly", icon: "📊" },
            ].map((s) => (
              <div key={s.step} className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{s.icon}</span>
                  <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">STEP {s.step}</span>
                </div>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-white/40 leading-relaxed">{s.desc}</p>
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
