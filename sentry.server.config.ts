import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  tracesSampleRate: 0,
  maxBreadcrumbs: 0,
  beforeSend(event) {
    // Request bodies, cookies, headers, query strings, and user profiles can
    // contain invitation, RSVP, payment, or account data. Keep stack frames
    // and route-level error metadata, but do not export those values.
    if (event.request) {
      delete event.request.cookies;
      delete event.request.data;
      delete event.request.headers;
      delete event.request.query_string;
    }
    delete event.user;

    return event;
  },
});
