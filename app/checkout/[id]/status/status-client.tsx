"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWisalLocale } from "../../../use-wisal-locale";

type PaymentStatus = "draft" | "pending_review" | "approved" | "rejected" | "needs_info" | "cancelled";

type Payment = {
  id: string;
  status: PaymentStatus;
  planCode: string;
  planNameSnapshot: string;
  durationDaysSnapshot: number;
  reviewedAt: string | null;
  updatedAt: string;
  rejectionReason: string | null;
  infoRequestReason: string | null;
} | null;

const STATUS_COPY: Record<PaymentStatus, { titleAr: string; titleEn: string; bodyAr: string; bodyEn: string }> = {
  draft: {
    titleAr: "الطلب مسودة",
    titleEn: "Request is a draft",
    bodyAr: "لم يُرسل الطلب بعد. أكمل رفع الإيصال لبدء المراجعة.",
    bodyEn: "The request has not been submitted yet. Upload the receipt to start the review.",
  },
  pending_review: {
    titleAr: "قيد المراجعة",
    titleEn: "Under review",
    bodyAr: "سنراجع الإيصال ونفعّل باقتك قريبًا. يتم تحديث الحالة تلقائيًا.",
    bodyEn: "We are reviewing your receipt and will activate your plan soon. This page refreshes automatically.",
  },
  approved: {
    titleAr: "تم تفعيل باقتك",
    titleEn: "Your plan is active",
    bodyAr: "باقتك مفعّلة الآن. يمكنك إنشاء دعوتك والاستمتاع بالمزايا.",
    bodyEn: "Your plan is active. You can now create your invitation and enjoy the benefits.",
  },
  rejected: {
    titleAr: "تم رفض الطلب",
    titleEn: "Request rejected",
    bodyAr: "تعذّر قبول الإيصال. راجع الملاحظة وأعد المحاولة من صفحة الدفع.",
    bodyEn: "The receipt could not be accepted. Review the note and try again from checkout.",
  },
  needs_info: {
    titleAr: "نحتاج معلومات إضافية",
    titleEn: "More information needed",
    bodyAr: "طلب المراجع معلومات إضافية. راجع الملاحظة وأعد إرسال الإيصال.",
    bodyEn: "The reviewer requested more information. Review the note and resubmit your receipt.",
  },
  cancelled: {
    titleAr: "تم إلغاء الطلب",
    titleEn: "Request cancelled",
    bodyAr: "لن تتم مراجعة هذا الطلب. يمكنك بدء طلب دفع جديد عند الحاجة.",
    bodyEn: "This request will not be reviewed. You can start a new payment request when you are ready.",
  },
};

