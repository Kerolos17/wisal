"use client";

import { Bell, CheckCircle2, Headphones, Send } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Locale = "ar" | "en";
type Ticket = { id: string; subject: string; message: string; category: string; priority: string; status: string; resolution: string; createdAt: string; updatedAt: string };
type Notification = { id: string; kind: string; titleAr: string; titleEn: string; bodyAr: string; bodyEn: string; readAt: string | null; createdAt: string };

export default function AccountCenter({ locale, mode, eventId }: { locale: Locale; mode: "notifications" | "support"; eventId?: string }) {
  const L = (ar: string, en: string) => locale === "ar" ? ar : en;
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "saving" | "error">("loading");
  const [form, setForm] = useState({ subject: "", message: "", category: "technical", priority: "normal" });

  const load = useCallback(async () => {
    setState("loading");
    const response = await fetch(mode === "support" ? "/api/support-tickets" : "/api/notifications", { cache: "no-store" });
    if (!response.ok) return setState("error");
    const result = await response.json() as { tickets?: Ticket[]; notifications?: Notification[] };
    setTickets(result.tickets ?? []); setNotifications(result.notifications ?? []); setState("ready");
  }, [mode]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  const createTicket = async () => {
    if (form.subject.trim().length < 4 || form.message.trim().length < 10) return setState("error");
    setState("saving");
    const response = await fetch("/api/support-tickets", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...form, eventId: eventId || null }) });
    if (!response.ok) return setState("error");
    setForm({ subject: "", message: "", category: "technical", priority: "normal" });
    await load();
  };
  const markAllRead = async () => {
    setState("saving");
    const response = await fetch("/api/notifications", { method: "PATCH" });
    if (!response.ok) return setState("error");
    const result = await response.json() as { notifications: Notification[] };
    setNotifications(result.notifications); setState("ready");
  };
  const statusLabel = (status: string) => ({ open: L("مفتوحة", "Open"), in_progress: L("قيد المعالجة", "In progress"), resolved: L("تم الحل", "Resolved"), closed: L("مغلقة", "Closed") } as Record<string, string>)[status] ?? status;

  if (state === "loading") return <section className="tool-panel account-center-state"><span /><p>{L("جارٍ تحميل بياناتك…", "Loading your account data…")}</p></section>;

  if (mode === "notifications") return <section className="tool-panel account-center">
    <div className="panel-toolbar"><div><h2>{L("مركز الإشعارات", "Notification center")}</h2><p>{L("تحديثات الدعوة والدعم في مكان واحد.", "Invitation and support updates in one place.")}</p></div>{notifications.some((item) => !item.readAt) && <button className="ghost" onClick={() => void markAllRead()} disabled={state === "saving"}><CheckCircle2 aria-hidden="true" /> {L("تحديد الكل كمقروء", "Mark all as read")}</button>}</div>
    <div className="notification-list">{notifications.length ? notifications.map((item) => <article key={item.id} className={item.readAt ? "read" : "unread"}><span><Bell aria-hidden="true" /></span><div><b>{locale === "ar" ? item.titleAr : item.titleEn}</b><p>{locale === "ar" ? item.bodyAr : item.bodyEn}</p><small>{new Date(item.createdAt).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}</small></div>{!item.readAt && <i>{L("جديد", "New")}</i>}</article>) : <div className="empty-tool"><Bell aria-hidden="true" /><h3>{L("لا توجد إشعارات بعد", "No notifications yet")}</h3><p>{L("ستظهر هنا تحديثات الدعوة وطلبات الدعم.", "Invitation and support updates will appear here.")}</p></div>}</div>
  </section>;

  return <div className="support-layout">
    <section className="tool-panel support-form"><div className="panel-toolbar"><div><h2>{L("طلب دعم جديد", "New support request")}</h2><p>{L("صف المشكلة بوضوح وسنتابعها من نفس اللوحة.", "Describe the issue and track it from this dashboard.")}</p></div><Headphones aria-hidden="true" /></div><div className="form-grid"><label className="wide">{L("عنوان الطلب", "Subject")}<input value={form.subject} onChange={(event) => { setForm({ ...form, subject: event.target.value }); setState("ready"); }} placeholder={L("مثال: مشكلة في نشر الدعوة", "Example: invitation publishing issue")} /></label><label>{L("القسم", "Category")}<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option value="technical">{L("مشكلة تقنية", "Technical")}</option><option value="invitation">{L("تصميم الدعوة", "Invitation")}</option><option value="guests">{L("الضيوف والردود", "Guests & RSVP")}</option><option value="account">{L("الحساب", "Account")}</option><option value="billing">{L("الباقات والفواتير", "Plans & billing")}</option><option value="other">{L("أخرى", "Other")}</option></select></label><label>{L("الأولوية", "Priority")}<select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value })}><option value="normal">{L("عادية", "Normal")}</option><option value="high">{L("مرتفعة", "High")}</option><option value="urgent">{L("عاجلة", "Urgent")}</option></select></label><label className="wide">{L("تفاصيل المشكلة", "Issue details")}<textarea value={form.message} onChange={(event) => { setForm({ ...form, message: event.target.value }); setState("ready"); }} placeholder={L("اكتب الخطوات التي أدت للمشكلة وما الذي ظهر أمامك…", "Describe the steps that led to the issue and what appeared…")} /></label></div>{state === "error" && <p className="form-error" role="alert">{L("تحقق من العنوان والتفاصيل ثم حاول مرة أخرى.", "Check the subject and details, then try again.")}</p>}<button className="primary support-submit" onClick={() => void createTicket()} disabled={state === "saving"}><Send aria-hidden="true" /> {state === "saving" ? L("جارٍ الإرسال…", "Sending…") : L("إرسال طلب الدعم", "Send support request")}</button></section>
    <section className="tool-panel"><div className="panel-toolbar"><div><h2>{L("طلباتك السابقة", "Your support requests")}</h2><p>{L("الحالة وآخر رد من فريق وِصال.", "Status and latest response from Wisal support.")}</p></div></div><div className="ticket-list">{tickets.length ? tickets.map((ticket) => <article key={ticket.id}><header><span className={`ticket-status ${ticket.status}`}>{statusLabel(ticket.status)}</span><small>{new Date(ticket.createdAt).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-GB")}</small></header><h3>{ticket.subject}</h3><p>{ticket.message}</p>{ticket.resolution && <div><b>{L("رد فريق الدعم", "Support response")}</b><p>{ticket.resolution}</p></div>}</article>) : <div className="empty-tool"><Headphones aria-hidden="true" /><h3>{L("لا توجد طلبات دعم", "No support requests")}</h3><p>{L("عند إرسال أول طلب سيظهر هنا مع حالته.", "Your first request and its status will appear here.")}</p></div>}</div></section>
  </div>;
}
