import { reportError } from "@/lib/client/report";

// Reports errors in the browser to Sentry, so a broken page doesn't go unnoticed. Sentry itself
// only downloads when an error happens (see lib/client/report.ts). Reports go through Folio's own
// /sentry-tunnel route (see next.config.ts), which passes on only the report: not the visitor's
// address, cookies or headers. Errors React catches to show the error screen are reported there.
addEventListener("error", (event) => {
  // Without an error object it's another site's script ("Script error."), with nothing to go on
  if (event.error) reportError(event.error);
});
addEventListener("unhandledrejection", (event) => reportError(event.reason));