const STATUS_LABEL: Record<PaymentStatus, { ar: string; en: string }> = {
  draft: { ar: "مسودة", en: "Draft" },
  pending_review: { ar: "قيد المراجعة", en: "Under review" },
  approved: { ar: "تم التفعيل", en: "Active" },
  rejected: { ar: "مرفوض", en: "Rejected" },
  needs_info: { ar: "معلومات مطلوبة", en: "Action needed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

export default function CheckoutStatusClient({ id }: { id: string }) {
  const [locale] = useWisalLocale();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [payment, setPayment] = useState<Payment>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const tr = (ar: string, en: string) => (locale === "ar" ? ar : en);
    const load = async () => {
      try {
        const res = await fetch(`/api/payments/${id}`, { cache: "no-store" });
        if (!res.ok) throw new Error("status request failed");
        const data = await res.json() as { payment: Payment };
        if (!active) return;
        setPayment(data.payment);
        setError("");
        if (data.payment && data.payment.status === "pending_review") {
          window.setTimeout(load, 5000);
        }
      } catch {
        if (active) {
          setError(tr("تعذر تحميل حالة الطلب. سنحاول مرة أخرى تلقائيًا.", "Could not load the request status. We will retry automatically."));
          window.setTimeout(load, 5000);
        }
      }
    };
    void load();
    return () => { active = false; };
  }, [id, locale]);

  if (error) {
    return (
      <section className="checkout-status-shell">
        <div className="checkout-status-frame">
          <StatusBrand locale={locale} />
          <main className="checkout-status-card checkout-status-card-error">
            <span className="checkout-status-symbol is-error" aria-hidden="true">!</span>
            <span className="checkout-status-eyebrow">{L("حالة الطلب", "REQUEST STATUS")}</span>
            <h1>{L("تعذر تحميل الحالة", "We could not load the status")}</h1>
            <p>{error}</p>
            <Link className="checkout-status-primary" href="/">{L("العودة للرئيسية", "Back to home")}</Link>
          </main>
        </div>
      </section>
    );
  }

  if (!payment) {
    return (
      <section className="checkout-status-shell">
        <div className="checkout-status-frame">
          <StatusBrand locale={locale} />
          <main className="checkout-status-card checkout-status-card-loading" aria-busy="true">
            <span className="checkout-status-spinner" aria-hidden="true" />
            <span className="checkout-status-eyebrow">{L("حالة الطلب", "REQUEST STATUS")}</span>
            <h1>{L("نحمّل حالة طلبك", "Loading your request")}</h1>
            <p>{L("لحظات ونظهر لك آخر تحديث.", "One moment while we fetch the latest update.")}</p>
          </main>
        </div>
      </section>
    );
  }

  const copy = STATUS_COPY[payment.status];
  const isApproved = payment.status === "approved";
  const isFinal = payment.status === "approved" || payment.status === "rejected" || payment.status === "cancelled";
  const canResume = payment.status === "draft" || payment.status === "needs_info";
  const checkoutHref = canResume ? `/checkout?plan=${encodeURIComponent(payment.planCode)}&paymentId=${encodeURIComponent(payment.id)}` : null;
  const statusLabel = STATUS_LABEL[payment.status];
  const progressState = isApproved ? 2 : payment.status === "rejected" || payment.status === "cancelled" ? 1 : payment.status === "draft" ? 0 : 1;
  const approvedAt = isApproved && payment.reviewedAt ? new Date(payment.reviewedAt) : null;
  const expiresAt = approvedAt ? new Date(approvedAt.getTime() + payment.durationDaysSnapshot * 24 * 60 * 60 * 1000) : null;
  const formatDate = (date: Date) => new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", { dateStyle: "long" }).format(date);

  return (
    <section className="checkout-status-shell">
      <div className="checkout-status-frame">
        <StatusBrand locale={locale} />
        <main className={`checkout-status-card checkout-status-card-${isApproved ? "approved" : isFinal ? "final" : "pending"}`}>
          <div className="checkout-status-heading">
            <span className={`checkout-status-symbol ${isApproved ? "is-success" : isFinal ? "is-error" : "is-pending"}`} aria-hidden="true">{isApproved ? "✓" : isFinal ? "!" : "…"}</span>
            <div className="checkout-status-label-row"><span className="checkout-status-eyebrow">{L("حالة طلب الدفع", "PAYMENT REQUEST")}</span><span className={`checkout-status-pill ${isApproved ? "is-success" : isFinal ? "is-error" : "is-pending"}`}>{L(statusLabel.ar, statusLabel.en)}</span></div>
            <h1>{L(copy.titleAr, copy.titleEn)}</h1>
            <p>{L(copy.bodyAr, copy.bodyEn)}</p>
          </div>
          <div className="checkout-status-progress" aria-label={L("مراحل طلب الدفع", "Payment request progress")}>
            {[L("تم الإرسال", "Submitted"), L("المراجعة", "Review"), L("التفعيل", "Activation")].map((step, index) => <div className={`checkout-status-step ${index < progressState ? "is-complete" : index === progressState ? "is-current" : ""}`} key={step}><span>{index < progressState ? "✓" : index + 1}</span><small>{step}</small></div>)}
          </div>
          {approvedAt && expiresAt ? <dl className="checkout-status-entitlement" aria-label={L("تفاصيل الاشتراك", "Subscription details")}><div><dt>{L("الباقة", "Plan")}</dt><dd>{payment.planNameSnapshot}</dd></div><div><dt>{L("بدأت في", "Started")}</dt><dd>{formatDate(approvedAt)}</dd></div><div><dt>{L("سارية حتى", "Active until")}</dt><dd>{formatDate(expiresAt)}</dd></div></dl> : null}
          {(payment.rejectionReason || payment.infoRequestReason) ? <div className="checkout-status-note"><span aria-hidden="true">i</span><p><b>{L("ملاحظة المراجع", "Reviewer note")}</b>{payment.rejectionReason || payment.infoRequestReason}</p></div> : null}
          <div className="checkout-status-actions">
            {isApproved
              ? <Link className="checkout-status-primary" href="/workspace">{L("الذهاب إلى مناسبتي", "Go to my event")}<span aria-hidden="true">→</span></Link>
              : canResume && checkoutHref
                ? <Link className="checkout-status-primary" href={checkoutHref}>{L("استكمال طلب الدفع", "Continue payment request")}<span aria-hidden="true">→</span></Link>
                : isFinal
                  ? <Link className="checkout-status-primary" href={`/checkout?plan=${encodeURIComponent(payment.planCode)}`}>{L("بدء طلب جديد", "Start a new request")}<span aria-hidden="true">→</span></Link>
                  : <span className="checkout-status-live"><i aria-hidden="true" />{L("يتم التحديث تلقائيًا", "Updates automatically")}</span>}
            <Link className="checkout-status-secondary" href="/">{L("العودة للرئيسية", "Back to home")}</Link>
          </div>
          <p className="checkout-status-footnote">{L("يمكنك ترك هذه الصفحة؛ سنحتفظ بطلبك ونحدّث حالته تلقائيًا.", "You can leave this page. We’ll keep your request and update its status automatically.")}</p>
        </main>
      </div>
    </section>
  );
}

function StatusBrand({ locale }: { locale: "ar" | "en" }) {
  return <header className="checkout-status-brand"><Link href="/" aria-label={locale === "ar" ? "وِصال - الرئيسية" : "Wisal - Home"}><span className="checkout-status-brand-mark">W</span><span><b>{locale === "ar" ? "وِصال" : "Wisal"}</b><small>{locale === "ar" ? "دعوتكم كما تخيلتموها" : "Invitations, beautifully yours"}</small></span></Link><span className="checkout-status-secure"><i aria-hidden="true" />{locale === "ar" ? "دفع يدوي آمن" : "Secure manual payment"}</span></header>;
}
