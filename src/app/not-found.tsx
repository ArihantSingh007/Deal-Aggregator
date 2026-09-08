import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h1 className="headline mt-6 text-4xl md:text-5xl">Page not found</h1>
      <p className="mt-2 max-w-md text-base text-muted-foreground">
        The page or deal you're looking for doesn't exist, may have moved, or is no longer available.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild variant="default" className="rounded-full">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-full">
          <Link href="/deals">Browse Deals</Link>
        </Button>
      </div>
    </div>
  );
}
