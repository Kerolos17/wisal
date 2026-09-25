import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvitationBySlug } from "@/lib/wisal-data";
import { siteUrl } from "@/lib/site-url";
import InvitationClient from "./InvitationClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonicalPath = `/invite/${encodeURIComponent(slug)}`;
  const generic: Metadata = {
    title: "Wisal invitation",
    description: "Open your digital invitation from Wisal.",
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      type: "website",
      title: "Wisal invitation",
      description: "Open your digital invitation from Wisal.",
      images: [],
    },
    twitter: {
      card: "summary",
      title: "Wisal invitation",
      description: "Open your digital invitation from Wisal.",
      images: [],
    },
  };

  // Without a guest token this returns null for private invitations, so
  // private links keep the generic metadata — names never leak into previews.
  let data: Awaited<ReturnType<typeof getInvitationBySlug>> = null;
  try {
    data = await getInvitationBySlug(slug);
  } catch {
    return generic;
  }
  if (!data) return generic;
  const { event, invitation } = data;
  const dateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(event.eventDate));
  const title = `${event.brideName} & ${event.groomName} — دعوة زفاف وِصال`;
  const description = [dateLabel, event.venue, event.city].filter(Boolean).join(" · ");
  const coverPath = invitation.coverImageKey ? `/api/media/${invitation.coverImageKey.split("/").map(encodeURIComponent).join("/")}` : null;
  return {
    title,
    description,
    robots: generic.robots,
    alternates: { canonical: canonicalPath },
    openGraph: {
      url: canonicalPath,
      type: "website",
      title,
      description,
      images: coverPath ? [{ url: `${siteUrl}${coverPath}` }] : [],
    },
    twitter: {
      card: coverPath ? "summary_large_image" : "summary",
      title,
      description,
      images: coverPath ? [`${siteUrl}${coverPath}`] : [],
    },
  };
}

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ g?: string }> }) {
  const { slug } = await params;
  const { g } = await searchParams;
  const data = await getInvitationBySlug(slug, g?.trim());
  if (!data) notFound();
  return <InvitationClient data={data} />;
}
