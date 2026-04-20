import { useState } from "react";
import { Loader, X, FileMinus, Sparkles, FileUp } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

export default function AddJobModal({ onClose, onCreated }: Props) {
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [jdText, setJdText] = useState("");
  
  const [form, setForm] = useState({
    title: "",
    department: "",
    location: "",
    type: "Full-time",
    openings: 1,
    description: "",
    skills: "",
    salaryRange: "",
  });

  const handleParseJD = async (file?: File) => {
    if (!jdText && !file) return toast.error("Please paste a Job Description or upload a PDF first");
    
    setParsing(true);
    const toastId = toast.loading("Extracting details automatically with AI...");
    
    try {
      const formData = new FormData();
      if (file) formData.append("file", file);
      if (jdText) formData.append("jd", jdText);

      const res = await fetch("/api/parse-jd", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to parse JD");

      const data = JSON.parse(result.data);
      
      // Show warning if AI quota hit and regex was used
      if (result._source === "regex_fallback") {
        toast("⚠️ AI quota exceeded. Used smart pattern matching instead. Please review fields.", { duration: 5000 });
      }
      
      setForm({
        ...form,
        title: data.title || form.title,
        location: data.location || form.location,
        salaryRange: data.salary || form.salaryRange,
        skills: Array.isArray(data.skills) ? data.skills.join(", ") : form.skills,
        description: data.description || form.description,
        department: data.company ? `${data.company}` : "Engineering",
        type: data.type || form.type,
      });
      
      toast.success("Job Description parsed!", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Parse failed", { id: toastId });
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || "Failed to create job");
      }

      toast.success("Job created");
      onCreated();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to create job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <div>
            <h2 className="text-base font-semibold text-white">Create Job</h2>
            <p className="text-xs text-white/40 mt-0.5">Automate or manually setup structured pipeline tracking.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-white/40 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 border-b border-white/5 bg-indigo-500/5">
          <div className="flex items-start gap-4">
             <div className="flex-1">
               <label className="block text-xs font-semibold text-indigo-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                 <Sparkles className="w-3.5 h-3.5" />
                 Smart JD Auto-Fill
               </label>
               <textarea
                 rows={3}
                 placeholder="Paste your full Job Description here..."
                 value={jdText}
                 onChange={(e) => setJdText(e.target.value)}
                 className="w-full bg-[#0b0b14] border border-indigo-500/30 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none shadow-inner"
               />
             </div>
             <div className="flex flex-col gap-2 mt-6">
               <button
                 type="button"
                 disabled={parsing}
                 onClick={() => handleParseJD()}
                 className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold px-4 py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
               >
                 {parsing ? <Loader className="w-4 h-4 animate-spin" /> : <FileMinus className="w-4 h-4" />}
                 Extract Text
               </button>
               <input
                 type="file"
                 accept=".pdf"
                 className="hidden"
                 id="jd-file"
                 onChange={(e) => {
                   const file = e.target.files?.[0];
                   if (file) handleParseJD(file);
                 }}
               />
               <label
                 htmlFor="jd-file"
                 className="cursor-pointer flex-shrink-0 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white/80 border border-white/10 text-xs font-semibold px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
               >
                 <FileUp className="w-4 h-4" />
                 Upload PDF
               </label>
             </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Title</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Department</label>
              <input
                required
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Location</label>
              <input
                required
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Openings</label>
              <input
                type="number"
                min={1}
                value={form.openings}
                onChange={(e) => setForm({ ...form, openings: Number(e.target.value) })}
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Salary Range</label>
            <input
              required
              value={form.salaryRange}
              onChange={(e) => setForm({ ...form, salaryRange: e.target.value })}
              placeholder="18-24 LPA"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Skills</label>
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="React, TypeScript, Next.js"
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Description (Optional manual trim)</label>
            <textarea
              required
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full bg-[#0b0b14] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-white/70 text-sm font-medium py-2.5 rounded-xl transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors shadow-lg shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Create Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
