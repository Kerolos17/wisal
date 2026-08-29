"use client";
/* eslint-disable @next/next/no-img-element -- QR assets are private and require the caller's authenticated cookie. */

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Check, Clipboard, Copy, ExternalLink, Landmark, QrCode, WalletCards, X } from "lucide-react";
import { useWisalLocale } from "../use-wisal-locale";

type CheckoutPlan = { code: string; nameAr: string; nameEn: string; priceEgp: number; guestLimit: number | null; durationDays: number; featuresAr: string[]; featuresEn: string[] };
type PaymentDestination = { id: string; method: string; labelAr: string; labelEn: string; recipientName: string; accountIdentifier: string; bankName: string; instructionsAr: string; instructionsEn: string; paymentUrl: string; qrKey: string | null };

const methodIcon = (method: string) => method === "bank_transfer" ? Landmark : WalletCards;

export default function CheckoutClient({ plan, destinations, initialPaymentId = null }: { plan: CheckoutPlan; destinations: PaymentDestination[]; initialPaymentId?: string | null }) {
  const [locale] = useWisalLocale();
  const router = useRouter();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const idempotency = useRef(crypto.randomUUID());
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(destinations[0]?.method ?? "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(initialPaymentId);
  const [copied, setCopied] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const qrTriggerRef = useRef<HTMLButtonElement>(null);
  const qrCloseRef = useRef<HTMLButtonElement>(null);
  const wasQrOpen = useRef(false);
  const destination = destinations.find((item) => item.method === paymentMethod) ?? destinations[0];
  const planName = locale === "ar" ? plan.nameAr : plan.nameEn;

  useEffect(() => {
    if (!qrOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setQrOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    const frame = window.requestAnimationFrame(() => qrCloseRef.current?.focus());
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.cancelAnimationFrame(frame);
    };
  }, [qrOpen]);

  useEffect(() => {
    const hadBeenOpen = wasQrOpen.current;
    wasQrOpen.current = qrOpen;
    if (!qrOpen && hadBeenOpen) qrTriggerRef.current?.focus();
  }, [qrOpen]);

  const trapQrFocus = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key !== "Tab") return;
    const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])"))
      .filter((element) => !element.hasAttribute("hidden"));
    if (!focusable.length) { event.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  const copyDetails = async () => {
    if (!destination || !navigator.clipboard) return;
    await navigator.clipboard.writeText(destination.accountIdentifier);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const submit = async () => {
    if (!destination) { setMessage(L("لا توجد بيانات دفع مفعّلة حاليًا. تواصل مع الدعم.", "No payment destination is configured yet. Please contact support.")); setState("error"); return; }
    if (!receipt) { setMessage(L("ارفع صورة الإيصال أولًا", "Upload the receipt first")); setState("error"); return; }
    if (!payerName.trim()) { setMessage(L("أدخل اسم المودع", "Enter the payer name")); setState("error"); return; }
    setState("submitting");
    setMessage("");
    try {
      let activePaymentId = paymentId;
      if (!activePaymentId) {
        const createRes = await fetch("/api/payments", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planCode: plan.code, idempotencyKey: idempotency.current }) });
        if (createRes.status === 401) { router.push(`/auth/sign-in?returnTo=${encodeURIComponent(`/checkout?plan=${plan.code}`)}`); return; }
        if (!createRes.ok) { const data = await createRes.json().catch(() => ({})); throw new Error(data.error || L("تعذر بدء الطلب", "Could not start the request")); }
        const created = await createRes.json() as { payment: { id: string } };
        activePaymentId = created.payment.id;
        setPaymentId(activePaymentId);
      }
      const form = new FormData();
      form.append("receipt", receipt);
      form.append("paymentMethod", destination.method);
      form.append("amountPaid", String(plan.priceEgp));
      form.append("referenceNumber", referenceNumber.trim());
      form.append("payerName", payerName.trim());
      form.append("payerPhoneMasked", payerPhone.trim());
      const submitRes = await fetch(`/api/payments/${activePaymentId}/submit`, { method: "PATCH", body: form });
      if (!submitRes.ok) { const data = await submitRes.json().catch(() => ({})); throw new Error(data.error || L("تعذر إرسال الطلب", "Could not submit the request")); }
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L("حدث خطأ غير متوقع", "An unexpected error occurred"));
      setState("error");
    }
  };

  if (state === "success") return <section className="checkout-shell checkout-shell-success"><main className="checkout-success-card"><div className="checkout-success-mark"><Check aria-hidden="true" /></div><p className="checkout-success-state">{L("تم إرسال إثبات التحويل", "Transfer proof sent")}</p><h1>{L("وصل طلب الدفع", "Payment request received")}</h1><p className="checkout-success-copy">{L("تم حفظ إيصالك بأمان. راجع حالة الطلب لمعرفة قرار المراجعة فور صدوره.", "Your receipt is safely saved. Track this request to see the review decision as soon as it is made.")}</p><dl className="checkout-success-details"><div><dt>{L("الباقة", "Plan")}</dt><dd>{planName}</dd></div><div><dt>{L("الخطوة التالية", "What happens next")}</dt><dd>{L("مراجعة الإيصال وتفعيل الباقة عند الموافقة", "Receipt review, then plan activation on approval")}</dd></div></dl><div className="checkout-success-actions">{paymentId && <Link className="checkout-success-primary" href={`/checkout/${paymentId}/status`}>{L("تتبّع حالة الطلب", "Track request status")}<ArrowUpRight aria-hidden="true" /></Link>}<button className="checkout-success-secondary" onClick={() => router.push("/workspace")}>{L("الذهاب إلى مناسبتي", "Go to my event")}</button></div><p className="checkout-success-note">{L("لن تحتاج إلى إعادة رفع الإيصال ما لم يطلب منك فريق المراجعة ذلك.", "You will not need to upload the receipt again unless the review team asks for more information.")}</p></main></section>;

  return <section className="checkout-shell"><div className="checkout-layout">
    <aside className="checkout-plan"><p className="checkout-overline">{L("اشتراك وِصال", "Wisal subscription")}</p><h1>{planName}</h1><b className="checkout-price">{plan.priceEgp} {L("جنيه مصري", "EGP")}</b><p className="checkout-sub">{plan.guestLimit ? L(`حتى ${plan.guestLimit} ضيفًا`, `Up to ${plan.guestLimit} guests`) : L("ضيوف بلا حد", "Unlimited guests")} · {L(`${plan.durationDays} يومًا من تاريخ الموافقة`, `${plan.durationDays} days from approval`)}</p><ul className="checkout-features">{(locale === "ar" ? plan.featuresAr : plan.featuresEn).map((feature) => <li key={feature}><Check aria-hidden="true" />{feature}</li>)}</ul><p className="checkout-security"><Clipboard aria-hidden="true" />{L("الدفع يدوي وآمن. لا نخزن بيانات بطاقتك.", "Manual, secure transfer. We never collect card details.")}</p></aside>
    <main className="checkout-card"><header className="checkout-head"><h2>{L("أرسل التحويل ثم أرفق إثباته", "Transfer, then attach your proof")}</h2><p>{L("اختر وسيلة التحويل التي تناسبك، وانسخ تفاصيل الاستلام بدقة قبل رفع الإيصال.", "Choose your transfer method, copy the receiving details, then upload your proof.")}</p></header>
      {destinations.length ? <><fieldset className="checkout-methods"><legend>{L("وسيلة التحويل", "Transfer method")}</legend><div>{destinations.map((item) => { const Icon = methodIcon(item.method); const selected = item.method === destination?.method; return <button type="button" className={`checkout-method ${selected ? "selected" : ""}`} key={item.id} aria-pressed={selected} onClick={() => setPaymentMethod(item.method)}><Icon aria-hidden="true" /><span>{locale === "ar" ? item.labelAr : item.labelEn}</span></button>; })}</div></fieldset>
        {destination && <section className="checkout-destination" aria-live="polite"><div className="checkout-destination-heading"><span>{L("بيانات الاستلام", "Receiving details")}</span><strong>{locale === "ar" ? destination.labelAr : destination.labelEn}</strong></div><dl><div><dt>{L("اسم المستفيد", "Recipient")}</dt><dd>{destination.recipientName}</dd></div>{destination.bankName && <div><dt>{L("البنك", "Bank")}</dt><dd>{destination.bankName}</dd></div>}<div className="checkout-account"><dt>{L("رقم الحساب أو المحفظة", "Account or wallet number")}</dt><dd><code dir="ltr">{destination.accountIdentifier}</code><button type="button" onClick={() => void copyDetails()} aria-label={L("نسخ بيانات التحويل", "Copy transfer details")}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}{copied ? L("تم النسخ", "Copied") : L("نسخ", "Copy")}</button></dd></div></dl>{(destination.paymentUrl || destination.qrKey) && <div className="checkout-destination-actions">{destination.paymentUrl && <a className="checkout-pay-link" href={destination.paymentUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" />{L("فتح رابط الدفع", "Open payment link")}</a>}{destination.qrKey && <button ref={qrTriggerRef} className="checkout-qr-trigger" type="button" aria-haspopup="dialog" onClick={() => setQrOpen(true)}><QrCode aria-hidden="true" /><span><b>{L("اعرض رمز QR بحجم كبير", "Open large QR code")}</b><small>{L("للمسح من تطبيق الدفع", "Ready to scan in your payment app")}</small></span><ArrowUpRight aria-hidden="true" /></button>}</div>}{(locale === "ar" ? destination.instructionsAr : destination.instructionsEn) && <p>{locale === "ar" ? destination.instructionsAr : destination.instructionsEn}</p>}</section>}</> : <div className="checkout-empty" role="status"><h2>{L("بيانات التحويل غير مفعّلة", "Payment details are not configured")}</h2><p>{L("لن نطلب منك التحويل قبل أن يضيف فريق وِصال وسيلة دفع معتمدة.", "We will not ask you to transfer until Wisal adds an approved receiving method.")}</p></div>}
      <div className="checkout-form"><label>{L("المبلغ المطلوب (جنيه مصري)", "Amount due (EGP)")}<input type="number" value={plan.priceEgp} readOnly aria-describedby="checkout-amount-help" /><small id="checkout-amount-help">{L("المبلغ ثابت حسب الباقة المختارة", "This amount is fixed for the selected plan")}</small></label><label>{L("اسم المودع", "Payer name")}<input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder={L("الاسم الظاهر في التحويل", "Name shown on the transfer")} autoComplete="name" /></label><label>{L("رقم الهاتف (اختياري)", "Phone (optional)")}<input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} placeholder="01xxxxxxxxx" inputMode="tel" /></label><label>{L("رقم المرجع (اختياري)", "Reference number (optional)")}<input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} /></label><label className="checkout-file">{L("صورة الإيصال أو PDF", "Receipt image or PDF")}<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} /><small>{L("حتى 5 ميجابايت", "Up to 5 MB")}</small></label></div>
      {state === "error" && <p className="checkout-error" role="alert">{message}</p>}<button className="primary checkout-submit" disabled={state === "submitting" || !destination} onClick={() => void submit()}>{state === "submitting" ? L("جارٍ الإرسال…", "Submitting…") : L("إرسال طلب المراجعة", "Send for review")}</button>
    </main>
  </div>{qrOpen && destination?.qrKey && <div className="checkout-qr-dialog-backdrop" role="presentation" onMouseDown={() => setQrOpen(false)}><section className="checkout-qr-dialog" role="dialog" aria-modal="true" aria-labelledby="checkout-qr-title" aria-describedby="checkout-qr-description" onKeyDown={trapQrFocus} onMouseDown={(event) => event.stopPropagation()}><button ref={qrCloseRef} className="checkout-qr-close" type="button" onClick={() => setQrOpen(false)} aria-label={L("إغلاق رمز QR", "Close QR code")}><X aria-hidden="true" /></button><QrCode aria-hidden="true" /><h2 id="checkout-qr-title">{L("امسح رمز الدفع", "Scan payment QR")}</h2><p id="checkout-qr-description">{L("افتح تطبيق الدفع على هاتفك ثم امسح الرمز لإتمام التحويل.", "Open your payment app on your phone, then scan this code to complete the transfer.")}</p><img src={`/api/payment-destinations/${destination.method}/qr`} alt={L(`رمز QR للتحويل عبر ${destination.labelAr}`, `${destination.labelEn} transfer QR code`)} /></section></div>}</section>;
}
