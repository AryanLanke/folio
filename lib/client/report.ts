import { sentryOptions } from "@/lib/sentry";

// Sends a browser error to Sentry. Sentry's browser code is about 60 KB (compressed), so instead
// of every visitor downloading it up front, it's only fetched when there's an error to report.
// Its own error listeners, session pings and tracing are left out: instrumentation-client.ts
// listens for errors instead, and nothing is sent until something actually breaks.

const SKIPPED = new Set(["GlobalHandlers", "BrowserSession", "BrowserTracing"]);

let sentry: Promise<typeof import("@sentry/nextjs") | null> | undefined;

function loadSentry() {
  sentry ??= sentryOptions.dsn
    ? import("@sentry/nextjs")
        .then((Sentry) => {
          Sentry.init({
            ...sentryOptions,
            integrations: (defaults) => defaults.filter((integration) => !SKIPPED.has(integration.name)),
          });
          return Sentry;
        })
        // Offline, or blocked: the error just isn't reported
        .catch(() => null)
    : Promise.resolve(null);
  return sentry;
}

export function reportError(error: unknown) {
  void loadSentry().then((Sentry) => Sentry?.captureException(error));
}
