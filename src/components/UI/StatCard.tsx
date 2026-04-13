import { LucideIcon } from "lucide-react";
import { cn } from "../../utils/cn";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color: "indigo" | "emerald" | "violet" | "amber" | "rose" | "cyan";
  suffix?: string;
}

const colorMap = {
  indigo: { bg: "bg-indigo-500/10", icon: "text-indigo-400", border: "border-indigo-500/20", glow: "shadow-indigo-500/10" },
  emerald: { bg: "bg-emerald-500/10", icon: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-emerald-500/10" },
  violet: { bg: "bg-violet-500/10", icon: "text-violet-400", border: "border-violet-500/20", glow: "shadow-violet-500/10" },
  amber: { bg: "bg-amber-500/10", icon: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  rose: { bg: "bg-rose-500/10", icon: "text-rose-400", border: "border-rose-500/20", glow: "shadow-rose-500/10" },
  cyan: { bg: "bg-cyan-500/10", icon: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
};

export default function StatCard({ label, value, icon: Icon, trend, color, suffix }: StatCardProps) {
  const c = colorMap[color];

  return (
    <div className={cn("relative rounded-2xl p-5 border bg-[#13131f] shadow-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-2xl", c.border, c.glow)}>
      <div className="flex items-start justify-between mb-4">
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c.bg)}>
          <Icon className={cn("w-5 h-5", c.icon)} />
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full",
            trend.value >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          )}>
            <span>{trend.value >= 0 ? "↑" : "↓"}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1 tracking-tight">
        {value}<span className="text-lg text-white/40 ml-1 font-medium">{suffix}</span>
      </div>
      <div className="text-sm text-white/40 font-medium">{label}</div>
      {trend && (
        <div className="text-[11px] text-white/25 mt-1">{trend.label}</div>
      )}
    </div>
  );
}
