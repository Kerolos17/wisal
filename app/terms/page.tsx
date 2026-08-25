import type { Metadata } from "next";
import LegalDocument from "@/app/legal-document";

export const metadata: Metadata = { title: "Terms of Use | Wisal", description: "The essential terms for using the Wisal wedding invitation platform." };

export default function TermsPage() {
  return <LegalDocument type="terms" />;
}
