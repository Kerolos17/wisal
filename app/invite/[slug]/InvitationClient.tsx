"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { CalendarDays, CalendarPlus, ChevronDown, Clock3, MapPin, Share2 } from "lucide-react";
import { useWisalLocale } from "@/app/use-wisal-locale";
import { resolveInvitationConcept } from "@/lib/invitation-concepts";

type InvitationData = {
  event: { id: string; brideName: string; groomName: string; eventDate: string; venue: string; city: string; mapUrl: string };
  invitation: { template: string; message: string; rsvpDeadline: string | null; accentColor: string; openingStyle: "envelope" | "card" | "curtain"; layoutStyle: "classic" | "story" | "cinematic"; showMessage: boolean; showCountdown: boolean; showSchedule: boolean; sectionOrder: string[]; rsvpEnabled: boolean; mealQuestionEnabled: boolean; maxPartySize: number; coverImageKey: string | null };
  guest: { name: string; inviteToken: string | null; status: "yes" | "maybe" | "pending" | "no"; partySize: number; meal: string } | null;
  segments: { id: string; title: string; startsAt: string; endsAt: string | null; venueName: string; city: string; address: string; mapUrl: string }[];
  segmentRsvps: { segmentId: string; status: "yes" | "maybe" | "pending" | "no"; partySize: number }[];
};

const copy = {
  ar: { privateInvite: "دعوة خاصة إلى", welcome: "أهلًا", special: "دعوة خاصة لكم", inside: "لحظة جميلة تنتظركم بالداخل", open: "افتح الدعوة", joy: "يسعدنا أن تشاركونا فرحتنا", scroll: "مرّر لتأكيد الحضور ↓", program: "برنامج دعوتكم", stages: "المراحل المدعوون إليها", stagesNote: "يعرض هذا الرابط فقط الأماكن والمواعيد المخصصة لكم.", map: "الخريطة ↗", rsvp: "تأكيد الحضور", confirmEach: "أكد حضورك لكل مرحلة", before: "يمكنك اختيار رد مختلف لكل جزء من المناسبة قبل", attend: "سأحضر", maybe: "ربما", decline: "أعتذر", party: "عدد الحضور", fullName: "الاسم الكامل", namePlaceholder: "اكتب اسمك", personalized: "تم تخصيص هذا الرابط لكم", meal: "تفضيل الطعام", regular: "عادي", vegetarian: "نباتي", send: "إرسال تأكيد الحضور ←", saving: "جارٍ حفظ الرد…", privacy: "⌁ بياناتك خاصة ولا تظهر إلا لصاحب الدعوة", closed: "انتهى موعد تأكيد الحضور", closedNote: "يمكنكم التواصل مباشرة مع أصحاب الدعوة إذا احتجتم إلى تعديل الرد.", thanks: "وصلنا ردّك، شكرًا لك", thanksNote: "سعداء بمشاركتك هذه اللحظة الجميلة.", invalidName: "اكتب اسمًا صحيحًا ثم حاول مرة أخرى.", saveError: "تعذر حفظ الرد. حاول مرة أخرى.", musicOn: "إيقاف الموسيقى", musicOff: "تشغيل موسيقى هادئة", saveDate: "حفظ الموعد", share: "مشاركة الدعوة", copied: "تم نسخ الرابط", shared: "تمت مشاركة الدعوة", saved: "تم حفظ الموعد", tagline: "دعوتكم… كما تخيلتموها" },
  en: { privateInvite: "A private invitation for", welcome: "Welcome", special: "A private invitation for you", inside: "A beautiful moment is waiting inside", open: "Open invitation", joy: "We would love you to share our joy", scroll: "Scroll to RSVP ↓", program: "Your invitation", stages: "The moments you are invited to", stagesNote: "This link only shows the places and times selected for you.", map: "Map ↗", rsvp: "RSVP", confirmEach: "Respond to each part", before: "You can choose a different response for every part before", attend: "Attending", maybe: "Maybe", decline: "Decline", party: "Party size", fullName: "Full name", namePlaceholder: "Enter your name", personalized: "This link is personalized for you", meal: "Meal preference", regular: "Regular", vegetarian: "Vegetarian", send: "Send RSVP →", saving: "Saving…", privacy: "⌁ Your details are only visible to the host", closed: "RSVP is now closed", closedNote: "Please contact the hosts directly if you need to change your response.", thanks: "Thank you, we received your reply", thanksNote: "We are delighted to share this beautiful moment with you.", invalidName: "Please enter a valid name and try again.", saveError: "We could not save your reply. Please try again.", musicOn: "Stop music", musicOff: "Play soft music", saveDate: "Save the date", share: "Share invitation", copied: "Link copied", shared: "Invitation shared", saved: "Date saved", tagline: "Invitations, beautifully yours" },
} as const;

