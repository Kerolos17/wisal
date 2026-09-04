export type LogLevel = "info" | "warn" | "error";

export type StructuredLog = {
  event: string;
  level: LogLevel;
  requestId?: string;
  errorName?: string;
  errorCode?: string;
  durationMs?: number;
  [key: string]: unknown;
};

const REDACTED = "[REDACTED]";

function redactSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const redactedData = { ...data };
  const sensitiveKeys = ["token", "password", "phone", "name", "email", "message", "receipt", "inviteToken"];

  for (const key of Object.keys(redactedData)) {
    if (sensitiveKeys.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))) {
      redactedData[key] = REDACTED;
    } else if (typeof redactedData[key] === "object" && redactedData[key] !== null) {
      // Shallow redaction for nested objects
      redactedData[key] = redactSensitiveData(redactedData[key] as Record<string, unknown>);
    }
  }
  return redactedData;
}

export const logger = {
  info: (event: string, context?: Record<string, unknown>) => log("info", event, context),
  warn: (event: string, context?: Record<string, unknown>) => log("warn", event, context),
  error: (event: string, context?: Record<string, unknown>) => log("error", event, context),
};

function log(level: LogLevel, event: string, context?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  let logEntry = { timestamp, level, event };

  if (context) {
    logEntry = { ...logEntry, ...redactSensitiveData(context) };
  }

  const serialized = JSON.stringify(logEntry);

  if (level === "error") {
    console.error(serialized);
  } else if (level === "warn") {
    console.warn(serialized);
  } else {
    console.log(serialized);
  }
}
