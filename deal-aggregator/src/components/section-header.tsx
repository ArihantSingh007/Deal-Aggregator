import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeader({ title, subtitle, href, hrefLabel }: { title: string; subtitle?: string; href?: string; hrefLabel?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4 md:mb-10">
      <div>
        <h2 className="headline text-3xl md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>}
      </div>
      {href && (
        <Link href={href} className="group flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          {hrefLabel ?? "View all"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
