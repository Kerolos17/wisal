import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Wisal | Digital Wedding Invitations",
    short_name: "Wisal",
    description: "Beautiful digital invitations with effortless guest and RSVP management.",
    start_url: "/",
    display: "standalone",
    background_color: "#120D16",
    theme_color: "#2A1D33",
    icons: [
      { src: "/brand/wisal-app-icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/wisal-app-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
