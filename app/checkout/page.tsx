import { redirect } from "next/navigation";
import Link from "next/link";
import { getPlatformIdentity } from "@/lib/auth/identity";
import { getOwnPaymentRequest } from "@/lib/payments";
import { listActivePaymentDestinations } from "@/lib/payment-destinations";
import { getDb } from "@/db";
import { platformPlans } from "@/db/schema";
import { eq } from "drizzle-orm";
import CheckoutClient from "./checkout-client";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; paymentId?: string }> }) {
  const { plan: requestedPlanCode, paymentId } = await searchParams;
  const identity = await getPlatformIdentity();
  if (!identity) {
    const returnTo = requestedPlanCode ? `/checkout?plan=${requestedPlanCode}${paymentId ? `&paymentId=${paymentId}` : ""}` : "/checkout";
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(returnTo)}`);
  }
  const existingPayment = paymentId ? await getOwnPaymentRequest(identity, paymentId) : null;
  if (paymentId && !existingPayment) {
    return <section className="checkout-shell"><div className="checkout-card"><h1>Wisal</h1><p className="checkout-error">Payment request unavailable</p><Link className="primary" href="/">Back to home</Link></div></section>;
  }
  const planCode = existingPayment?.planCode ?? requestedPlanCode;
  if (!planCode) redirect("/");

  const [planRow] = await getDb().select().from(platformPlans).where(eq(platformPlans.code, planCode)).limit(1);
  if (!planRow || (!planRow.active && !existingPayment)) {
    return (
      <section className="checkout-shell">
        <div className="checkout-card">
          <h1>Wisal</h1>
          <p className="checkout-error">{planRow ? "الباقة غير متاحة حاليًا" : "Plan unavailable"}</p>
          <Link className="primary" href="/">{planRow ? "Back" : "Back to home"}</Link>
        </div>
      </section>
    );
  }

  const plan = {
    code: planRow.code,
    nameAr: existingPayment?.planNameSnapshot ?? planRow.nameAr,
    nameEn: planRow.nameEn,
    priceEgp: existingPayment?.priceEgpSnapshot ?? planRow.priceEgp,
    guestLimit: existingPayment?.guestLimitSnapshot ?? planRow.guestLimit,
    durationDays: existingPayment?.durationDaysSnapshot ?? planRow.durationDays,
    featuresAr: planRow.featuresAr,
    featuresEn: planRow.featuresEn,
  };

  const destinations = await listActivePaymentDestinations();
  return <CheckoutClient plan={plan} destinations={destinations} initialPaymentId={existingPayment?.id ?? null} />;
}
