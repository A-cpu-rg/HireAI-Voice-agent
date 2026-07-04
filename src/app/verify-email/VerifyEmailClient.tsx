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
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center shadow-2xl backdrop-blur">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
          {status === "loading" && <Loader className="h-6 w-6 animate-spin text-indigo-300" />}
          {status === "success" && <CheckCircle2 className="h-6 w-6 text-emerald-400" />}
          {status === "error" && <MailWarning className="h-6 w-6 text-amber-400" />}
        </div>
        <h1 className="mb-2 text-2xl font-semibold text-white">
          {status === "success"
            ? "Email verified"
            : status === "error"
              ? "Verification failed"
              : "Checking your link"}
        </h1>
        <p className="mb-6 text-sm leading-relaxed text-white/65">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.replace("/login")}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <XCircle className="h-4 w-4" />
            Back to login
          </button>
        )}
      </div>
    </div>
  );
}
