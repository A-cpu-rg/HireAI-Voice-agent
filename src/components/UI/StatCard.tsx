import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "indigo" | "emerald" | "violet" | "amber" | "rose" | "cyan";
  suffix?: string;
}

const colorMap = {
  indigo: {
    bg: "bg-indigo-500/10",
    icon: "text-indigo-400",
    border: "border-indigo-500/20",
    glow: "shadow-indigo-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/10",
    icon: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
  },
  violet: {
    bg: "bg-violet-500/10",
    icon: "text-violet-400",
    border: "border-violet-500/20",
    glow: "shadow-violet-500/10",
  },
  amber: {
    bg: "bg-amber-500/10",
    icon: "text-amber-400",
    border: "border-amber-500/20",
    glow: "shadow-amber-500/10",
  },
  rose: {
    bg: "bg-rose-500/10",
    icon: "text-rose-400",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/10",
    icon: "text-cyan-400",
    border: "border-cyan-500/20",
    glow: "shadow-cyan-500/10",
  },
};

export default function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color,
  suffix,
}: StatCardProps) {
  const c = colorMap[color ?? "indigo"];

  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-[#13131f] p-5 shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl",
        c.border,
        c.glow
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", c.bg)}>
          <Icon className={cn("h-5 w-5", c.icon)} />
        </div>
        {trend && (
          <div
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
              trend.value >= 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-rose-500/10 text-rose-400"
            )}
          >
            <span>{trend.value >= 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="mb-1 text-3xl font-bold tracking-tight text-white">
        {value}
        <span className="ml-1 text-lg font-medium text-white/40">{suffix}</span>
      </div>
      <div className="text-sm font-medium text-white/40">{label}</div>
      {trend && <div className="mt-1 text-[11px] text-white/25">{trend.label}</div>}
    </div>
  );
}
