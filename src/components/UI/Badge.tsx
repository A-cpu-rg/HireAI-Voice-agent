import { cn } from "../../utils/cn";
import { CandidateStatus } from "../../types";

const statusConfig: Record<CandidateStatus, { label: string; classes: string; dot: string }> = {
  pending: { label: "Pending", classes: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-400" },
  scheduled: { label: "Scheduled", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  calling: { label: "Live Call", classes: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400 animate-pulse" },
  completed: { label: "Completed", classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", dot: "bg-cyan-400" },
  failed: { label: "Failed", classes: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400" },
  shortlisted: { label: "Shortlisted", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  rejected: { label: "Rejected", classes: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-400" },
};

export function StatusBadge({ status }: { status: CandidateStatus }) {
  const config = statusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", config.classes)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
    : score >= 60 ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
    : "text-rose-400 bg-rose-500/10 border-rose-500/20";

  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border", color)}>
      {score}
      <span className="font-normal opacity-60">/100</span>
    </span>
  );
}

export function TagBadge({ tag }: { tag: string }) {
  return (
    <span className="inline-flex items-center text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
      {tag}
    </span>
  );
}
