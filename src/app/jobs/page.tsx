"use client";

import { Briefcase, Loader, MapPin, Plus } from "lucide-react";
import Header from "@/components/Layout/Header";
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

      setJobs(Array.isArray(jobsRes?.data) ? jobsRes.data : []);
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
      const shortlisted = attached.filter(
        (candidate) => candidate.decisionStatus === "shortlisted"
      ).length;

      return {
        ...job,
        applicants: attached.length,
        screened: completed,
        shortlisted,
        candidatesList: attached.slice(0, 3),
      };
    });
  }, [jobs, candidates]);

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-gray-900">
      <Header title="Jobs" subtitle="Manage hiring pipelines for structured recruiting" />

      <div className="space-y-6 p-6 pt-16">
        {/* TOP */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-xl text-sm text-gray-500">
            Create jobs to organize candidates into structured pipelines.
          </p>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Create Job
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="py-20 text-center">
            <Loader className="mx-auto animate-spin text-gray-400" />
          </div>
        ) : jobCards.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-gray-400" />
            <h2 className="mb-2 text-lg font-semibold">No jobs yet</h2>
            <p className="mb-6 text-sm text-gray-500">
              Create your first job to start building a pipeline
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm text-white"
            >
              Create Job
            </button>
          </div>
        ) : (
          <div className="grid gap-5">
            {jobCards.map((job) => {
              const shortlistRate =
                job.screened > 0 ? Math.round((job.shortlisted / job.screened) * 100) : 0;

              return (
                <div
                  key={job.id}
                  className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
                >
                  {/* HEADER */}
                  <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="mb-1 flex items-center gap-2">
                        <h3 className="font-semibold">{job.title}</h3>

                        <span className="rounded-full border bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                          {job.status}
                        </span>
                      </div>

                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
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
                        className="rounded-lg bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200"
                      >
                        Add Candidates
                      </button>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="mb-5 text-sm text-gray-600">{job.description}</p>

                  {/* STATS */}
                  <div className="mb-5 grid grid-cols-4 gap-4">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="mb-1 text-xs text-gray-400">Added</p>
                      <p className="text-xl font-semibold">{job.applicants}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="mb-1 text-xs text-gray-400">Screened</p>
                      <p className="text-xl font-semibold text-blue-600">{job.screened}</p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="mb-1 text-xs text-emerald-500">Shortlisted</p>
                      <p className="text-xl font-semibold text-emerald-600">{job.shortlisted}</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="mb-1 text-xs text-gray-400">Shortlist Rate</p>
                      <p className="text-xl font-semibold">{shortlistRate}%</p>
                    </div>
                  </div>

                  {/* CANDIDATES PREVIEW */}
                  {job.candidatesList.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <p className="mb-3 text-xs text-gray-400">Recent Pipeline</p>

                      <div className="flex flex-wrap gap-3">
                        {job.candidatesList.map((c: any) => (
                          <div
                            key={c.id}
                            className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-1.5"
                          >
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                              style={{ background: c.avatarColor }}
                            >
                              {c.name.charAt(0)}
                            </div>

                            <span className="text-xs text-gray-700">{c.name}</span>
                          </div>
                        ))}

                        {job.applicants > 3 && (
                          <span className="text-xs text-gray-400">+{job.applicants - 3} more</span>
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
