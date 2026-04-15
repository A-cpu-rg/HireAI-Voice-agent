"use client";

import { Briefcase, CheckCircle, Loader, MapPin, Plus, Users } from "lucide-react";
import Header from "@/components/Layout/Header";
import { cn } from "@/utils/cn";
import { useEffect, useMemo, useState } from "react";
import AddJobModal from "@/components/Jobs/AddJobModal";

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
              Jobs are optional in this MVP. You can add candidates directly, or create a role first when you want to track a structured hiring pipeline.
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
            <p>Loading jobs...</p>
          </div>
        ) : jobCards.length === 0 ? (
          <div className="bg-[#13131f] border border-white/5 rounded-3xl p-10 text-center">
            <Briefcase className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-white mb-2">No jobs yet</h2>
            <p className="text-sm text-white/45 max-w-xl mx-auto mb-6">
              Create a job when you want to group candidates under a role. You can still add and screen candidates without creating one.
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
          <div className="grid grid-cols-1 gap-4">
            {jobCards.map((job) => {
              const shortlistRate = job.screened > 0 ? Math.round((job.shortlisted / job.screened) * 100) : 0;

              return (
                <div key={job.id} className="bg-[#13131f] border border-white/5 rounded-2xl p-5 hover:border-indigo-500/20 transition-all">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-base font-semibold text-white">{job.title}</h3>
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
                    <div className="text-right">
                      <p className="text-sm font-semibold text-white">{job.salaryRange}</p>
                      <p className="text-xs text-white/35 mt-1">{job.openings} opening{job.openings > 1 ? "s" : ""}</p>
                    </div>
                  </div>

                  <p className="text-sm text-white/50 leading-relaxed mb-4">{job.description}</p>

                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {(job.skills || []).map((skill: string) => (
                      <span key={skill} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-white/50 border border-white/10">
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
                        <Users className="w-3.5 h-3.5" />
                        Applicants
                      </div>
                      <p className="text-2xl font-bold text-white">{job.applicants}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="text-white/30 text-xs mb-2">Completed Interviews</div>
                      <p className="text-2xl font-bold text-cyan-400">{job.screened}</p>
                    </div>
                    <div className="bg-white/[0.03] rounded-xl p-3">
                      <div className="flex items-center gap-2 text-white/30 text-xs mb-2">
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showAddModal && <AddJobModal onClose={() => setShowAddModal(false)} onCreated={fetchData} />}
    </div>
  );
}
