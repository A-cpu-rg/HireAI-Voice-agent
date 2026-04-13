"use client";

import { useApp } from "@/context/AppContext";
import { cn } from "@/utils/cn";

export default function LayoutClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { sidebarOpen } = useApp();

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
