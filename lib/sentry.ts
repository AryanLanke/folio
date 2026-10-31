// Sentry settings shared by the browser (instrumentation-client.ts) and the server
// (instrumentation.ts). Off until NEXT_PUBLIC_SENTRY_DSN is set. The browser and server share the
// one DSN, which is also the only one the /sentry-tunnel route accepts.
//
// Reports say what broke and where, never what people wrote. Sentry would otherwise attach request
// bodies (the resume text sent to AI routes) and the values of variables in the code (the same text,
// again), so collecting those, and anything that identifies the person, is switched off.
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
    stackFrameVariables: false,
  },
};
