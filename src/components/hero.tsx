"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingDown } from "lucide-react";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
};

// Apple-style hero: center everything, let type do the work, keep the
// background calm (a faint ticker grid instead of anything busy), and use a
// slow, staggered entrance rather than snapping everything in at once.
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b bg-primary text-primary-foreground">
      <div className="ledger-grid absolute inset-0 opacity-[0.15]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-primary" />
      <div className="pointer-events-none absolute -right-24 top-8 hidden animate-float text-primary-foreground/[0.06] lg:block">
        <TrendingDown className="h-80 w-80" strokeWidth={0.6} />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="container relative flex flex-col items-center gap-7 py-28 text-center md:py-40"
      >
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-xs font-medium tracking-wide backdrop-blur-sm"
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-signal" />
          </span>
          Tracking prices across Amazon &amp; Flipkart
        </motion.span>

        <motion.h1 variants={fadeUp} className="headline max-w-4xl text-5xl md:text-7xl lg:text-[5.5rem]">
          Know if it's <span className="gradient-text">actually</span>
          <br className="hidden sm:block" /> a deal.
        </motion.h1>

        <motion.p variants={fadeUp} className="max-w-xl text-balance text-lg text-primary-foreground/70 md:text-xl">
          Every product here has a real price history — not just today's discount badge.
        </motion.p>

        <motion.div variants={fadeUp} className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="signal" className="group rounded-full px-7 text-base">
            <Link href="/deals">
              Browse today's deals
              <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="rounded-full border-primary-foreground/25 bg-transparent px-7 text-base text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link href="/categories">Explore categories</Link>
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} className="mt-6 grid w-full max-w-2xl grid-cols-3 gap-4 border-t border-primary-foreground/10 pt-8">
          {[
            { label: "6-month history", value: "Every product" },
            { label: "Deal score", value: "0–100 scale" },
            { label: "Price alerts", value: "Free forever" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="tabular-price text-sm font-semibold md:text-base">{stat.value}</p>
              <p className="mt-0.5 text-xs text-primary-foreground/50">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
