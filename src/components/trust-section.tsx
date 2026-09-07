import { RevealGrid, RevealItem } from "@/components/reveal-grid";
import { ShieldCheck, LineChart, BellRing } from "lucide-react";

const POINTS = [
  {
    icon: LineChart,
    title: "Real price history",
    body: "Six months of tracked prices per product, so a 'sale' has to actually be one.",
  },
  {
    icon: ShieldCheck,
    title: "A transparent score",
    body: "Every deal score breaks down into discount, trend, rating, and availability.",
  },
  {
    icon: BellRing,
    title: "Alerts, not ads",
    body: "Set a target price once. We'll surface it — no sponsored placements in between.",
  },
];

export function TrustSection() {
  return (
    <section className="bg-foreground py-24 text-background md:py-32">
      <div className="container">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow text-background/50">Why DealLedger</p>
          <h2 className="headline mt-3 text-4xl md:text-5xl">No fake discounts. No guesswork.</h2>
        </div>

        <RevealGrid className="mx-auto mt-16 grid max-w-4xl gap-10 sm:grid-cols-3 sm:gap-8">
          {POINTS.map((point) => (
            <RevealItem key={point.title} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-background/10">
                <point.icon className="h-5 w-5 text-signal" />
              </div>
              <h3 className="font-display text-lg font-semibold">{point.title}</h3>
              <p className="text-sm leading-relaxed text-background/60">{point.body}</p>
            </RevealItem>
          ))}
        </RevealGrid>
      </div>
    </section>
  );
}
