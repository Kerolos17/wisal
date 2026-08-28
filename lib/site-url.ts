const DEFAULT_SITE_URL = "https://wisal-self.vercel.app";

function normalizeSiteUrl(value: string | undefined) {
  const candidate = value?.trim() || DEFAULT_SITE_URL;

  try {
    const url = new URL(candidate);
    return url.origin;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

export const siteUrl = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);

