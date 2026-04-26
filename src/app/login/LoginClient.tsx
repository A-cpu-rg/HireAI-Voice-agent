"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (mode === "register") {
        nameRef.current?.focus();
      } else {
        emailRef.current?.focus();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    if (!email || !password) {
      toast.error("Email and password are required");
      return;
    }

    if (!email.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }

    if (mode === "register" && !name) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload =
        mode === "login"
          ? { email, password }
          : { name, email, password };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Unexpected server response");
      }

      if (!res.ok) {
        throw new Error(
          mode === "login"
            ? "Invalid credentials"
            : "Failed to create account"
        );
      }

      if (mode === "login") {
        toast.success("Welcome back 🚀");
        router.push("/");
      } else {
        toast.success("Account created! Please login.");
        setMode("login");
        setPassword("");
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        toast.error("Request timed out. Try again.");
      } else {
        toast.error(error.message || "Something went wrong");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f6f8fb]">
  
      {/* LEFT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-8">
        <div className="w-full max-w-md">
  
          {/* Brand */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg tracking-tight">
                HireAI
              </span>
            </div>
  
            <span className="text-xs text-gray-400">
              by <span className="font-medium text-gray-600">NavisLab</span>
            </span>
          </div>
  
          {/* Heading */}
          <h2 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h2>
  
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">
            Intelligent hiring powered by AI-driven screening & decision systems.
          </p>
  
          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-5">
  
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Full Name
                </label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 caret-teal-600 rounded-lg px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
              </div>
            )}
  
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 caret-teal-600 rounded-lg px-4 py-3 text-sm shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
              />
            </div>
  
            <div>
              <label className="text-xs text-gray-500 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 bg-white text-gray-900 placeholder-gray-400 caret-teal-600 rounded-lg px-4 py-3 pr-10 text-sm shadow-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
  
            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-800 hover:bg-teal-900 text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
  
          {/* Divider */}
          <div className="my-6 flex items-center gap-3 text-gray-400 text-xs">
            <div className="flex-1 h-px bg-gray-200" />
            OR
            <div className="flex-1 h-px bg-gray-200" />
          </div>
  
          {/* Google */}
          <button className="w-full border border-gray-300 py-3 rounded-lg text-sm flex justify-center gap-2 hover:bg-gray-50 transition shadow-sm">
            Continue with Google
          </button>
  
          {/* Switch */}
          <p className="text-center text-sm mt-6 text-gray-500">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button
                  onClick={() => setMode("register")}
                  className="text-teal-700 font-medium"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => setMode("login")}
                  className="text-teal-700 font-medium"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
  
      {/* RIGHT SIDE (PREMIUM BRAND PANEL) */}
      <div className="hidden lg:flex w-1/2 relative bg-gradient-to-br from-[#0f172a] via-[#0f766e] to-[#0d9488] text-white p-14 flex-col justify-center overflow-hidden">
  
        {/* glow */}
        <div className="absolute w-[500px] h-[500px] bg-teal-400/20 blur-[140px] top-[-150px] right-[-100px]" />
  
        {/* subtle pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(circle,white_1px,transparent_1px)] [background-size:20px_20px]" />
  
        {/* small branding */}
        <p className="text-xs tracking-widest text-white/50 mb-6">
          NAVISLABS
        </p>
  
        {/* headline */}
        <h2 className="text-4xl font-bold mb-6 leading-tight max-w-md">
          Intelligence layer for modern hiring
        </h2>
  
        {/* description */}
        <p className="text-lg text-white/80 mb-10 max-w-md leading-relaxed">
          HireAI combines AI calls, resume intelligence, and structured scoring
          to help teams evaluate candidates faster and make better decisions.
        </p>
  
        {/* product visual card */}
        <div className="bg-white/10 border border-white/10 rounded-2xl p-6 backdrop-blur mb-10 max-w-md shadow-lg">
  
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-white/70">AI Screening</span>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-md">
              LIVE
            </span>
          </div>
  
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    AI
                  </div>
                  <div>
                    <p className="text-sm">Candidate #{i}</p>
                    <p className="text-xs text-white/50">Analyzed</p>
                  </div>
                </div>
                <span className="text-xs text-emerald-300">✔</span>
              </div>
            ))}
          </div>
        </div>
  
        {/* footer */}
        <p className="text-sm text-white/50">
          Built by NavisLab • AI-native hiring workflow
        </p>
  
      </div>
    </div>
  );
}
