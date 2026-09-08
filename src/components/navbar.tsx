"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, X, TrendingDown, LayoutDashboard, ShieldCheck, LogOut, Sparkles, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/deals", label: "Deals" },
  { href: "/categories", label: "Categories" },
];

export function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/deals?search=${encodeURIComponent(query.trim())}`);
      setMobileOpen(false);
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border/70 bg-background/85 shadow-xs backdrop-blur-xl"
          : "border-b border-transparent bg-background/60 backdrop-blur-md"
      )}
    >
      <div className="container flex h-16 items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-signal to-emerald-400 text-white shadow-md shadow-signal/25 transition-transform duration-300 group-hover:scale-105">
              <TrendingDown className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold tracking-tight text-foreground">
                Deal<span className="text-signal">Ledger</span>
              </span>
            </div>
          </Link>

          {/* Navigation items */}
          <nav className="hidden items-center gap-1 sm:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Global Search Input */}
        <form onSubmit={handleSearch} className="hidden max-w-sm flex-1 md:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Amazon & Flipkart deals..."
              className="h-9 rounded-full border-border/80 bg-secondary/50 pl-9 pr-4 text-xs font-medium focus-visible:bg-background focus-visible:ring-signal/30"
            />
          </div>
        </form>

        {/* Right side controls */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          {session?.user?.role === "ADMIN" && (
            <Button variant="ghost" size="sm" asChild className="hidden text-xs font-semibold sm:inline-flex">
              <Link href="/admin">
                <ShieldCheck className="mr-1.5 h-4 w-4 text-accent" />
                Admin
              </Link>
            </Button>
          )}

          {session ? (
            <div className="flex items-center gap-1.5">
              <Button variant="outline" size="sm" asChild className="rounded-full text-xs font-semibold">
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-1.5 h-3.5 w-3.5 text-signal" />
                  Dashboard
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                aria-label="Sign out"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="signal" asChild className="rounded-full px-4 text-xs font-bold shadow-xs">
              <Link href="/login">Sign In</Link>
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="border-t border-border/70 bg-card/95 px-4 py-4 shadow-xl backdrop-blur-xl sm:hidden">
          <form onSubmit={handleSearch} className="mb-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search deals..."
                className="pl-9 text-xs"
              />
            </div>
          </form>
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={session ? "/dashboard" : "/login"}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-secondary"
              onClick={() => setMobileOpen(false)}
            >
              {session ? "Dashboard" : "Sign In"}
            </Link>
            {session?.user?.role === "ADMIN" && (
              <Link
                href="/admin"
                className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 hover:bg-secondary"
                onClick={() => setMobileOpen(false)}
              >
                Admin Panel
              </Link>
            )}
            {session && (
              <button
                onClick={() => {
                  setMobileOpen(false);
                  signOut();
                }}
                className="rounded-lg px-3 py-2 text-left text-sm font-semibold text-destructive hover:bg-secondary"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

