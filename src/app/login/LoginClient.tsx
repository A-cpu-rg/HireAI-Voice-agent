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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f6f8fb]">
  
      {/* LEFT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-8 py-10 lg:py-0">
        <div className="w-full max-w-md">
  
          {/* Brand */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 text-lg tracking-tight">
                HireAI
              </span>
            </div>
  
            <span className="text-xs text-gray-400">
              by <span className="font-medium text-gray-600">NavisLabs</span>
            </span>
          </div>
  
          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {mode === "login" ? "Welcome back 👋" : "Create your account"}
          </h2>
  
          <p className="text-gray-500 mb-6 sm:mb-8 text-sm leading-relaxed">
            Intelligent hiring powered by AI-driven screening & decision systems.
          </p>
  
          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
  
            {mode === "register" && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">
                  Full Name
                </label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>
            )}
  
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Email</label>
              <input
                ref={emailRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
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
                  className="w-full border border-gray-300 bg-white text-gray-900 rounded-lg px-4 py-3 pr-10 text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                />
  
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
  
            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-700 hover:bg-teal-800 text-white py-3 rounded-lg font-medium flex justify-center items-center gap-2 transition"
            >
              {loading && <Loader className="w-4 h-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
  
          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-gray-400 text-xs">
            <div className="flex-1 h-px bg-gray-200" />
            OR
            <div className="flex-1 h-px bg-gray-200" />
          </div>
  
          {/* Google */}
          <button className="w-full border border-gray-300 py-3 rounded-lg text-sm hover:bg-gray-50 transition">
            Continue with Google
          </button>
  
          {/* Switch */}
          <p className="text-center text-sm mt-5 text-gray-500">
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
  
      {/* RIGHT SIDE */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#0f172a] via-[#0f766e] to-[#0d9488] text-white p-10 xl:p-14 flex-col justify-center relative overflow-hidden">
  
        <p className="text-xs tracking-widest text-white/50 mb-6">
          NAVISLABS
        </p>
  
        <h2 className="text-3xl xl:text-4xl font-bold mb-6 leading-tight max-w-md">
          Intelligence layer for modern hiring
        </h2>
  
        <p className="text-base xl:text-lg text-white/80 mb-8 max-w-md">
          HireAI combines AI calls, resume intelligence, and structured scoring
          to help teams evaluate candidates faster.
        </p>
  
        <div className="bg-white/10 border border-white/10 rounded-2xl p-5 backdrop-blur max-w-md">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>Candidate #{i}</span>
                <span className="text-emerald-300">✔</span>
              </div>
            ))}
          </div>
        </div>
  
        <p className="text-sm text-white/50 mt-8">
          Built by NavisLabs
        </p>
      </div>
  
    </div>
  );
}
