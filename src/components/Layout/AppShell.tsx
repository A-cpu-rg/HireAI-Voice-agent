"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Layout/Sidebar";
import LayoutClientWrapper from "@/components/Layout/LayoutClientWrapper";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <>
      <Sidebar />
      <LayoutClientWrapper>{children}</LayoutClientWrapper>
    </>
  );
}
