"use client";

import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Bell, CircleCheckBig, CircleDashed, Eye, Headphones, History, House, LayoutDashboard, LayoutTemplate, ListChecks, MessageSquareText, Palette, Quote, Rocket, Send, Settings, UsersRound } from "lucide-react";
import { type Locale, useWisalLocale } from "./use-wisal-locale";

const AdminDashboard = lazy(() => import("./admin-dashboard"));
const AccountCenter = lazy(() => import("./account-center"));

type View = "home" | "studio" | "guest" | "dashboard" | "admin";
type DataState = "loading" | "ready" | "empty" | "error";
type MessageAudience = "all" | "pending" | "confirmed" | "unopened" | "opened_pending" | "maybe" | "declined";
type PlanCode = string;
type PublicPlan = { code: string; nameAr: string; nameEn: string; priceEgp: number; guestLimit: number | null; featured: boolean; featuresAr: string[]; featuresEn: string[] };
type PublicContent = Record<string, { ar: string; en: string }>;
type TemplateArt = "editorial" | "botanical" | "glass" | "royal" | "minimal" | "cinematic" | "coastal" | "arabic";
type PublicTemplate = { code: string; name: string; enName: string; tag: string; enTag: string; category: string; color: string; openingStyle: "envelope" | "card" | "curtain"; layoutStyle: "classic" | "story" | "cinematic"; art: TemplateArt; description: string; enDescription: string; previewImage?: string };

const tr = (locale: Locale, arabic: string, english: string) => locale === "ar" ? arabic : english;

const guests = [
  { name: "مريم وعمرو", status: "مؤكد", people: 2, meal: "عادي", tone: "yes" },
  { name: "نورهان أحمد", status: "ربما", people: 1, meal: "نباتي", tone: "maybe" },
  { name: "يوسف خالد", status: "لم يرد", people: 2, meal: "—", tone: "pending" },
  { name: "سارة محمد", status: "معتذر", people: 1, meal: "—", tone: "no" },
];

type GuestRecord = {
  id: string;
  name: string;
  phone: string;
  inviteToken: string | null;
  status: "yes" | "maybe" | "pending" | "no";
  partySize: number;
  meal: string;
  openedAt: string | null;
  respondedAt: string | null;
};

type EventSegmentRecord = {
  id: string;
  title: string;
  kind: "ceremony" | "reception" | "dinner" | "party" | "session" | "other";
  startsAt: string;
  endsAt: string | null;
  venueName: string;
  city: string;
  address: string;
  mapUrl: string;
  position: number;
};

type GuestGroupRecord = {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  guestIds: string[];
  segmentIds: string[];
  partyLimit: number;
};

type EventOverview = {
  event: { id: string; title: string; brideName: string; groomName: string; eventDate: string; venue: string; city: string; mapUrl: string; slug: string; status: "draft" | "published" | "archived" };
  invitation: { template: string; message: string; rsvpDeadline: string; accentColor: string; fontStyle: string; openingStyle: "envelope" | "card" | "curtain"; layoutStyle: "classic" | "story" | "cinematic"; showMessage: boolean; showCountdown: boolean; showSchedule: boolean; sectionOrder: string[]; rsvpEnabled: boolean; mealQuestionEnabled: boolean; maxPartySize: number; coverImageKey: string | null };
  segments: EventSegmentRecord[];
  guestGroups: GuestGroupRecord[];
  segmentRsvps: { id: string; guestId: string; segmentId: string; status: GuestRecord["status"]; partySize: number }[];
  guests: GuestRecord[];
  activity: { id: string; actor: string; action: string; details: string; createdAt: string }[];
  messages: { id: string; title: string; body: string; audience: MessageAudience; groupId: string | null; segmentId: string | null; status: "draft" | "scheduled"; scheduledAt: string | null; createdAt: string }[];
  stats: { total: number; invitations: number; seats: number; opened: number; responded: number; pendingInvitations: number; yes: number; maybe: number; pending: number; no: number };
};

type MessageRecord = EventOverview["messages"][number];

type EventSummary = EventOverview["event"] & { stats: EventOverview["stats"] };

const statusLabel = { yes: "مؤكد", maybe: "ربما", pending: "لم يرد", no: "معتذر" } as const;
const segmentKindLabel = {
  ceremony: { ar: "مراسم", en: "Ceremony" },
  reception: { ar: "استقبال", en: "Reception" },
  dinner: { ar: "عشاء", en: "Dinner" },
  party: { ar: "حفل", en: "Party" },
  session: { ar: "جلسة", en: "Session" },
  other: { ar: "مرحلة", en: "Moment" },
} as const;

function formatSegmentDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" }).format(date);
}

const templates: PublicTemplate[] = [
  { code: "love-poem", name: "أناقة التحرير", enName: "Élan Editorial", tag: "تحريري فاخر", enTag: "Editorial luxury", category: "classic", color: "template-plum", openingStyle: "card", layoutStyle: "classic", art: "editorial", description: "قوس معماري وورق دافئ بصياغة مجلة فاخرة.", enDescription: "Architectural framing and warm paper with a luxury magazine rhythm.", previewImage: "/brand/templates/previews/elan-editorial.webp" },
  { code: "garden-night", name: "حُلم الحديقة", enName: "Garden Reverie", tag: "نباتي حالم", enTag: "Romantic botanical", category: "botanical", color: "template-sage", openingStyle: "envelope", layoutStyle: "story", art: "botanical", description: "زهور مائية تتحرك برقة قبل أن تكشف الحكاية.", enDescription: "Watercolour blooms drift softly before revealing the story.", previewImage: "/brand/templates/previews/garden-reverie.webp" },
  { code: "moonlight", name: "قمر زجاجي", enName: "Glass Moon", tag: "فخامة عصرية", enTag: "Modern glass", category: "modern", color: "template-blue", openingStyle: "card", layoutStyle: "classic", art: "glass", description: "ضوء لؤلؤي وطبقات زجاجية شفافة بتفاصيل هادئة.", enDescription: "Pearl light and translucent layers with a calm, modern finish.", previewImage: "/brand/templates/arabic-glass-luxury.webp" },
  { code: "golden-vows", name: "الوعد المُذهّب", enName: "Gilded Promise", tag: "ملكي", enTag: "Royal classic", category: "luxury", color: "template-gold", openingStyle: "envelope", layoutStyle: "classic", art: "royal", description: "ختم ملكي وإطار شامبانيا لحفل رسمي خالد.", enDescription: "A royal seal and champagne frame for timeless formal celebrations.", previewImage: "/brand/templates/classic-rose-frame.webp" },
  { code: "white-story", name: "سُكون", enName: "Still", tag: "بسيط معاصر", enTag: "Modern minimal", category: "minimal", color: "template-ivory", openingStyle: "card", layoutStyle: "story", art: "minimal", description: "مساحات بيضاء وتفاصيل دقيقة تجعل الأسماء هي البطلة.", enDescription: "Quiet white space and precise details that let the names lead.", previewImage: "/brand/templates/editorial-arch.webp" },
  { code: "cinema-night", name: "وهج الغروب", enName: "Afterglow Première", tag: "سينمائي غامر", enTag: "Immersive cinematic", category: "cinematic", color: "template-noir", openingStyle: "curtain", layoutStyle: "cinematic", art: "cinematic", description: "غروب سينمائي وصورة غامرة مع كشف درامي محسوب.", enDescription: "A full-bleed sunset portrait with a measured cinematic reveal.", previewImage: "/brand/templates/previews/afterglow-premiere.webp" },
  { code: "rose-garden", name: "وردة حالمة", enName: "Blush Botanica", tag: "رومانسي", enTag: "Romantic", category: "botanical", color: "template-rose", openingStyle: "envelope", layoutStyle: "story", art: "botanical", description: "بتلات وردية تلتف حول الصورة والرسالة بنعومة.", enDescription: "Blush petals wrap softly around the portrait and message." },
  { code: "cathedral-light", name: "الميثاق الملكي", enName: "The Royal Chapel", tag: "رسمي كلاسيكي", enTag: "Formal classic", category: "classic", color: "template-pearl", openingStyle: "envelope", layoutStyle: "classic", art: "royal", description: "تكوين رسمي يليق بالمراسم والاحتفالات الكلاسيكية.", enDescription: "A formal composition shaped for ceremonies and classic celebrations." },
  { code: "desert-sunset", name: "صفحات الغروب", enName: "Sunlit Pages", tag: "تحريري دافئ", enTag: "Warm editorial", category: "modern", color: "template-sunset", openingStyle: "card", layoutStyle: "story", art: "editorial", description: "تخطيط مجلّي دافئ وصورة بطول الصفحة مع انتقالات ناعمة.", enDescription: "Warm magazine composition with full-height imagery and soft transitions." },
  { code: "velvet-night", name: "العرض المخملي", enName: "Velvet Première", tag: "فاخر غامر", enTag: "Immersive luxury", category: "luxury", color: "template-velvet", openingStyle: "curtain", layoutStyle: "cinematic", art: "cinematic", description: "ستائر مخملية وإضاءة ذهبية لتجربة ضيف غامرة.", enDescription: "Velvet curtains and golden light create an immersive guest entrance." },
  { code: "coastal-breeze", name: "عهود الساحل", enName: "Barefoot Vows", tag: "طبيعي هادئ", enTag: "Coastal minimal", category: "minimal", color: "template-coast", openingStyle: "card", layoutStyle: "classic", art: "coastal", description: "صورة شاطئية واسعة وبطاقة شفافة بخفة صيفية.", enDescription: "A wide coastal portrait and airy translucent card for summer celebrations." },
  { code: "modern-monogram", name: "حروف النور", enName: "Noor Monogram", tag: "عربي عصري", enTag: "Arabic luxury", category: "cinematic", color: "template-mono", openingStyle: "curtain", layoutStyle: "cinematic", art: "arabic", description: "فخامة عربية حديثة بزجاج داكن وظلال هندسية رقيقة.", enDescription: "Modern Arabic luxury shaped with dark glass and subtle geometric light." },
];

// Editorial Atelier launches with six authored worlds. The remaining legacy
// definitions stay available for rendering older invitations, but are not
// offered as new choices in the studio or public catalogue.
const atelierTemplates = templates.slice(0, 6);

function InvitationSpecimen({ template, brideName, groomName, date, venue, city, locale, phone = false }: { template: PublicTemplate; brideName: string; groomName: string; date: string; venue?: string; city?: string; locale: Locale; phone?: boolean }) {
  const ar = locale === "ar";
  const couple = `${brideName || (ar ? "العروس" : "Bride")} ${ar ? "و" : "&"} ${groomName || (ar ? "العريس" : "Groom")}`;
  return <>
    <span className="concept-edition">WISAL · {String(templates.findIndex((item) => item.code === template.code) + 1).padStart(2, "0")}</span>
    <span className="concept-rule" aria-hidden="true" />
    <Image className="concept-mark" src="/brand/wisal-monogram-64.png" width={phone ? 42 : 30} height={phone ? 42 : 30} alt="" unoptimized />
    <small className="concept-invitation-line">{ar ? "بكل الحب ندعوكم لمشاركتنا" : "Together with joy, we invite you"}</small>
    <strong className="concept-couple">{couple}</strong>
    <span className="concept-date">{date || (ar ? "تاريخ المناسبة" : "Your date")}</span>
    {phone && <>
      <p className="concept-place">{venue || (ar ? "مكان الاحتفال" : "Celebration venue")}{city ? ` · ${city}` : ""}</p>
      <span className="concept-action">{ar ? "تأكيد الحضور" : "RSVP"}</span>
    </>}
  </>;
}

const templateAccentByArt: Record<TemplateArt, "plum" | "sage" | "blue" | "sand"> = {
  editorial: "sand",
  botanical: "sage",
  glass: "blue",
  royal: "sand",
  minimal: "sand",
  cinematic: "plum",
  coastal: "blue",
  arabic: "plum",
};

const mergePublicTemplates = (rows: Array<{ code: string; nameAr: string; nameEn: string; category: string }>) => rows.filter((row) => atelierTemplates.some((item) => item.code === row.code)).map((row, index) => {
  const visual = atelierTemplates.find((item) => item.code === row.code) ?? atelierTemplates[index % atelierTemplates.length];
  return { ...visual, code: row.code, category: row.category };
});

const legacyTemplateNames: Record<string, string[]> = {
  "love-poem": ["قصيدة حب", "Love Poem"], "garden-night": ["ليلة في الحديقة", "Garden Night"], moonlight: ["نور القمر", "Moonlight"],
  "golden-vows": ["عهود ذهبية", "Golden Vows"], "white-story": ["حكاية بيضاء", "White Story"], "cinema-night": ["ليلة سينمائية", "Cinema Night"],
  "rose-garden": ["حديقة الورد", "Rose Garden"], "cathedral-light": ["نور الكاتدرائية", "Cathedral Light"], "desert-sunset": ["غروب الصحراء", "Desert Sunset"],
  "velvet-night": ["ليلة مخملية", "Velvet Night"], "coastal-breeze": ["نسيم الساحل", "Coastal Breeze"], "modern-monogram": ["حروفنا", "Modern Monogram"],
};

const templateIndexForName = (items: PublicTemplate[], name: string) => items.findIndex((template) => template.name === name || template.enName === name || legacyTemplateNames[template.code]?.includes(name));

const openingStyles = [
  { value: "envelope", name: "ظرف ملكي", enName: "Royal envelope", description: "يفتح الظرف لتظهر البطاقة", enDescription: "An envelope opens to reveal the invitation", icon: "◇" },
  { value: "card", name: "بطاقة أنيقة", enName: "Elegant card", description: "بطاقة ترحيب تفاعلية وهادئة", enDescription: "A calm, interactive welcome card", icon: "▤" },
  { value: "curtain", name: "ستارة احتفالية", enName: "Celebration curtain", description: "افتتاح سينمائي للمناسبات الفاخرة", enDescription: "A cinematic entrance for luxurious events", icon: "◫" },
] as const;

const layoutStyles = [
  { value: "classic", name: "رأسي كلاسيكي", enName: "Classic vertical", description: "تسلسل واضح وسهل لكل الأعمار", enDescription: "A clear sequence that works for every age" },
  { value: "story", name: "قصة ومراحل", enName: "Story & moments", description: "أقسام متحركة تحكي تفاصيل اليوم", enDescription: "Animated sections that tell the story of the day" },
  { value: "cinematic", name: "سينمائي", enName: "Cinematic", description: "مشاهد واسعة وتباين فاخر", enDescription: "Wide scenes with luxurious contrast" },
] as const;

const defaultPlans: PublicPlan[] = [
  { code: "starter", nameAr: "البداية", nameEn: "Starter", priceEgp: 0, guestLimit: 50, featured: false, featuresAr: ["دعوة واحدة", "50 ضيفًا"], featuresEn: ["One invitation", "50 guests"] },
  { code: "elegant", nameAr: "الأنيقة", nameEn: "Elegant", priceEgp: 899, guestLimit: 250, featured: true, featuresAr: ["قوالب مميزة", "250 ضيفًا", "تقارير الحضور"], featuresEn: ["Premium templates", "250 guests", "RSVP reports"] },
  { code: "signature", nameAr: "التوقيع", nameEn: "Signature", priceEgp: 1699, guestLimit: null, featured: false, featuresAr: ["ضيوف بلا حد", "تجربة سينمائية", "دعم أولوية"], featuresEn: ["Unlimited guests", "Cinematic experience", "Priority support"] },
];

const mediaUrl = (key: string) => `/api/media/${key.split("/").map(encodeURIComponent).join("/")}`;

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const input = document.createElement("textarea");
    input.value = text;
    input.setAttribute("readonly", "");
    input.style.position = "fixed";
    input.style.opacity = "0";
    document.body.appendChild(input);
    input.select();
    const copied = document.execCommand("copy");
    input.remove();
    return copied;
  }
}

