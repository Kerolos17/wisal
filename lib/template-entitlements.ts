// Single source of truth for which invitation templates require a paid plan.
// Keep this in sync with the premium template definitions in app/page.tsx.
export const PREMIUM_TEMPLATE_CODES = [
  "cinema-night",
  "velvet-night",
  "moonlight",
  "golden-vows",
  "cathedral-light",
  "coastal-breeze",
] as const;

export function isPremiumTemplateCode(code: string | undefined | null): boolean {
  if (!code) return false;
  return (PREMIUM_TEMPLATE_CODES as readonly string[]).includes(code);
}

export function isPaidPlanCode(planCode: string | null | undefined): boolean {
  return planCode !== null && planCode !== undefined && planCode !== "starter";
}
