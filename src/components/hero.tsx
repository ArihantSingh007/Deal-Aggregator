"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingDown,
  Search,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

const QUICK_TAGS = ["iPhone 15", "Sony WH-1000XM5", "MacBook Air", "AirPods Pro", "PS5"];

export function Hero() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/deals?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  }

  function handleTagClick(tag: string) {
    router.push(`/deals?search=${encodeURIComponent(tag)}`);
  }

  return (
    <section className="relative overflow-hidden border-b bg-background">
      {/* Ambient background glows */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[550px] w-[850px] -translate-x-1/2 rounded-full bg-gradient-to-tr from-signal/15 via-primary/10 to-accent/15 blur-[120px] dark:from-signal/20 dark:via-primary/15 dark:to-accent/10" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-72 w-72 rounded-full bg-signal/10 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/3 -right-32 -z-10 h-80 w-80 rounded-full bg-accent/10 blur-[100px]" />

      <div className="container relative py-16 md:py-24 lg:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Headline, Search, Stats */}
          <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
            {/* Live radar badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-signal/30 bg-signal/10 px-3.5 py-1.5 text-xs font-semibold text-signal shadow-xs backdrop-blur-md"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal opacity-80" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-signal" />
              </span>
              <span>Live Price Intelligence • Amazon &amp; Flipkart</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="headline mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-[4rem] lg:leading-[1.08]"
            >
              Stop falling for <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-destructive via-accent to-destructive bg-clip-text text-transparent">
                fake sale discounts.
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-4 max-w-xl text-balance text-base text-muted-foreground sm:text-lg md:text-xl"
            >
              We track historical prices 24/7 across major retailers. Know the 6-month average, verify true discounts, and get instant drop alerts before you checkout.
            </motion.p>

            {/* Hero Interactive Search Bar */}
            <motion.form
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onSubmit={onSearch}
              className="mt-6 flex w-full max-w-lg items-center rounded-2xl border border-border/80 bg-card p-1.5 shadow-elevated transition-all focus-within:border-signal/50 focus-within:ring-4 focus-within:ring-signal/10"
            >
              <div className="flex flex-1 items-center gap-2 pl-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Paste a product name or search e.g. Sony WH-1000XM5..."
                  className="w-full bg-transparent text-sm font-medium placeholder:text-muted-foreground/70 focus:outline-none"
                />
              </div>
              <Button type="submit" size="sm" variant="signal" className="rounded-xl px-5 font-semibold">
                Search Deals
              </Button>
            </motion.form>

            {/* Quick search tags */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground"
            >
              <span className="flex items-center gap-1 font-medium text-foreground/70">
                <Sparkles className="h-3 w-3 text-accent" /> Popular:
              </span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagClick(tag)}
                  className="rounded-lg bg-secondary/80 px-2.5 py-1 font-medium text-secondary-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button asChild size="lg" variant="signal" className="group rounded-full px-7 text-base font-semibold shadow-md">
                <Link href="/deals">
                  Explore Today's Deals
                  <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border/80 bg-card/60 px-6 text-base font-medium backdrop-blur-sm hover:bg-secondary"
              >
                <Link href="/categories">All Categories</Link>
              </Button>
            </motion.div>

            {/* Trust highlights */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="mt-8 flex flex-wrap items-center gap-6 text-xs font-medium text-muted-foreground"
            >
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-signal" /> 100% Free &amp; Ad-free
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-signal" /> Direct Store Checkout
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-signal" /> Real Price History
              </span>
            </motion.div>
          </div>

          {/* Right Column: Live Deal Spotlight Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:col-span-5"
          >
            {/* Glow backdrop behind card */}
            <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-r from-signal/30 via-primary/20 to-accent/30 opacity-60 blur-xl transition-all duration-500 hover:opacity-100" />

            <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card/90 p-6 shadow-elevated-lg backdrop-blur-xl">
              {/* Header inside spotlight */}
              <div className="flex items-center justify-between border-b border-border/60 pb-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal/15 text-signal">
                    <Zap className="h-4 w-4" />
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deal of the Hour</span>
                    <p className="text-xs font-medium text-signal">Verified 32% Below 6-Mo Avg</p>
                  </div>
                </div>
                <span className="rounded-full bg-signal px-2.5 py-0.5 text-xs font-bold text-signal-foreground">
                  Score: 98/100
                </span>
              </div>

              {/* Product mini showcase */}
              <div className="mt-5 flex gap-4">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-secondary/70 p-2">
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-signal/10 font-mono text-2xl font-bold text-foreground/80">
                    🎧
                  </div>
                  <span className="absolute bottom-1 right-1 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -35%
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sony Audio</span>
                  <h3 className="line-clamp-2 font-display text-sm font-bold leading-snug">
                    Sony WH-1000XM5 Wireless Noise Cancelling Headphones
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-2">
                    <span className="tabular-price font-mono text-xl font-extrabold text-foreground">₹22,990</span>
                    <span className="tabular-price text-xs text-muted-foreground line-through">₹34,990</span>
                  </div>
                </div>
              </div>

              {/* Retailer price comparison preview */}
              <div className="mt-5 space-y-2 rounded-2xl bg-secondary/50 p-3 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-background/80 px-3 py-2 border border-signal/30 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-signal" />
                    <span className="font-bold text-foreground">Amazon India</span>
                    <span className="rounded-full bg-signal/15 px-2 py-0.5 text-[10px] font-bold text-signal">Lowest</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="tabular-price font-mono font-bold text-foreground">₹22,990</span>
                    <CheckCircle2 className="h-3.5 w-3.5 text-signal" />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-background/40 px-3 py-2 text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                    <span className="font-medium">Flipkart</span>
                  </div>
                  <span className="tabular-price font-mono font-semibold">₹26,499</span>
                </div>
              </div>

              {/* Action row */}
              <div className="mt-5 flex items-center justify-between gap-3 pt-2">
                <div className="text-xs">
                  <span className="text-muted-foreground">You save: </span>
                  <span className="font-mono font-bold text-signal">₹12,000</span>
                </div>
                <Button asChild size="sm" variant="signal" className="rounded-xl px-4 font-semibold text-xs">
                  <Link href="/deals">
                    Inspect Deal <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