function csvCell(value: string | number | null) {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' && quoted && source[index + 1] === '"') { cell += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(cell.trim()); cell = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function whatsappNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function Mark({ compact = false, locale = "en" }: { compact?: boolean; locale?: Locale }) {
  return (
    <div className={`mark ${compact ? "mark-compact" : ""}`} aria-label="وِصال">
      <span className="mark-symbol"><Image src="/brand/wisal-monogram-64.png" width={46} height={46} alt="" unoptimized /></span>
      <span><strong>{locale === "ar" ? "وِصال" : "Wisal"}</strong>{!compact && <small>{locale === "ar" ? "دعوتكم… كما تخيلتموها" : "Invitations, beautifully yours"}</small>}</span>
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="icon" aria-hidden="true">{children}</span>;
}

type AccountSummary = { displayName: string; email: string; role?: string };

export default function Home({ initialView = "home", authenticated = false, account = null }: { initialView?: View; authenticated?: boolean; account?: AccountSummary | null } = {}) {
  const router = useRouter();
  const [locale, setLocale] = useWisalLocale();
  const [view, setView] = useState<View>(initialView);
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [rsvp, setRsvp] = useState("yes");
  const [filter, setFilter] = useState("الكل");
  const [eventData, setEventData] = useState<EventOverview | null>(null);
  const [eventList, setEventList] = useState<EventSummary[]>([]);
  const [dataState, setDataState] = useState<DataState>("loading");
  const [dataError, setDataError] = useState("");
  const [currentEventId, setCurrentEventId] = useState("");
  const [profileName, setProfileName] = useState(account?.displayName || "Layla Ahmed");
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode>(() => typeof window === "undefined" ? "elegant" : new URLSearchParams(window.location.search).get("plan") || "elegant");
  const [publicPlans, setPublicPlans] = useState<PublicPlan[]>(defaultPlans);
  const [publicContent, setPublicContent] = useState<PublicContent>({});
  const [publicTemplates, setPublicTemplates] = useState<PublicTemplate[]>(atelierTemplates);
  const [guestEditor, setGuestEditor] = useState<{ mode: "add" | "edit"; guest?: GuestRecord } | null>(null);

  const loadEvent = useCallback(async (eventId?: string, showLoading = true) => {
    if (showLoading) setDataState("loading");
    try {
      const response = await fetch(eventId ? `/api/events/${eventId}` : "/api/event", { cache: "no-store" });
      if (!response.ok) throw new Error(tr(locale, "تعذر تحميل بيانات الدعوة.", "We could not load the invitation data."));
      const data = await response.json() as EventOverview;
      if (!data?.event) throw new Error(tr(locale, "لم يتم العثور على دعوة نشطة.", "No active invitation was found."));
      setEventData(data);
      setSelectedTemplate(Math.max(0, templateIndexForName(atelierTemplates, data.invitation.template)));
      setDataState("ready");
      setDataError("");
      return true;
    } catch (error) {
      setEventData(null);
      setDataState("error");
      setDataError(error instanceof Error ? error.message : tr(locale, "تعذر تحميل بيانات الدعوة.", "We could not load the invitation data."));
      return false;
    }
  }, [locale]);

  const loadEvents = useCallback(async (preferredId?: string, showLoading = true): Promise<DataState> => {
    if (showLoading) setDataState("loading");
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) throw new Error(tr(locale, "تعذر تحميل قائمة الدعوات.", "We could not load your invitations."));
      const data = await response.json() as { events: EventSummary[] };
      const list = data.events ?? [];
      setEventList(list);
      const requestedId = preferredId || "";
      const nextId = list.some((item) => item.id === requestedId) ? requestedId : list[0]?.id || "";
      if (!nextId) {
        setCurrentEventId("");
        setEventData(null);
        setDataState("empty");
        setDataError("");
        return "empty";
      }
      setCurrentEventId(nextId);
      const loaded = await loadEvent(nextId, false);
      return loaded ? "ready" : "error";
    } catch (error) {
      setEventData(null);
      setDataState("error");
      setDataError(error instanceof Error ? error.message : tr(locale, "تعذر تحميل الدعوات.", "We could not load your invitations."));
      return "error";
    }
  }, [loadEvent, locale]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (authenticated) {
        void loadEvents();
        void fetch("/api/profile", { cache: "no-store" })
          .then((response) => response.ok ? response.json() : null)
          .then((profile: { displayName?: string } | null) => {
            if (profile?.displayName) setProfileName(profile.displayName);
          });
      } else {
        setDataState("empty");
      }
      void fetch("/api/platform-content", { cache: "no-store" })
        .then((response) => response.ok ? response.json() : null)
        .then((config: { content?: Array<{ key: string; valueAr: string; valueEn: string }>; plans?: PublicPlan[]; templates?: Array<{ code: string; nameAr: string; nameEn: string; category: string }> } | null) => {
          if (!config) return;
          if (config.plans?.length) setPublicPlans(config.plans);
          if (config.templates?.length) {
            const availableTemplates = mergePublicTemplates(config.templates);
            if (availableTemplates.length) setPublicTemplates(availableTemplates);
          }
          if (config.content) setPublicContent(Object.fromEntries(config.content.map((item) => [item.key, { ar: item.valueAr, en: item.valueEn }])));
        });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [authenticated, loadEvents]);

  useEffect(() => {
    const templateName = eventData?.invitation.template;
    if (!templateName || !publicTemplates.length) return;
    const timer = window.setTimeout(() => {
      const activeIndex = templateIndexForName(publicTemplates, templateName);
      if (activeIndex >= 0) setSelectedTemplate(activeIndex);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [eventData?.invitation.template, publicTemplates]);

  const chooseEvent = async (id: string) => {
    setCurrentEventId(id);
    setStep(1);
    await loadEvent(id);
  };

  const createEvent = async (payload: Record<string, string>) => {
    const response = await fetch("/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      return { ok: false, error: result?.error || tr(locale, "تعذر إنشاء الدعوة. حاول مرة أخرى.", "We could not create the invitation. Please try again.") };
    }
    const created = await response.json() as EventOverview;
    setCreatingEvent(false);
    setCurrentEventId(created.event.id);
    setEventData(created);
    setDataState("ready");
    setDataError("");
    setSelectedTemplate(Math.max(0, templateIndexForName(atelierTemplates, created.invitation.template)));
    const listResponse = await fetch("/api/events", { cache: "no-store" });
    if (listResponse.ok) setEventList((await listResponse.json() as { events: EventSummary[] }).events);
    setStep(1);
    go("studio");
    return { ok: true, error: "" };
  };

  const saveGuest = async (payload: { name: string; phone: string; status: GuestRecord["status"]; partySize: number; meal: string }) => {
    if (!eventData) return false;
    const editing = guestEditor?.mode === "edit" && guestEditor.guest;
    const url = editing ? `/api/events/${eventData.event.id}/guests/${editing.id}` : `/api/events/${eventData.event.id}/guests`;
    const response = await fetch(url, { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) return false;
    setEventData(await response.json() as EventOverview);
    setGuestEditor(null);
    await loadEvents(eventData.event.id, false);
    return true;
  };

  const removeGuest = async () => {
    if (!eventData || guestEditor?.mode !== "edit" || !guestEditor.guest) return false;
    const response = await fetch(`/api/events/${eventData.event.id}/guests/${guestEditor.guest.id}`, { method: "DELETE" });
    if (!response.ok) return false;
    setEventData(await response.json() as EventOverview);
    setGuestEditor(null);
    await loadEvents(eventData.event.id, false);
    return true;
  };

  const go = (next: View) => {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openStudio = async () => {
    if (!authenticated) {
      router.push("/auth/sign-in?returnTo=%2Fworkspace");
      return;
    }
    if (eventData) {
      go("studio");
      return;
    }
    if (dataState === "empty") {
      setCreatingEvent(true);
      return;
    }
    go("studio");
    const result = await loadEvents();
    if (result === "empty") {
      go("home");
      setCreatingEvent(true);
    }
  };

  const chooseTemplateFromHome = async (code: string) => {
    const nextIndex = publicTemplates.findIndex((template) => template.code === code);
    if (nextIndex >= 0) setSelectedTemplate(nextIndex);
    await openStudio();
  };

  const choosePlan = (plan: PlanCode) => {
    setSelectedPlan(plan);
    if (!authenticated) {
      const returnTo = encodeURIComponent(`/workspace?plan=${encodeURIComponent(plan)}`);
      router.push(`/auth/sign-in?returnTo=${returnTo}`);
      return;
    }
    setCreatingEvent(true);
  };

  return (
    <main className={`view-${view}`} dir={locale === "ar" ? "rtl" : "ltr"} lang={locale}>
      <header className={`site-header ${view === "dashboard" ? "workspace-header" : ""}`}>
        <button className="brand-button" onClick={() => go("home")} aria-label={locale === "ar" ? "العودة إلى وِصال الرئيسية" : "Back to Wisal home"}><Mark compact locale={locale} /></button>
        <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Primary navigation"}>
          {view === "home" ? <>
            <button onClick={() => document.getElementById("product")?.scrollIntoView({ behavior: "smooth" })}>{locale === "ar" ? "المنتج" : "Product"}</button>
            <button onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })}>{locale === "ar" ? "القوالب" : "Templates"}</button>
            <button onClick={() => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" })}>{locale === "ar" ? "الأسعار" : "Pricing"}</button>
          </> : view === "dashboard" ? <div className="workspace-breadcrumb" aria-label={locale === "ar" ? "سياق مساحة العمل" : "Workspace context"}>
            <span>{locale === "ar" ? "مساحة العمل" : "Workspace"}</span>
            <i aria-hidden="true">/</i>
            <b dir="auto">{eventData?.event.title ?? (locale === "ar" ? "لوحة المناسبة" : "Event dashboard")}</b>
          </div> : <>
            <button onClick={() => go("home")}>{locale === "ar" ? "الرئيسية" : "Home"}</button>
            <button className={view === "studio" ? "active" : ""} onClick={() => void openStudio()}>{locale === "ar" ? "تصميم الدعوة" : "Invitation studio"}</button>
            <button className={view === "guest" ? "active" : ""} onClick={() => go("guest")}>{locale === "ar" ? "تجربة الضيف" : "Guest experience"}</button>
            <button onClick={() => authenticated ? go("dashboard") : router.push("/auth/sign-in?returnTo=%2Fworkspace")}>{locale === "ar" ? "لوحة المناسبة" : "Event dashboard"}</button>
          </>}
          {(account?.role === "admin" || account?.role === "support" || account?.role === "content_manager") && <button className={view === "admin" ? "active" : ""} onClick={() => router.push("/admin")}>{locale === "ar" ? "الإدارة" : "Admin"}</button>}
        </nav>
        <div className="header-actions">
          {(account?.role === "admin" || account?.role === "support" || account?.role === "content_manager") && <button className="admin-shortcut" onClick={() => router.push("/admin")} aria-label={locale === "ar" ? "فتح لوحة الإدارة" : "Open admin dashboard"}><Settings aria-hidden="true" /></button>}
          <button className="locale-switch" onClick={() => setLocale(locale === "ar" ? "en" : "ar")} aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}>{locale === "ar" ? "EN" : "عربي"}</button>
          {authenticated ? <button className="account-button" onClick={() => router.push("/auth/sign-out?returnTo=%2F")}><span>{profileName.slice(0, 1)}</span><b>{profileName.split(" ")[0]}</b><small>{locale === "ar" ? "تسجيل الخروج" : "Sign out"}</small></button> : <button className="header-cta" onClick={() => router.push("/auth/sign-in?returnTo=%2Fworkspace")}>{locale === "ar" ? "تسجيل الدخول" : "Sign in"}</button>}
          {view === "home" && <button className="header-cta home-create" onClick={() => void openStudio()}>{locale === "ar" ? "أنشئ دعوتك" : "Create your invitation"}</button>}
        </div>
      </header>

      <nav className="mobile-nav" aria-label={locale === "ar" ? "التنقل السريع" : "Quick navigation"}>
        <button className={view === "home" ? "active" : ""} onClick={() => go("home")}><House aria-hidden="true" />{locale === "ar" ? "الرئيسية" : "Home"}</button>
        <button className={view === "studio" ? "active" : ""} onClick={() => void openStudio()}><Palette aria-hidden="true" />{locale === "ar" ? "التصميم" : "Studio"}</button>
        <button className={view === "guest" ? "active" : ""} onClick={() => go("guest")}><Eye aria-hidden="true" />{locale === "ar" ? "المعاينة" : "Preview"}</button>
        <button className={view === "dashboard" ? "active" : ""} onClick={() => authenticated ? go("dashboard") : router.push("/auth/sign-in?returnTo=%2Fworkspace")}><LayoutDashboard aria-hidden="true" />{locale === "ar" ? "اللوحة" : "Dashboard"}</button>
      </nav>

      {view === "home" && <Landing locale={locale} plans={publicPlans} templates={publicTemplates} content={publicContent} onStart={() => void openStudio()} onGuest={() => go("guest")} onChoosePlan={choosePlan} onChooseTemplate={(code) => void chooseTemplateFromHome(code)} />}
      {view === "studio" && dataState === "loading" && <BuilderLoading locale={locale} />}
      {view === "studio" && dataState === "error" && <BuilderUnavailable locale={locale} message={dataError} onRetry={() => void loadEvents()} onCreate={() => setCreatingEvent(true)} />}
      {view === "studio" && dataState === "empty" && <BuilderUnavailable locale={locale} message={tr(locale, "لا توجد دعوة بعد. ابدأ بإضافة بيانات المناسبة الأساسية.", "There is no invitation yet. Start with the essential event details.")} onRetry={() => void loadEvents()} onCreate={() => setCreatingEvent(true)} />}
      {view === "studio" && dataState === "ready" && eventData && (
        <Studio
          key={eventData?.event.id}
          step={step}
          setStep={setStep}
          selectedTemplate={selectedTemplate}
          setSelectedTemplate={setSelectedTemplate}
          templates={publicTemplates}
          eventData={eventData}
          locale={locale}
          onSaved={async (updated) => {
            setEventData(updated);
            setEventList((current) => current.map((item) => item.id === updated.event.id ? { ...updated.event, stats: updated.stats } : item));
          }}
        />
      )}
      {view === "guest" && <Guest locale={locale} rsvp={rsvp} setRsvp={setRsvp} eventData={eventData} onSubmitted={async () => { await loadEvent(currentEventId); go("dashboard"); }} />}
      {view === "dashboard" && <Dashboard locale={locale} filter={filter} setFilter={setFilter} eventData={eventData} eventList={eventList} currentEventId={currentEventId} onChooseEvent={chooseEvent} onCreate={() => setCreatingEvent(true)} onEdit={() => void openStudio()} onAddGuest={() => setGuestEditor({ mode: "add" })} onEditGuest={(guest) => setGuestEditor({ mode: "edit", guest })} onDataUpdated={setEventData} profileName={profileName} />}
      {view === "admin" && <Suspense fallback={<BuilderLoading locale={locale} />}><AdminDashboard locale={locale} onOpenEvent={(id) => { void chooseEvent(id).then(() => go("dashboard")); }} /></Suspense>}
      {creatingEvent && <CreateEventModal locale={locale} plan={selectedPlan} onClose={() => setCreatingEvent(false)} onCreate={createEvent} />}
      {guestEditor && <GuestModal locale={locale} mode={guestEditor.mode} guest={guestEditor.guest} onClose={() => setGuestEditor(null)} onSave={saveGuest} onDelete={removeGuest} />}
    </main>
  );
}

function Landing({ locale, plans, templates, content, onStart, onGuest, onChoosePlan, onChooseTemplate }: { locale: Locale; plans: PublicPlan[]; templates: PublicTemplate[]; content: PublicContent; onStart: () => void; onGuest: () => void; onChoosePlan: (plan: PlanCode) => void; onChooseTemplate: (code: string) => void }) {
  const ar = locale === "ar";
  const copy = (key: string, fallbackAr: string, fallbackEn: string) => content[key]?.[ar ? "ar" : "en"] || (ar ? fallbackAr : fallbackEn);
  const showcaseTemplates = ["love-poem", "garden-night", "moonlight", "golden-vows", "white-story", "cinema-night"].map((code) => templates.find((template) => template.code === code) ?? atelierTemplates.find((template) => template.code === code)).filter(Boolean) as PublicTemplate[];
  return (
    <div className="atlas-home">
      <section className="atlas-hero">
        <div className="atlas-hero-copy">
          <h1>{ar ? <>كل ضيوفكم.<br /><em>في مدار واحد.</em></> : <>Every guest.<br /><em>In perfect orbit.</em></>}</h1>
          <p className="atlas-intro">{ar ? "دعوة خاصة وإدارة حضور هادئة، صُممتا لتعملا معًا." : "A private invitation and calm RSVP control, designed as one."}</p>
          <div className="atlas-actions">
            <button className="atlas-primary" onClick={onStart}>{copy("hero_primary_cta", "أنشئ دعوتك", "Create your invitation")} <span aria-hidden="true">{ar ? "←" : "→"}</span></button>
            <button className="atlas-link" onClick={() => document.getElementById("templates")?.scrollIntoView({ behavior: "smooth" })}>{ar ? "استكشف القوالب" : "Explore templates"}</button>
          </div>
        </div>

        <div className="atlas-stage" aria-label={ar ? "دعوة داخل أداة فلكية نحاسية" : "Invitation composed within a copper astronomical instrument"}>
          <Image className="atlas-instrument" src="/brand/wisal-celestial-atlas.png" width={1448} height={1086} priority sizes="(max-width: 900px) 100vw, 68vw" alt="" />
          <article className="atlas-invitation">
            <small>{ar ? "بكل الحب ندعوكم" : "With love, we invite you"}</small>
            <h2>{ar ? "ليلى" : "Layla"}<span>&amp;</span>{ar ? "كريم" : "Kareem"}</h2>
            <p>{ar ? "السبت، ١٨ أكتوبر ٢٠٢٦" : "Saturday, 18 October 2026"}</p>
            <p>{ar ? "قصر النيل، القاهرة" : "Nile Palace, Cairo"}</p>
            <button onClick={onGuest}>{ar ? "تأكيد الحضور" : "RSVP"}</button>
          </article>
          <aside className="atlas-rsvp" aria-label={ar ? "مثال لملخص الحضور" : "Example RSVP overview"}>
            <span><small>{ar ? "مثال حي للردود" : "Live response example"}</small><b>{ar ? "٤١ من ٦٨" : "41 of 68"}</b></span>
            <div className="atlas-rsvp-line"><i /><i /><i /></div>
            <span><CircleCheckBig aria-hidden="true" /><small>{ar ? "تم التأكيد" : "Confirmed"}</small></span>
          </aside>
        </div>
      </section>

      <section className="atlas-proof" aria-label={ar ? "مزايا أساسية" : "Core product strengths"}>
        <p>{ar ? "تفاصيل أقل تشتتًا. صورة أوضح ليومكم." : "Less chasing. A clearer picture of your day."}</p>
        <div><strong>{ar ? "عربي وإنجليزي" : "Arabic and English"}</strong><small>{ar ? "تجربة صحيحة في الاتجاهين" : "Native in both directions"}</small></div>
        <div><strong>{ar ? "رابط خاص" : "Private link"}</strong><small>{ar ? "لكل ضيف أو مجموعة" : "For every guest or group"}</small></div>
        <div><strong>{ar ? "ردود لحظية" : "Live replies"}</strong><small>{ar ? "في لوحة واحدة" : "In one focused dashboard"}</small></div>
      </section>

      <section className="atlas-section atlas-templates" id="templates">
        <header className="atlas-section-head">
          <h2>{ar ? "اختاروا المزاج الذي يشبهكم" : "Choose the mood that feels like you"}</h2>
          <p>{ar ? "ستة عوالم منتقاة، لكل واحد منها إيقاع بصري واضح قبل أن تبدأوا التخصيص." : "Six authored worlds, each with a distinct visual rhythm before you make it yours."}</p>
        </header>
        <div className="atlas-template-grid">
          {showcaseTemplates.map((template, index) => (
            <button className={`atlas-template atlas-template-${index + 1} atlas-template-${template.code}`} key={template.code} onClick={() => onChooseTemplate(template.code)} aria-label={ar ? `معاينة واختيار قالب ${template.name}` : `Preview and choose ${template.enName} template`}>
              <span className={`atlas-template-media atlas-template-media-${template.code}`}>
                {template.previewImage ? <Image src={template.previewImage} width={853} height={1844} alt={ar ? `معاينة قالب ${template.name}` : `${template.enName} template preview`} sizes="(max-width: 700px) 92vw, (max-width: 1100px) 45vw, 30vw" /> : <span className={`atlas-template-fallback mini-template template-concept-${template.code}`}><InvitationSpecimen template={template} brideName={ar ? "ليلى" : "Layla"} groomName={ar ? "كريم" : "Kareem"} date={ar ? "١٨ أكتوبر ٢٠٢٦" : "18 October 2026"} venue={ar ? "قصر النيل" : "Nile Palace"} city={ar ? "القاهرة" : "Cairo"} locale={locale} phone /></span>}
              </span>
              <span className="atlas-template-label"><span><b>{ar ? template.name : template.enName}</b><small>{ar ? template.tag : template.enTag}</small><small className="atlas-template-description">{ar ? template.description : template.enDescription}</small></span><span className="atlas-template-cta"><small>{ar ? "معاينة واختيار" : "Preview & choose"}</small><i aria-hidden="true">{ar ? "←" : "→"}</i></span></span>
            </button>
          ))}
        </div>
      </section>

      <section className="atlas-section atlas-journey">
        <div className="atlas-journey-intro">
          <h2>{ar ? "من أول اسم إلى آخر رد" : "From the first name to the final reply"}</h2>
          <p>{ar ? "مسار واحد واضح يبقي الدعوة والضيوف في الصورة نفسها." : "One clear path keeps the invitation and every guest in the same picture."}</p>
          <button className="atlas-primary" onClick={onStart}>{ar ? "ابدأ التصميم" : "Start designing"} <span aria-hidden="true">{ar ? "←" : "→"}</span></button>
        </div>
        <div className="atlas-orbit-steps">
          <article><LayoutTemplate aria-hidden="true" /><span><h3>{ar ? "اختاروا القالب" : "Choose the template"}</h3><p>{ar ? "ابدؤوا من تصميم يناسب روح المناسبة." : "Begin with a design that suits the celebration."}</p></span></article>
          <article><ListChecks aria-hidden="true" /><span><h3>{ar ? "أضيفوا التفاصيل" : "Add the details"}</h3><p>{ar ? "رتبوا الموعد والمكان والرسالة ومجموعات الضيوف." : "Arrange the date, venue, message, and guest groups."}</p></span></article>
          <article><Send aria-hidden="true" /><span><h3>{ar ? "شاركوا وتابعوا" : "Share and follow"}</h3><p>{ar ? "أرسلوا الرابط وشاهدوا الفتح والردود فورًا." : "Send the link and see opens and replies as they arrive."}</p></span></article>
        </div>
      </section>

      <section className="atlas-section atlas-product" id="product">
        <div className="atlas-product-title">
          <h2>{ar ? "دعوة جميلة، ونظام يعرف من سيحضر" : "A beautiful invitation that knows who is coming"}</h2>
          <p>{ar ? "وِصال يجمع التجربة التي يراها الضيف مع الأدوات التي تحتاجونها خلف الكواليس." : "Wisal joins the guest experience to the tools you need behind the scenes."}</p>
        </div>
        <div className="atlas-feature-list">
          <article><UsersRound aria-hidden="true" /><b>{ar ? "ضيوف منظمون" : "Organised guests"}</b><p>{ar ? "مجموعات وروابط وصلاحيات تناسب كل جزء من يومكم." : "Groups, links, and access shaped for each part of your day."}</p></article>
          <article><Eye aria-hidden="true" /><b>{ar ? "صورة حية وواضحة" : "A clear live picture"}</b><p>{ar ? "تعرفون من فتح ومن رد وعدد الحضور المتوقع." : "Know who opened, who replied, and the expected headcount."}</p></article>
          <article><MessageSquareText aria-hidden="true" /><b>{ar ? "رسالة تصل لمن يحتاجها" : "The right message reaches the right people"}</b><p>{ar ? "اختاروا الفئة المناسبة بدل إرسال كل تحديث للجميع." : "Choose the right audience instead of sending every update to everyone."}</p></article>
        </div>
      </section>

      <section className="atlas-story">
        <div className="atlas-story-media">
          <Image src="/brand/cinematic-palace-hero.webp" width={1672} height={941} sizes="(max-width: 900px) 100vw, 55vw" alt={ar ? "مشهد افتتاح سينمائي لدعوة وِصال" : "Cinematic opening scene for a Wisal invitation"} />
          <div className="atlas-story-proof"><CircleCheckBig aria-hidden="true" /><span><small>{ar ? "مثال لردود الحضور" : "Example RSVP responses"}</small><b>{ar ? "٤١ من ٦٨ ضيفًا" : "41 of 68 guests"}</b></span></div>
        </div>
        <div className="atlas-story-copy"><Quote aria-hidden="true" /><blockquote>{ar ? "دعوتنا بقيت جميلة. وضيوفنا بقوا منظّمين." : "Our invitation stayed beautiful. Our guests stayed organised."}</blockquote><p>{ar ? "ليلى وكريم، مثال توضيحي" : "Layla and Kareem, illustrative example"}</p></div>
      </section>

      <section className="atlas-section atlas-pricing" id="pricing">
        <header className="atlas-section-head">
          <h2>{ar ? "خطة تناسب حجم احتفالكم" : "A plan shaped for your celebration"}</h2>
          <p>{ar ? "الباقات معروضة للتخطيط. الدفع الإلكتروني متوقف حتى اكتمال اختبار المنصة." : "Plans are shown for planning. Online payment stays paused while the platform is tested."}</p>
        </header>
        <div className="atlas-plan-list">
          {plans.map((plan) => <article className={plan.featured ? "is-featured" : ""} key={plan.code}>
            <div><h3>{ar ? plan.nameAr : plan.nameEn}</h3><p>{plan.guestLimit ? (ar ? `حتى ${plan.guestLimit} ضيفًا` : `Up to ${plan.guestLimit} guests`) : (ar ? "ضيوف بلا حد" : "Unlimited guests")}</p></div>
            <ul>{(ar ? plan.featuresAr : plan.featuresEn).map((feature) => <li key={feature}><CircleCheckBig aria-hidden="true" />{feature}</li>)}</ul>
            <div className="atlas-plan-action"><span><b>{plan.priceEgp}</b><small>{ar ? "جنيه للمناسبة" : "EGP per event"}</small></span><button onClick={() => onChoosePlan(plan.code)}>{ar ? "اختيار الخطة" : "Choose plan"}</button></div>
          </article>)}
        </div>
      </section>

      <section className="atlas-final">
        <span className="atlas-final-ring" aria-hidden="true" />
        <h2>{ar ? "ابدؤوا دعوتكم من مكان يليق بالحكاية" : "Begin your invitation somewhere worthy of the story"}</h2>
        <p>{ar ? "اختاروا القالب، أضيفوا تفاصيلكم، وشاركوا رابطًا يليق بمن تحبون." : "Choose a template, add your details, and share a link worthy of the people you love."}</p>
        <button className="atlas-primary" onClick={onStart}>{ar ? "أنشئ دعوتك" : "Create your invitation"} <span aria-hidden="true">{ar ? "←" : "→"}</span></button>
      </section>

      <footer className="atlas-footer"><Mark locale={locale} /><p>{ar ? "صُنعت بعناية لتبدأ حكايتكم بصورة أجمل." : "Made with care, so your story begins beautifully."}</p><nav><a href="/privacy">{ar ? "سياسة الخصوصية" : "Privacy"}</a><a href="/terms">{ar ? "شروط الاستخدام" : "Terms"}</a></nav></footer>
    </div>
  );
}

function BuilderLoading({ locale }: { locale: Locale }) {
  return <section className="builder-state" aria-live="polite"><span className="builder-spinner" /><h1>{tr(locale, "نجهّز استوديو الدعوة…", "Preparing your invitation studio…")}</h1><p>{tr(locale, "لحظات قليلة ونفتح آخر نسخة محفوظة.", "Your latest saved version will be ready in a moment.")}</p></section>;
}

function BuilderUnavailable({ locale, message, onRetry, onCreate }: { locale: Locale; message: string; onRetry: () => void; onCreate: () => void }) {
  return <section className="builder-state" role="alert"><Icon>!</Icon><h1>{tr(locale, "تعذر فتح استوديو الدعوة", "We could not open the invitation studio")}</h1><p>{message}</p><div><button className="ghost" onClick={onRetry}>{tr(locale, "إعادة المحاولة", "Try again")}</button><button className="primary" onClick={onCreate}>{tr(locale, "إنشاء دعوة جديدة ←", "Create a new invitation →")}</button></div></section>;
}

function Studio({ step, setStep, selectedTemplate, setSelectedTemplate, templates, eventData, locale, onSaved }: { step: number; setStep: (n: number) => void; selectedTemplate: number; setSelectedTemplate: (n: number) => void; templates: PublicTemplate[]; eventData: EventOverview; locale: Locale; onSaved: (event: EventOverview) => Promise<void> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const ar = locale === "ar";
  const steps = ar ? ["القالب", "المحتوى", "الهوية", "تأكيد الحضور", "المعاينة والنشر"] : ["Template", "Content", "Identity", "RSVP", "Preview & publish"];
  const stepGuidance = [
    { eyebrow: L("اختيار بصري", "Visual direction"), copy: L("اختاروا الأسلوب، ثم خصّصوا لحظة فتح الدعوة وطريقة ظهور الحكاية.", "Choose the style, then tailor the opening moment and story layout."), outcome: L("سينعكس اختياركم مباشرة في المعاينة.", "Your selection updates the live preview immediately.") },
    { eyebrow: L("أساسيات المناسبة", "Event essentials"), copy: L("أضيفوا الأسماء والرسالة، ثم رتّبوا كل مرحلة وموقع في جدول واحد واضح.", "Add the names and message, then organize every moment and location in one clear schedule."), outcome: L("ستظهر البيانات المناسبة لكل ضيف وفق صلاحياته.", "Each guest sees only the details they are invited to." ) },
    { eyebrow: L("بصمتكم الخاصة", "Your signature"), copy: L("وازنوا الغلاف واللون والخط، ثم اختاروا ترتيب الأقسام التي يقرأها الضيف.", "Balance cover, color, and typography, then set the order guests read each section."), outcome: L("التجربة جاهزة بالعربية والإنجليزية من نفس الإعدادات.", "The experience is ready in Arabic and English from the same settings.") },
    { eyebrow: L("تنظيم الردود", "Response settings"), copy: L("حدّدوا موعد الرد وحجم الحضور والسؤال الاختياري قبل مشاركة الرابط.", "Set the reply deadline, party size, and optional question before sharing the link."), outcome: L("سيتابع كل رد داخل لوحة المناسبة.", "Every response will be tracked in your event dashboard.") },
    { eyebrow: L("فحص أخير", "Final check"), copy: L("راجعوا التجربة كما يراها الضيف على الهاتف والكمبيوتر ثم انشروها بثقة.", "Review the guest experience on phone and desktop, then publish with confidence."), outcome: L("بعد النشر ستصبح أدوات المشاركة والمتابعة جاهزة.", "After publishing, sharing and follow-up tools become available.") },
  ][step - 1];
  const [draft, setDraft] = useState(() => ({
    title: eventData.event.title,
    brideName: eventData.event.brideName,
    groomName: eventData.event.groomName,
    eventDate: eventData.event.eventDate.slice(0, 16),
    venue: eventData.event.venue,
    city: eventData.event.city,
    mapUrl: eventData.event.mapUrl,
    message: eventData.invitation.message,
    rsvpDeadline: eventData.invitation.rsvpDeadline ?? "",
    accentColor: eventData.invitation.accentColor,
    fontStyle: eventData.invitation.fontStyle,
    openingStyle: eventData.invitation.openingStyle,
    layoutStyle: eventData.invitation.layoutStyle,
    showMessage: eventData.invitation.showMessage,
    showCountdown: eventData.invitation.showCountdown,
    showSchedule: eventData.invitation.showSchedule,
    sectionOrder: eventData.invitation.sectionOrder,
    rsvpEnabled: eventData.invitation.rsvpEnabled,
    mealQuestionEnabled: eventData.invitation.mealQuestionEnabled,
    maxPartySize: String(eventData.invitation.maxPartySize),
    coverImageKey: eventData.invitation.coverImageKey ?? "",
  }));
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const [saveError, setSaveError] = useState("");
  const [maxStep, setMaxStep] = useState(eventData.event.status === "published" ? 5 : 1);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "error">("idle");
  const [segmentEditor, setSegmentEditor] = useState<{ mode: "add" | "edit"; segment?: EventSegmentRecord } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<"phone" | "desktop">("phone");
  const [templateFilter, setTemplateFilter] = useState("all");
  const selectedTemplateData = templates[selectedTemplate] ?? templates[0];
  const chooseTemplate = (index: number) => {
    const template = templates[index];
    if (!template) return;
    setSelectedTemplate(index);
    setDraft((current) => ({
      ...current,
      accentColor: templateAccentByArt[template.art],
      openingStyle: template.openingStyle,
      layoutStyle: template.layoutStyle,
    }));
    setSaveState("dirty");
    setSaveError("");
  };
  const setField = (field: string, value: string | boolean) => { setDraft((current) => ({ ...current, [field]: value })); setSaveState("dirty"); setSaveError(""); };
  const moveSection = (section: string, direction: -1 | 1) => {
    setDraft((current) => {
      const index = current.sectionOrder.indexOf(section);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.sectionOrder.length) return current;
      const sectionOrder = [...current.sectionOrder];
      [sectionOrder[index], sectionOrder[target]] = [sectionOrder[target], sectionOrder[index]];
      return { ...current, sectionOrder };
    });
    setSaveState("dirty");
  };
  const save = async (publish = false, activeStep = step) => {
    if (!eventData) {
      setSaveState("error");
      setSaveError(L("لم تكتمل تهيئة الدعوة. أعد تحميل الصفحة ثم حاول مرة أخرى.", "The invitation could not be initialized. Reload the page and try again."));
      return false;
    }
    if ((activeStep === 2 || publish) && (!draft.brideName.trim() || !draft.groomName.trim() || Number.isNaN(new Date(draft.eventDate).getTime()))) {
      setSaveState("error");
      setSaveError(L("أكمل اسم العروس واسم العريس وتاريخ الحفل للمتابعة.", "Add both names and a valid event date to continue."));
      return false;
    }
    const payload = publish ? {
      ...draft,
      eventDate: draft.eventDate,
      maxPartySize: Number(draft.maxPartySize),
      template: templates[selectedTemplate].name,
      status: "published",
    } : activeStep === 1 ? {
      template: templates[selectedTemplate].name,
      openingStyle: draft.openingStyle,
      layoutStyle: draft.layoutStyle,
    } : activeStep === 2 ? {
      title: draft.title,
      brideName: draft.brideName,
      groomName: draft.groomName,
      eventDate: draft.eventDate,
      venue: draft.venue,
      city: draft.city,
      mapUrl: draft.mapUrl,
      message: draft.message,
    } : activeStep === 3 ? {
      accentColor: draft.accentColor,
      fontStyle: draft.fontStyle,
      coverImageKey: draft.coverImageKey || null,
      showMessage: draft.showMessage,
      showCountdown: draft.showCountdown,
      showSchedule: draft.showSchedule,
      sectionOrder: draft.sectionOrder,
    } : {
      rsvpEnabled: draft.rsvpEnabled,
      mealQuestionEnabled: draft.mealQuestionEnabled,
      rsvpDeadline: draft.rsvpDeadline,
      maxPartySize: Number(draft.maxPartySize),
    };
    setSaveState("saving");
    const response = await fetch(`/api/events/${eventData.event.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setSaveState("error");
      setSaveError(result?.error || L("تعذر حفظ هذه الخطوة. تحقق من الاتصال ثم حاول مرة أخرى.", "We could not save this step. Check your connection and try again."));
      return false;
    }
    await onSaved(await response.json() as EventOverview);
    setSaveState("saved");
    setSaveError("");
    return true;
  };
  const next = async () => {
    if (await save(false, step)) {
      const nextStep = Math.min(5, step + 1);
      setMaxStep((current) => Math.max(current, nextStep));
      setStep(nextStep);
    }
  };
  const navigateStep = async (target: number) => {
    if (target <= maxStep) {
      setStep(target);
      setSaveError("");
      return;
    }
    if (target === step + 1) await next();
  };
  const publish = async () => { if (await save(true)) window.location.assign(invitePath); };
  const uploadCover = async (file?: File) => {
    if (!file || !eventData) return;
    setUploadState("uploading");
    const form = new FormData();
    form.append("cover", file);
    const response = await fetch(`/api/events/${eventData.event.id}/cover`, { method: "POST", body: form });
    if (!response.ok) { setUploadState("error"); return; }
    const updated = await response.json() as EventOverview;
    setDraft((current) => ({ ...current, coverImageKey: updated.invitation.coverImageKey ?? "" }));
    await onSaved(updated);
    setUploadState("idle");
  };
  const saveSegment = async (payload: Omit<EventSegmentRecord, "id" | "position">) => {
    if (!eventData) return false;
    const editing = segmentEditor?.mode === "edit" && segmentEditor.segment;
    const response = await fetch(editing ? `/api/events/${eventData.event.id}/segments/${editing.id}` : `/api/events/${eventData.event.id}/segments`, {
      method: editing ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return false;
    await onSaved(await response.json() as EventOverview);
    setSegmentEditor(null);
    return true;
  };
  const removeSegment = async () => {
    if (!eventData || segmentEditor?.mode !== "edit" || !segmentEditor.segment) return { ok: false, error: "تعذر تحديد المرحلة" };
    const response = await fetch(`/api/events/${eventData.event.id}/segments/${segmentEditor.segment.id}`, { method: "DELETE" });
    const result = await response.json().catch(() => null) as EventOverview | { error?: string } | null;
    if (!response.ok) return { ok: false, error: result && "error" in result ? result.error || "تعذر حذف المرحلة" : "تعذر حذف المرحلة" };
    await onSaved(result as EventOverview);
    setSegmentEditor(null);
    return { ok: true, error: "" };
  };
  const invitePath = eventData ? `/invite/${eventData.event.slug}` : "";
  return (
    <section className="app-shell studio-shell">
      <div className="app-title"><div><span className="eyebrow"><i /> {L("استوديو الدعوة", "Invitation studio")}</span><h1 dir="auto">{draft.title}</h1><p aria-live="polite"><span className={`save-dot ${saveState}`} /> {saveState === "saving" ? L("جارٍ حفظ التغييرات…", "Saving changes…") : saveState === "dirty" ? L("توجد تغييرات غير محفوظة", "You have unsaved changes") : saveState === "error" ? L("تعذر الحفظ — راجع الرسالة بالأسفل", "Save failed — review the message below") : L("تم حفظ جميع التغييرات", "All changes are saved")}</p></div><button className="ghost" onClick={() => setPreviewOpen(true)}>{L("معاينة كاملة ↗", "Full preview ↗")}</button></div>
      <div className="progress-steps">
        {steps.map((item, i) => {
          const target = i + 1;
          const locked = target > maxStep && target !== step + 1;
          return <button key={item} onClick={() => void navigateStep(target)} disabled={locked} aria-current={step === target ? "step" : undefined} className={step === target ? "current" : maxStep > target ? "done" : ""}><span>{maxStep > target ? "✓" : target}</span>{item}</button>;
        })}
      </div>
      <div className="studio-grid">
        <div className="studio-panel">
          <div className="panel-heading"><div><small>{L(`الخطوة ${step} من ٥`, `Step ${step} of 5`)}</small><h2>{step === 1 ? L("اختاروا القالب الأقرب لكم", "Choose the template that feels right") : step === 2 ? L("اكتبوا حكايتكم", "Tell your story") : step === 3 ? L("أضيفوا لمستكم", "Add your visual signature") : step === 4 ? L("إعدادات تأكيد الحضور", "RSVP settings") : L("دعوتكم جاهزة للنشر", "Your invitation is ready to publish")}</h2></div><span className="step-count">0{step}</span></div>
          <aside className="studio-step-guide" aria-label={stepGuidance.eyebrow}><span>{stepGuidance.eyebrow}</span><p>{stepGuidance.copy}</p><small>✦ {stepGuidance.outcome}</small></aside>
          {step === 1 && <div className="design-engine">
            <div className="template-filter" aria-label={L("تصفية القوالب", "Filter templates")}>
              {[["all", L("الكل", "All")], ["classic", L("كلاسيكي", "Classic")], ["botanical", L("طبيعي", "Botanical")], ["modern", L("عصري", "Modern")], ["luxury", L("فاخر", "Luxury")], ["minimal", L("بسيط", "Minimal")], ["cinematic", L("سينمائي", "Cinematic")]].map(([value, label]) => <button type="button" key={value} className={templateFilter === value ? "active" : ""} onClick={() => setTemplateFilter(value)}>{label}</button>)}
            </div>
            <div className="studio-templates">{templates.slice(0, 6).map((template, i) => ({ template, i })).filter(({ template }) => templateFilter === "all" || template.category === templateFilter).map(({ template, i }) => <button type="button" key={template.code} onClick={() => chooseTemplate(i)} className={selectedTemplate === i ? "selected" : ""}><div className={`mini-template ${template.color} template-art-${template.art} template-concept-${template.code}`}><InvitationSpecimen template={template} brideName={draft.brideName} groomName={draft.groomName} date={draft.eventDate.slice(0, 10)} locale={locale} /></div><span><b>{ar ? template.name : template.enName}</b><small>{ar ? template.tag : template.enTag}</small></span>{selectedTemplate === i && <i>✓</i>}</button>)}</div>
            <section className={`selected-template-note template-art-${selectedTemplateData.art} template-concept-${selectedTemplateData.code}`}><div><Image src="/brand/wisal-monogram-64.png" width={36} height={36} alt="" unoptimized /><span><small>{L("التجربة المختارة", "Selected experience")}</small><b>{ar ? selectedTemplateData.name : selectedTemplateData.enName}</b><p>{ar ? selectedTemplateData.description : selectedTemplateData.enDescription}</p></span></div><span className="template-experience-meta"><b>{openingStyles.find((item) => item.value === selectedTemplateData.openingStyle)?.[ar ? "name" : "enName"]}</b><small>{layoutStyles.find((item) => item.value === selectedTemplateData.layoutStyle)?.[ar ? "name" : "enName"]}</small></span></section>
            <section className="experience-picker"><div><span className="eyebrow"><i /> {L("لحظة الوصول", "Arrival moment")}</span><h3>{L("كيف تبدأ الدعوة؟", "How should the invitation begin?")}</h3></div><div className="choice-grid opening-grid">{openingStyles.map((option) => <button type="button" key={option.value} className={draft.openingStyle === option.value ? "selected" : ""} onClick={() => setField("openingStyle", option.value)}><span>{option.icon}</span><b>{ar ? option.name : option.enName}</b><small>{ar ? option.description : option.enDescription}</small>{draft.openingStyle === option.value && <i>✓</i>}</button>)}</div></section>
            <section className="experience-picker"><div><span className="eyebrow"><i /> {L("أسلوب الحكاية", "Story style")}</span><h3>{L("كيف تظهر التفاصيل؟", "How should the details unfold?")}</h3></div><div className="choice-grid">{layoutStyles.map((option) => <button type="button" key={option.value} className={draft.layoutStyle === option.value ? "selected" : ""} onClick={() => setField("layoutStyle", option.value)}><b>{ar ? option.name : option.enName}</b><small>{ar ? option.description : option.enDescription}</small>{draft.layoutStyle === option.value && <i>✓</i>}</button>)}</div></section>
          </div>}
          {step === 2 && <><div className="form-grid"><label>{L("اسم العروس", "Bride's name")}<input value={draft.brideName} onChange={(e) => setField("brideName", e.target.value)} /></label><label>{L("اسم العريس", "Groom's name")}<input value={draft.groomName} onChange={(e) => setField("groomName", e.target.value)} /></label><label>{L("اسم المناسبة", "Event name")}<input value={draft.title} onChange={(e) => setField("title", e.target.value)} /></label><label>{L("التاريخ الرئيسي", "Main date")}<input type="datetime-local" value={draft.eventDate} onChange={(e) => setField("eventDate", e.target.value)} /></label><label className="wide">{L("رسالة الدعوة", "Invitation message")}<textarea value={draft.message} onChange={(e) => setField("message", e.target.value)} /></label></div><section className="segments-builder"><div className="segments-heading"><div><span className="eyebrow"><i /> {L("الجدول والمواقع", "Schedule & locations")}</span><h3>{L("مراحل المناسبة", "Event moments")}</h3><p>{L("أضفوا الكنيسة، القاعة، العشاء أو أي جزء آخر بموعد وموقع مستقل.", "Add the ceremony, reception, dinner, or any other moment with its own time and location.")}</p></div><button className="ghost" onClick={() => setSegmentEditor({ mode: "add" })}>{L("＋ إضافة مرحلة", "+ Add moment")}</button></div><div className="segment-list">{eventData.segments.map((segment, index) => <button className="segment-card" key={segment.id} onClick={() => setSegmentEditor({ mode: "edit", segment })}><span className="segment-order">{String(index + 1).padStart(2, "0")}</span><span className="segment-main"><small>{segmentKindLabel[segment.kind][locale]}</small><b>{segment.title}</b><span>{formatSegmentDate(segment.startsAt, locale)}</span></span><span className="segment-venue"><small>{L("الموقع", "Location")}</small><b>{segment.venueName}</b><span>{segment.city}</span></span><Icon>{ar ? "←" : "→"}</Icon></button>)}</div></section></>}
          {step === 3 && <><div className="identity-panel"><label className={`upload-box theme-preview ${draft.accentColor} ${draft.coverImageKey ? "has-cover" : ""}`} style={draft.coverImageKey ? { backgroundImage: `linear-gradient(rgba(30,18,27,.3),rgba(30,18,27,.3)),url(${mediaUrl(draft.coverImageKey)})` } : undefined}><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadCover(e.target.files?.[0])} /><Icon>{draft.coverImageKey ? "↥" : "＋"}</Icon><b>{draft.coverImageKey ? L("تغيير صورة الغلاف", "Change cover image") : L("أضيفوا صورة الغلاف", "Add a cover image")}</b><small>{uploadState === "uploading" ? L("جارٍ رفع الصورة…", "Uploading image…") : uploadState === "error" ? L("تعذر رفع الصورة — حتى 5MB", "Upload failed — maximum 5MB") : "JPG, PNG or WebP — 5MB max"}</small></label><div><h3>{L("ألوان الدعوة", "Invitation colors")}</h3><div className="swatches">{["plum", "sage", "blue", "sand"].map((color) => <button type="button" key={color} aria-label={L(`لون ${color}`, `${color} color`)} onClick={() => setField("accentColor", color)} className={`swatch ${color} ${draft.accentColor === color ? "active" : ""}`} />)}</div><label>{L("الخط", "Typography")}<select value={draft.fontStyle} onChange={(e) => setField("fontStyle", e.target.value)}><option value="classic">{L("عنوان عربي كلاسيكي", "Classic serif title")}</option><option value="modern">{L("عربي عصري", "Modern clean title")}</option></select></label></div></div><section className="section-composer"><div><span className="eyebrow"><i /> {L("ترتيب المحتوى", "Content order")}</span><h3>{L("صمّموا مسار قراءة الدعوة", "Shape the invitation journey")}</h3><p>{L("فعّلوا الأقسام المناسبة ثم اسحبوها لأعلى أو أسفل بالأسهم.", "Enable what matters, then move each section up or down.")}</p></div><div className="section-composer-list">{draft.sectionOrder.map((section, index) => { const config = { message: { name: L("رسالة الترحيب", "Welcome message"), enabled: draft.showMessage, field: "showMessage" }, countdown: { name: L("العدّ التنازلي", "Countdown"), enabled: draft.showCountdown, field: "showCountdown" }, schedule: { name: L("الجدول والمواقع", "Schedule & locations"), enabled: draft.showSchedule, field: "showSchedule" }, rsvp: { name: L("تأكيد الحضور", "RSVP"), enabled: draft.rsvpEnabled, field: "rsvpEnabled" } }[section] ?? { name: section, enabled: false, field: "showMessage" }; return <article key={section} className={!config.enabled ? "is-disabled" : ""}><span className="section-drag">{String(index + 1).padStart(2, "0")}</span><b>{config.name}</b><button type="button" className={`toggle ${config.enabled ? "on" : ""}`} onClick={() => setField(config.field, !config.enabled)} aria-label={L(`تبديل ${config.name}`, `Toggle ${config.name}`)}><i /></button><div><button type="button" onClick={() => moveSection(section, -1)} disabled={index === 0} aria-label={L("تحريك لأعلى", "Move up")}>↑</button><button type="button" onClick={() => moveSection(section, 1)} disabled={index === draft.sectionOrder.length - 1} aria-label={L("تحريك لأسفل", "Move down")}>↓</button></div></article>; })}</div></section></>}
          {step === 4 && <div className="rsvp-settings"><div className="setting"><span><b>{L("تفعيل تأكيد الحضور", "Enable RSVP")}</b><small>{L("السماح للضيوف بإرسال ردهم", "Allow guests to submit their response")}</small></span><button aria-label={L("تبديل تأكيد الحضور", "Toggle RSVP")} onClick={() => setField("rsvpEnabled", !draft.rsvpEnabled)} className={`toggle ${draft.rsvpEnabled ? "on" : ""}`}><i /></button></div><div className="form-grid"><label>{L("آخر موعد للرد", "RSVP deadline")}<input type="date" value={draft.rsvpDeadline} onChange={(e) => setField("rsvpDeadline", e.target.value)} /></label><label>{L("الحد الأقصى للحضور", "Maximum party size")}<select value={draft.maxPartySize} onChange={(e) => setField("maxPartySize", e.target.value)}>{[1,2,3,4,5].map((count) => <option key={count} value={count}>{count} {L(count === 1 ? "شخص" : "أشخاص", count === 1 ? "person" : "people")}</option>)}</select></label></div><div className="setting"><span><b>{L("سؤال تفضيلات الطعام", "Meal preference question")}</b><small>{L("يظهر فقط عند اختيار الحضور", "Only appears when a guest is attending")}</small></span><button aria-label={L("تبديل سؤال الطعام", "Toggle meal question")} onClick={() => setField("mealQuestionEnabled", !draft.mealQuestionEnabled)} className={`toggle ${draft.mealQuestionEnabled ? "on" : ""}`}><i /></button></div></div>}
          {step === 5 && <div className="publish-box"><Icon>✓</Icon><h3>{eventData?.event.status === "published" ? L("دعوتكم منشورة", "Your invitation is published") : L("كل التفاصيل مكتملة", "Everything is ready")}</h3><p>{L("راجعوا الدعوة للمرة الأخيرة، ثم انشروها وشاركوها مع أحبابكم.", "Review the invitation one last time, then publish and share it with your loved ones.")}</p><div className="link-box"><span>{typeof window !== "undefined" ? `${window.location.origin}${invitePath}` : invitePath}</span><button onClick={() => void copyText(`${window.location.origin}${invitePath}`)}>{L("نسخ الرابط", "Copy link")}</button></div></div>}
          {saveError && <p className="builder-error" role="alert">{saveError}</p>}
          <div className="studio-actions"><button className="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1 || saveState === "saving"}>{L("السابق", "Back")}</button>{step < 5 ? <button className="primary" onClick={() => void next()} disabled={saveState === "saving"}>{saveState === "saving" ? L("جارٍ الحفظ…", "Saving…") : L("حفظ ومتابعة ←", "Save & continue →")}</button> : <button className="primary" onClick={() => void publish()} disabled={saveState === "saving"}>{saveState === "saving" ? L("جارٍ النشر…", "Publishing…") : eventData?.event.status === "published" ? L("حفظ وفتح الدعوة ←", "Save & open invitation →") : L("نشر ومعاينة الدعوة ←", "Publish & preview →")}</button>}</div>
        </div>
        <aside className="phone-preview" aria-label={L("المعاينة المباشرة للدعوة", "Live invitation preview")}><div className="phone-preview-head"><span><small>{L("معاينة مباشرة", "Live preview")}</small><b>{ar ? selectedTemplateData.name : selectedTemplateData.enName}</b></span><i>{L("تتحدث فورًا", "Updates instantly")}</i></div><div className="phone"><div className="phone-notch" /><div className={`phone-invite ${selectedTemplateData.color} template-art-${selectedTemplateData.art} template-concept-${selectedTemplateData.code} preview-layout-${draft.layoutStyle}`}><InvitationSpecimen template={selectedTemplateData} brideName={draft.brideName} groomName={draft.groomName} date={draft.eventDate.slice(0, 10)} venue={draft.venue} city={draft.city} locale={locale} phone /></div></div><small>{L("هاتف · تجربة الضيف", "Phone · Guest experience")}</small></aside>
      </div>
      {segmentEditor && <SegmentModal locale={locale} mode={segmentEditor.mode} segment={segmentEditor.segment} onClose={() => setSegmentEditor(null)} onSave={saveSegment} onDelete={removeSegment} />}
      {previewOpen && <div className="modal-backdrop device-preview-backdrop" role="dialog" aria-modal="true" aria-label={L("معاينة الدعوة", "Invitation preview")}><section className="device-preview-modal"><button className="modal-close" onClick={() => setPreviewOpen(false)} aria-label={L("إغلاق", "Close")}>×</button><header><div><span className="eyebrow"><i /> {L("معاينة حقيقية", "True preview")}</span><h2>{L("شاهد الدعوة كما يراها ضيوفك", "See the invitation exactly as your guests will")}</h2></div><div className="device-switch"><button className={previewDevice === "phone" ? "active" : ""} onClick={() => setPreviewDevice("phone")}>{L("هاتف", "Phone")}</button><button className={previewDevice === "desktop" ? "active" : ""} onClick={() => setPreviewDevice("desktop")}>{L("كمبيوتر", "Desktop")}</button></div></header>{eventData.event.status === "published" ? <div className={`preview-stage ${previewDevice}`}><iframe key={`${previewDevice}-${locale}`} src={`${invitePath}?lang=${locale}&preview=1`} title={L("معاينة الدعوة", "Invitation preview")} /></div> : <div className="preview-unpublished"><span>◷</span><h3>{L("المعاينة الكاملة متاحة بعد النشر", "Full preview is available after publishing")}</h3><p>{L("يمكنك متابعة المعاينة المصغّرة الآن، ثم فتح التجربة التفاعلية الكاملة بعد نشر الدعوة.", "Use the live mini preview for now, then open the complete interactive experience after publishing.")}</p></div>}<footer><small>{L("المعاينة تستخدم نفس رابط وتجربة الضيف الفعلية.", "This preview uses the exact guest invitation experience.")}</small>{eventData.event.status === "published" && <a href={`${invitePath}?lang=${locale}`} target="_blank" rel="noreferrer">{L("فتح في نافذة جديدة ↗", "Open in a new window ↗")}</a>}</footer></section></div>}
    </section>
  );
}

function Guest({ locale, rsvp, setRsvp, eventData, onSubmitted }: { locale: Locale; rsvp: string; setRsvp: (v: string) => void; eventData: EventOverview | null; onSubmitted: () => Promise<void> }) {
  const ar = locale === "ar";
  const L = (arabic: string, english: string) => ar ? arabic : english;
  const responses = [
    { value: "yes", label: L("سأحضر", "I’ll attend") },
    { value: "maybe", label: L("ربما", "Maybe") },
    { value: "no", label: L("لن أتمكن", "I can’t make it") },
  ];
  const [name, setName] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [meal, setMeal] = useState("Regular");
  const [submitState, setSubmitState] = useState<"idle" | "saving" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [openedAt] = useState(() => Date.now());
  const invitation = eventData?.invitation;
  const deadline = invitation?.rsvpDeadline ? new Date(`${invitation.rsvpDeadline}T23:59:59+03:00`) : null;
  const rsvpClosed = Boolean(deadline && !Number.isNaN(deadline.getTime()) && openedAt > deadline.getTime());

  const submitRsvp = async () => {
    if (name.trim().length < 2) {
      setSubmitState("error");
      setSubmitError(L("اكتب اسمًا صحيحًا ثم حاول مرة أخرى.", "Enter your full name, then try again."));
      return;
    }
    setSubmitState("saving");
    const status = rsvp === "maybe" ? "maybe" : rsvp === "no" ? "no" : "yes";
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: eventData?.event.id, name, status, partySize: Number(partySize), meal: status === "yes" ? meal : "—" }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null) as { error?: string } | null;
      setSubmitState("error");
      setSubmitError(result?.error || L("تعذر حفظ الرد. حاول مرة أخرى.", "We could not save your response. Please try again."));
      return;
    }
    await onSubmitted();
  };

  return (
    <section className="guest-page">
      <div className="guest-cover"><span className="guest-flower">❦</span><small>{L("يسعدنا أن تشاركونا فرحتنا", "We would love you to share our joy")}</small><h1>{eventData?.event.brideName ?? L("ليلى", "Layla")} <b>&</b> {eventData?.event.groomName ?? L("كريم", "Kareem")}</h1><p>{eventData?.invitation.message ?? L("معًا تبدأ أجمل الحكايات", "Together, our most beautiful story begins")}</p><div className="guest-date"><span><b>{L("موعد الحفل", "Event date")}</b><small>{eventData?.event.eventDate.slice(0, 10) ?? L("١٨ أكتوبر ٢٠٢٦", "18 October 2026")}</small></span><i /><span><b>{eventData?.event.venue ?? L("قصر النيل", "Nile Palace")}</b><small>{eventData?.event.city ?? L("القاهرة", "Cairo")}</small></span></div><div className="scroll-hint">{L("مرّر للتفاصيل ↓", "Scroll for details ↓")}</div></div>
      <div className="guest-content">
        <div className="event-details"><article><Icon>◷</Icon><span><small>{L("الموعد", "Date")}</small><b>{eventData?.event.eventDate.slice(0, 10) ?? L("السبت، ١٨ أكتوبر", "Saturday, 18 October")}</b><p>{L("التوقيت محفوظ في الدعوة", "The event time is saved in your invitation")}</p></span></article><article><Icon>⌖</Icon><span><small>{L("المكان", "Location")}</small><b>{eventData?.event.venue ?? L("قصر النيل", "Nile Palace")}</b><p>{eventData?.event.city ?? L("القاهرة", "Cairo")}</p></span>{eventData?.event.mapUrl && <a href={eventData.event.mapUrl} target="_blank" rel="noreferrer">{L("فتح الخريطة ↗", "Open map ↗")}</a>}</article></div>
        {!invitation?.rsvpEnabled ? <section className="rsvp-card"><div className="rsvp-success rsvp-closed"><span>⌁</span><h2>{L("تأكيد الحضور غير مفعّل", "RSVP is not enabled")}</h2><p>{L("هذه معاينة للدعوة، ويمكن تفعيل استقبال الردود من إعدادات الاستوديو.", "This is an invitation preview. RSVP responses can be enabled in Studio settings.")}</p></div></section> : rsvpClosed ? <section className="rsvp-card"><div className="rsvp-success rsvp-closed"><span>◷</span><h2>{L("انتهى موعد تأكيد الحضور", "The RSVP deadline has passed")}</h2><p>{L("يمكن تعديل آخر موعد للرد من إعدادات الدعوة.", "You can change the response deadline in the invitation settings.")}</p></div></section> : <section className="rsvp-card"><span className="eyebrow"><i /> {L("تأكيد الحضور", "RSVP")}</span><h2>{L("هل ستشاركونا فرحتنا؟", "Will you celebrate with us?")}</h2><p>{L("ننتظر ردكم قبل", "Please respond by")} {invitation?.rsvpDeadline || L("موعد الحفل", "the event date")}</p><div className="rsvp-options">{responses.map(option => <button key={option.value} onClick={() => setRsvp(option.value)} className={rsvp === option.value ? "selected" : ""}><span>{rsvp === option.value ? "✓" : ""}</span>{option.label}</button>)}</div><div className="guest-form"><label>{L("الاسم الكامل", "Full name")}<input value={name} onChange={(event) => { setName(event.target.value); setSubmitState("idle"); setSubmitError(""); }} placeholder={L("اكتب اسمك", "Enter your name")} aria-invalid={submitState === "error"} /></label>{rsvp === "yes" && <><label>{L("عدد الحضور", "Party size")}<select value={partySize} onChange={(event) => setPartySize(event.target.value)}>{Array.from({ length: invitation?.maxPartySize || 1 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>{invitation?.mealQuestionEnabled && <label>{L("تفضيل الطعام", "Meal preference")}<select value={meal} onChange={(event) => setMeal(event.target.value)}><option value="Regular">{L("عادي", "Regular")}</option><option value="Vegetarian">{L("نباتي", "Vegetarian")}</option></select></label>}</>}</div>{submitState === "error" && <p className="form-error" role="alert">{submitError}</p>}<button className="primary wide-button" onClick={() => void submitRsvp()} disabled={submitState === "saving"}>{submitState === "saving" ? L("جارٍ حفظ الرد…", "Saving your response…") : L("إرسال تأكيد الحضور ←", "Send RSVP →")}</button><small className="privacy-note">⌁ {L("بياناتك خاصة ولا تظهر إلا لصاحب الدعوة", "Your details are private and visible only to the host")}</small></section>}
      </div>
    </section>
  );
}

function Dashboard({ locale, filter, setFilter, eventData, eventList, currentEventId, onChooseEvent, onCreate, onEdit, onAddGuest, onEditGuest, onDataUpdated, profileName }: { locale: Locale; filter: string; setFilter: (v: string) => void; eventData: EventOverview | null; eventList: EventSummary[]; currentEventId: string; onChooseEvent: (id: string) => Promise<void>; onCreate: () => void; onEdit: () => void; onAddGuest: () => void; onEditGuest: (guest: GuestRecord) => void; onDataUpdated: (event: EventOverview) => void; profileName: string }) {
  const router = useRouter();
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [section, setSection] = useState<"overview" | "guests" | "messages" | "notifications" | "support" | "activity" | "settings">(() => typeof window === "undefined" ? "overview" : new URLSearchParams(window.location.search).get("section") === "support" ? "support" : "overview");
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeAudience, setComposeAudience] = useState<MessageAudience>("pending");
  const [composeGroupId, setComposeGroupId] = useState<string | null>(null);
  const [composeSegmentId, setComposeSegmentId] = useState<string | null>(null);
  const [dispatchMessage, setDispatchMessage] = useState<MessageRecord | null>(null);
  const [guestQuery, setGuestQuery] = useState("");
  const [copiedLink, setCopiedLink] = useState("");
  const [groupEditor, setGroupEditor] = useState<{ mode: "add" | "edit"; group?: GuestGroupRecord } | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const localizedStatus = { yes: L("مؤكد", "Confirmed"), maybe: L("ربما", "Maybe"), pending: L("لم يرد", "Pending"), no: L("معتذر", "Declined") } as const;
  const liveGuests = eventData?.guests.map((guest) => ({ id: guest.id, name: guest.name, status: localizedStatus[guest.status], people: guest.partySize, meal: guest.meal, tone: guest.status, openedAt: guest.openedAt, record: guest })) ?? guests.map((guest, index) => ({ ...guest, id: String(index), openedAt: null, record: { id: String(index), phone: "", inviteToken: null, name: guest.name, status: guest.tone as GuestRecord["status"], partySize: guest.people, meal: guest.meal, openedAt: null, respondedAt: null } }));
  const stats = eventData?.stats ?? { total: 124, invitations: 4, seats: 124, opened: 3, responded: 3, pendingInvitations: 1, yes: 86, maybe: 11, pending: 29, no: 9 };
  const visible = liveGuests.filter((guest) => {
    if (filter === "الكل") return true;
    if (filter === "فتح الدعوة") return Boolean(guest.openedAt);
    if (filter === "فتح ولم يرد") return Boolean(guest.openedAt) && guest.record.status === "pending";
    if (filter === "لم يفتح") return !guest.openedAt;
    if (filter === "تم الرد") return Boolean(guest.record.respondedAt);
    const statusFilter = ({ "مؤكد": "yes", "ربما": "maybe", "لم يرد": "pending", "معتذر": "no" } as Record<string, GuestRecord["status"]>)[filter];
    const matchesFilter = statusFilter ? guest.record.status === statusFilter : guest.status === filter;
    return matchesFilter;
  }).filter((guest) => !guestQuery.trim() || `${guest.name} ${guest.record.phone}`.toLocaleLowerCase().includes(guestQuery.trim().toLocaleLowerCase()));
  const responseRate = stats.invitations ? Math.round((stats.responded / stats.invitations) * 100) : 0;
  const openRate = stats.invitations ? Math.round((stats.opened / stats.invitations) * 100) : 0;
  const firstName = profileName.split(" ")[0] || "ليلى";
  const title = section === "messages" ? L("الرسائل والتذكيرات", "Messages & reminders") : section === "notifications" ? L("الإشعارات", "Notifications") : section === "support" ? L("الدعم الفني", "Support") : section === "activity" ? L("سجل النشاط", "Activity log") : section === "guests" ? L("إدارة الضيوف", "Guest management") : section === "settings" ? L("إعدادات المناسبة", "Event settings") : eventData?.event.title ?? L("فرحتكم تقترب ♡", "Your celebration is getting closer ♡");
  const actionLabels: Record<string, string> = { event_created: L("تم إنشاء المناسبة", "Event created"), invitation_updated: L("تم تحديث الدعوة", "Invitation updated"), invitation_published: L("تم نشر الدعوة", "Invitation published"), event_segment_added: L("تمت إضافة مرحلة", "Event stage added"), event_segment_updated: L("تم تعديل مرحلة", "Event stage updated"), event_segment_deleted: L("تم حذف مرحلة", "Event stage deleted"), guest_group_added: L("تمت إضافة فئة مدعوين", "Guest group added"), guest_group_updated: L("تم تحديث فئة مدعوين", "Guest group updated"), guest_group_deleted: L("تم حذف فئة مدعوين", "Guest group deleted"), guest_added: L("تمت إضافة ضيف", "Guest added"), guest_updated: L("تم تعديل بيانات ضيف", "Guest updated"), guest_deleted: L("تم حذف ضيف", "Guest deleted"), rsvp_submitted: L("وصل رد حضور جديد", "New RSVP received"), message_scheduled: L("تمت جدولة رسالة", "Message scheduled"), message_drafted: L("تم حفظ مسودة رسالة", "Message draft saved") };
  const groupByGuest = new Map(eventData?.guestGroups.flatMap((group) => group.guestIds.map((guestId) => [guestId, group] as const)) ?? []);
  const segmentStats = eventData?.segments.map((segment) => {
    const invitedGuestIds = new Set(eventData.guestGroups.filter((group) => group.segmentIds.includes(segment.id)).flatMap((group) => group.guestIds));
    eventData.guests.filter((guest) => !groupByGuest.has(guest.id)).forEach((guest) => invitedGuestIds.add(guest.id));
    const responses = eventData.segmentRsvps.filter((response) => response.segmentId === segment.id);
    const countPeople = (status: GuestRecord["status"]) => responses.filter((response) => response.status === status).reduce((sum, response) => sum + response.partySize, 0);
    return { segment, invited: invitedGuestIds.size, responded: responses.filter((response) => response.status !== "pending").length, yes: countPeople("yes"), maybe: countPeople("maybe"), no: responses.filter((response) => response.status === "no").length, pending: Math.max(0, invitedGuestIds.size - responses.filter((response) => response.status !== "pending").length) };
  }) ?? [];
  const launchChecks = [
    { id: "details", done: Boolean(eventData?.event.brideName && eventData.event.groomName && eventData.event.eventDate && eventData.event.venue && eventData.event.city), ar: "بيانات المناسبة", en: "Event details", action: onEdit },
    { id: "design", done: Boolean(eventData?.invitation.template && eventData.invitation.openingStyle && eventData.invitation.layoutStyle), ar: "التصميم وتجربة الفتح", en: "Design & opening", action: onEdit },
    { id: "segments", done: Boolean(eventData?.segments.length && eventData.segments.every((segment) => segment.title && segment.startsAt && segment.venueName && segment.city)), ar: "المواقع والمراحل", en: "Locations & stages", action: onEdit },
    { id: "guests", done: stats.invitations > 0, ar: "إضافة أول ضيف", en: "Add first guest", action: () => setSection("guests") },
    { id: "publish", done: eventData?.event.status === "published", ar: "المراجعة والنشر", en: "Review & publish", action: onEdit },
  ];
  const launchScore = launchChecks.filter((item) => item.done).length * 20;
  const audienceLabels: Record<MessageAudience, string> = { all: L("كل الضيوف", "All guests"), pending: L("بانتظار الرد", "Awaiting reply"), confirmed: L("مؤكدو الحضور", "Confirmed"), unopened: L("لم يفتحوا الدعوة", "Not opened"), opened_pending: L("فتحوا ولم يردوا", "Opened, no reply"), maybe: L("ربما يحضرون", "Maybe attending"), declined: L("المعتذرون", "Declined") };
  const audienceCounts: Record<MessageAudience, number> = {
    all: liveGuests.length,
    pending: liveGuests.filter((guest) => guest.record.status === "pending").length,
    confirmed: liveGuests.filter((guest) => guest.record.status === "yes").length,
    unopened: liveGuests.filter((guest) => !guest.openedAt).length,
    opened_pending: liveGuests.filter((guest) => guest.openedAt && guest.record.status === "pending").length,
    maybe: liveGuests.filter((guest) => guest.record.status === "maybe").length,
    declined: liveGuests.filter((guest) => guest.record.status === "no").length,
  };
  const followUpCount = audienceCounts.opened_pending + audienceCounts.unopened;
  const getRecipients = (audience: MessageAudience, groupId: string | null, segmentId: string | null) => {
    if (!eventData) return [] as GuestRecord[];
    const groupGuestIds = groupId ? new Set(eventData.guestGroups.find((group) => group.id === groupId)?.guestIds ?? []) : null;
    const groupedGuestIds = new Set(eventData.guestGroups.flatMap((group) => group.guestIds));
    const segmentGuestIds = segmentId ? new Set(eventData.guestGroups.filter((group) => group.segmentIds.includes(segmentId)).flatMap((group) => group.guestIds)) : null;
    const matchesAudience = (guest: GuestRecord) => audience === "all" || audience === "pending" && guest.status === "pending" || audience === "confirmed" && guest.status === "yes" || audience === "unopened" && !guest.openedAt || audience === "opened_pending" && Boolean(guest.openedAt) && guest.status === "pending" || audience === "maybe" && guest.status === "maybe" || audience === "declined" && guest.status === "no";
    return eventData.guests.filter((guest) => matchesAudience(guest) && (!groupGuestIds || groupGuestIds.has(guest.id)) && (!segmentGuestIds || segmentGuestIds.has(guest.id) || !groupedGuestIds.has(guest.id)));
  };
  const getRecipientSummary = (audience: MessageAudience, groupId: string | null, segmentId: string | null) => {
    const recipients = getRecipients(audience, groupId, segmentId);
    return { total: recipients.length, whatsapp: recipients.filter((guest) => Boolean(whatsappNumber(guest.phone))).length };
  };
  const invitationUrl = (guest?: GuestRecord) => {
    if (!eventData) return "";
    const base = `${window.location.origin}/invite/${eventData.event.slug}`;
    return guest?.inviteToken ? `${base}?g=${encodeURIComponent(guest.inviteToken)}` : base;
  };
  const copyInvitation = async (guest?: GuestRecord) => {
    const url = invitationUrl(guest);
    if (!url) return;
    if (!await copyText(url)) return;
    const key = guest?.id ?? "general";
    setCopiedLink(key);
    window.setTimeout(() => setCopiedLink((current) => current === key ? "" : current), 1800);
  };
  const shareOnWhatsApp = (guest: GuestRecord) => {
    const url = invitationUrl(guest);
    const text = L(`أهلًا ${guest.name}، يسعدنا مشاركتكم فرحتنا. هذه دعوتكم الخاصة: ${url}`, `Hello ${guest.name}, we would love you to join our celebration. Here is your personal invitation: ${url}`);
    const destination = whatsappNumber(guest.phone);
    window.open(`https://wa.me/${destination}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };
  const exportGuests = () => {
    if (!eventData) return;
    const headers = locale === "ar" ? ["اسم الضيف", "رقم واتساب", "الحالة", "عدد الحضور", "تفضيل الطعام", "فتح الدعوة", "وقت الفتح", "وقت الرد", "رابط الدعوة"] : ["Guest name", "WhatsApp number", "Status", "Party size", "Meal preference", "Opened", "Opened at", "Responded at", "Invitation link"];
    const rows = eventData.guests.map((guest) => [
      guest.name,
      guest.phone,
      localizedStatus[guest.status],
      guest.partySize,
      guest.meal,
      guest.openedAt ? L("نعم", "Yes") : L("لا", "No"),
      guest.openedAt ?? "",
      guest.respondedAt ?? "",
      invitationUrl(guest),
    ]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `wisal-guests-${eventData.event.slug}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };
  const openCompose = (audience: MessageAudience = "pending", groupId: string | null = null, segmentId: string | null = null) => {
    setComposeAudience(audience);
    setComposeGroupId(groupId);
    setComposeSegmentId(segmentId);
    setComposeOpen(true);
  };
  const saveMessage = async (payload: { title: string; body: string; audience: MessageAudience; scheduledAt: string; groupId: string | null; segmentId: string | null }) => {
    if (!eventData) return false;
    const response = await fetch(`/api/events/${eventData.event.id}/messages`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) return false;
    onDataUpdated(await response.json() as EventOverview);
    setComposeOpen(false);
    setSection("messages");
    return true;
  };
  const saveGroup = async (payload: Omit<GuestGroupRecord, "id" | "isDefault">) => {
    if (!eventData) return false;
    const editing = groupEditor?.mode === "edit" && groupEditor.group;
    const response = await fetch(editing ? `/api/events/${eventData.event.id}/guest-groups/${editing.id}` : `/api/events/${eventData.event.id}/guest-groups`, { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) return false;
    onDataUpdated(await response.json() as EventOverview);
    setGroupEditor(null);
    return true;
  };
  const removeGroup = async () => {
    if (!eventData || groupEditor?.mode !== "edit" || !groupEditor.group) return false;
    const response = await fetch(`/api/events/${eventData.event.id}/guest-groups/${groupEditor.group.id}`, { method: "DELETE" });
    if (!response.ok) return false;
    onDataUpdated(await response.json() as EventOverview);
    setGroupEditor(null);
    return true;
  };
  const guestTable = (
    <section className="guest-list">
      <div className="list-title">
        <div><h2>{L("قائمة الضيوف", "Guest list")}</h2><p>{L("رابط خاص لكل ضيف مع تتبع الفتح والرد", "A personal link for every guest with open and response tracking")}</p></div>
        <div className="list-actions"><button onClick={exportGuests}>{L("تصدير CSV ↓", "Export CSV ↓")}</button><button onClick={() => setImportOpen(true)}>{L("استيراد CSV ↑", "Import CSV ↑")}</button><button onClick={onAddGuest}>{L("إضافة ضيف ＋", "Add guest +")}</button></div>
      </div>
      <div className="follow-up-strip" aria-label={L("مسار متابعة الضيوف", "Guest follow-up workflow")}>
        <button type="button" className={filter === "لم يفتح" ? "active" : ""} onClick={() => setFilter("لم يفتح")}><span>01</span><b>{audienceCounts.unopened}</b><small>{L("لم يفتحوا — أرسل الدعوة", "Not opened — send invitation")}</small></button>
        <button type="button" className={filter === "فتح ولم يرد" ? "active" : ""} onClick={() => setFilter("فتح ولم يرد")}><span>02</span><b>{audienceCounts.opened_pending}</b><small>{L("فتحوا ولم يردوا — ذكّر بلطف", "Opened, no reply — follow up gently")}</small></button>
        <button type="button" className={filter === "تم الرد" ? "active" : ""} onClick={() => setFilter("تم الرد")}><span>03</span><b>{stats.responded}</b><small>{L("أرسلوا ردهم — راجع التفاصيل", "Responded — review details")}</small></button>
      </div>
      <div className="guest-operations"><label><span>{L("بحث سريع", "Quick search")}</span><input value={guestQuery} onChange={(event) => setGuestQuery(event.target.value)} placeholder={L("اسم الضيف أو رقم واتساب", "Guest name or WhatsApp number")} /></label><div><button type="button" className={filter === "لم يرد" ? "active" : ""} onClick={() => setFilter("لم يرد")}>{L(`${audienceCounts.pending} بانتظار الرد`, `${audienceCounts.pending} awaiting reply`)}</button><button type="button" className={filter === "لم يفتح" ? "active" : ""} onClick={() => setFilter("لم يفتح")}>{L(`${audienceCounts.unopened} لم يفتحوا`, `${audienceCounts.unopened} not opened`)}</button></div></div>
      <div className="filters">{[["الكل", L("الكل", "All")], ["مؤكد", L("مؤكد", "Confirmed")], ["ربما", L("ربما", "Maybe")], ["لم يرد", L("لم يرد", "Pending")], ["معتذر", L("معتذر", "Declined")], ["فتح الدعوة", L("فتح الدعوة", "Opened")], ["فتح ولم يرد", L("فتح ولم يرد", "Opened, no reply")], ["لم يفتح", L("لم يفتح", "Not opened")], ["تم الرد", L("تم الرد", "Responded")]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={filter === value ? "active" : ""}>{label}</button>)}</div>
      <div className="guest-table">
        <div className="table-head"><span>{L("الضيف", "Guest")}</span><span>{L("الحالة", "Status")}</span><span>{L("فتح الدعوة", "Opened")}</span><span>{L("الحضور", "Party")}</span><span>{L("المشاركة", "Share")}</span></div>
        {visible.length ? visible.map(g => (
          <div className="table-row" key={g.id}>
            <span><i>{g.name[0]}</i><span className="guest-identity"><b>{g.name}</b>{g.record.phone && <small dir="ltr">{g.record.phone}</small>}{groupByGuest.get(g.id) && <small className="guest-group-chip">{groupByGuest.get(g.id)?.name}</small>}</span></span>
            <span><em className={g.tone}>{g.status}</em></span>
            <span className={`interaction-state ${g.openedAt ? "opened" : ""}`}>{g.openedAt ? L("تم الفتح", "Opened") : L("لم تُفتح", "Not opened")}</span>
            <span>{g.people}</span>
            <span className="guest-actions">
              <button className={copiedLink === g.id ? "copied" : ""} onClick={() => void copyInvitation(g.record)} disabled={!g.record.inviteToken || eventData?.event.status !== "published"} aria-label={L(`نسخ رابط دعوة ${g.name}`, `Copy invitation link for ${g.name}`)}>{copiedLink === g.id ? L("تم النسخ", "Copied") : L("نسخ", "Copy")}</button>
              <button onClick={() => shareOnWhatsApp(g.record)} disabled={!g.record.inviteToken || eventData?.event.status !== "published"} aria-label={L(`مشاركة دعوة ${g.name} عبر واتساب`, `Share ${g.name}'s invitation on WhatsApp`)}>WhatsApp</button>
              <button onClick={() => onEditGuest(g.record)} aria-label={L(`تعديل ${g.name}`, `Edit ${g.name}`)}>{L("تعديل", "Edit")}</button>
            </span>
          </div>
        )) : <div className="empty-guests"><span>♙</span><b>{L("لا يوجد ضيوف في هذه الحالة", "No guests match this filter")}</b><button onClick={onAddGuest}>{L("إضافة أول ضيف", "Add the first guest")}</button></div>}
      </div>
      {eventData?.event.status !== "published" && <p className="sharing-hint">{L("انشر الدعوة أولًا لتفعيل روابط المشاركة الخاصة.", "Publish the invitation to activate personal sharing links.")}</p>}
    </section>
  );
  return (
    <section className="dashboard-page">
      <aside><Mark locale={locale} /><div className="event-switch"><small>{L("المناسبة الحالية", "Current event")}</small><select dir="auto" aria-label={L("اختيار المناسبة", "Choose event")} value={currentEventId} onChange={(e) => void onChooseEvent(e.target.value)}>{eventList.map((item) => <option dir="auto" key={item.id} value={item.id}>{item.title}</option>)}</select><span>{eventData?.event.eventDate.slice(0, 10) ?? ""}</span><button onClick={onCreate}>{L("＋ مناسبة جديدة", "+ New event")}</button></div><nav><button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard aria-hidden="true" />{L("نظرة عامة", "Overview")}</button><button className={section === "guests" ? "active" : ""} onClick={() => setSection("guests")}><UsersRound aria-hidden="true" />{L("قائمة الضيوف", "Guest list")} <span>{stats.invitations}</span></button><button onClick={onEdit}><Palette aria-hidden="true" />{L("تصميم الدعوة", "Invitation design")}</button><button className={section === "messages" ? "active" : ""} onClick={() => setSection("messages")}><MessageSquareText aria-hidden="true" />{L("الرسائل", "Messages")}</button><button className={section === "notifications" ? "active" : ""} onClick={() => setSection("notifications")}><Bell aria-hidden="true" />{L("الإشعارات", "Notifications")}</button><button className={section === "support" ? "active" : ""} onClick={() => setSection("support")}><Headphones aria-hidden="true" />{L("الدعم الفني", "Support")}</button><button className={section === "activity" ? "active" : ""} onClick={() => setSection("activity")}><History aria-hidden="true" />{L("سجل النشاط", "Activity log")}</button><button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}><Settings aria-hidden="true" />{L("الإعدادات", "Settings")}</button></nav><div className="aside-user"><span>{firstName[0]}</span><div><b>{profileName}</b><small>{L("صاحب المناسبة", "Event owner")}</small></div></div></aside>
      <div className="dashboard-main">
        <div className="dashboard-mobile-context"><select dir="auto" aria-label={L("اختيار المناسبة", "Choose event")} value={currentEventId} onChange={(event) => void onChooseEvent(event.target.value)}>{eventList.map((item) => <option dir="auto" key={item.id} value={item.id}>{item.title}</option>)}</select><button onClick={onCreate}>{L("مناسبة جديدة +", "New event +")}</button></div>
        <nav className="dashboard-mobile-tabs" aria-label={L("أقسام لوحة المناسبة", "Event dashboard sections")}>
          <button className={section === "overview" ? "active" : ""} onClick={() => setSection("overview")}><LayoutDashboard aria-hidden="true" />{L("نظرة عامة", "Overview")}</button>
          <button className={section === "guests" ? "active" : ""} onClick={() => setSection("guests")}><UsersRound aria-hidden="true" />{L("الضيوف", "Guests")}</button>
          <button className={section === "messages" ? "active" : ""} onClick={() => setSection("messages")}><MessageSquareText aria-hidden="true" />{L("الرسائل", "Messages")}</button>
          <button className={section === "notifications" ? "active" : ""} onClick={() => setSection("notifications")}><Bell aria-hidden="true" />{L("الإشعارات", "Notifications")}</button>
          <button className={section === "support" ? "active" : ""} onClick={() => setSection("support")}><Headphones aria-hidden="true" />{L("الدعم", "Support")}</button>
          <button className={section === "activity" ? "active" : ""} onClick={() => setSection("activity")}><History aria-hidden="true" />{L("النشاط", "Activity")}</button>
          <button className={section === "settings" ? "active" : ""} onClick={() => setSection("settings")}><Settings aria-hidden="true" />{L("الإعدادات", "Settings")}</button>
        </nav>
        <div className="dashboard-header"><div><small>{L("مساء الخير،", "Welcome,")} {firstName}</small><div className="event-title-line"><h1 dir="auto">{title}</h1><span className={`event-status-pill ${eventData?.event.status === "published" ? "published" : "draft"}`}>{eventData?.event.status === "published" ? L("منشورة", "Published") : L("مسودة", "Draft")}</span></div><p>{section === "overview" ? eventData?.event.status === "published" ? L("الدعوة منشورة — وهذه أحدث تفاعلات ضيوفكم.", "Your invitation is published — here are the latest guest interactions.") : L("الدعوة ما زالت مسودة — أكملوا التفاصيل ثم انشروها.", "Your invitation is still a draft — complete the details, then publish it.") : L("كل أدوات المناسبة في مكان واحد واضح.", "Every event tool is organized in one clear place.")}</p></div><div>{eventData?.event.status === "published" && <><button className="ghost" onClick={() => void copyInvitation()}>{copiedLink === "general" ? L("تم نسخ الرابط ✓", "Link copied ✓") : L("نسخ الرابط العام", "Copy public link")}</button><button className="ghost" onClick={() => router.push(`/invite/${eventData.event.slug}`)}>{L("فتح الدعوة ↗", "Open invitation ↗")}</button></>}{section === "messages" ? <button className="primary" onClick={() => openCompose()}>{L("رسالة جديدة ＋", "New message +")}</button> : section === "guests" ? <button className="primary" onClick={onAddGuest}>{L("إضافة ضيف ＋", "Add guest +")}</button> : section === "overview" && eventData?.event.status === "published" ? <button className="primary" onClick={onAddGuest}>{L("إضافة ضيف ＋", "Add guest +")}</button> : <button className="primary" onClick={onEdit}>{L("فتح استوديو التصميم ←", "Open invitation studio →")}</button>}</div></div>
        {section === "overview" && <><section className="launch-readiness"><div className="launch-score"><span><Rocket aria-hidden="true" /></span><div><small>{L("جاهزية الدعوة للإرسال", "Invitation launch readiness")}</small><b>{launchScore}%</b><p>{launchScore === 100 ? L("الدعوة جاهزة للمشاركة مع الضيوف.", "Your invitation is ready to share.") : L("أكمل الخطوات المتبقية لتجنب أي نقص قبل الإرسال.", "Complete the remaining steps before sharing.")}</p></div></div><div className="launch-progress" aria-label={L(`نسبة الاكتمال ${launchScore}٪`, `${launchScore}% complete`)}><span style={{ transform: `scaleX(${launchScore / 100})` }} /></div><div className="launch-checks">{launchChecks.map((item) => <button key={item.id} className={item.done ? "done" : ""} onClick={item.action}>{item.done ? <CircleCheckBig aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}<span>{L(item.ar, item.en)}</span></button>)}</div></section><div className="stat-grid"><article><span className="stat-icon plum">♙</span><div><small>{L("الدعوات المخصصة", "Personal invitations")}</small><b>{stats.invitations}</b><p>{L(`${stats.seats} فردًا متوقعًا`, `${stats.seats} expected guests`)}</p></div></article><article><span className="stat-icon green">↗</span><div><small>{L("فتحوا الدعوة", "Invitations opened")}</small><b>{stats.opened}</b><p>{L(`${openRate}٪ معدل الفتح`, `${openRate}% open rate`)}</p></div></article><article><span className="stat-icon gold">✓</span><div><small>{L("مؤكدو الحضور", "Confirmed guests")}</small><b>{stats.yes}</b><p>{L("عدد الأفراد المؤكدين", "Confirmed party size")}</p></div></article><article><span className="stat-icon rose">◷</span><div><small>{L("في انتظار الرد", "Awaiting reply")}</small><b>{stats.pendingInvitations}</b><p>{L("دعوات تحتاج متابعة", "Invitations to follow up")}</p></div></article></div><section className="segment-analytics"><div className="analytics-heading"><div><span className="eyebrow"><i /> {L("الحضور حسب المرحلة", "Attendance by stage")}</span><h2>{L("صورة واضحة لكل موقع", "A clear view of every location")}</h2></div><small>{L("الأعداد تتحدث تلقائيًا مع ردود الضيوف", "Counts update automatically with guest responses")}</small></div><div className="segment-stat-grid">{segmentStats.map((item) => { const rate = item.invited ? Math.round((item.responded / item.invited) * 100) : 0; return <article key={item.segment.id}><div className="segment-stat-head"><span><small>{segmentKindLabel[item.segment.kind][locale]}</small><b>{item.segment.title}</b></span><i>{L(`${rate}٪ ردوا`, `${rate}% replied`)}</i></div><p>{item.segment.venueName} · {formatSegmentDate(item.segment.startsAt, locale)}</p><div className="mini-progress"><span style={{ width: `${rate}%` }} /></div><div className="segment-stat-values"><span><b>{item.invited}</b><small>{L("مدعو", "Invited")}</small></span><span className="yes"><b>{item.yes}</b><small>{L("مؤكد", "Confirmed")}</small></span><span className="maybe"><b>{item.maybe}</b><small>{L("ربما", "Maybe")}</small></span><span className="pending"><b>{item.pending}</b><small>{L("بانتظار الرد", "Pending")}</small></span></div><button onClick={() => { setSection("messages"); openCompose("pending", null, item.segment.id); }}>{L("إرسال تذكير لهذه المرحلة ←", "Send a reminder for this stage →")}</button></article>; })}</div></section><div className="dashboard-grid">{guestTable}<section className="response-card"><div className="list-title"><div><h2>{L("معدل الاستجابة", "Response rate")}</h2><p>{L("من إجمالي روابط الدعوة", "Across all invitation links")}</p></div></div><div className="donut" style={{ "--response": `${responseRate}%` } as React.CSSProperties}><div><b>{responseRate}%</b><small>{L("تم الرد", "Responded")}</small></div></div><div className="legend"><span><i className="yes" /> {L("مؤكد", "Confirmed")} <b>{stats.yes}</b></span><span><i className="maybe" /> {L("ربما", "Maybe")} <b>{stats.maybe}</b></span><span><i className="no" /> {L("معتذر", "Declined")} <b>{stats.no}</b></span><span><i className="pending" /> {L("لم يرد", "Pending")} <b>{stats.pendingInvitations}</b></span></div><button className="reminder-button" onClick={() => openCompose("pending")}>{L(`تجهيز تذكير لـ ${stats.pendingInvitations} دعوة ←`, `Prepare a reminder for ${stats.pendingInvitations} invitations →`)}</button></section></div></>}
        {section === "guests" && <div className="single-panel"><section className="group-manager"><div className="panel-toolbar"><div><span className="eyebrow"><i /> {L("صلاحيات الحضور", "Attendance access")}</span><h2>{L("فئات المدعوين", "Guest groups")}</h2><p>{L("قسّم الضيوف وحدد المراحل التي تظهر لكل فئة في رابط دعوتها الخاص.", "Group guests and choose which stages appear in each personal invitation.")}</p></div><button className="primary" onClick={() => setGroupEditor({ mode: "add" })}>{L("فئة جديدة ＋", "New group +")}</button></div><div className="group-cards">{eventData?.guestGroups.length ? eventData.guestGroups.map((group) => <button key={group.id} className="group-card" onClick={() => setGroupEditor({ mode: "edit", group })}><span className="group-card-top"><b>{group.name}</b><i>{L(`${group.guestIds.length} ضيف`, `${group.guestIds.length} guests`)}</i></span><p>{group.description || L("بدون وصف", "No description")}</p><div>{eventData.segments.filter((segment) => group.segmentIds.includes(segment.id)).map((segment) => <span key={segment.id}>✓ {segment.title}</span>)}</div><small>{L("تعديل الفئة والصلاحيات ←", "Edit group & access →")}</small></button>) : <div className="empty-tool"><span>♙</span><h3>{L("أنشئ أول فئة للمدعوين", "Create your first guest group")}</h3><p>{L("مثال: الكنيسة فقط، أو الكنيسة والقاعة.", "For example: ceremony only, or ceremony and reception.")}</p><button onClick={() => setGroupEditor({ mode: "add" })}>{L("إنشاء فئة", "Create group")}</button></div>}</div></section>{guestTable}</div>}
        {section === "messages" && <section className="tool-panel"><div className="panel-toolbar"><div><h2>{L("الرسائل المحفوظة", "Saved messages")}</h2><p>{L("جهّز تذكيرًا لفئة محددة، ثم شاركه بعد المراجعة.", "Prepare a reminder for a specific audience, then share it after review.")}</p></div><button className="primary" onClick={() => openCompose()}>{L("إنشاء رسالة ＋", "Create message +")}</button></div><div className="message-priority"><div><span>{L("المتابعة المقترحة", "Suggested follow-up")}</span><b>{L(`${followUpCount} ضيوف يحتاجون خطوة`, `${followUpCount} guests need a step`)}</b></div><button type="button" onClick={() => openCompose("opened_pending")}>{L("تذكير لمن فتحوا ولم يردوا ←", "Remind opened guests →")}</button><button type="button" onClick={() => openCompose("unopened")}>{L("رسالة لمن لم يفتحوا ←", "Message unopened guests →")}</button></div><div className="audience-grid">{(["opened_pending", "unopened", "pending", "confirmed"] as MessageAudience[]).map((audience) => <button key={audience} onClick={() => openCompose(audience)}><b>{audienceCounts[audience]}</b><span>{audienceLabels[audience]}</span></button>)}</div><div className="message-list">{eventData?.messages.length ? eventData.messages.map((message) => { const audience = getRecipientSummary(message.audience, message.groupId, message.segmentId); return <article key={message.id}><span className={`message-status ${message.status}`}>{message.status === "scheduled" ? L("موعد متابعة", "Follow-up due") : L("مسودة", "Draft")}</span><div><h3>{message.title}</h3><p>{message.body}</p><small>{L(`${audience.total} مستلم حالي · ${audience.whatsapp} جاهز واتساب`, `${audience.total} current recipients · ${audience.whatsapp} WhatsApp-ready`)}{message.scheduledAt ? ` · ${L("متابعة", "Follow up")} ${message.scheduledAt.replace("T", " ")}` : ""}</small></div><div className="message-actions"><button className="copy-message" onClick={() => void copyText(message.body)}>{L("نسخ النص", "Copy text")}</button><button className="prepare-message" onClick={() => setDispatchMessage(message)} disabled={audience.total === 0}>{L("تجهيز واتساب ←", "Prepare WhatsApp →")}</button></div></article>; }) : <div className="empty-tool"><span>▤</span><h3>{L("لا توجد رسائل بعد", "No messages yet")}</h3><p>{L("أنشئ أول تذكير واحفظه داخل المناسبة.", "Create the first reminder and save it to the event.")}</p><button onClick={() => openCompose()}>{L("إنشاء رسالة", "Create message")}</button></div>}</div></section>}
        {section === "notifications" && <Suspense fallback={<BuilderLoading locale={locale} />}><AccountCenter locale={locale} mode="notifications" eventId={eventData?.event.id} /></Suspense>}
        {section === "support" && <Suspense fallback={<BuilderLoading locale={locale} />}><AccountCenter locale={locale} mode="support" eventId={eventData?.event.id} /></Suspense>}
        {section === "activity" && <section className="tool-panel"><div className="panel-toolbar"><div><h2>{L("آخر العمليات", "Recent activity")}</h2><p>{L("سجل زمني لكل تعديل ورد وحركة مهمة.", "A timeline of every update, response, and important action.")}</p></div></div><div className="activity-list">{eventData?.activity.map((item) => <article key={item.id}><span>✓</span><div><b>{actionLabels[item.action] ?? item.action}</b><small>{item.actor} · {item.createdAt.replace("T", " ").slice(0, 16)}</small></div></article>)}</div></section>}
        {section === "settings" && <section className="tool-panel settings-summary"><h2>{L("بيانات المناسبة", "Event details")}</h2><div><span><small>{L("المكان", "Venue")}</small><b>{eventData?.event.venue}</b></span><span><small>{L("المدينة", "City")}</small><b>{eventData?.event.city}</b></span><span><small>{L("الخريطة", "Map")}</small><b>{eventData?.event.mapUrl ? L("مرتبطة", "Connected") : L("غير مضافة", "Not added")}</b></span><span><small>{L("حالة الدعوة", "Invitation status")}</small><b>{eventData?.event.status === "published" ? L("منشورة", "Published") : L("مسودة", "Draft")}</b></span></div><button className="primary" onClick={onEdit}>{L("تعديل بيانات الدعوة ←", "Edit invitation details →")}</button></section>}
      </div>
      {composeOpen && eventData && <MessageModal locale={locale} initialAudience={composeAudience} initialGroupId={composeGroupId} initialSegmentId={composeSegmentId} audienceCounts={audienceCounts} groups={eventData.guestGroups} segments={eventData.segments} getRecipientSummary={getRecipientSummary} onClose={() => setComposeOpen(false)} onSave={saveMessage} />}
      {dispatchMessage && eventData && <WhatsAppQueueModal locale={locale} message={dispatchMessage} recipients={getRecipients(dispatchMessage.audience, dispatchMessage.groupId, dispatchMessage.segmentId)} invitationUrl={invitationUrl} onClose={() => setDispatchMessage(null)} />}
      {groupEditor && eventData && <GuestGroupModal locale={locale} mode={groupEditor.mode} group={groupEditor.group} guests={eventData.guests} segments={eventData.segments} onClose={() => setGroupEditor(null)} onSave={saveGroup} onDelete={removeGroup} />}
      {importOpen && eventData && <ImportGuestsModal locale={locale} groups={eventData.guestGroups} onClose={() => setImportOpen(false)} onImport={async (rows) => { const response = await fetch(`/api/events/${eventData.event.id}/guests/import`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ rows }) }); if (!response.ok) return null; const updated = await response.json() as EventOverview & { importSummary?: { imported: number; skipped: number } }; onDataUpdated(updated); return updated.importSummary ?? { imported: rows.length, skipped: 0 }; }} />}
    </section>
  );
}

