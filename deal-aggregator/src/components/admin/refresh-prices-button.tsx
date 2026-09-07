"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCw } from "lucide-react";

export function RefreshPricesButton() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/refresh-prices", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Refresh failed");
      const data = json.data;

      toast({
        title: "Price refresh complete",
        description: `${data.updated} updated, ${data.unchanged} unchanged, ${data.errors} errors (checked ${data.checksPerformed} of ${data.totalTracked} tracked listings).${data.hasMore ? " Click again to check the rest." : ""}`,
        variant: data.errors > 0 ? "destructive" : "success",
      });
      router.refresh();
    } catch (err) {
      toast({ title: "Couldn't refresh prices", description: (err as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="outline" onClick={handleClick} disabled={loading}>
      <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Refreshing…" : "Refresh live prices"}
    </Button>
  );
}
