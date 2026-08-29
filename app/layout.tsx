import type { Metadata } from "next";
import "@fontsource/ibm-plex-sans-arabic/400.css";
import "@fontsource/ibm-plex-sans-arabic/500.css";
import "@fontsource/ibm-plex-sans-arabic/600.css";
import "@fontsource/ibm-plex-sans-arabic/700.css";
import "@fontsource/noto-naskh-arabic/500.css";
import "@fontsource/noto-naskh-arabic/600.css";
import "@fontsource/noto-naskh-arabic/700.css";
import "@fontsource-variable/manrope";
import "@fontsource-variable/cormorant-garamond";
import "./globals.css";
import "./wisal-atlas.css";
import { siteUrl } from "@/lib/site-url";

const platformJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Wisal",
  url: siteUrl,
  applicationCategory: "EventManagementApplication",
  operatingSystem: "Web",
  description: "Create a beautiful digital wedding invitation, share it with loved ones, and manage RSVPs in one place.",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  alternates: { canonical: "/" },
  title: "Wisal | Digital Wedding Invitations",
  description: "Create a beautiful digital invitation, share it with the people you love, and manage every RSVP in one place.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/brand/wisal-app-icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    shortcut: "/favicon.ico",
    apple: "/brand/wisal-app-icon-192.png",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    url: "/",
    title: "Wisal | Digital Wedding Invitations",
    description: "Create a beautiful digital invitation, share it with the people you love, and manage every RSVP in one place.",
    type: "website",
    locale: "en_US",
    alternateLocale: "ar_EG",
    images: [{ url: "/brand/wisal-app-icon-512.png", width: 512, height: 512, alt: "Wisal" }],
  },
  twitter: {
    card: "summary",
    title: "Wisal | Digital Wedding Invitations",
    description: "Create a beautiful digital invitation, share it with the people you love, and manage every RSVP in one place.",
    images: ["/brand/wisal-app-icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(platformJsonLd) }} />
        <template
          data-impeccable-contract="1917206f"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: Wisal is a celestial guest atlas, not a pastel wedding-template catalogue.
OWN-WORLD: Plum-black observatory fields, cold ivory type, copper instruments, ruled rails, and one luminous invitation plate.
STORY: Couples see invitation craft and guest control as one system, trust the workflow, then begin their invitation.
FIRST VIEWPORT: Copy occupies the left third; a large copper astrolabe owns the right, holding the invitation while an RSVP rail crosses its lower edge. The primary action sits beneath the headline.
FORM: Celestial Guest Atlas, first in the chosen ordered direction set; seed 1917206f.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
