"use client";

import { Briefcase, CheckCircle, Loader, MapPin, Plus, Users } from "lucide-react";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";
import AddJobModal from "@/components/Jobs/AddJobModal";
import AddCandidateModal from "@/components/Candidates/AddCandidateModal";

const statusColor: Record<string, string> = {
  active: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  paused: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  closed: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

export default function Jobs() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCandidateForJob, setShowAddCandidateForJob] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [jobsRes, candidatesRes] = await Promise.all([
        fetch("/api/jobs").then((r) => r.json()),
        fetch("/api/candidates").then((r) => r.json()),
      ]);

      setJobs(Array.isArray(jobsRes) ? jobsRes : []);
      setCandidates(candidatesRes.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const jobCards = useMemo(() => {
    return jobs.map((job) => {
      const attached = candidates.filter((candidate) => candidate.jobId === job.id);
      const completed = attached.filter((candidate) => candidate.callStatus === "completed").length;
      const shortlisted = attached.filter((candidate) => candidate.decisionStatus === "shortlisted").length;

      return {
        ...job,
        applicants: attached.length,
        screened: completed,
        shortlisted,
        candidatesList: attached.slice(0, 3) 
      };
    });
  }, [jobs, candidates]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Jobs" subtitle="Optional hiring pipelines for structured recruiting" />

      <div className="pt-16 p-6 space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-sm text-white/55">
              Manage your jobs to keep candidates cleanly separated. Add candidates directly to a pipeline.
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/50">
            <Loader className="w-8 h-8 animate-spin mx-auto mb-4 opacity-50" />
            <p>Loading pipelines...</p>
          </div>
        ) : jobCards.length === 0 ? (
          <div className="bg-[#13131f] border border-white/5 rounded-3xl p-10 text-center">
            <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No jobs yet</h2>
            <p className="text-sm text-white/45 max-w-xl mx-auto mb-6">
              Create a job when you want to group candidates under a role.
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create your first job
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {jobCards.map((job) => {
              const shortlistRate = job.screened > 0 ? Math.round((job.shortlisted / job.screened) * 100) : 0;

              return (
                <div key={job.id} className="bg-[#13131f] border border-white/5 rounded-2xl p-6 hover:border-indigo-500/20 transition-all shadow-xl shadow-black/20">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-white">{job.title}</h3>
                        <span className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-full border", statusColor[job.status] || statusColor.active)}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                        <span>{job.type}</span>
                        <span>{job.department}</span>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">{job.salaryRange}</p>
                        <p className="text-xs text-white/35 mt-1">{job.openings} opening{job.openings > 1 ? "s" : ""}</p>
                      </div>
                      <button
                        onClick={() => setShowAddCandidateForJob(job.id)}
                        className="bg-white/5 hover:bg-white/10 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all border border-white/5 flex flex-col items-center justify-center gap-1 h-full shadow-inner shadow-white/5"
                      >
                         <Plus className="w-4 h-4" />
                         Add Candidates
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed mb-6">{job.description}</p>

                  <div className="grid grid-cols-4 gap-4 mb-5">
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Added
                      </div>
                      <p className="text-2xl font-bold text-white">{job.applicants}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="text-white/30 text-xs mb-2">Screened</div>
                      <p className="text-2xl font-bold text-cyan-400">{job.screened}</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-emerald-400/50 text-xs mb-2">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Shortlisted
                      </div>
                      <p className="text-2xl font-bold text-emerald-400">{job.shortlisted}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="text-white/30 text-xs mb-2">Shortlist Rate</div>
                      <p className="text-2xl font-bold text-violet-400">{shortlistRate}%</p>
                    </div>
                  </div>
                  
                  {job.candidatesList.length > 0 && (
                    <div className="border-t border-white/5 pt-4">
                      <p className="text-xs text-white/30 uppercase tracking-widest mb-3">Recent Pipeline</p>
                      <div className="flex max-w-full overflow-hidden items-center gap-4">
                        {job.candidatesList.map((c: any) => (
                           <div key={c.id} className="flex items-center gap-2 bg-[#0b0b14] px-3 py-1.5 rounded-lg border border-white/5">
                             <div className="w-5 h-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{background: c.avatarColor}}>
                               {c.name.charAt(0)}
                             </div>
                             <span className="text-xs text-white/70 truncate w-20">{c.name}</span>
                           </div>
                        ))}
                        {job.applicants > 3 && (
                          <span className="text-xs text-white/30">+{job.applicants - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && <AddJobModal onClose={() => setShowAddModal(false)} onCreated={fetchData} />}
      {showAddCandidateForJob && <AddCandidateModal defaultJobId={showAddCandidateForJob} onClose={() => setShowAddCandidateForJob(null)} onSuccess={fetchData} />}
    </div>
  );
}
