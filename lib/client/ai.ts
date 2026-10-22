"use client";

import { useSyncExternalStore } from "react";
import { DAILY_LIMIT } from "@/lib/enhance";
import { aiUsesLeft, recordAiUse } from "@/lib/storage";

// Calls one of Folio's /api AI routes and turns failures into plain-English messages.
// Every successful call counts toward the shared daily allowance.

const MESSAGES: Record<string, string> = {
  not_configured: "AI isn't set up yet.",
  limit: "You've used today's free AI actions. They reset tomorrow.",
  busy: "AI is busy right now. Try again in a minute.",
  too_large: "That file is too big. Use a PDF or Word file under 4 MB.",
  old_word: "That's an old Word file (.doc). Open it in Word and save it as .docx or PDF, or paste the text instead.",
  unreadable: "Couldn't read any text from that file. If it's a scanned image, paste the text instead.",
  bad_request: "There isn't enough text to work with yet.",
  failed: "The AI's answer didn't come through properly. Please try again.",
  // Vercel itself answers these, without Folio's error format:
  // 429 from the firewall's rate limit, 504 when a request runs out of time
  too_fast: "That's a lot of AI requests in a few minutes. Wait a little and try again.",
  timeout: "That took too long. Please try again.",
};

// Errors Vercel sends before Folio's own code runs, by status
const PLATFORM_ERRORS: Record<number, string> = { 413: "too_large", 429: "too_fast", 504: "timeout" };

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// How many AI actions are left today, kept in sync across every component that shows it
export function useAiUsesLeft() {
  return useSyncExternalStore(subscribe, aiUsesLeft, () => DAILY_LIMIT);
}

export async function callAi<T>(
  path: string,
  body: object | FormData,
  // Chat messages don't count; only actions that produce something (enhance, import, ...) do
  { count = true }: { count?: boolean } = {},
): Promise<{ ok: true; data: T } | { ok: false; message: string }> {
  if (count && aiUsesLeft() <= 0) return { ok: false, message: MESSAGES.limit };
  try {
    const response = await fetch(path, {
      method: "POST",
      ...(body instanceof FormData
        ? { body }
        : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      const code = data?.error ?? PLATFORM_ERRORS[response.status];
      return { ok: false, message: MESSAGES[code] ?? "Something went wrong. Try again." };
    }
    if (count) {
      recordAiUse();
      listeners.forEach((listener) => listener());
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, message: "Couldn't reach the AI. Check your connection and try again." };
  }
}
