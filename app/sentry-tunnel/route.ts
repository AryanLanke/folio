// Where the browser sends error reports for Sentry. Being on Folio's own address, it fits the
// Content-Security-Policy and isn't blocked by ad blockers. It forwards only the report, without
// the visitor's headers or cookies, and only for Folio's own Sentry project.
export { POST } from "@sentry/nextjs/tunnel";
