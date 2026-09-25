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
import "./design/wisal.css";
import { cookies } from "next/headers";
import { LocaleProvider, type Locale } from "./locale-provider";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Server-known locale: the cookie is written by LocaleProvider on every
  // choice, so <html lang/dir> is correct from the first byte — no
  // post-hydration direction flip for Arabic visitors. Static routes see an
  // empty cookie store and fall back to the English default.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get("wisal-locale")?.value;
  const locale: Locale = cookieLocale === "ar" ? "ar" : "en";
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <LocaleProvider initialLocale={locale}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(platformJsonLd) }} />
        <template
          data-impeccable-contract="b17b8bec"
          dangerouslySetInnerHTML={{
            __html: `<!--
THESIS: Wisal is a living invitation atelier: the invitation demonstrates the product before supporting tools explain it.
OWN-WORLD: Pale lilac fields, porcelain surfaces, aubergine type, silk depth, chartreuse action, and precisely framed invitation previews.
STORY: Couples understand design, private sharing, and RSVP tracking, explore six distinct worlds, then begin their invitation.
FIRST VIEWPORT: Clear copy and actions occupy one half; a large invitation on lilac silk owns the other, with three selectable previews. A three-step workflow closes the fold.
FORM: Atelier Wisal, first grounded direction and user-approved balanced composition; seed b17b8bec.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
-->`,
          }}
        />
        {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
