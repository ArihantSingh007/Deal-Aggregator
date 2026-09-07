"use client";
import { motion } from "framer-motion";

// `template.tsx` remounts on every navigation (unlike layout.tsx), which is
// exactly what we want for a per-page transition — layout.tsx stays mounted
// so the navbar/footer never re-animate, only the page content does.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
