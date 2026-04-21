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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
  
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Add Candidates</h2>
            <p className="text-xs text-gray-500 mt-1">
              Upload resumes or manually add candidate details
            </p>
          </div>
  
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
  
        <div className="p-6 space-y-6">
  
          {/* UPLOAD SECTION */}
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
  
            <div className="flex items-start justify-between gap-4 flex-wrap">
  
              <div>
                <p className="text-sm font-semibold text-gray-900 mb-1">
                  Upload resumes
                </p>
                <p className="text-xs text-gray-500 mb-3">
                  Upload 1 file → auto-fill form  
                  Upload multiple → bulk import candidates
                </p>
  
                <select
                  value={form.jobId}
                  onChange={(e) => updateForm("jobId", e.target.value)}
                  className="w-full max-w-xs bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900"
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
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2.5 rounded-lg"
              >
                {loading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
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
  
              <h3 className="text-sm font-semibold text-gray-900">
                Upload Progress
              </h3>
  
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {uploadQueue.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-lg"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <FileUp className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-700 truncate">
                        {item.name || item.file.name}
                      </p>
                    </div>
  
                    <div>
                      {item.status === "pending" && (
                        <span className="text-xs text-gray-400">Waiting</span>
                      )}
                      {item.status === "processing" && (
                        <Loader className="w-4 h-4 text-teal-600 animate-spin" />
                      )}
                      {item.status === "success" && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {item.status === "error" && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
  
              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-5 py-2.5 rounded-lg"
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
                  <label className="text-xs text-gray-500 mb-1 block">
                    Full Name *
                  </label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => updateForm("name", e.target.value)}
                    className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
  
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Phone *
                  </label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => updateForm("phone", e.target.value)}
                    className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
  
              </div>
  
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Email *
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm"
                />
              </div>
  
              <div className="grid grid-cols-2 gap-4">
  
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Location *
                  </label>
                  <input
                    required
                    value={form.location}
                    onChange={(e) => updateForm("location", e.target.value)}
                    className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
  
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">
                    Skills
                  </label>
                  <input
                    value={form.tags}
                    onChange={(e) => updateForm("tags", e.target.value)}
                    className="w-full border border-gray-200 bg-white text-gray-900 rounded-lg px-3 py-2.5 text-sm"
                  />
                </div>
  
              </div>
  
              <div className="flex gap-3 pt-2">
  
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm py-2.5 rounded-lg"
                >
                  Cancel
                </button>
  
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg"
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
