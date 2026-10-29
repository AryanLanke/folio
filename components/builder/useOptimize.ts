"use client";

import { useEffect, useRef, useState } from "react";
import { type Optimized, REVEAL_MS, optimizeResume } from "@/components/resume/Optimizer";
import { type OptimizeChange, revertChange } from "@/lib/optimize";
import type { PaperSize, Resume } from "@/lib/resume";

// Optimize: the effect on the page while it works, then what it changed, each change revertible.
// The result is one undo step.
export function useOptimize({
  resume,
  paper,
  update,
}: {
  resume: Resume;
  paper: PaperSize;
  update: (next: Resume, checkpoint?: boolean) => void;
}) {
  const [optimizing, setOptimizing] = useState<"working" | "reveal" | null>(null);
  const [optimized, setOptimized] = useState<Optimized | null>(null);
  // The resume as it is now, so Optimize can tell if it was edited while it worked
  const latestResume = useRef(resume);
  useEffect(() => {
    latestResume.current = resume;
  }, [resume]);

  const optimize = async () => {
    setOptimized(null);
    setOptimizing("working");
    const result = await optimizeResume(resume, paper);
    // Applying it now would throw away whatever was typed while it worked
    if (latestResume.current !== result.before) {
      setOptimizing(null);
      alert("The resume changed while it was being optimized, so nothing was applied. Try Optimize again.");
      return;
    }
    if (result.after !== result.before) update(result.after, true);
    setOptimized(result);
    setOptimizing("reveal");
    setTimeout(() => setOptimizing(null), REVEAL_MS);
  };

  const revert = (change: OptimizeChange) => {
    if (!optimized) return;
    const next = revertChange(resume, optimized.before, change.key);
    const changes = optimized.changes.filter((c) => c.key !== change.key);
    update(next, true);
    setOptimized(changes.length > 0 ? { ...optimized, after: next, changes } : null);
  };

  const undoAll = () => {
    if (!optimized) return;
    update(optimized.before, true);
    setOptimized(null);
  };

  return { optimizing, optimized, optimize, revert, undoAll, close: () => setOptimized(null) };
}
