/**
 * Platform Owner — Single source of truth for owner identity.
 *
 * All owner-related logic MUST import from this module.
 * The owner email is read from the PLATFORM_OWNER_EMAIL environment variable.
 * No hardcoded email addresses are permitted in any other module.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function rawOwnerEmail(): string {
  const raw = process.env.PLATFORM_OWNER_EMAIL;
  if (!raw) {
    throw new Error(
      "PLATFORM_OWNER_EMAIL is not set. " +
      "Add it to your environment variables (see .env.example).",
    );
  }
  const trimmed = raw.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new Error(
      "PLATFORM_OWNER_EMAIL must be a valid email address.",
    );
  }
  return trimmed;
}

/**
 * Returns the normalized platform owner email.
 * Throws if PLATFORM_OWNER_EMAIL is missing or invalid.
 * Cache-friendly: the result is re-computed per call because process.env
 * can change during tests, but the validation is cheap.
 */
export function getPlatformOwnerEmail(): string {
  return rawOwnerEmail();
}

/**
 * Returns true if the given email belongs to the platform owner.
 * Throws if PLATFORM_OWNER_EMAIL is not configured.
 * Returns false only for null/undefined email.
 */
export function isPlatformOwner(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getPlatformOwnerEmail();
}

/**
 * Returns true if PLATFORM_OWNER_EMAIL is configured and valid.
 * Use this for graceful degradation in contexts where the missing
 * env var should not crash the whole request (e.g. UI rendering).
 */
export function isPlatformOwnerConfigured(): boolean {
  try {
    getPlatformOwnerEmail();
    return true;
  } catch {
    return false;
  }
}
