import { Suspense } from "react";
import VerifyEmailClient from "./VerifyEmailClient";

export default function VerifyEmailPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.22),_transparent_35%),linear-gradient(180deg,#0b0b14_0%,#080810_100%)] text-white px-6 py-10">
      <Suspense
        fallback={
          <div className="min-h-[70vh] flex items-center justify-center text-white/60">
            Verifying email...
          </div>
        }
      >
        <VerifyEmailClient />
      </Suspense>
    </main>
  );
}

