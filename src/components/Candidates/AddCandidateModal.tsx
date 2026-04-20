import { useEffect, useRef, useState } from "react";
import { FileUp, Loader, Sparkles, Upload, X, CheckCircle, AlertCircle } from "lucide-react";
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

const colors = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"];

export default function AddCandidateModal({ onClose, defaultJobId, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  
  // Bulk upload states
  const [bulkMode, setBulkMode] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<{file: File, status: 'pending'|'processing'|'success'|'error', name?: string}[]>([]);
  
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
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]));
  }, []);

  const updateForm = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    if (data.usingFallback) toast.error("Used regex fallback for parsing.", { icon: '⚠️' });
    return data.parsed || {};
  };

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
        const parsed = await processSingleFile(files[0]);
        const matchedRole = roles.find((role) => role.toLowerCase() === String(parsed.role || "").toLowerCase());
        
        setForm(prev => ({
          ...prev,
          name: parsed.name || prev.name,
          email: parsed.email || prev.email,
          phone: parsed.phone || prev.phone,
          role: (matchedRole || prev.role) as JobRole,
          experience: parsed.experience > 0 ? parsed.experience : prev.experience,
          tags: parsed.skills?.length ? parsed.skills.join(", ") : prev.tags,
        }));
        toast.success("Resume parsed! Fill remaining details.");
      } catch (err: any) {
        toast.error(err.message || "Parsing failed");
      } finally {
        setLoading(false);
      }
    } else {
      // Bulk mode -> Auto create
      setBulkMode(true);
      const initialQueue = files.map(f => ({ file: f, status: 'pending' as const }));
      setUploadQueue(initialQueue);
      
      let successCount = 0;
      for (let i = 0; i < files.length; i++) {
        setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'processing' } : item));
        
        try {
          const parsed = await processSingleFile(files[i]);
          const avatarColor = colors[Math.floor(Math.random() * colors.length)];
          
          await createCandidateEntry({
            ...form,
            name: parsed.name || files[i].name,
            email: parsed.email || "unknown@example.com",
            phone: parsed.phone || "0000000000",
            experience: parsed.experience || 0,
            tags: parsed.skills || [],
            matchScore: parsed.matchScore || null,
            avatarColor,
            callStatus: "pending",
            decisionStatus: "undecided",
            jobId: form.jobId || null,
          });
          
          setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'success', name: parsed.name } : item));
          successCount++;
        } catch (err) {
          setUploadQueue(q => q.map((item, idx) => idx === i ? { ...item, status: 'error' } : item));
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
      tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
      jobId: form.jobId || null,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">Add Candidate(s)</h2>
            <p className="text-xs text-white/40 mt-0.5">Upload a single resume to auto-fill, or multiple resumes for bulk import.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/10 to-violet-600/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <p className="text-sm font-semibold text-white">Smart Resume Upload</p>
                </div>
                <p className="text-xs text-white/45 leading-relaxed max-w-xl mb-3">
                  Upload multiple PDFs. HireAI will extract details and create candidates instantly. Ensure a job is selected below if applicable.
                </p>
                
                <select
                  value={form.jobId}
                  onChange={(e) => updateForm("jobId", e.target.value)}
                  className="w-full max-w-xs bg-[#0b0b14] border border-indigo-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none mb-4"
                >
                  <option value="">No Job Selected</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>{job.title}</option>
                  ))}
                </select>
              </div>
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className="inline-flex items-center flex-shrink-0 gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2.5 transition-colors"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {loading ? "Processing..." : "Select Resumes"}
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

          {bulkMode ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Bulk Import Progress</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {uploadQueue.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-[#0b0b14] border border-white/5 p-3 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileUp className="w-4 h-4 flex-shrink-0 text-white/40" />
                      <p className="text-xs text-white/70 truncate">{item.name || item.file.name}</p>
                    </div>
                    <div>
                      {item.status === 'pending' && <p className="text-[10px] text-white/30 uppercase">Waiting</p>}
                      {item.status === 'processing' && <Loader className="w-4 h-4 text-indigo-400 animate-spin" />}
                      {item.status === 'success' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                      {item.status === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Phone Number *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/50"
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
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Role / Location *</label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    placeholder="Bangalore, etc."
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/50 mb-1.5">Skills / Tags</label>
                  <input
                    value={form.tags}
                    onChange={(e) => updateForm("tags", e.target.value)}
                    className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:border-indigo-500/50"
                  />
                </div>
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
                  disabled={loading}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  Manually Add Candidate
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
