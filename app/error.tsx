"use client";

import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return <main className="route-error"><AlertTriangle aria-hidden="true" /><h1>Something went wrong</h1><p>Your data is safe. Try again, and if the problem continues, open a support request from your event dashboard.</p><button onClick={reset}><RefreshCw aria-hidden="true" /> Try again</button></main>;
}
