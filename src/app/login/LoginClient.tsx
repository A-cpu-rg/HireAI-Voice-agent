"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bot, Loader, Eye, EyeOff, MailCheck, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [resending, setResending] = useState(false);
  const hasPendingVerification = Boolean(pendingVerificationEmail);

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

  const handleResendVerification = async (emailToUse?: string) => {
    const targetEmail = emailToUse || pendingVerificationEmail || email;
    if (!targetEmail) {
      toast.error("Enter your email first.");
      return;
    }

    setResending(true);
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification email.");
      }

      setPendingVerificationEmail(targetEmail);
      setPreviewUrl(data.previewUrl || "");
      toast.success("Verification email sent.");
    } catch (error: any) {
      toast.error(error.message || "Failed to resend verification email.");
    } finally {
      setResending(false);
    }
  };

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

      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

      const payload = mode === "login" ? { email, password } : { name, email, password };

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
        if (data.code === "EMAIL_NOT_VERIFIED") {
          setPendingVerificationEmail(email);
        }
        throw new Error(
          data.error || (mode === "login" ? "Invalid credentials" : "Failed to create account")
        );
      }

      if (mode === "login") {
        toast.success("Welcome back 🚀");
        router.push("/");
      } else {
        setPendingVerificationEmail(email);
        setPreviewUrl(data.previewUrl || "");
        toast.success("Account created. Verify your email to continue.");
        setMode("login");
        setPassword("");

        if (data.previewUrl) {
          setTimeout(() => {
            window.location.href = data.previewUrl;
          }, 600);
        }
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
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] lg:flex-row">
      {/* LEFT SIDE */}
      <div className="flex w-full items-center justify-center px-6 py-10 sm:px-8 lg:w-1/2 lg:py-0">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 shadow-md">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-gray-900">HireAI</span>
            </div>

            <span className="text-xs text-gray-400">
              by <span className="font-medium text-gray-600">NavisLabs</span>
            </span>
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">
            {hasPendingVerification
              ? "Check your email"
              : mode === "login"
                ? "Welcome back 👋"
                : "Create your account"}
          </h2>

          <p className="mb-6 text-sm leading-relaxed text-gray-500 sm:mb-8">
            {hasPendingVerification
              ? "Verify your email once, then sign in and start using HireAI."
              : "Intelligent hiring powered by AI-driven screening & decision systems."}
          </p>

          {pendingVerificationEmail && (
            <div className="mb-6 rounded-2xl border border-teal-200 bg-teal-50 p-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-xl bg-teal-100 p-2 text-teal-700">
                  <MailCheck className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-teal-900">Verify your email</p>
                  <p className="mt-1 text-xs leading-relaxed text-teal-800/80">
                    We sent a verification link to{" "}
                    <span className="font-medium">{pendingVerificationEmail}</span>. Open that link
                    first, then sign in.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {previewUrl && (
                      <a
                        href={previewUrl}
                        className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-800"
                      >
                        <MailCheck className="h-3.5 w-3.5" />
                        Verify now
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => handleResendVerification(pendingVerificationEmail)}
                      disabled={resending}
                      className="inline-flex items-center gap-2 rounded-lg border border-teal-300 bg-white px-3 py-2 text-xs font-medium text-teal-800 transition hover:bg-teal-100 disabled:opacity-50"
                    >
                      {resending ? (
                        <Loader className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Resend verification
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {mode === "register" && (
              <div>
                <label className="mb-1 block text-xs text-gray-500">Full Name</label>
                <input
                  ref={nameRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-gray-500">Email</label>
              <input
                ref={emailRef}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-gray-500">Password</label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-teal-500"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-3 right-3 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-700 py-3 font-medium text-white transition hover:bg-teal-800"
            >
              {loading && <Loader className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            OR
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          {/* Google */}
          <button className="w-full rounded-lg border border-gray-300 py-3 text-sm transition hover:bg-gray-50">
            Continue with Google
          </button>

          {/* Switch */}
          <p className="mt-5 text-center text-sm text-gray-500">
            {mode === "login" ? (
              <>
                Don’t have an account?{" "}
                <button onClick={() => setMode("register")} className="font-medium text-teal-700">
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button onClick={() => setMode("login")} className="font-medium text-teal-700">
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative hidden w-1/2 flex-col justify-center overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#0f766e] to-[#0d9488] p-10 text-white lg:flex xl:p-14">
        <p className="mb-6 text-xs tracking-widest text-white/50">NAVISLABS</p>

        <h2 className="mb-6 max-w-md text-3xl leading-tight font-bold xl:text-4xl">
          Intelligence layer for modern hiring
        </h2>

        <p className="mb-8 max-w-md text-base text-white/80 xl:text-lg">
          HireAI combines AI calls, resume intelligence, and structured scoring to help teams
          evaluate candidates faster.
        </p>

        <div className="max-w-md rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>Candidate #{i}</span>
                <span className="text-emerald-300">✔</span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-sm text-white/50">Built by NavisLabs</p>
      </div>
    </div>
  );
}
