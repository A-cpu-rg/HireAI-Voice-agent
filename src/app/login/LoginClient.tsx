"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader, ArrowRight, ShieldCheck, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Autofocus email on mount and mode switch
    if (emailRef.current) {
      emailRef.current.focus();
    }
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Invalid email or password");

        toast.success("Welcome back to HireAI");
        window.location.href = "/";
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");

        toast.success("Account created successfully! Please log in.");
        setMode("login");
        setPassword("");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-[#0b0b14] flex">
      {/* LEFT SIDE: Branding / Value */}
      <div className="hidden lg:flex w-1/2 bg-[#080810] border-r border-white/5 relative items-center justify-center p-12 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-xl relative z-10 w-full">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-[inset_0_1px_rgba(255,255,255,0.1)]">
              <Bot className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">HireAI</h1>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white leading-[1.1] mb-6">
            AI Hiring <br />
            Automation Platform
          </h2>
          
          <p className="text-lg text-indigo-300 font-medium mb-10 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-indigo-500/50" />
            Screen 100 candidates in under 1 hour using AI calls
          </p>

          {/* Simple Illustration / UI Preview */}
          <div className="bg-[#13131f] border border-white/10 rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#13131f] via-transparent to-transparent z-10 rounded-2xl" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="w-32 h-4 bg-white/5 rounded-full" />
              <div className="w-16 h-4 bg-indigo-500/20 rounded-full" />
            </div>
            
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/30">AI</div>
                    <div className="space-y-2">
                       <div className="w-24 h-2.5 bg-white/10 rounded-full" />
                       <div className="w-16 h-2 bg-white/5 rounded-full" />
                    </div>
                  </div>
                  <div className="w-10 h-4 bg-emerald-500/20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 relative">
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-center gap-2 mb-8">
            <Bot className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">HireAI</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">
              {mode === "login" ? "Welcome back 👋" : "Create your account"}
            </h2>
            <p className="text-sm text-white/45">
              {mode === "login" 
                ? "Sign in to your account" 
                : "Start screening candidates in minutes"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Email Address</label>
              <input
                ref={emailRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#13131f] border border-white/10 rounded-xl px-4 py-3.5 pr-12 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 shadow-[inset_0_1px_rgba(255,255,255,0.2)] mt-6 flex justify-center items-center gap-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader className="w-4 h-4 animate-spin" /> 
                  {mode === "login" ? "Signing in..." : "Creating account..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5 text-center">
            {mode === "login" ? (
              <p className="text-sm text-white/45">
                 Don't have an account?{" "}
                 <button onClick={() => setMode("register")} className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                   Create Account
                 </button>
              </p>
            ) : (
              <p className="text-sm text-white/45">
                 Already have an account?{" "}
                 <button onClick={() => setMode("login")} className="text-indigo-400 font-semibold hover:text-indigo-300 transition-colors">
                   Sign In
                 </button>
              </p>
            )}
          </div>

          <div className="mt-12 flex items-center justify-center gap-2 text-white/30 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            Your data is securely encrypted
          </div>
        </div>
      </div>
    </div>
  );
}
