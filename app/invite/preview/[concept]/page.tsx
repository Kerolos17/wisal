import { notFound } from "next/navigation";
import InvitationClient, { type InvitationData } from "@/app/invite/[slug]/InvitationClient";
import type { InvitationConcept } from "@/lib/invitation-concepts";

const previewConceptCodes = ["love-poem", "garden-night", "moonlight", "golden-vows", "white-story", "cinema-night"] as const satisfies readonly InvitationConcept[];
type PreviewConcept = (typeof previewConceptCodes)[number];

const templates: Record<PreviewConcept, { name: string; accent: string; layout: "classic" | "story" | "cinematic" }> = {
  "love-poem": { name: "Élan Editorial", accent: "plum", layout: "story" },
  "garden-night": { name: "Garden Reverie", accent: "sage", layout: "story" },
  moonlight: { name: "Glass Moon", accent: "blue", layout: "classic" },
  "golden-vows": { name: "Gilded Promise", accent: "sand", layout: "classic" },
  "white-story": { name: "Still", accent: "plum", layout: "classic" },
  "cinema-night": { name: "Afterglow Première", accent: "plum", layout: "cinematic" },
};

export const dynamic = "force-static";

export const metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false, noimageindex: true } },
};

export function generateStaticParams() {
  return previewConceptCodes.map((concept) => ({ concept }));
}

export default async function InvitationPreviewPage({ params }: { params: Promise<{ concept: string }> }) {
  const { concept } = await params;
  if (!previewConceptCodes.includes(concept as PreviewConcept)) notFound();
  const selected = templates[concept as PreviewConcept];
  const startsAt = "2026-10-18T18:30:00+03:00";
  const data: InvitationData = {
    event: { id: `preview-${concept}`, brideName: "ليلى", groomName: "كريم", eventDate: startsAt, venue: "قصر النخيل", city: "القاهرة", mapUrl: "" },
    invitation: { template: selected.name, message: "بكل الحب، يسعدنا أن تشاركونا بداية حكايتنا.", rsvpDeadline: "2026-10-10", accentColor: selected.accent, openingStyle: concept === "cinema-night" ? "curtain" : concept === "white-story" ? "card" : "envelope", layoutStyle: selected.layout, showMessage: true, showCountdown: true, showSchedule: true, sectionOrder: ["message", "countdown", "schedule", "rsvp"], accessMode: "public", rsvpEnabled: true, mealQuestionEnabled: true, maxPartySize: 4, coverImageKey: null },
    guest: null,
    segments: [{ id: "ceremony", title: "حفل الزفاف", startsAt, endsAt: null, venueName: "قصر النخيل", city: "القاهرة", address: "قاعة الحدائق", mapUrl: "" }],
    segmentRsvps: [],
  };
  return <InvitationClient data={data} previewMode />;
}
