"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DealScoreBadge } from "@/components/deal-score-badge";
import { useToast } from "@/components/ui/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Sparkles, Check, X, RefreshCw } from "lucide-react";
import type { ProductWithNumbers } from "@/types";

interface Suggestion {
  id: string;
  score: number;
  label: string;
  reason: string;
  priceAtSuggestion: number;
  createdAt: string;
  product: ProductWithNumbers;
}

export function DealFinderClient({ initialSuggestions }: { initialSuggestions: Suggestion[] }) {
  const router = useRouter();
  const { toast } = useToast();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [scanning, setScanning] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function runScan() {
    setScanning(true);
    try {
      const res = await fetch("/api/admin/deal-finder", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      const result = json.data;
      toast({
        title: "Scan complete",
        description: `Scanned ${result.scanned} products, found ${result.created} new suggestion${result.created === 1 ? "" : "s"}.`,
      });
      router.refresh();
      // Re-fetch so the new suggestions appear without a full page reload.
      const listRes = await fetch("/api/admin/deal-finder");
      if (listRes.ok) setSuggestions((await listRes.json()).data);
    } catch {
      toast({ title: "Scan failed", description: "Please try again.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  }

  async function review(id: string, action: "approve" | "reject") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/deal-finder/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error();
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      toast({
        title: action === "approve" ? "Approved — now featured" : "Suggestion rejected",
        variant: action === "approve" ? "success" : "default",
      });
      router.refresh();
    } catch {
      toast({ title: "Couldn't update suggestion", variant: "destructive" });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mt-6">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{suggestions.length} pending suggestion{suggestions.length === 1 ? "" : "s"}</p>
        <Button onClick={runScan} disabled={scanning}>
          {scanning ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
          {scanning ? "Scanning…" : "Run scan"}
        </Button>
      </div>

      {suggestions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
          No pending suggestions. Click "Run scan" to check current price history for new deals.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((s) => (
              <motion.div
                key={s.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Card>
                  <CardContent className="flex flex-col gap-4 p-4 sm:flex-row">
                    <Link href={`/product/${s.product.slug}`} className="relative h-32 w-32 shrink-0 overflow-hidden rounded-md bg-secondary">
                      {s.product.images[0] && <Image src={s.product.images[0]} alt={s.product.name} fill className="object-cover" />}
                    </Link>

                    <div className="flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.product.brand}</p>
                          <Link href={`/product/${s.product.slug}`} className="font-display font-semibold hover:underline">
                            {s.product.name}
                          </Link>
                        </div>
                        <DealScoreBadge score={s.score} label={s.label} />
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">{s.reason}</p>

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>Price when flagged: <span className="tabular-price">{formatCurrency(s.priceAtSuggestion)}</span></span>
                        <span>Current price: <span className="tabular-price">{formatCurrency(s.product.currentPrice)}</span></span>
                        <span>Flagged {formatDate(s.createdAt)}</span>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <Button size="sm" variant="signal" onClick={() => review(s.id, "approve")} disabled={busyId === s.id}>
                          <Check className="mr-1.5 h-4 w-4" /> Approve & feature
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => review(s.id, "reject")} disabled={busyId === s.id}>
                          <X className="mr-1.5 h-4 w-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
