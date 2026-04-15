import { cn } from "../../utils/cn";

const callStatusConfig: Record<string, { label: string; classes: string; dot: string }> = {
  pending: { label: "Ready", classes: "bg-slate-500/10 text-slate-300 border-slate-500/20", dot: "bg-slate-300" },
  calling: { label: "Calling", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20", dot: "bg-amber-400 animate-pulse" },
  processing: { label: "Processing", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400 animate-pulse" },
  completed: { label: "Completed", classes: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20", dot: "bg-cyan-400" },
  failed: { label: "Failed", classes: "bg-rose-500/10 text-rose-400 border-rose-500/20", dot: "bg-rose-400" },
};

const decisionStatusConfig: Record<string, { label: string; classes: string }> = {
  undecided: { label: "Awaiting Decision", classes: "bg-white/5 text-white/50 border-white/10" },
  shortlisted: { label: "Shortlisted", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
  rejected: { label: "Rejected", classes: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
};

export function CallStatusBadge({ status }: { status: string }) {
  const config = callStatusConfig[status] || callStatusConfig.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border", config.classes)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {config.label}
    </span>
  );
}

export function DecisionBadge({ status }: { status: string }) {
  const config = decisionStatusConfig[status] || decisionStatusConfig.undecided;
  return (
    <span className={cn("inline-flex items-center text-[11px] font-semibold px-2.5 py-1 rounded-full border", config.classes)}>
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
