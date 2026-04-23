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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
  
      <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-2xl mx-4 shadow-xl max-h-[90vh] overflow-y-auto">
  
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Create Job</h2>
            <p className="text-xs text-gray-500 mt-1">
              Auto-fill using JD or manually enter job details
            </p>
          </div>
  
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
  
        {/* JD SECTION */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50">
  
          <label className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Smart JD Auto-Fill
          </label>
  
          <div className="flex gap-3 flex-wrap">
  
            <textarea
              rows={3}
              placeholder="Paste your job description here..."
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="flex-1 min-w-[200px] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 resize-none"
            />
  
            <div className="flex flex-col gap-2">
  
              <button
                type="button"
                disabled={parsing}
                onClick={() => handleParseJD()}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs px-4 py-2.5 rounded-lg flex items-center gap-2"
              >
                {parsing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <FileMinus className="w-4 h-4" />
                )}
                Extract
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
                className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 justify-center"
              >
                <FileUp className="w-4 h-4" />
                Upload PDF
              </label>
  
            </div>
          </div>
        </div>
  
        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
  
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              placeholder="Job Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
  
            <input
              required
              placeholder="Department"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
  
          <div className="grid grid-cols-3 gap-4">
            <input
              required
              placeholder="Location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
  
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Contract</option>
              <option>Internship</option>
            </select>
  
            <input
              type="number"
              min={1}
              value={form.openings}
              onChange={(e) =>
                setForm({ ...form, openings: Number(e.target.value) })
              }
              className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
  
          <input
            required
            placeholder="Salary Range (e.g. 18-24 LPA)"
            value={form.salaryRange}
            onChange={(e) =>
              setForm({ ...form, salaryRange: e.target.value })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          />
  
          <input
            placeholder="Skills (comma separated)"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm"
          />
  
          <textarea
            required
            rows={3}
            placeholder="Job Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm resize-none"
          />
  
          {/* ACTIONS */}
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
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              Create Job
            </button>
  
          </div>
        </form>
      </div>
    </div>
  );
}
