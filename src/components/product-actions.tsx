"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Bell, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";

interface ProductActionsProps {
  productId: string;
  amazonUrl: string | null;
  amazonLink: string | null;
  flipkartUrl: string | null;
  flipkartLink: string | null;
  currentPrice: number;
}

export function ProductActions({
  productId,
  amazonUrl,
  amazonLink,
  flipkartUrl,
  flipkartLink,
  currentPrice,
}: ProductActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [alertOpen, setAlertOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(String(Math.round(currentPrice * 0.9)));
  const [savingWishlist, setSavingWishlist] = useState(false);
  const [savingAlert, setSavingAlert] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  function requireAuth() {
    if (!session) {
      toast({ title: "Sign in required", description: "Create a free account to save products & track prices.", variant: "default" });
      router.push("/login");
      return false;
    }
    return true;
  }

  async function handleWishlist() {
    if (!requireAuth()) return;
    setSavingWishlist(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      setIsWishlisted((prev) => !prev);
      toast({ title: isWishlisted ? "Removed from wishlist" : "Added to your wishlist", variant: "success" });
    } catch {
      toast({ title: "Couldn't update wishlist", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingWishlist(false);
    }
  }

  async function handleSetAlert() {
    if (!requireAuth()) return;
    setSavingAlert(true);
    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetPrice: Number(targetPrice) }),
      });
      if (!res.ok) throw new Error();
      toast({
        title: "Price alert activated",
        description: `We'll email you immediately if the price drops to ₹${Number(targetPrice).toLocaleString("en-IN")}.`,
        variant: "success",
      });
      setAlertOpen(false);
    } catch {
      toast({ title: "Couldn't set alert", description: "Please try again.", variant: "destructive" });
    } finally {
      setSavingAlert(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary store purchase actions */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {amazonUrl && (
          <Button
            asChild
            size="lg"
            className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500 to-amber-600 font-bold text-white shadow-md transition-all hover:from-amber-600 hover:to-amber-700"
          >
            <a href={amazonLink || amazonUrl} target="_blank" rel="noopener noreferrer sponsored">
              <span>Buy on Amazon</span>
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
        )}
        {flipkartUrl && (
          <Button
            asChild
            size="lg"
            className="rounded-xl border border-blue-500/40 bg-gradient-to-r from-blue-600 to-blue-700 font-bold text-white shadow-md transition-all hover:from-blue-700 hover:to-blue-800"
          >
            <a href={flipkartLink || flipkartUrl} target="_blank" rel="noopener noreferrer sponsored">
              <span>Buy on Flipkart</span>
              <ArrowUpRight className="ml-1.5 h-4 w-4" />
            </a>
          </Button>
        )}
      </div>

      {/* Secondary utility actions */}
      <div className="grid grid-cols-2 gap-2.5">
        <Button
          variant="outline"
          size="default"
          onClick={handleWishlist}
          disabled={savingWishlist}
          className="rounded-xl border-border/80 bg-background/80 hover:bg-secondary"
        >
          {savingWishlist ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Heart className={`mr-1.5 h-4 w-4 ${isWishlisted ? "fill-destructive text-destructive" : ""}`} />
          )}
          {isWishlisted ? "Wishlisted" : "Wishlist"}
        </Button>

        <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="rounded-xl border-border/80 bg-background/80 hover:bg-secondary"
            >
              <Bell className="mr-1.5 h-4 w-4 text-signal" />
              Set Price Alert
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display text-xl font-bold">Set a Price Drop Alert</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="target-price" className="text-xs font-semibold text-muted-foreground">
                  Notify me when price drops below (₹)
                </Label>
                <div className="relative mt-1.5">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="target-price"
                    type="number"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    className="rounded-xl pl-8 font-mono text-base font-bold"
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Current Price: ₹{currentPrice.toLocaleString("en-IN")}</span>
                  <button
                    type="button"
                    onClick={() => setTargetPrice(String(Math.round(currentPrice * 0.85)))}
                    className="font-medium text-signal hover:underline"
                  >
                    Set 15% discount
                  </button>
                </div>
              </div>

              <Button
                onClick={handleSetAlert}
                disabled={savingAlert}
                variant="signal"
                className="w-full rounded-xl font-bold"
              >
                {savingAlert ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Create Price Alert"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

