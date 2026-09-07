"use client";
import { useToast } from "./use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "animate-fade-in-up rounded-lg border p-4 shadow-lg bg-card",
            t.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground",
            t.variant === "success" && "border-signal"
          )}
        >
          <p className="text-sm font-semibold">{t.title}</p>
          {t.description && <p className="text-sm opacity-90 mt-0.5">{t.description}</p>}
        </div>
      ))}
    </div>
  );
}
