"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader, MailWarning, XCircle } from "lucide-react";

export default function VerifyEmailClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setStatus("error");
        setMessage("Verification token is missing.");
        return;
      }

      try {
        const res = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to verify email.");
        }

        setStatus("success");
        setMessage("Your email is verified. Redirecting to HireAI...");
        setTimeout(() => {
          router.replace("/");
          router.refresh();
        }, 1500);
      } catch (error) {
        setStatus("error");
        setMessage(error instanceof Error ? error.message : "Failed to verify email.");
      }
    };

    verify();
  }, [router, token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur p-8 text-center shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
          {status === "loading" && <Loader className="w-6 h-6 animate-spin text-indigo-300" />}
          {status === "success" && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
          {status === "error" && <MailWarning className="w-6 h-6 text-amber-400" />}
        </div>
        <h1 className="text-2xl font-semibold text-white mb-2">
          {status === "success" ? "Email verified" : status === "error" ? "Verification failed" : "Checking your link"}
        </h1>
        <p className="text-sm text-white/65 leading-relaxed mb-6">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.replace("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 transition-colors"
          >
            <XCircle className="w-4 h-4" />
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
