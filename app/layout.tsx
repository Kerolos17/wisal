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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wisal-wedding.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
      <body>{children}</body>
    </html>
  );
}
