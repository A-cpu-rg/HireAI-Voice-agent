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
    <div className="flex flex-col min-h-screen bg-[#f6f8fb] text-gray-900">
  
      <Header title="Jobs" subtitle="Manage hiring pipelines for structured recruiting" />
  
      <div className="pt-16 p-6 space-y-6">
  
        {/* TOP */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-gray-500 max-w-xl">
            Create jobs to organize candidates into structured pipelines.
          </p>
  
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
  
        {/* LOADING */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="animate-spin mx-auto text-gray-400" />
          </div>
        ) : jobCards.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
            <Briefcase className="w-10 h-10 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">No jobs yet</h2>
            <p className="text-sm text-gray-500 mb-6">
              Create your first job to start building a pipeline
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Create Job
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
  
            {jobCards.map((job) => {
              const shortlistRate =
                job.screened > 0
                  ? Math.round((job.shortlisted / job.screened) * 100)
                  : 0;
  
              return (
                <div
                  key={job.id}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition"
                >
  
                  {/* HEADER */}
                  <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
  
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{job.title}</h3>
  
                        <span className="text-xs px-2 py-0.5 rounded-full border text-gray-600 bg-gray-100">
                          {job.status}
                        </span>
                      </div>
  
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {job.location}
                        </span>
                        <span>{job.type}</span>
                        <span>{job.department}</span>
                      </div>
                    </div>
  
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.salaryRange}</p>
                        <p className="text-xs text-gray-400">
                          {job.openings} opening{job.openings > 1 ? "s" : ""}
                        </p>
                      </div>
  
                      <button
                        onClick={() => setShowAddCandidateForJob(job.id)}
                        className="bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-lg text-sm"
                      >
                        Add Candidates
                      </button>
                    </div>
                  </div>
  
                  {/* DESCRIPTION */}
                  <p className="text-sm text-gray-600 mb-5">
                    {job.description}
                  </p>
  
                  {/* STATS */}
                  <div className="grid grid-cols-4 gap-4 mb-5">
  
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Added</p>
                      <p className="text-xl font-semibold">{job.applicants}</p>
                    </div>
  
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">Screened</p>
                      <p className="text-xl font-semibold text-blue-600">
                        {job.screened}
                      </p>
                    </div>
  
                    <div className="bg-emerald-50 rounded-xl p-3">
                      <p className="text-xs text-emerald-500 mb-1">
                        Shortlisted
                      </p>
                      <p className="text-xl font-semibold text-emerald-600">
                        {job.shortlisted}
                      </p>
                    </div>
  
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 mb-1">
                        Shortlist Rate
                      </p>
                      <p className="text-xl font-semibold">
                        {shortlistRate}%
                      </p>
                    </div>
  
                  </div>
  
                  {/* CANDIDATES PREVIEW */}
                  {job.candidatesList.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="text-xs text-gray-400 mb-3">
                        Recent Pipeline
                      </p>
  
                      <div className="flex gap-3 flex-wrap">
                        {job.candidatesList.map((c: any) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg"
                          >
                            <div
                              className="w-5 h-5 rounded-full text-[8px] font-bold text-white flex items-center justify-center"
                              style={{ background: c.avatarColor }}
                            >
                              {c.name.charAt(0)}
                            </div>
  
                            <span className="text-xs text-gray-700">
                              {c.name}
                            </span>
                          </div>
                        ))}
  
                        {job.applicants > 3 && (
                          <span className="text-xs text-gray-400">
                            +{job.applicants - 3} more
                          </span>
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
  
      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onCreated={fetchData}
        />
      )}
  
      {showAddCandidateForJob && (
        <AddCandidateModal
          defaultJobId={showAddCandidateForJob}
          onClose={() => setShowAddCandidateForJob(null)}
          onSuccess={fetchData}
        />
      )}
    </div>
  );
}