type TemplateArt = "editorial" | "botanical" | "glass" | "royal" | "minimal" | "cinematic" | "coastal" | "arabic";

const publicTemplateArt: Record<string, TemplateArt> = {
  "قصيدة حب": "editorial",
  "أناقة التحرير": "editorial",
  "Élan Editorial": "editorial",
  "عهود ذهبية": "royal",
  "الوعد المُذهّب": "royal",
  "Gilded Promise": "royal",
  "حديقة الورد": "botanical",
  "وردة حالمة": "botanical",
  "Blush Botanica": "botanical",
  "نور الكاتدرائية": "royal",
  "الميثاق الملكي": "royal",
  "The Royal Chapel": "royal",
  "ليلة في الحديقة": "botanical",
  "حُلم الحديقة": "botanical",
  "Garden Reverie": "botanical",
  "نور القمر": "glass",
  "قمر زجاجي": "glass",
  "Glass Moon": "glass",
  "حكاية بيضاء": "minimal",
  "سُكون": "minimal",
  "Still": "minimal",
  "نسيم الساحل": "coastal",
  "عهود الساحل": "coastal",
  "Barefoot Vows": "coastal",
  "غروب الصحراء": "editorial",
  "صفحات الغروب": "editorial",
  "Sunlit Pages": "editorial",
  "حروفنا": "arabic",
  "حروف النور": "arabic",
  "Noor Monogram": "arabic",
  "ليلة سينمائية": "cinematic",
  "بعد الغروب": "cinematic",
  "After Dark": "cinematic",
  "وهج الغروب": "cinematic",
  "Afterglow Première": "cinematic",
  "ليلة مخملية": "cinematic",
  "العرض المخملي": "cinematic",
  "Velvet Première": "cinematic",
};

function escapeCalendarText(value: string) {
  return value.replace(/[\\;,\n]/g, (character) => character === "\n" ? "\\n" : `\\${character}`);
}