function CreateEventModal({ locale, plan, onClose, onCreate }: { locale: Locale; plan: PlanCode; onClose: () => void; onCreate: (payload: Record<string, string>) => Promise<{ ok: boolean; error: string }> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [form, setForm] = useState({ brideName: "", groomName: "", eventDate: "", venue: "", city: L("القاهرة", "Cairo") });
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const change = (field: string, value: string) => { setForm((current) => ({ ...current, [field]: value })); setState("idle"); setErrorMessage(""); };
  const submit = async () => {
    if (!form.brideName.trim() || !form.groomName.trim() || Number.isNaN(new Date(form.eventDate).getTime())) { setErrorMessage(L("أكملوا الأسماء واختاروا تاريخًا صحيحًا للحفل.", "Enter both names and choose a valid event date.")); return setState("error"); }
    setState("saving");
    const result = await onCreate({ ...form, plan, title: L(`زفاف ${form.brideName} و${form.groomName}`, `${form.brideName} & ${form.groomName}'s wedding`) });
    if (!result.ok) { setErrorMessage(result.error); setState("error"); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="create-modal" role="dialog" aria-modal="true" aria-labelledby="create-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("مناسبة جديدة", "New event")}</span><h2 id="create-title">{L("ابدأوا دعوة جديدة", "Start a new invitation")}</h2><p>{L("أضيفوا الأساسيات الآن، ويمكنكم تعديل كل التفاصيل لاحقًا.", "Add the essentials now. You can refine every detail later.")}</p><div className="form-grid"><label>{L("اسم العروس", "Bride's name")}<input value={form.brideName} onChange={(e) => change("brideName", e.target.value)} autoFocus /></label><label>{L("اسم العريس", "Groom's name")}<input value={form.groomName} onChange={(e) => change("groomName", e.target.value)} /></label><label>{L("تاريخ الحفل", "Event date")}<input type="date" value={form.eventDate} onChange={(e) => change("eventDate", e.target.value)} /></label><label>{L("المدينة", "City")}<input value={form.city} onChange={(e) => change("city", e.target.value)} /></label><label className="wide">{L("مكان الحفل", "Venue")}<input value={form.venue} onChange={(e) => change("venue", e.target.value)} /></label></div>{state === "error" && <p className="form-error" role="alert">{errorMessage}</p>}<div className="modal-actions"><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={state === "saving"}>{state === "saving" ? L("جارٍ الإنشاء…", "Creating…") : L("إنشاء الدعوة ←", "Create invitation →")}</button></div></section></div>;
}

function GuestModal({ locale, mode, guest, onClose, onSave, onDelete }: { locale: Locale; mode: "add" | "edit"; guest?: GuestRecord; onClose: () => void; onSave: (payload: { name: string; phone: string; status: GuestRecord["status"]; partySize: number; meal: string }) => Promise<boolean>; onDelete: () => Promise<boolean> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [form, setForm] = useState({ name: guest?.name ?? "", phone: guest?.phone ?? "", status: guest?.status ?? "pending", partySize: String(guest?.partySize ?? 1), meal: guest?.meal === "—" ? L("عادي", "Regular") : guest?.meal ?? L("عادي", "Regular") });
  const [state, setState] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const submit = async () => {
    if (form.name.trim().length < 2 || (form.phone && !/^[+\d\s()-]{7,30}$/.test(form.phone))) return setState("error");
    setState("saving");
    if (!await onSave({ name: form.name.trim(), phone: form.phone.trim(), status: form.status as GuestRecord["status"], partySize: Number(form.partySize), meal: form.status === "yes" ? form.meal : "—" })) setState("error");
  };
  const remove = async () => { setState("deleting"); if (!await onDelete()) setState("error"); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="create-modal guest-modal" role="dialog" aria-modal="true" aria-labelledby="guest-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("إدارة الضيوف", "Guest management")}</span><h2 id="guest-title">{mode === "add" ? L("إضافة ضيف جديد", "Add a new guest") : L("تعديل بيانات الضيف", "Edit guest details")}</h2><p>{L("أضفوا رقم واتساب اختياريًا لتوجيه المشاركة مباشرة إلى الضيف.", "Add an optional WhatsApp number to share the invitation directly.")}</p><div className="form-grid"><label>{L("اسم الضيف", "Guest name")}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></label><label>{L("رقم واتساب", "WhatsApp number")}<input type="tel" dir="ltr" placeholder="+20 10 0000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label><label>{L("الحالة", "Status")}<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as GuestRecord["status"] })}><option value="pending">{L("لم يرد", "Pending")}</option><option value="yes">{L("مؤكد", "Confirmed")}</option><option value="maybe">{L("ربما", "Maybe")}</option><option value="no">{L("معتذر", "Declined")}</option></select></label><label>{L("عدد الحضور", "Party size")}<select value={form.partySize} onChange={(e) => setForm({ ...form, partySize: e.target.value })}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>{form.status === "yes" && <label className="wide">{L("تفضيل الطعام", "Meal preference")}<select value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}><option>{L("عادي", "Regular")}</option><option>{L("نباتي", "Vegetarian")}</option></select></label>}</div>{state === "error" && <p className="form-error" role="alert">{L("تحقق من اسم الضيف ورقم واتساب ثم حاول مرة أخرى.", "Check the guest name and WhatsApp number, then try again.")}</p>}<div className="modal-actions split">{mode === "edit" ? <button className="danger-button" onClick={() => void remove()} disabled={state === "deleting"}>{state === "deleting" ? L("جارٍ الحذف…", "Deleting…") : L("حذف الضيف", "Delete guest")}</button> : <span />}<div><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={state === "saving"}>{state === "saving" ? L("جارٍ الحفظ…", "Saving…") : L("حفظ الضيف ←", "Save guest →")}</button></div></div></section></div>;
}

function GuestGroupModal({ locale, mode, group, guests, segments, onClose, onSave, onDelete }: { locale: Locale; mode: "add" | "edit"; group?: GuestGroupRecord; guests: GuestRecord[]; segments: EventSegmentRecord[]; onClose: () => void; onSave: (payload: Omit<GuestGroupRecord, "id" | "isDefault">) => Promise<boolean>; onDelete: () => Promise<boolean> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [name, setName] = useState(group?.name ?? "");
  const [description, setDescription] = useState(group?.description ?? "");
  const [guestIds, setGuestIds] = useState<string[]>(group?.guestIds ?? []);
  const [segmentIds, setSegmentIds] = useState<string[]>(group?.segmentIds ?? segments.map((segment) => segment.id));
  const [partyLimit, setPartyLimit] = useState(group?.partyLimit ?? 2);
  const [state, setState] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const toggle = (items: string[], id: string, setter: (items: string[]) => void) => setter(items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);
  const submit = async () => {
    if (!name.trim() || !segmentIds.length) return setState("error");
    setState("saving");
    if (!await onSave({ name: name.trim(), description: description.trim(), guestIds, segmentIds, partyLimit })) setState("error");
  };
  const remove = async () => { setState("deleting"); if (!await onDelete()) setState("error"); };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="create-modal group-modal" role="dialog" aria-modal="true" aria-labelledby="group-modal-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("فئات المدعوين", "Guest groups")}</span><h2 id="group-modal-title">{mode === "add" ? L("إنشاء فئة جديدة", "Create a new group") : L("تعديل الفئة والصلاحيات", "Edit group & access")}</h2><p>{L("لن يرى الضيف في دعوته إلا المراحل المحددة لفئته.", "Guests only see the stages assigned to their group.")}</p><div className="form-grid"><label>{L("اسم الفئة", "Group name")}<input value={name} onChange={(event) => { setName(event.target.value); setState("idle"); }} placeholder={L("مثل: الكنيسة فقط", "For example: ceremony only")} autoFocus /></label><label>{L("الحد الأقصى للحضور", "Maximum party size")}<select value={partyLimit} onChange={(event) => setPartyLimit(Number(event.target.value))}>{Array.from({ length: 10 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label className="wide">{L("وصف اختياري", "Optional description")}<input value={description} onChange={(event) => setDescription(event.target.value)} placeholder={L("وصف يساعدك على تمييز هذه الفئة", "A short description to identify this group")} /></label></div><div className="audience-picker"><section><div className="picker-title"><b>{L("الضيوف داخل الفئة", "Guests in this group")}</b><small>{L(`${guestIds.length} محدد`, `${guestIds.length} selected`)}</small></div><div className="check-list">{guests.map((guest) => <label key={guest.id}><input type="checkbox" checked={guestIds.includes(guest.id)} onChange={() => toggle(guestIds, guest.id, setGuestIds)} /><span><b>{guest.name}</b><small>{guest.phone || L(statusLabel[guest.status], ({ yes: "Confirmed", maybe: "Maybe", pending: "Pending", no: "Declined" } as const)[guest.status])}</small></span></label>)}</div></section><section><div className="picker-title"><b>{L("المراحل المسموح بها", "Allowed stages")}</b><small>{L(`${segmentIds.length} محدد`, `${segmentIds.length} selected`)}</small></div><div className="check-list segment-checks">{segments.map((segment) => <label key={segment.id}><input type="checkbox" checked={segmentIds.includes(segment.id)} onChange={() => toggle(segmentIds, segment.id, setSegmentIds)} /><span><b>{segment.title}</b><small>{segment.venueName} · {formatSegmentDate(segment.startsAt, locale)}</small></span></label>)}</div></section></div>{state === "error" && <p className="form-error" role="alert">{L("أضف اسم الفئة واختر مرحلة واحدة على الأقل، ثم حاول مجددًا.", "Add a group name and select at least one stage, then try again.")}</p>}<div className={`modal-actions ${mode === "edit" ? "split" : ""}`}>{mode === "edit" && <button className="danger-button" onClick={() => void remove()} disabled={state === "deleting"}>{state === "deleting" ? L("جارٍ الحذف…", "Deleting…") : L("حذف الفئة", "Delete group")}</button>}<div><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={state === "saving" || state === "deleting"}>{state === "saving" ? L("جارٍ الحفظ…", "Saving…") : L("حفظ الفئة والصلاحيات ←", "Save group & access →")}</button></div></div></section></div>;
}

function ImportGuestsModal({ locale, groups, onClose, onImport }: { locale: Locale; groups: GuestGroupRecord[]; onClose: () => void; onImport: (rows: Array<{ name: string; phone: string; partySize: number; groupId: string | null }>) => Promise<{ imported: number; skipped: number } | null> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [rows, setRows] = useState<Array<{ name: string; phone: string; partySize: number; groupId: string | null }>>([]);
  const [defaultGroupId, setDefaultGroupId] = useState<string | null>(groups.find((group) => group.isDefault)?.id ?? groups[0]?.id ?? null);
  const [fileName, setFileName] = useState("");
  const [state, setState] = useState<"idle" | "ready" | "saving" | "done" | "error">("idle");
  const [summary, setSummary] = useState<{ imported: number; skipped: number } | null>(null);
  const readFile = async (file?: File) => {
    if (!file) return;
    setFileName(file.name);
    const parsed = parseCsv(await file.text());
    const headers = (parsed[0] ?? []).map((header) => header.toLowerCase().replaceAll(" ", ""));
    const indexOf = (...names: string[]) => headers.findIndex((header) => names.includes(header));
    const nameIndex = indexOf("الاسم", "اسمالضيف", "name", "guestname");
    const phoneIndex = indexOf("الهاتف", "رقمالهاتف", "واتساب", "phone", "whatsapp");
    const partyIndex = indexOf("عددالحضور", "الأفراد", "partysize", "guests");
    const groupIndex = indexOf("الفئة", "group", "category");
    if (nameIndex < 0) { setRows([]); return setState("error"); }
    const mapped = parsed.slice(1).map((cells) => {
      const groupName = groupIndex >= 0 ? cells[groupIndex]?.trim().toLowerCase() : "";
      const matchedGroup = groups.find((group) => group.name.trim().toLowerCase() === groupName);
      return { name: cells[nameIndex]?.trim() || "", phone: phoneIndex >= 0 ? cells[phoneIndex]?.trim() || "" : "", partySize: Math.max(1, Math.min(10, Number(partyIndex >= 0 ? cells[partyIndex] : 1) || 1)), groupId: matchedGroup?.id ?? defaultGroupId };
    }).filter((row) => row.name.length >= 2).slice(0, 500);
    setRows(mapped);
    setState(mapped.length ? "ready" : "error");
  };
  const submit = async () => {
    setState("saving");
    const result = await onImport(rows.map((row) => ({ ...row, groupId: row.groupId ?? defaultGroupId })));
    if (!result) return setState("error");
    setSummary(result);
    setState("done");
  };
  const downloadTemplate = () => {
    const content = locale === "ar" ? "\uFEFFالاسم,رقم الهاتف,عدد الحضور,الفئة\r\nمريم وعمرو,+201000000000,2,الكنيسة والقاعة" : "\uFEFFName,Phone,Party Size,Group\r\nMary and Omar,+201000000000,2,Ceremony and reception";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "wisal-guests-template.csv"; link.click(); URL.revokeObjectURL(url);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="create-modal import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("استيراد جماعي", "Bulk import")}</span><h2 id="import-title">{L("أضف قائمة الضيوف في دقائق", "Add your guest list in minutes")}</h2>{state === "done" ? <div className="import-success"><span>✓</span><h3>{L(`تم استيراد ${summary?.imported} ضيف`, `${summary?.imported} guests imported`)}</h3><p>{summary?.skipped ? L(`تم تجاهل ${summary.skipped} صفوف غير مكتملة.`, `${summary.skipped} incomplete rows were skipped.`) : L("تم حفظ كل الصفوف بنجاح.", "All rows were saved successfully.")}</p><button className="primary" onClick={onClose}>{L("العودة لقائمة الضيوف", "Back to guest list")}</button></div> : <><p>{L("استخدم ملف CSV بعناوين عربية أو إنجليزية. ستظهر معاينة قبل الحفظ.", "Use a CSV file with Arabic or English headers. You will see a preview before saving.")}</p><div className="import-controls"><label className="file-drop"><input type="file" accept=".csv,text/csv" onChange={(event) => void readFile(event.target.files?.[0])} /><span>↑</span><b>{fileName || L("اختر ملف CSV", "Choose a CSV file")}</b><small>{L("حتى 500 ضيف في المرة", "Up to 500 guests at a time")}</small></label><div><label>{L("الفئة الافتراضية", "Default group")}<select value={defaultGroupId ?? ""} onChange={(event) => setDefaultGroupId(event.target.value || null)}><option value="">{L("بدون فئة", "No group")}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name}</option>)}</select></label><button className="text-button" onClick={downloadTemplate}>{L("تحميل نموذج جاهز ↓", "Download template ↓")}</button></div></div>{rows.length > 0 && <div className="import-preview"><div><b>{L("معاينة البيانات", "Data preview")}</b><small>{L(`${rows.length} صف صالح`, `${rows.length} valid rows`)}</small></div><div className="import-table"><span>{L("الاسم", "Name")}</span><span>{L("الهاتف", "Phone")}</span><span>{L("الأفراد", "Party")}</span><span>{L("الفئة", "Group")}</span>{rows.slice(0, 6).flatMap((row, index) => [<b key={`n-${index}`}>{row.name}</b>, <small key={`p-${index}`} dir="ltr">{row.phone || "—"}</small>, <small key={`s-${index}`}>{row.partySize}</small>, <small key={`g-${index}`}>{groups.find((group) => group.id === row.groupId)?.name || L("بدون", "None")}</small>])}</div>{rows.length > 6 && <small>{L(`و${rows.length - 6} صفوف أخرى…`, `And ${rows.length - 6} more rows…`)}</small>}</div>}{state === "error" && <p className="form-error" role="alert">{L("تعذر قراءة الملف. تأكد من وجود عمود باسم «الاسم» أو Name ومن صحة أرقام الهاتف.", "The file could not be read. Make sure it includes a Name column and valid phone numbers.")}</p>}<div className="modal-actions"><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={!rows.length || state === "saving"}>{state === "saving" ? L("جارٍ الاستيراد…", "Importing…") : L(`استيراد ${rows.length || ""} ضيف ←`, `Import ${rows.length || ""} guests →`)}</button></div></>}</section></div>;
}

function MessageModal({ locale, initialAudience, initialGroupId, initialSegmentId, audienceCounts, groups, segments, getRecipientSummary, onClose, onSave }: { locale: Locale; initialAudience: MessageAudience; initialGroupId: string | null; initialSegmentId: string | null; audienceCounts: Record<MessageAudience, number>; groups: GuestGroupRecord[]; segments: EventSegmentRecord[]; getRecipientSummary: (audience: MessageAudience, groupId: string | null, segmentId: string | null) => { total: number; whatsapp: number }; onClose: () => void; onSave: (payload: { title: string; body: string; audience: MessageAudience; scheduledAt: string; groupId: string | null; segmentId: string | null }) => Promise<boolean> }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [form, setForm] = useState<{ title: string; body: string; audience: MessageAudience; scheduledAt: string; groupId: string | null; segmentId: string | null }>({ title: L("تذكير بتأكيد الحضور", "RSVP reminder"), body: L("يسعدنا وجودكم معنا. نرجو تأكيد حضوركم عبر رابط الدعوة عند أول فرصة.", "We would love to have you with us. Please confirm your attendance through the invitation link when you can."), audience: initialAudience, scheduledAt: "", groupId: initialGroupId, segmentId: initialSegmentId });
  const [state, setState] = useState<"idle" | "saving" | "error">("idle");
  const messageTemplates: Array<{ id: string; label: string; title: string; body: string; audience: MessageAudience }> = [
    { id: "first-invite", label: L("إرسال الدعوة", "Send invitation"), title: L("دعوتكم الخاصة", "Your personal invitation"), body: L("أهلًا {name}، يسعدنا أن تشاركونا فرحتنا. ستجدون كل تفاصيل المناسبة وتأكيد الحضور هنا: {link}", "Hello {name}, we would love you to celebrate with us. View the details and RSVP here: {link}"), audience: "unopened" },
    { id: "gentle-reminder", label: L("تذكير لطيف", "Gentle reminder"), title: L("تذكير بتأكيد الحضور", "RSVP reminder"), body: L("أهلًا {name}، نتمنى أن تكونوا بخير. عندما تسمح الفرصة، نرجو تأكيد حضوركم من خلال دعوتكم الخاصة: {link}", "Hello {name}, we hope you are well. When you have a moment, please RSVP through your personal invitation: {link}"), audience: "opened_pending" },
    { id: "confirmed-details", label: L("تفاصيل للمؤكدين", "Confirmed details"), title: L("ننتظركم بكل فرح", "We cannot wait to see you"), body: L("أهلًا {name}، سعداء بتأكيد حضوركم. يمكنكم الرجوع إلى الموعد والموقع في أي وقت من هنا: {link}", "Hello {name}, we are delighted you confirmed. You can revisit the date and location anytime here: {link}"), audience: "confirmed" },
  ];
  const recipients = getRecipientSummary(form.audience, form.groupId, form.segmentId);
  const submit = async () => {
    if (form.title.trim().length < 2 || form.body.trim().length < 5) return setState("error");
    setState("saving");
    if (!await onSave({ ...form, title: form.title.trim(), body: form.body.trim() })) setState("error");
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}><section className="create-modal message-modal" role="dialog" aria-modal="true" aria-labelledby="message-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("الرسائل والتذكيرات", "Messages & reminders")}</span><h2 id="message-title">{L("تجهيز رسالة مخصصة", "Prepare a targeted message")}</h2><p>{L("اختر نقطة بداية ثم خصّص النص. سيتم استبدال {name} و{link} لكل ضيف عند تجهيز واتساب.", "Choose a starting point, then tailor the copy. {name} and {link} are personalized when preparing WhatsApp.")}</p><div className="message-templates">{messageTemplates.map((template) => <button type="button" key={template.id} className={form.title === template.title && form.audience === template.audience ? "active" : ""} onClick={() => setForm({ ...form, title: template.title, body: template.body, audience: template.audience })}><span>✦</span><b>{template.label}</b><small>{audienceLabelsForModal(template.audience, locale)}</small></button>)}</div><div className="form-grid"><label className="wide">{L("عنوان الرسالة", "Message title")}<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus /></label><label className="wide">{L("نص الرسالة", "Message body")}<textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></label><label>{L("حالة المستلمين", "Recipient status")}<select value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value as MessageAudience })}><option value="pending">{L("بانتظار الرد", "Awaiting reply")} ({audienceCounts.pending})</option><option value="opened_pending">{L("فتحوا ولم يردوا", "Opened, no reply")} ({audienceCounts.opened_pending})</option><option value="unopened">{L("لم يفتحوا الدعوة", "Not opened")} ({audienceCounts.unopened})</option><option value="confirmed">{L("مؤكدو الحضور", "Confirmed")} ({audienceCounts.confirmed})</option><option value="maybe">{L("ربما يحضرون", "Maybe attending")} ({audienceCounts.maybe})</option><option value="declined">{L("المعتذرون", "Declined")} ({audienceCounts.declined})</option><option value="all">{L("كل الضيوف", "All guests")} ({audienceCounts.all})</option></select></label><label>{L("فئة المدعوين", "Guest group")}<select value={form.groupId ?? ""} onChange={(e) => setForm({ ...form, groupId: e.target.value || null })}><option value="">{L("كل الفئات", "All groups")}</option>{groups.map((group) => <option key={group.id} value={group.id}>{group.name} ({group.guestIds.length})</option>)}</select></label><label>{L("مرحلة المناسبة", "Event stage")}<select value={form.segmentId ?? ""} onChange={(e) => setForm({ ...form, segmentId: e.target.value || null })}><option value="">{L("كل المراحل", "All stages")}</option>{segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.title}</option>)}</select></label><label>{L("موعد متابعة مقترح — لا يرسل تلقائيًا", "Follow-up reminder — does not auto-send")}<input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></label></div>{state === "error" && <p className="form-error" role="alert">{L("أضف عنوانًا ونصًا واضحين ثم حاول مرة أخرى.", "Add a clear title and message, then try again.")}</p>}<div className="target-summary"><span>{L("الجمهور", "Audience")}</span><b>{form.groupId ? groups.find((group) => group.id === form.groupId)?.name : L("كل الفئات", "All groups")} · {form.segmentId ? segments.find((segment) => segment.id === form.segmentId)?.title : L("كل المراحل", "All stages")}</b><small>{L(`الجمهور الحالي ${recipients.total} ضيف، منهم ${recipients.whatsapp} جاهزون للمتابعة اليدوية عبر واتساب.`, `Current audience: ${recipients.total} guests; ${recipients.whatsapp} are ready for manual WhatsApp follow-up.`)}</small></div><div className="modal-actions"><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={state === "saving" || recipients.total === 0}>{state === "saving" ? L("جارٍ الحفظ…", "Saving…") : form.scheduledAt ? L("حفظ مع موعد متابعة ←", "Save with follow-up reminder →") : L("حفظ كمسودة ←", "Save as draft →")}</button></div></section></div>;
}

function audienceLabelsForModal(audience: MessageAudience, locale: Locale) {
  const labels: Record<MessageAudience, { ar: string; en: string }> = {
    all: { ar: "كل الضيوف", en: "All guests" }, pending: { ar: "بانتظار الرد", en: "Awaiting reply" }, confirmed: { ar: "مؤكدو الحضور", en: "Confirmed" }, unopened: { ar: "لم يفتحوا", en: "Not opened" }, opened_pending: { ar: "فتحوا ولم يردوا", en: "Opened, no reply" }, maybe: { ar: "ربما", en: "Maybe" }, declined: { ar: "المعتذرون", en: "Declined" },
  };
  return labels[audience][locale];
}

function WhatsAppQueueModal({ locale, message, recipients, invitationUrl, onClose }: { locale: Locale; message: MessageRecord; recipients: GuestRecord[]; invitationUrl: (guest?: GuestRecord) => string; onClose: () => void }) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const ready = recipients.filter((guest) => Boolean(whatsappNumber(guest.phone)) && Boolean(guest.inviteToken));
  const missing = recipients.length - ready.length;
  const personalize = (guest: GuestRecord) => {
    const link = invitationUrl(guest);
    let text = message.body.replaceAll("{name}", guest.name).replaceAll("{{name}}", guest.name).replaceAll("{link}", link).replaceAll("{{link}}", link);
    if (!message.body.includes("{link}") && !message.body.includes("{{link}}")) text = `${text}\n\n${link}`;
    return text;
  };
  const openWhatsApp = (guest: GuestRecord) => {
    const destination = whatsappNumber(guest.phone);
    window.open(`https://wa.me/${destination}?text=${encodeURIComponent(personalize(guest))}`, "_blank", "noopener,noreferrer");
    setCompletedIds((current) => current.includes(guest.id) ? current : [...current, guest.id]);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="create-modal whatsapp-queue-modal" role="dialog" aria-modal="true" aria-labelledby="queue-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("متابعة يدوية وآمنة", "Manual, controlled follow-up")}</span><h2 id="queue-title">{L("قائمة متابعة واتساب", "WhatsApp follow-up queue")}</h2><p>{L("افتح كل محادثة وراجع النص قبل الإرسال. وصال لا يرسل أي رسالة تلقائيًا.", "Open each conversation and review the copy before sending. Wisal never sends these messages automatically.")}</p><div className="queue-progress"><div><span>{L("جاهز للإرسال", "Ready")}</span><b>{ready.length}</b></div><div><span>{L("تم فتح محادثتهم", "Conversations opened")}</span><b>{completedIds.length}/{ready.length}</b></div>{missing > 0 && <div className="missing"><span>{L("ينقصهم رقم أو رابط", "Missing phone or link")}</span><b>{missing}</b></div>}</div><div className="queue-list">{ready.length ? ready.map((guest, index) => <article key={guest.id} className={completedIds.includes(guest.id) ? "done" : ""}><span>{completedIds.includes(guest.id) ? "✓" : String(index + 1).padStart(2, "0")}</span><div><b>{guest.name}</b><small dir="ltr">{guest.phone}</small></div><button type="button" onClick={() => openWhatsApp(guest)}>{completedIds.includes(guest.id) ? L("فتح مرة أخرى ↗", "Open again ↗") : L("فتح واتساب ↗", "Open WhatsApp ↗")}</button></article>) : <div className="empty-tool"><span>⌁</span><h3>{L("لا يوجد مستلمون جاهزون", "No recipients are ready")}</h3><p>{L("أضف رقم واتساب وتأكد من نشر الدعوة وإنشاء الرابط الخاص.", "Add WhatsApp numbers and make sure personal invitation links are active.")}</p></div>}</div><footer><small>{L("يتم تخصيص الاسم والرابط تلقائيًا عند فتح كل محادثة.", "The guest name and personal link are inserted when each chat opens.")}</small><button className="primary" onClick={onClose}>{L("إنهاء المتابعة", "Finish follow-up")}</button></footer></section></div>;
}

function SegmentModal({ locale, mode, segment, onClose, onSave, onDelete }: {
  locale: Locale;
  mode: "add" | "edit";
  segment?: EventSegmentRecord;
  onClose: () => void;
  onSave: (payload: Omit<EventSegmentRecord, "id" | "position">) => Promise<boolean>;
  onDelete: () => Promise<{ ok: boolean; error: string }>;
}) {
  const L = (arabic: string, english: string) => tr(locale, arabic, english);
  const localDate = (value?: string | null) => value ? new Date(value).toLocaleString("sv-SE", { timeZone: "Africa/Cairo" }).replace(" ", "T").slice(0, 16) : "";
  const [form, setForm] = useState({
    title: segment?.title ?? "",
    kind: segment?.kind ?? "ceremony" as EventSegmentRecord["kind"],
    startsAt: localDate(segment?.startsAt),
    endsAt: localDate(segment?.endsAt),
    venueName: segment?.venueName ?? "",
    city: segment?.city ?? L("القاهرة", "Cairo"),
    address: segment?.address ?? "",
    mapUrl: segment?.mapUrl ?? "",
  });
  const [state, setState] = useState<"idle" | "saving" | "deleting" | "error">("idle");
  const [error, setError] = useState("");
  const change = (field: keyof typeof form, value: string) => { setForm((current) => ({ ...current, [field]: value })); setState("idle"); setError(""); };
  const submit = async () => {
    if (!form.title.trim() || !form.startsAt || !form.venueName.trim() || !form.city.trim()) { setError(L("أكمل اسم المرحلة والموعد والمكان والمدينة.", "Complete the stage name, date, venue, and city.")); return setState("error"); }
    setState("saving");
    if (!await onSave({ ...form, endsAt: form.endsAt || null })) { setError(L("تعذر حفظ المرحلة. راجع البيانات وحاول مرة أخرى.", "The stage could not be saved. Review the details and try again.")); setState("error"); }
  };
  const remove = async () => {
    setState("deleting");
    const result = await onDelete();
    if (!result.ok) { setError(result.error); setState("error"); }
  };
  return <div className="modal-backdrop" role="presentation"><section className="create-modal segment-modal" role="dialog" aria-modal="true" aria-labelledby="segment-modal-title"><button className="modal-close" onClick={onClose} aria-label={L("إغلاق", "Close")}>×</button><span className="eyebrow"><i /> {L("الجدول والمواقع", "Schedule & locations")}</span><h2 id="segment-modal-title">{mode === "add" ? L("إضافة مرحلة جديدة", "Add a new stage") : L("تعديل المرحلة", "Edit stage")}</h2><p>{L("كل مرحلة لها موعد وموقع مستقل، ولن تظهر لاحقًا إلا للفئات المسموح لها.", "Each stage has its own time and location, and only appears to permitted guest groups.")}</p><div className="form-grid"><label>{L("اسم المرحلة", "Stage name")}<input value={form.title} onChange={(e) => change("title", e.target.value)} placeholder={L("مثل: مراسم الكنيسة", "For example: ceremony")} /></label><label>{L("نوع المرحلة", "Stage type")}<select value={form.kind} onChange={(e) => change("kind", e.target.value)}><option value="ceremony">{L("مراسم", "Ceremony")}</option><option value="reception">{L("استقبال", "Reception")}</option><option value="dinner">{L("عشاء", "Dinner")}</option><option value="party">{L("حفل", "Party")}</option><option value="session">{L("جلسة", "Session")}</option><option value="other">{L("أخرى", "Other")}</option></select></label><label>{L("موعد البداية", "Start time")}<input type="datetime-local" value={form.startsAt} onChange={(e) => change("startsAt", e.target.value)} /></label><label>{L("موعد النهاية — اختياري", "End time — optional")}<input type="datetime-local" value={form.endsAt} onChange={(e) => change("endsAt", e.target.value)} /></label><label>{L("اسم المكان", "Venue name")}<input value={form.venueName} onChange={(e) => change("venueName", e.target.value)} placeholder={L("اسم الكنيسة أو القاعة", "Ceremony or reception venue")} /></label><label>{L("المدينة", "City")}<input value={form.city} onChange={(e) => change("city", e.target.value)} /></label><label className="wide">{L("العنوان التفصيلي", "Full address")}<input value={form.address} onChange={(e) => change("address", e.target.value)} /></label><label className="wide">{L("رابط الخريطة", "Map link")}<input type="url" value={form.mapUrl} onChange={(e) => change("mapUrl", e.target.value)} placeholder="https://maps.google.com/..." /></label></div>{state === "error" && <p className="form-error" role="alert">{error}</p>}<div className={`modal-actions ${mode === "edit" ? "split" : ""}`}>{mode === "edit" && <button className="danger-button" onClick={() => void remove()} disabled={state === "saving" || state === "deleting"}>{state === "deleting" ? L("جارٍ الحذف…", "Deleting…") : L("حذف المرحلة", "Delete stage")}</button>}<div><button className="ghost" onClick={onClose}>{L("إلغاء", "Cancel")}</button><button className="primary" onClick={() => void submit()} disabled={state === "saving" || state === "deleting"}>{state === "saving" ? L("جارٍ الحفظ…", "Saving…") : L("حفظ المرحلة", "Save stage")}</button></div></div></section></div>;
}
