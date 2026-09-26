// Central message catalog for strings introduced by the Atelier motion waves.
// Existing copy stays inline (tr()) — only NEW text lands here, keyed, bilingual.
import type { Locale } from "./use-wisal-locale";

type Entry = { ar: string; en: string };

const messages = {
  hero_eyebrow: { ar: "منصة الدعوات الأولى عربيًا", en: "The Arabic-first invitation platform" },
  worlds_kicker: { ar: "عوالم وِصال", en: "The Wisal worlds" },
  worlds_title: { ar: "ثلاثة عوالم، ثلاثة إحساسات", en: "Three worlds, three feelings" },
  worlds_intro: { ar: "كل تصميم عالم كامل بحركته وضوءه وصوته — مرّر لتشعر به.", en: "Each design is a complete world with its own motion, light, and voice — scroll to feel it." },
  world_rose_garden_title: { ar: "حديقة الورد", en: "Rose garden" },
  world_rose_garden_line: { ar: "بتلات تنسدل بهدوء على ورق بلاش دافئ.", en: "Petals settle softly over warm blush paper." },
  world_desert_sunset_title: { ar: "غروب الصحراء", en: "Desert sunset" },
  world_desert_sunset_line: { ar: "ضوء ذهبي يمسح الكثبان قبل أن تظهر الأسماء.", en: "Golden light sweeps the dunes before the names appear." },
  world_cathedral_light_title: { ar: "ضوء الكاتدرائية", en: "Cathedral light" },
  world_cathedral_light_line: { ar: "أعمدة ضوء هادئة ترسم هيبة الموقع.", en: "Quiet shafts of light draw the venue's grandeur." },
  ring_fallback_label: { ar: "خاتم ذهبي", en: "Golden ring" },
} satisfies Record<string, Entry>;

export type MessageKey = keyof typeof messages;

export function message(locale: Locale, key: MessageKey): string {
  return messages[key][locale === "ar" ? "ar" : "en"];
}
