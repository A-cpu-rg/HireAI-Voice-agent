import { useEffect, useRef, useState } from "react";
import { FileUp, Loader, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
import { Job, JobRole } from "../../types";
import toast from "react-hot-toast";

const roles: JobRole[] = [
  "Full-Stack Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "DevOps Engineer",
  "Data Scientist",
  "Product Manager",
  "UI/UX Designer",
];

interface Props {
  onClose: () => void;
  defaultJobId?: string;
  onSuccess?: () => void;
}

const colors = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#84cc16",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#d946ef",
];

interface ParsedResumeResponse {
  name: string;
  email: string;
  phone: string;
  experience: number;
  skills: string[];
  matchScore: number;
  confidence: number;
  strengths: string[];
  weaknesses: string[];
  summary: string;
  source: "ai" | "heuristic";
  role?: string;
}

type ResumeIntelligencePayload = Pick<
  ParsedResumeResponse,
  "skills" | "matchScore" | "confidence" | "strengths" | "weaknesses" | "summary" | "source"
>;

interface FraudPayload {
  fraudScore: number;
  flags: { code: string; severity: "low" | "medium" | "high"; detail: string }[];
}

function toIntelligence(parsed: ParsedResumeResponse): ResumeIntelligencePayload {
  return {
    skills: parsed.skills ?? [],
    matchScore: Number(parsed.matchScore) || 0,
    confidence: Number(parsed.confidence) || 0,
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    summary: parsed.summary ?? "",
    source: parsed.source === "ai" ? "ai" : "heuristic",
  };
}

/** Deterministic avatar colour so the same input always renders the same. */
function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return colors[hash % colors.length];
}

export default function AddCandidateModal({ onClose, defaultJobId, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);

  // Bulk upload states
  const [bulkMode, setBulkMode] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<
    { file: File; status: "pending" | "processing" | "success" | "error"; name?: string }[]
  >([]);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Full-Stack Engineer" as JobRole,
    experience: 2,
    location: "Remote",
    tags: "",
    jobId: defaultJobId || "",
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((res) => setJobs(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setJobs([]));
  }, []);

  const updateForm = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const [parsedIntelligence, setParsedIntelligence] = useState<ResumeIntelligencePayload | null>(
    null
  );
  const [fraudReport, setFraudReport] = useState<FraudPayload | null>(null);

  const processSingleFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    if (form.jobId) formData.append("jobId", form.jobId);

    const res = await fetch("/api/parse-resume", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to parse resume");
    return data as { parsed: ParsedResumeResponse; fraud: FraudPayload };
  };

  const buildIntelligencePayload = (parsed: ParsedResumeResponse, fraud: FraudPayload) => ({
    intelligence: toIntelligence(parsed),
    fraud,
  });

  const createCandidateEntry = async (payload: any) => {
    const res = await fetch("/api/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error("Failed to create candidate");
    return res.json();
  };

  const handleFilesChosen = async (files: File[]) => {
    if (files.length === 0) return;

    if (files.length === 1) {
      // Single upload mode -> Auto fill form
      setLoading(true);
      try {
        const { parsed, fraud } = await processSingleFile(files[0]);
        const matchedRole = roles.find(
          (role) => role.toLowerCase() === String(parsed.role || "").toLowerCase()
        );

        setForm((prev) => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          role: (matchedRole || prev.role) as JobRole,
          experience: parsed.experience > 0 ? parsed.experience : prev.experience,
          tags: parsed.skills?.length ? parsed.skills.join(", ") : prev.tags,
        }));
        setParsedIntelligence(toIntelligence(parsed));
        setFraudReport(fraud ?? null);

        toast.success(
          parsed.source === "ai" ? "Resume parsed with AI." : "Resume parsed. Review the details."
        );
        if (fraud?.flags?.length) {
          toast(`${fraud.flags.length} integrity flag(s) detected`, { icon: "⚠️" });
        }
      } catch (err: any) {
        toast.error(err.message || "Parsing failed");
      } finally {
        setLoading(false);
      }
    } else {
      // Bulk mode -> Auto create
      setBulkMode(true);
      const initialQueue = files.map((f) => ({ file: f, status: "pending" as const }));
      setUploadQueue(initialQueue);

      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        setUploadQueue((q) =>
          q.map((item, idx) => (idx === i ? { ...item, status: "processing" } : item))
        );

        try {
          const { parsed, fraud } = await processSingleFile(files[i]);

          await createCandidateEntry({
            ...form,
            name: parsed.name || files[i].name,
            email: parsed.email || `unknown-${i + 1}@example.com`,
            phone: parsed.phone || "",
            experience: parsed.experience || 0,
            tags: parsed.skills || [],
            avatarColor: avatarColorFor(parsed.name || files[i].name),
            callStatus: "pending",
            decisionStatus: "undecided",
            jobId: form.jobId || undefined,
            ...buildIntelligencePayload(parsed, fraud),
          });

          setUploadQueue((q) =>
            q.map((item, idx) =>
              idx === i ? { ...item, status: "success", name: parsed.name } : item
            )
          );
          successCount++;
        } catch {
          setUploadQueue((q) =>
            q.map((item, idx) => (idx === i ? { ...item, status: "error" } : item))
          );
        }
      }

      toast.success(`Bulk imported ${successCount}/${files.length} candidates`);
      if (onSuccess) onSuccess();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      callStatus: "pending",
      decisionStatus: "undecided",
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      avatarColor: avatarColorFor(form.name || form.email),
      jobId: form.jobId || undefined,
      intelligence: parsedIntelligence ?? undefined,
      fraud: fraudReport ?? undefined,
    };

    try {
      await createCandidateEntry(payload);
      toast.success(`${form.name} added successfully`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Candidates</h2>
            <p className="mt-1 text-xs text-gray-500">
              Upload resumes or manually add candidate details
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* UPLOAD SECTION */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-gray-900">Upload resumes</p>
                <p className="mb-3 text-xs text-gray-500">
                  Upload 1 file → auto-fill form Upload multiple → bulk import candidates
                </p>

                <select
                  value={form.jobId}
                  onChange={(e) => updateForm("jobId", e.target.value)}
                  className="w-full max-w-xs rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
                >
                  <option value="">No Job Selected</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      {job.title}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Select Files
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files) handleFilesChosen(Array.from(files));
              }}
            />
          </div>

          {/* BULK MODE */}
          {bulkMode ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Upload Progress</h3>

              <div className="max-h-60 space-y-2 overflow-y-auto pr-2">
                {uploadQueue.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileUp className="h-4 w-4 text-gray-400" />
                      <p className="truncate text-xs text-gray-700">
                        {item.name || item.file.name}
                      </p>
                    </div>

                    <div>
                      {item.status === "pending" && (
                        <span className="text-xs text-gray-400">Waiting</span>
                      )}
                      {item.status === "processing" && (
                        <Loader className="h-4 w-4 animate-spin text-teal-600" />
                      )}
                      {item.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      {item.status === "error" && <AlertCircle className="h-4 w-4 text-red-500" />}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* FORM */
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Phone *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs text-gray-500">Email *</label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-gray-500">Location *</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs text-gray-500">Skills</label>
                  <input
                    value={form.tags}
                    onChange={(e) => updateForm("tags", e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg bg-gray-100 py-2.5 text-sm text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-teal-600 py-2.5 text-sm font-medium text-white hover:bg-teal-700"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
