"use client";

import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";
import { usePathname } from "next/navigation";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useApp();
  const pathname = usePathname();

  if (pathname === "/login") {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <main
      className={cn(
        "transition-all duration-300 min-h-screen",
        sidebarOpen ? "ml-60" : "ml-[68px]"
      )}
    >
      {children}
    </main>
  );
}
