"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useWisalLocale } from "../../../use-wisal-locale";

type PaymentStatus = "draft" | "pending_review" | "approved" | "rejected" | "needs_info";

type Payment = {
  id: string;
  status: PaymentStatus;
  planCode: string;
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
        if (!res.ok) { setError(tr("تعذر تحميل حالة الطلب", "Could not load the request status")); return; }
        const data = await res.json() as { payment: Payment };
        if (!active) return;
        setPayment(data.payment);
        setError("");
        if (data.payment && (data.payment.status === "pending_review" || data.payment.status === "draft" || data.payment.status === "needs_info")) {
          window.setTimeout(load, 5000);
        }
      } catch {
        if (active) setError(tr("تعذر تحميل حالة الطلب", "Could not load the request status"));
      }
    };
    void load();
    return () => { active = false; };
  }, [id, locale]);

  if (error) {
    return (
      <section className="checkout-shell">
        <div className="checkout-card">
          <h1>Wisal</h1>
          <p className="checkout-error">{error}</p>
          <Link className="primary" href="/">{L("العودة للرئيسية", "Back to home")}</Link>
        </div>
      </section>
    );
  }

  if (!payment) {
    return (
      <section className="checkout-shell">
        <div className="checkout-card">
          <h1>Wisal</h1>
          <p>{L("جارٍ التحميل…", "Loading…")}</p>
        </div>
      </section>
    );
  }

  const copy = STATUS_COPY[payment.status];
  const isApproved = payment.status === "approved";
  const isFinal = payment.status === "approved" || payment.status === "rejected";

  return (
    <section className="checkout-shell">
      <div className={`checkout-card ${isApproved ? "success" : ""}`}>
        <span className={`checkout-icon ${isFinal ? (isApproved ? "" : "is-error") : "is-pending"}`}>{isApproved ? "✓" : isFinal ? "!" : "…"}</span>
        <h1>{L(copy.titleAr, copy.titleEn)}</h1>
        <p>{L(copy.bodyAr, copy.bodyEn)}</p>
        {(payment.rejectionReason || payment.infoRequestReason) ? <p className="checkout-note">{L("ملاحظة المراجع: ", "Reviewer note: ")}{payment.rejectionReason || payment.infoRequestReason}</p> : null}
        <div className="checkout-status-actions">
          {isApproved
            ? <Link className="primary" href="/workspace">{L("الذهاب إلى مناسبتي", "Go to my event")}</Link>
            : <Link className="primary" href={`/checkout?plan=${encodeURIComponent(payment.planCode)}&paymentId=${encodeURIComponent(payment.id)}`}>{L("العودة للدفع", "Back to checkout")}</Link>}
          <Link href="/">{L("الرئيسية", "Home")}</Link>
        </div>
      </div>
    </section>
  );
}
