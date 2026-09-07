"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Search, Menu, TrendingDown, LayoutDashboard, ShieldCheck, LogOut } from "lucide-react";
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
    if (query.trim()) router.push(`/deals?search=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/90 backdrop-blur transition-shadow duration-300",
        scrolled ? "shadow-sm" : "shadow-none border-b-transparent"
      )}
    >
      <div className="container flex h-16 items-center gap-4 transition-[height] duration-300">
        <Link href="/" className="group flex shrink-0 items-center gap-2 font-display text-lg font-bold tracking-tight">
          <TrendingDown className="h-5 w-5 text-signal transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110" />
          DealLedger
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              {link.label}
              <span className="absolute inset-x-3 -bottom-px h-0.5 origin-left scale-x-0 bg-signal transition-transform duration-200 group-hover:scale-x-100" />
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="ml-auto hidden max-w-sm flex-1 items-center gap-2 sm:flex">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="rounded-full pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <ThemeToggle />

          {session?.user?.role === "ADMIN" && (
            <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
              <Link href="/admin"><ShieldCheck className="mr-1.5 h-4 w-4" />Admin</Link>
            </Button>
          )}

          {session ? (
            <>
              <Button variant="ghost" size="sm" asChild className="hidden md:inline-flex">
                <Link href="/dashboard"><LayoutDashboard className="mr-1.5 h-4 w-4" />Dashboard</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out" className="hidden md:inline-flex">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button size="sm" asChild className="hidden rounded-full md:inline-flex">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen((o) => !o)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className={cn("border-t md:hidden", mobileOpen ? "block" : "hidden")}>
        <div className="container flex flex-col gap-1 py-3">
          <form onSubmit={handleSearch} className="mb-2">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products…" />
          </form>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              {link.label}
            </Link>
          ))}
          <Link href={session ? "/dashboard" : "/login"} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
            {session ? "Dashboard" : "Sign in"}
          </Link>
          {session?.user?.role === "ADMIN" && (
            <Link href="/admin" className="rounded-md px-3 py-2 text-sm font-medium hover:bg-secondary" onClick={() => setMobileOpen(false)}>
              Admin
            </Link>
          )}
          {session && (
            <button onClick={() => signOut()} className="rounded-md px-3 py-2 text-left text-sm font-medium hover:bg-secondary">
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
