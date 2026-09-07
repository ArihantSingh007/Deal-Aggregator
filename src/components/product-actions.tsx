"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Heart, Bell } from "lucide-react";
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

export function ProductActions({ productId, amazonUrl, amazonLink, flipkartUrl, flipkartLink, currentPrice }: ProductActionsProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [alertOpen, setAlertOpen] = useState(false);
  const [targetPrice, setTargetPrice] = useState(String(Math.round(currentPrice * 0.9)));
  const [saving, setSaving] = useState(false);

  function requireAuth() {
    if (!session) {
      toast({ title: "Sign in required", description: "Create a free account to save products.", variant: "default" });
      router.push("/login");
      return false;
    }
    return true;
  }

  async function handleWishlist() {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Added to wishlist", variant: "success" });
    } catch {
      toast({ title: "Couldn't add to wishlist", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSetAlert() {
    if (!requireAuth()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/price-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, targetPrice: Number(targetPrice) }),
      });
      if (!res.ok) throw new Error();
      toast({ title: "Price alert set", description: `We'll notify you if the price drops to that level.`, variant: "success" });
      setAlertOpen(false);
    } catch {
      toast({ title: "Couldn't set alert", description: "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {amazonUrl && (
        <Button asChild size="lg" className="flex-1 sm:flex-none">
          <a href={amazonLink || amazonUrl} target="_blank" rel="noopener noreferrer sponsored">Buy on Amazon</a>
        </Button>
      )}
      {flipkartUrl && (
        <Button asChild size="lg" variant="secondary" className="flex-1 sm:flex-none">
          <a href={flipkartLink || flipkartUrl} target="_blank" rel="noopener noreferrer sponsored">Buy on Flipkart</a>
        </Button>
      )}

      <Button variant="outline" size="lg" onClick={handleWishlist} disabled={saving}>
        <Heart className="mr-1.5 h-4 w-4" /> Wishlist
      </Button>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg">
            <Bell className="mr-1.5 h-4 w-4" /> Set price alert
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify me when the price drops</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="target-price">Target price</Label>
            <Input id="target-price" type="number" value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} />
            <p className="text-xs text-muted-foreground">Current price: ₹{currentPrice.toLocaleString("en-IN")}</p>
          </div>
          <Button onClick={handleSetAlert} disabled={saving} className="w-full">
            Save alert
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
