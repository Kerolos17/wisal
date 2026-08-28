import { getDb } from "@/db";
import { platformPlans } from "@/db/schema";

/**
 * Minimal, deterministic plan fixture for database-mutating payment tests.
 * The environment guard must run before this helper is imported or invoked.
 */
export async function ensurePaymentTestPlans() {
  await getDb().insert(platformPlans).values([
    { code: "starter", nameAr: "البداية", nameEn: "Starter", priceEgp: 0, guestLimit: 50, durationDays: 365, position: 1, featuresAr: [], featuresEn: [] },
    { code: "elegant", nameAr: "الأنيقة", nameEn: "Elegant", priceEgp: 899, guestLimit: 250, durationDays: 365, position: 2, featured: true, featuresAr: [], featuresEn: [] },
    { code: "signature", nameAr: "التوقيع", nameEn: "Signature", priceEgp: 1699, guestLimit: null, durationDays: 365, position: 3, featuresAr: [], featuresEn: [] },
  ]).onConflictDoNothing({ target: platformPlans.code });
}