function calendarDate(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

export default function InvitationClient({ data }: { data: InvitationData }) {
  const { event, invitation, guest } = data;
  const eventDate = new Date(event.eventDate);
  const [name, setName] = useState(guest?.name ?? "");
  const [segmentAnswers, setSegmentAnswers] = useState<Record<string, { status: "yes" | "maybe" | "no"; partySize: number }>>(() => Object.fromEntries(data.segments.map((segment) => {
    const saved = data.segmentRsvps.find((response) => response.segmentId === segment.id);
    return [segment.id, { status: saved?.status && saved.status !== "pending" ? saved.status : guest?.status && guest.status !== "pending" ? guest.status : "yes", partySize: Math.min(invitation.maxPartySize, saved?.partySize ?? guest?.partySize ?? 1) }];
  })));
  const [meal, setMeal] = useState(guest?.meal && guest.meal !== "—" ? guest.meal : "عادي");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [openedAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [openingState, setOpeningState] = useState<"closed" | "opening" | "open">("closed");
  const [locale, setLocale] = useWisalLocale("lang");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [utilityFeedback, setUtilityFeedback] = useState<"idle" | "saved" | "copied" | "shared">("idle");
  const contentRef = useRef<HTMLElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambienceTimerRef = useRef<number | null>(null);
  const ar = locale === "ar";
  const t = copy[locale];
  const formatLocale = ar ? "ar-EG" : "en-GB";
  const dateFormatter = new Intl.DateTimeFormat(formatLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
  const timeFormatter = new Intl.DateTimeFormat(formatLocale, { hour: "numeric", minute: "2-digit", timeZone: "Africa/Cairo" });
  const deadlineFormatter = new Intl.DateTimeFormat(formatLocale, { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Cairo" });
  const coverUrl = invitation.coverImageKey ? `/api/media/${invitation.coverImageKey.split("/").map(encodeURIComponent).join("/")}` : null;
  const deadline = invitation.rsvpDeadline ? new Date(`${invitation.rsvpDeadline}T23:59:59+03:00`) : null;
  const rsvpClosed = Boolean(deadline && !Number.isNaN(deadline.getTime()) && openedAt > deadline.getTime());
  const deadlineLabel = deadline && !Number.isNaN(deadline.getTime()) ? deadlineFormatter.format(deadline) : invitation.rsvpDeadline;
  const templateArt = publicTemplateArt[invitation.template] ?? "editorial";
  const templateConcept = resolveInvitationConcept(invitation.template);
  const sectionOrder = Array.isArray(invitation.sectionOrder) && invitation.sectionOrder.length === 4 ? invitation.sectionOrder : ["message", "countdown", "schedule", "rsvp"];
  const secondsUntilEvent = Math.max(0, Math.floor((eventDate.getTime() - now) / 1000));
  const countdown = { days: Math.floor(secondsUntilEvent / 86400), hours: Math.floor((secondsUntilEvent % 86400) / 3600), minutes: Math.floor((secondsUntilEvent % 3600) / 60) };

  useEffect(() => {
    if (!guest?.inviteToken) return;
    void fetch("/api/invitation-open", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, inviteToken: guest.inviteToken }),
    });
  }, [event.id, guest?.inviteToken]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (ambienceTimerRef.current) window.clearInterval(ambienceTimerRef.current);
      void audioContextRef.current?.close();
    };
  }, []);

  useEffect(() => {
    const skipIntro = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpeningState("open");
    };
    window.addEventListener("keydown", skipIntro);
    return () => window.removeEventListener("keydown", skipIntro);
  }, []);

  const playChord = (context: AudioContext) => {
    const now = context.currentTime;
    [220, 277.18, 329.63].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency / (index === 0 ? 2 : 1);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.018, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 5.6);
    });
  };

  const toggleMusic = async () => {
    if (musicPlaying) {
      if (ambienceTimerRef.current) window.clearInterval(ambienceTimerRef.current);
      ambienceTimerRef.current = null;
      await audioContextRef.current?.close();
      audioContextRef.current = null;
      setMusicPlaying(false);
      return;
    }
    const context = new AudioContext();
    audioContextRef.current = context;
    await context.resume();
    playChord(context);
    ambienceTimerRef.current = window.setInterval(() => playChord(context), 5600);
    setMusicPlaying(true);
  };

  const saveDate = () => {
    const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Wisal//Invitation//EN",
      "BEGIN:VEVENT",
      `UID:${event.id}@wisal.invite`,
      `DTSTAMP:${calendarDate(new Date())}`,
      `DTSTART:${calendarDate(eventDate)}`,
      `DTEND:${calendarDate(end)}`,
      `SUMMARY:${escapeCalendarText(`${event.brideName} & ${event.groomName}`)}`,
      `LOCATION:${escapeCalendarText(`${event.venue}, ${event.city}`)}`,
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${event.brideName}-${event.groomName}-save-the-date.ics`.replace(/[^a-z0-9\-_.]+/gi, "-");
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setUtilityFeedback("saved");
  };

  const shareInvitation = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${event.brideName} & ${event.groomName}`, text: t.joy, url });
        setUtilityFeedback("shared");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        setUtilityFeedback("copied");
      }
    } catch {
      setUtilityFeedback("idle");
    }
  };

  const openInvitation = () => {
    if (openingState !== "closed") return;
    setOpeningState("opening");
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 850;
    window.setTimeout(() => {
      setOpeningState("open");
      window.requestAnimationFrame(() => contentRef.current?.focus());
    }, duration);
  };

  const submit = async () => {
    if (name.trim().length < 2) {
      setErrorMessage(t.invalidName);
      return setState("error");
    }
    setState("saving");
    setErrorMessage("");
    const responses = data.segments.map((segment) => ({ segmentId: segment.id, ...segmentAnswers[segment.id] }));
    const overallStatus: "yes" | "maybe" | "no" = responses.some((response) => response.status === "yes") ? "yes" : responses.some((response) => response.status === "maybe") ? "maybe" : "no";
    const overallPartySize = Math.max(1, ...responses.filter((response) => response.status === "yes").map((response) => response.partySize));
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, inviteToken: guest?.inviteToken, name, status: overallStatus, partySize: overallStatus === "yes" ? overallPartySize : 1, meal: overallStatus === "yes" && invitation.mealQuestionEnabled ? meal : "—", segmentResponses: responses }),
    });
    if (response.ok) {
      setState("done");
      return;
    }
    const result = await response.json().catch(() => null) as { error?: string } | null;
    setErrorMessage(result?.error || t.saveError);
    setState("error");
  };

  const sectionNodes = {
    message: invitation.showMessage ? <section className="invite-message"><span className="eyebrow"><i /> {ar ? "كلمة من القلب" : "A note from the heart"}</span><p>{invitation.message}</p></section> : null,
    countdown: invitation.showCountdown ? <section className="countdown-card"><span className="eyebrow"><i /> {ar ? "نلتقي قريبًا" : "Counting down"}</span><h2>{ar ? "باقي على الاحتفال" : "Until the celebration"}</h2><div>{[[countdown.days, ar ? "يوم" : "Days"], [countdown.hours, ar ? "ساعة" : "Hours"], [countdown.minutes, ar ? "دقيقة" : "Minutes"]].map(([value, label]) => <span key={String(label)}><b>{String(value).padStart(2, "0")}</b><small>{label}</small></span>)}</div></section> : null,
    schedule: invitation.showSchedule ? <section className="invite-schedule"><span className="eyebrow"><i /> {t.program}</span><h2>{t.stages}</h2><p>{t.stagesNote}</p><div className="event-details">{data.segments.map((segment, index) => { const date = new Date(segment.startsAt); return <article key={segment.id}><span className="segment-number">{String(index + 1).padStart(2, "0")}</span><span><small>{dateFormatter.format(date)}</small><b>{segment.title}</b><p>{timeFormatter.format(date)} · {segment.venueName}، {segment.city}</p>{segment.address && <p>{segment.address}</p>}</span>{segment.mapUrl && <a href={segment.mapUrl} target="_blank" rel="noreferrer">{t.map}</a>}</article>; })}</div></section> : null,
    rsvp: invitation.rsvpEnabled ? <section className="rsvp-card" id="invitation-rsvp">{rsvpClosed ? <div className="rsvp-success rsvp-closed" aria-live="polite"><span>◷</span><h2>{t.closed}</h2><p>{t.closedNote}</p></div> : state === "done" ? <div className="rsvp-success" aria-live="polite"><span>✓</span><h2>{t.thanks}</h2><p>{t.thanksNote}</p></div> : <><span className="eyebrow"><i /> {t.rsvp}</span><h2>{t.confirmEach}</h2><p>{t.before} {deadlineLabel}</p><div className="rsvp-progress" aria-label={ar ? `${data.segments.length} مراحل للحضور` : `${data.segments.length} attendance moments`}><span>{String(data.segments.length).padStart(2, "0")}</span><small>{ar ? "مراحل يمكنكم الرد عليها بشكل مستقل" : "moments you can respond to independently"}</small></div><div className="segment-rsvp-list">{data.segments.map((segment, index) => { const response = segmentAnswers[segment.id]; return <section key={segment.id}><div className="segment-rsvp-heading"><span>{String(index + 1).padStart(2, "0")}</span><div><b>{segment.title}</b><small>{segment.venueName} · {timeFormatter.format(new Date(segment.startsAt))}</small></div></div><div className="segment-rsvp-options" role="group" aria-label={segment.title}>{[["yes", t.attend], ["maybe", t.maybe], ["no", t.decline]].map(([value, label]) => <button key={value} type="button" aria-pressed={response?.status === value} className={`${value} ${response?.status === value ? "selected" : ""}`} onClick={() => setSegmentAnswers((current) => ({ ...current, [segment.id]: { status: value as "yes" | "maybe" | "no", partySize: current[segment.id]?.partySize ?? 1 } }))}>{label}</button>)}</div>{response?.status === "yes" && <label>{t.party}<select value={response.partySize} onChange={(event) => setSegmentAnswers((current) => ({ ...current, [segment.id]: { ...current[segment.id], partySize: Number(event.target.value) } }))}>{Array.from({ length: invitation.maxPartySize }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label>}</section>; })}</div><div className="guest-form"><label>{t.fullName}<input value={name} onChange={(e) => { setName(e.target.value); setState("idle"); setErrorMessage(""); }} placeholder={t.namePlaceholder} aria-invalid={state === "error"} readOnly={Boolean(guest)} />{guest && <small className="personalized-note">{t.personalized}</small>}</label>{Object.values(segmentAnswers).some((response) => response.status === "yes") && invitation.mealQuestionEnabled && <label>{t.meal}<select value={meal} onChange={(e) => setMeal(e.target.value)}><option value="عادي">{t.regular}</option><option value="نباتي">{t.vegetarian}</option></select></label>}</div>{state === "error" && <p className="form-error" role="alert">{errorMessage}</p>}<button className="primary wide-button invite-primary-action" onClick={() => void submit()} disabled={state === "saving"}>{state === "saving" ? t.saving : t.send}</button><small className="privacy-note">{t.privacy}</small></>}</section> : null,
  };

  return (
    <>
      {openingState !== "open" && <section dir={ar ? "rtl" : "ltr"} className={`invite-opening opening-mode-${invitation.openingStyle} opening-theme-${templateArt} opening-concept-${templateConcept} ${openingState === "opening" ? "is-opening" : ""}`} aria-label={t.open}>
        <button className="invite-locale-control" onClick={() => setLocale(ar ? "en" : "ar")}>{ar ? "EN" : "عربي"}</button>
        <button className="opening-skip" type="button" onClick={() => setOpeningState("open")}>{ar ? "تخطي المقدمة" : "Skip intro"}</button>
        <div className="curtain-panel curtain-right" /><div className="curtain-panel curtain-left" />
        <div className="opening-ornament"><Image src="/brand/wisal-monogram-64.png" width={64} height={64} alt="" unoptimized /></div>
        <div className="opening-envelope" aria-hidden="true"><span className="envelope-shadow" /><span className="envelope-liner" /><span className="envelope-letter"><small>{guest ? guest.name : ar ? "بكل الحب" : "With love"}</small><strong>{event.brideName}<i>&</i>{event.groomName}</strong><b /></span><span className="envelope-flap" /><span className="envelope-seal"><Image src="/brand/wisal-monogram-64.png" width={40} height={40} alt="" unoptimized /></span></div>
        <div className="opening-card" aria-hidden="true"><small>{guest ? `${t.privateInvite} ${guest.name}` : t.special}</small><strong>{event.brideName} <i>&</i> {event.groomName}</strong><span>❦</span></div>
        <div className="opening-copy"><small>{guest ? `${t.welcome} ${guest.name}` : t.special}</small><h1>{event.brideName} <span>&</span> {event.groomName}</h1><p>{t.inside}</p><button className="opening-action" type="button" onClick={openInvitation}>{t.open} <span>{ar ? "←" : "→"}</span></button><em>{ar ? "تجربة قصيرة ومناسبة للجوال" : "A short, mobile-friendly experience"}</em></div>
      </section>}
    <main ref={contentRef} tabIndex={-1} dir={ar ? "rtl" : "ltr"} lang={locale} className={`public-invite invite-${invitation.accentColor} guest-template-${templateArt} invite-concept-${templateConcept} layout-${invitation.layoutStyle} ${openingState === "open" ? "invite-revealed" : ""}`}>
      <div className="invite-controls"><button onClick={() => setLocale(ar ? "en" : "ar")} aria-label={ar ? "Switch to English" : "التبديل إلى العربية"}>{ar ? "EN" : "عربي"}</button><button onClick={() => void toggleMusic()} aria-pressed={musicPlaying}><span>{musicPlaying ? "Ⅱ" : "♪"}</span>{musicPlaying ? t.musicOn : t.musicOff}</button></div>
      {(["editorial", "botanical", "cinematic"] as TemplateArt[]).includes(templateArt) ? <section className={`signature-invite-hero signature-${templateArt} concept-${templateConcept} ${coverUrl ? "with-cover" : ""}`} style={coverUrl ? { "--guest-photo": `url(${coverUrl})` } as CSSProperties : undefined}>
        <div className="signature-copy">
          <Image className="signature-monogram" src="/brand/wisal-monogram-64.png" width={56} height={56} alt="" unoptimized />
          <small className="signature-kicker">{guest ? `${t.privateInvite} ${guest.name}` : ar ? "نحتفل بحبنا" : "We’re getting married"}</small>
          <h1><span>{event.brideName}</span><i>&</i><span>{event.groomName}</span></h1>
          <p>{invitation.message || (ar ? "كل قصة حب جميلة، وقصتنا هي المفضلة لدينا." : "Every love story is beautiful, but ours is our favourite.")}</p>
          <div className="signature-details">
            <article><CalendarDays aria-hidden="true" /><span><b>{dateFormatter.format(eventDate)}</b><small>{ar ? "التاريخ" : "Date"}</small></span></article>
            <article><Clock3 aria-hidden="true" /><span><b>{timeFormatter.format(eventDate)}</b><small>{ar ? "الوقت" : "Time"}</small></span></article>
            <article><MapPin aria-hidden="true" /><span><b>{event.venue}</b><small>{event.city}</small></span></article>
          </div>
          {invitation.showCountdown && <div className="signature-countdown">{[[countdown.days, ar ? "يوم" : "Days"], [countdown.hours, ar ? "ساعة" : "Hours"], [countdown.minutes, ar ? "دقيقة" : "Minutes"]].map(([value, label]) => <span key={String(label)}><b>{String(value).padStart(2, "0")}</b><small>{label}</small></span>)}</div>}
          {invitation.rsvpEnabled && <button className="signature-rsvp" type="button" onClick={() => document.getElementById("invitation-rsvp")?.scrollIntoView({ behavior: "smooth" })}>{t.rsvp} <span>{ar ? "←" : "→"}</span></button>}
          <div className="invitation-utilities" aria-live="polite"><button type="button" onClick={saveDate}><CalendarPlus aria-hidden="true" />{t.saveDate}</button><button type="button" onClick={() => void shareInvitation()}><Share2 aria-hidden="true" />{utilityFeedback === "copied" ? t.copied : utilityFeedback === "shared" ? t.shared : t.share}</button>{utilityFeedback !== "idle" && <small>{utilityFeedback === "saved" ? t.saved : utilityFeedback === "copied" ? t.copied : t.shared}</small>}</div>
        </div>
        <button className="signature-scroll" type="button" aria-label={t.scroll} onClick={() => contentRef.current?.querySelector(".guest-content")?.scrollIntoView({ behavior: "smooth" })}><ChevronDown aria-hidden="true" /></button>
      </section> : <section className={`guest-cover image-treatment-${templateArt} concept-${templateConcept} ${coverUrl ? "with-cover" : ""}`} style={coverUrl ? { "--guest-photo": `url(${coverUrl})` } as CSSProperties : undefined}>
        <span className="guest-flower">❦</span><small>{guest ? `${t.privateInvite} ${guest.name}` : t.joy}</small><h1>{event.brideName} <b>&</b> {event.groomName}</h1><div className="guest-date"><span><b>{dateFormatter.format(eventDate)}</b><small>{timeFormatter.format(eventDate)}</small></span><i /><span><b>{event.venue}</b><small>{event.city}</small></span></div><div className="invitation-utilities" aria-live="polite"><button type="button" onClick={saveDate}><CalendarPlus aria-hidden="true" />{t.saveDate}</button><button type="button" onClick={() => void shareInvitation()}><Share2 aria-hidden="true" />{utilityFeedback === "copied" ? t.copied : utilityFeedback === "shared" ? t.shared : t.share}</button>{utilityFeedback !== "idle" && <small>{utilityFeedback === "saved" ? t.saved : utilityFeedback === "copied" ? t.copied : t.shared}</small>}</div><div className="scroll-hint">{t.scroll}</div>
      </section>}
      <div className="guest-content">{sectionOrder.map((section) => sectionNodes[section as keyof typeof sectionNodes])}</div>
      <footer className="invite-footer"><Image src="/brand/wisal-monogram-64.png" width={36} height={36} alt="" unoptimized /><strong>{ar ? "وِصال" : "Wisal"}</strong><span>{t.tagline}</span><nav><a href="/privacy">{ar ? "الخصوصية" : "Privacy"}</a><a href="/terms">{ar ? "الشروط" : "Terms"}</a></nav></footer>
    </main>
    </>
  );
}
