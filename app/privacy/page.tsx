import type { Metadata } from "next";
import LegalDocument from "@/app/legal-document";

export const metadata: Metadata = { title: "Privacy Policy | Wisal", description: "How Wisal handles and protects event-owner and guest data." };

export default function PrivacyPage() {
  return <LegalDocument type="privacy" />;
}
