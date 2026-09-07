"use client";
import * as React from "react";

// A minimal, dependency-free toast store (no Radix Toast needed). Components
// call `useToast().toast({ title, description, variant })` and <Toaster />
// (mounted once in the root layout) renders whatever is queued.

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

type Listener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners: Set<Listener> = new Set();

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

function addToast(toast: Omit<ToastItem, "id">) {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { ...toast, id }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export function useToast() {
  const [items, setItems] = React.useState<ToastItem[]>(toasts);

  React.useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return {
    toasts: items,
    toast: (t: Omit<ToastItem, "id">) => addToast(t),
  };
}
