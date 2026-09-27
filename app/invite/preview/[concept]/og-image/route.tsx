import { ImageResponse } from "next/og";

// Designed OG share card per invitation concept (the first thing guests see
// on WhatsApp when a preview link is shared). Palette comes from the
// concept's own authored world. Text stays Latin/numerals: the OG image
// renderer does not shape Arabic script.
export const runtime = "nodejs";

type ConceptTheme = { bg: string; ink: string; accent: string; label: string; moon?: boolean };

const themes: Record<string, ConceptTheme> = {
  "nile-moon": { bg: "linear-gradient(180deg,#0a1224 0%,#13223c 62%,#1b3050 100%)", ink: "#f2ecd9", accent: "#e3cf92", label: "NILE MOON · WISAL", moon: true },
  "arabesque-gold": { bg: "#171012", ink: "#f4ead8", accent: "#c9a24f", label: "ARABESQUE GOLD · WISAL" },
  "linen-minimal": { bg: "#f5f2ea", ink: "#171513", accent: "#171513", label: "LINEN MINIMAL · WISAL" },
  "oud-night": { bg: "linear-gradient(160deg,#191014 0%,#241318 100%)", ink: "#f0e2d2", accent: "#b0763c", label: "OUD NIGHT · WISAL" },
  "palm-oasis": { bg: "linear-gradient(180deg,#eaf3df 0%,#cfe4bd 100%)", ink: "#22301c", accent: "#5d7a45", label: "PALM OASIS · WISAL" },
  "mirage-blush": { bg: "linear-gradient(160deg,#f3d9cd 0%,#e3b7ac 58%,#d9a29d 100%)", ink: "#4c2f31", accent: "#a26362", label: "MIRAGE BLUSH · WISAL" },
};

export async function GET(request: Request) {
  const concept = new URL(request.url).pathname.split("/")[3] ?? "nile-moon";
  const theme = themes[concept] ?? themes["nile-moon"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%", height: "100%", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", background: theme.bg,
          color: theme.ink, position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 34, border: `2px solid ${theme.accent}`, opacity: 0.55, display: "flex" }} />
        {theme.moon && <div style={{ position: "absolute", top: 92, right: 150, width: 110, height: 110, borderRadius: 999, background: theme.accent, opacity: 0.85, display: "flex" }} />}
        <div style={{ display: "flex", fontSize: 22, letterSpacing: 8, color: theme.accent, marginBottom: 26 }}>{theme.label}</div>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 700, letterSpacing: -1 }}>Layla & Kareem</div>
        <div style={{ display: "flex", fontSize: 30, opacity: 0.85, marginTop: 24 }}>18 October 2026 · Cairo</div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
