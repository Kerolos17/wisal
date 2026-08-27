import { redirect } from "next/navigation";
import { getPlatformIdentity } from "@/lib/auth/identity";
import CheckoutStatusClient from "./status-client";

export const dynamic = "force-dynamic";

export default async function CheckoutStatusPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const identity = await getPlatformIdentity();
  if (!identity) redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/checkout/${id}/status`)}`);
  return <CheckoutStatusClient id={id} />;
}
