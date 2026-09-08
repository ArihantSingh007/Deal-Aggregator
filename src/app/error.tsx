"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="headline mt-6 text-3xl md:text-4xl">Something went wrong</h1>
      <p className="mt-2 max-w-md text-base text-muted-foreground">
        An unexpected error occurred while loading this page. You can try refreshing or returning to the homepage.
      </p>
      <div className="mt-8 flex gap-3">
        <Button onClick={reset} className="rounded-full">
          <RefreshCw className="mr-2 h-4 w-4" /> Try again
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
