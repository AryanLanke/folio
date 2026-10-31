import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/sentry";

// Reports server errors to Sentry: crashes in pages and API routes (onRequestError), and AI
// failures people would notice (reported in lib/server/ai.ts). Errors only, and never resume text
// (see lib/sentry.ts).
export function register() {
  Sentry.init(sentryOptions);
}

export const onRequestError = Sentry.captureRequestError;
