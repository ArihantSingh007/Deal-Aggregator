import { cn } from "@/lib/utils";

const LABEL_STYLES: Record<string, string> = {
  "Excellent Deal": "bg-signal text-signal-foreground",
  "Great Deal": "bg-signal/80 text-signal-foreground",
  "Good Deal": "bg-accent/80 text-accent-foreground",
  "Normal Price": "bg-muted text-muted-foreground",
};

export function DealScoreBadge({ score, label, className }: { score: number; label: string; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        LABEL_STYLES[label] ?? LABEL_STYLES["Normal Price"],
        label === "Excellent Deal" && "animate-pulse-signal",
        className
      )}
      title={`Deal score: ${score}/100`}
    >
      <span className="tabular-price">{score}</span>
      <span>{label}</span>
    </div>
  );
}
