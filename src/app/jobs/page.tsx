"use client";

import { Briefcase, Users, CheckCircle, MapPin, Clock, TrendingUp, Loader } from "lucide-react";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import { useState, useEffect } from "react";

const statusColor: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  closed: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/jobs').then(r => r.json()),
      fetch('/api/candidates').then(r => r.json())
    ]).then(([jobsData, candData]) => {
      setJobs(jobsData || []);
      setCandidates(candData.data || []);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Open Positions" subtitle={`${jobs.filter(j => j.status === 'active').length} active roles · ${jobs.reduce((a, j) => a + j.openings, 0)} total openings`} />

      <div className="pt-16 p-6 space-y-5">
        {loading ? (
             <div className="text-center py-20 text-white/50">
               <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
               <p>Loading Jobs...</p>
             </div>
        ) : (
          <>
        {/* Summary */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Active Roles", value: jobs.filter(j => j.status === "active").length, icon: Briefcase, color: "text-indigo-400 bg-indigo-500/10" },
            { label: "Total Applicants", value: jobs.reduce((a, j) => a + j.applicants, 0), icon: Users, color: "text-violet-400 bg-violet-500/10" },
            { label: "AI Screened", value: jobs.reduce((a, j) => a + j.screened, 0), icon: TrendingUp, color: "text-cyan-400 bg-cyan-500/10" },
            { label: "Shortlisted", value: jobs.reduce((a, j) => a + j.shortlisted, 0), icon: CheckCircle, color: "text-emerald-400 bg-emerald-500/10" },
          ].map((s) => (
            <div key={s.label} className="bg-[#13131f] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", s.color)}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/40">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Job Cards */}
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => {
            const screenRate = job.applicants > 0 ? Math.round((job.screened / job.applicants) * 100) : 0;
            const shortlistRate = job.screened > 0 ? Math.round((job.shortlisted / job.screened) * 100) : 0;

            return (
              <div key={job.id} className="bg-[#13131f] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <Briefcase className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">{job.title}</h3>
                        <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", statusColor[job.status] || statusColor.closed)}>
                          {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{job.type}</span>
                        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{job.openings} opening{job.openings > 1 ? "s" : ""}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{job.salaryRange}</p>
                    <p className="text-xs text-white/40 mt-0.5">{job.department}</p>
                  </div>
                </div>

                <p className="text-sm text-white/50 mb-4 leading-relaxed">{job.description}</p>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {(job.skills || []).map((s: string) => (
                    <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">{s}</span>
                  ))}
                </div>

                {/* Funnel stats */}
                <div className="grid grid-cols-4 gap-4 border-t border-white/5 pt-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-white">{job.applicants}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Applied</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-indigo-400">{job.screened}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">AI Screened</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-emerald-400">{job.shortlisted}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Shortlisted</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-bold text-violet-400">{shortlistRate}%</p>
                    <p className="text-[11px] text-white/30 mt-0.5">Shortlist Rate</p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-white/30 mb-1.5">
                    <span>Screening Progress</span>
                    <span>{screenRate}% screened</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" style={{ width: `${screenRate}%` }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </>
        )}
      </div>
    </div>
  );
}
