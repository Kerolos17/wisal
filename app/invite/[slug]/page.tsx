import { notFound } from "next/navigation";
import { getInvitationBySlug } from "@/lib/wisal-data";
import InvitationClient from "./InvitationClient";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ g?: string }> }) {
  const { slug } = await params;
  const { g } = await searchParams;
  const data = await getInvitationBySlug(slug, g?.trim());
  if (!data) notFound();
  return <InvitationClient data={data} />;
}
