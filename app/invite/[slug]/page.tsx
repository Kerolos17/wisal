import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getInvitationBySlug } from "@/lib/wisal-data";
import InvitationClient from "./InvitationClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const canonicalPath = `/invite/${encodeURIComponent(slug)}`;
  return {
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
}

export default async function InvitationPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ g?: string }> }) {
  const { slug } = await params;
  const { g } = await searchParams;
  const data = await getInvitationBySlug(slug, g?.trim());
  if (!data) notFound();
  return <InvitationClient data={data} />;
}
