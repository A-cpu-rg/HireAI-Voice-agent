"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Loader, LockKeyhole, Mail, Mic2, User } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get("next") || "/";
  const safeNextUrl = nextUrl.startsWith("/") ? nextUrl : "/";
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      toast.success(mode === "login" ? "Welcome back" : "Account created");
      localStorage.removeItem("hireai-mode");
      router.replace(safeNextUrl);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100vh-5rem)] grid grid-cols-2 gap-8 items-center">
      <section className="space-y-6">
        <div className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Mic2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">HireAI</p>
            <p className="text-xs text-indigo-300">Powered by Bolna</p>
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-indigo-300/70 mb-3">Recruiter Workspace</p>
          <h1 className="text-4xl font-semibold leading-tight">Log in and run AI screening from one clean workflow.</h1>
          <p className="text-sm text-white/55 leading-relaxed mt-4 max-w-xl">
            HireAI helps recruiters move from candidate intake to AI interview to scored decision without juggling tools. Sign in to access your candidates, jobs, call logs, and Bolna connection settings.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { title: "Candidate pipeline", text: "Track every candidate from ready to completed to decision." },
            { title: "AI call workflow", text: "Start calls, watch status progress, and review transcripts." },
            { title: "Bolna connection", text: "Connect once, then operate from the recruiter interface." },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
              <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
              <p className="text-xs text-white/45 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#13131f]/95 p-7 shadow-2xl shadow-black/30">
        <div className="flex items-center gap-2 rounded-2xl bg-[#0b0b14] border border-white/10 p-1 mb-6">
          <button
            onClick={() => setMode("login")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-indigo-600 text-white" : "text-white/55 hover:text-white"}`}
          >
            Log In
          </button>
          <button
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${mode === "signup" ? "bg-indigo-600 text-white" : "text-white/55 hover:text-white"}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-white/50 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Abhishek Meena"
                  className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-1.5">Password</label>
            <div className="relative">
              <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
              <input
                required
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                className="w-full bg-[#0b0b14] border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-3 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {loading && <Loader className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Log In to HireAI" : "Create Account"}
          </button>
        </form>
      </section>
    </div>
  );
}
