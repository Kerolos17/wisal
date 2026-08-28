const targetArg = process.argv.find((value) => value.startsWith("--target="));
const target = targetArg?.slice("--target=".length) || "production";

if (!new Set(["local", "preview", "production"]).has(target)) {
  console.error("Environment check failed: target must be local, preview, or production.");
  process.exitCode = 1;
} else {
  const required = target === "local"
    ? ["DATABASE_URL"]
    : ["DATABASE_URL", "WISAL_AUTH_PROVIDER", "NEON_AUTH_BASE_URL", "NEON_AUTH_COOKIE_SECRET", "PLATFORM_OWNER_EMAIL", "NEXT_PUBLIC_SITE_URL"];

  const failures = [];
  const status = [];
  const present = (key) => Boolean(process.env[key]?.trim());

  for (const key of required) {
    const configured = present(key);
    status.push({ key, configured });
    if (!configured) failures.push(`${key}: missing`);
  }

  if (present("DATABASE_URL") && !/^postgres(ql)?:\/\//i.test(process.env.DATABASE_URL.trim())) failures.push("DATABASE_URL: must be a PostgreSQL URL");
  if (target !== "local" && present("WISAL_AUTH_PROVIDER") && process.env.WISAL_AUTH_PROVIDER.trim() !== "neon") failures.push("WISAL_AUTH_PROVIDER: must be neon");
  if (target !== "local" && present("NEON_AUTH_COOKIE_SECRET") && process.env.NEON_AUTH_COOKIE_SECRET.trim().length < 32) failures.push("NEON_AUTH_COOKIE_SECRET: must be at least 32 characters");
  if (target !== "local" && present("PLATFORM_OWNER_EMAIL") && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.PLATFORM_OWNER_EMAIL.trim())) failures.push("PLATFORM_OWNER_EMAIL: invalid email format");

  if (target !== "local" && present("NEXT_PUBLIC_SITE_URL")) {
    try {
      const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL.trim());
      if (siteUrl.protocol !== "https:" || siteUrl.pathname !== "/" || siteUrl.search || siteUrl.hash) failures.push("NEXT_PUBLIC_SITE_URL: must be an HTTPS origin without path, query, or hash");
    } catch {
      failures.push("NEXT_PUBLIC_SITE_URL: invalid URL");
    }
  }

  console.table(status);
  if (failures.length) {
    console.error(`Environment check failed for ${target}:\n- ${failures.join("\n- ")}`);
    process.exitCode = 1;
  } else {
    console.log(`Environment check passed for ${target}. Values were not printed.`);
  }
}
