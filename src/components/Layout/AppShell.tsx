"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import LayoutClientWrapper from "@/components/Layout/LayoutClientWrapper";
import { useApp } from "@/context/AppContext";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setCurrentUser } = useApp();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const isAuthPage = pathname === "/login";

  useEffect(() => {
    let cancelled = false;

    const verifySession = async () => {
      if (isAuthPage) {
        setCheckingAuth(false);
        return;
      }

      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });

        if (!res.ok) {
          setCurrentUser(null);
          router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
          return;
        }

        const data = await res.json();
        if (!cancelled) {
          setCurrentUser(data.user);
          setCheckingAuth(false);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
          router.replace(`/login?next=${encodeURIComponent(pathname || "/")}`);
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [isAuthPage, pathname, router, setCurrentUser]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-[#0b0b14] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white/15 border-t-indigo-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-white/45">Checking session...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <Sidebar />
      <LayoutClientWrapper>{children}</LayoutClientWrapper>
    </>
  );
}
