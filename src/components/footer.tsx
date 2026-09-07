import Link from "next/link";
import { TrendingDown } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container grid gap-8 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <TrendingDown className="h-5 w-5 text-signal" />
            DealLedger
          </Link>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Real price history for Amazon and Flipkart products, so you know when a "deal" actually is one.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Browse</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/deals" className="hover:text-foreground">Today's Deals</Link></li>
            <li><Link href="/categories" className="hover:text-foreground">Categories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Account</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/dashboard" className="hover:text-foreground">Your dashboard</Link></li>
            <li><Link href="/login" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-sm font-semibold">Disclosure</h4>
          <p className="text-sm text-muted-foreground">
            Some links are affiliate links. We may earn a commission at no extra cost to you.
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} DealLedger. Prices are added manually and may not reflect the current live price — always confirm on the retailer's site.
      </div>
    </footer>
  );
}
