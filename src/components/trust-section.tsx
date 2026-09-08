import { RevealGrid, RevealItem } from "@/components/reveal-grid";
import { ShieldCheck, LineChart, BellRing, CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const POINTS = [
  {
    icon: LineChart,
    badge: "24/7 Scraping",
    title: "Real 6-Month Price History",
    body: "Retailers frequently mark up prices right before a 'sale' event. We store true historical price points daily so you never get tricked.",
    accent: "from-blue-500/20 to-cyan-500/20 text-blue-600 dark:text-cyan-400",
  },
  {
    icon: ShieldCheck,
    badge: "Algorithmic Deal Score",
    title: "Transparent 0–100 Rating",
    body: "Every product gets scored automatically based on discount magnitude, historical variance, rating authenticity, and stock stability.",
    accent: "from-signal/20 to-emerald-500/20 text-signal dark:text-signal",
  },
  {
    icon: BellRing,
    badge: "Direct Notifications",
    title: "Smart Price Drop Alerts",
    body: "Set your target price once. When Amazon or Flipkart drops to that threshold, we notify you immediately with no spam or sponsored filler.",
    accent: "from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-400",
  },
];

export function TrustSection() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-secondary/30 py-24 md:py-32">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-96 w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/5 blur-[120px]" />

      <div className="container relative">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-foreground/80">
            Why DealLedger
          </span>
          <h2 className="headline mt-4 text-3xl font-extrabold md:text-5xl">
            Never pay inflated sale prices again.
          </h2>
          <p className="mt-3 text-base text-muted-foreground md:text-lg">
            Built for smart shoppers who want real financial data before making purchases on Amazon or Flipkart.
          </p>
        </div>

        <RevealGrid className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
          {POINTS.map((point) => (
            <RevealItem
              key={point.title}
              className="group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-elevated transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-elevated-lg"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${point.accent}`}>
                    <point.icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                    {point.badge}
                  </span>
                </div>

                <h3 className="mt-5 font-display text-lg font-bold text-foreground">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>

              <div className="mt-6 border-t border-border/60 pt-4">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-signal">
                  <CheckCircle className="h-3.5 w-3.5" /> Verified feature
                </span>
              </div>
            </RevealItem>
          ))}
        </RevealGrid>
      </div>
    </section>
  );
}

