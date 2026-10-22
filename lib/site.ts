// Where "Send feedback" links go: an email to the person who runs Folio
export const FEEDBACK_EMAIL = "redischarmender@gmail.com";
export const FEEDBACK_URL = `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent("Folio feedback")}`;

// Visitor counting with Vercel Web Analytics, only on the live site and only once it's switched
// on: enable Analytics for the project in Vercel, then set the ANALYTICS environment variable to
// "on". Without that, the script isn't there to load and would fail on every page.
export const ANALYTICS_ON = process.env.VERCEL_ENV === "production" && process.env.ANALYTICS === "on";
