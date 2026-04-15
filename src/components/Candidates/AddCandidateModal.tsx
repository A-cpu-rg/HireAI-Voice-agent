import { useEffect, useRef, useState } from "react";
import { FileUp, Loader, Sparkles, Upload, X } from "lucide-react";
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
}

const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"];

export default function AddCandidateModal({ onClose }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumeFileName, setResumeFileName] = useState("");
  const [parsedSummary, setParsedSummary] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Full-Stack Engineer" as JobRole,
    experience: 2,
    location: "",
    tags: "",
    jobId: "",
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]));
  }, []);

  const updateForm = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResumeUpload = async (file: File) => {
    setParsing(true);
    setResumeFileName(file.name);
    setParsedSummary("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to parse resume");
      }

      const parsed = data.parsed || {};
      const matchedRole = roles.find((role) => role.toLowerCase() === String(parsed.role || "").toLowerCase());

      setForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        email: parsed.email || prev.email,
        phone: parsed.phone || prev.phone,
        role: (matchedRole || prev.role) as JobRole,
        experience: parsed.experience > 0 ? parsed.experience : prev.experience,
        location: parsed.location || prev.location,
        tags: parsed.skills?.length ? parsed.skills.join(", ") : prev.tags,
      }));

      setParsedSummary(
        [
          parsed.name ? `Name: ${parsed.name}` : "",
          parsed.email ? `Email: ${parsed.email}` : "",
          parsed.phone ? `Phone: ${parsed.phone}` : "",
          parsed.skills?.length ? `Skills: ${parsed.skills.slice(0, 5).join(", ")}` : "",
        ]
          .filter(Boolean)
          .join(" • ")
      );

      toast.success("Resume parsed and form auto-filled");
    } catch (error: any) {
      toast.error(error.message || "Resume parsing failed");
      setResumeFileName("");
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const payload = {
      ...form,
      callStatus: "pending",
      decisionStatus: "undecided",
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      avatarColor,
      jobId: form.jobId || null,
    };

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to add candidate");
      }

      toast.success(`${form.name} added successfully`);
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to add candidate");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">Add Candidate</h2>
            <p className="text-xs text-white/40 mt-0.5">Upload a resume to auto-fill the candidate, or enter details manually.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-violet-600/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <p className="text-sm font-semibold text-white">Resume Upload</p>
                </div>
                <p className="text-xs text-white/45 leading-relaxed max-w-xl">
                  Upload a PDF, DOC, DOCX, TXT, PNG, JPG, or JPEG resume. HireAI will parse it and auto-fill the candidate form for you.
                </p>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={parsing}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
              >
                {parsing ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {parsing ? "Parsing Resume..." : "Upload Resume"}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleResumeUpload(file);
                }
              }}
            />

            {(resumeFileName || parsedSummary) && (
              <div className="mt-4 rounded-xl border border-white/10 bg-[#0b0b14] p-4">
                {resumeFileName && (
                  <div className="flex items-center gap-2 text-sm text-white/70 mb-2">
                    <FileUp className="w-4 h-4 text-indigo-300" />
                    {resumeFileName}
                  </div>
                )}
                {parsedSummary && <p className="text-xs text-white/45 leading-relaxed">{parsedSummary}</p>}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name *</label>
              <input
                required
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
                placeholder="Candidate full name"
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Phone Number *</label>
              <input
                required
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                placeholder="+91XXXXXXXXXX"
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Email *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => updateForm("email", e.target.value)}
              placeholder="candidate@example.com"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Role *</label>
              <select
                value={form.role}
                onChange={(e) => updateForm("role", e.target.value as JobRole)}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Experience (years)</label>
              <input
                type="number"
                min={0}
                max={30}
                value={form.experience}
                onChange={(e) => updateForm("experience", Number(e.target.value))}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Job Association</label>
            <select
              value={form.jobId}
              onChange={(e) => updateForm("jobId", e.target.value)}
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="">Add without a job</option>
              {jobs.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-white/30 mt-1.5">Optional. You can still add direct candidates without a job pipeline.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Location</label>
            <input
              value={form.location}
              onChange={(e) => updateForm("location", e.target.value)}
              placeholder="Bangalore, India"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Skills / Tags (comma separated)</label>
            <input
              value={form.tags}
              onChange={(e) => updateForm("tags", e.target.value)}
              placeholder="React, Node.js, AWS"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || parsing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Add Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
