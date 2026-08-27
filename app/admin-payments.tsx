"use client";

import { useEffect, useState } from "react";

type Locale = "ar" | "en";

type AdminPayment = {
  id: string;
  planCode: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "info_requested";
  planNameSnapshot: string | null;
  priceEgpSnapshot: number | null;
  currency: string;
  guestLimitSnapshot: number | null;
  paymentMethod: string | null;
  payerName: string | null;
  referenceNumber: string | null;
  hasReceipt: boolean;
  rejectionReason: string | null;
  infoRequestReason: string | null;
  adminNotes: string | null;
  statusVersion: number;
  submittedAt: string | null;
  createdAt: string;
};

const statusLabel = (locale: Locale, status: AdminPayment["status"]) => {
  const map: Record<AdminPayment["status"], [string, string]> = {
    draft: ["مسودة", "Draft"],
    pending_review: ["بانتظار المراجعة", "Pending review"],
    approved: ["معتمد", "Approved"],
    rejected: ["مرفوض", "Rejected"],
    info_requested: ["معلومات مطلوبة", "Info requested"],
  };
  const [ar, en] = map[status];
  return locale === "ar" ? ar : en;
};

function PaymentCard({ locale, payment, busy, onAct }: {
  locale: Locale;
  payment: AdminPayment;
  busy: boolean;
  onAct: (action: "approve" | "reject" | "request-info", statusVersion: number, reason?: string) => void;
}) {
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [reason, setReason] = useState("");
  const canReview = payment.status === "pending_review" || payment.status === "info_requested";
  const money = `${payment.priceEgpSnapshot ?? 0} ${payment.currency}`;
  const submitted = payment.submittedAt ?? payment.createdAt;

  return (
    <article className="admin-payment-card">
      <header>
        <div>
          <b>{payment.planNameSnapshot || payment.planCode}</b>
          <small>{money}{payment.guestLimitSnapshot ? ` · ${L(`حتى ${payment.guestLimitSnapshot} ضيف`, `up to ${payment.guestLimitSnapshot} guests`)}` : ""}</small>
        </div>
        <span className={`payment-status ${payment.status}`}>{statusLabel(locale, payment.status)}</span>
      </header>
      <dl className="admin-payment-meta">
        <div><dt>{L("المُودِع", "Payer")}</dt><dd>{payment.payerName || "—"}</dd></div>
        <div><dt>{L("المرجع", "Reference")}</dt><dd>{payment.referenceNumber || "—"}</dd></div>
        <div><dt>{L("الطريقة", "Method")}</dt><dd>{payment.paymentMethod || "—"}</dd></div>
        <div><dt>{L("أُرسلت", "Submitted")}</dt><dd>{new Date(submitted).toLocaleString(locale === "ar" ? "ar-EG" : "en-GB")}</dd></div>
      </dl>
      {payment.hasReceipt && (
        <a className="admin-receipt-link" href={`/api/admin/payments/${payment.id}/receipt`} target="_blank" rel="noreferrer">
          {L("عرض الإيصال", "View receipt")}
        </a>
      )}
      {payment.rejectionReason && <p className="admin-payment-note rejected">{L("سبب الرفض: ", "Rejection reason: ")}{payment.rejectionReason}</p>}
      {payment.infoRequestReason && <p className="admin-payment-note info">{L("معلومات مطلوبة: ", "Info requested: ")}{payment.infoRequestReason}</p>}
      {payment.adminNotes && <p className="admin-payment-note">{payment.adminNotes}</p>}
      {canReview && (
        <div className="admin-payment-actions">
          <input
            className="admin-reason-input"
            value={reason}
            placeholder={L("سبب الرفض أو طلب المعلومات (مطلوب للإجراءين الآخرين)", "Reject / info reason (required for those actions)")}
            onChange={(event) => setReason(event.target.value)}
          />
          <div className="admin-payment-buttons">
            <button className="admin-approve" disabled={busy} onClick={() => onAct("approve", payment.statusVersion)}>{L("اعتماد", "Approve")}</button>
            <button className="admin-reject" disabled={busy || !reason.trim()} onClick={() => onAct("reject", payment.statusVersion, reason.trim())}>{L("رفض", "Reject")}</button>
            <button className="admin-request-info" disabled={busy || !reason.trim()} onClick={() => onAct("request-info", payment.statusVersion, reason.trim())}>{L("طلب معلومات", "Request info")}</button>
          </div>
        </div>
      )}
    </article>
  );
}

export default function AdminPayments({ locale }: { locale: Locale }) {
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [payments, setPayments] = useState<AdminPayment[] | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  const load = async () => {
    const response = await fetch("/api/admin/payments", { cache: "no-store" });
    if (!response.ok) { setError(L("تعذر تحميل طلبات الدفع", "Could not load payment requests")); setPayments([]); return; }
    const data = await response.json() as { payments: AdminPayment[] };
    setPayments(data.payments);
    setError("");
  };

  useEffect(() => {
    let active = true;
    const errorText = locale === "ar" ? "تعذر تحميل طلبات الدفع" : "Could not load payment requests";
    void fetch("/api/admin/payments", { cache: "no-store" })
      .then(async (response) => {
        if (!active) return;
        if (!response.ok) { setError(errorText); setPayments([]); return; }
        const data = await response.json() as { payments: AdminPayment[] };
        setPayments(data.payments);
        setError("");
      })
      .catch(() => { if (active) { setError(errorText); setPayments([]); } });
    return () => { active = false; };
  }, [locale]);

  const act = async (action: "approve" | "reject" | "request-info", id: string, statusVersion: number, reason?: string) => {
    setBusyId(id);
    const response = await fetch(`/api/admin/payments/${id}/${action}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(reason ? { statusVersion, reason } : { statusVersion }),
    });
    setBusyId("");
    if (response.ok) {
      const data = await response.json() as { payment: AdminPayment };
      setPayments((prev) => (prev ? prev.map((item) => (item.id === id ? data.payment : item)) : prev));
    } else {
      const data = await response.json().catch(() => ({})) as { error?: string };
      setError(data.error || L("تعذر تنفيذ الإجراء", "Could not perform action"));
    }
  };

  if (payments === null) {
    return <section className="admin-panel"><div className="admin-panel-title"><div><h2>{L("طلبات الدفع", "Payment requests")}</h2></div></div><p className="admin-empty">{L("جارٍ التحميل…", "Loading…")}</p></section>;
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel-title">
        <div>
          <h2>{L("طلبات الدفع والاشتراكات", "Payment requests & subscriptions")}</h2>
          <p>{L("راجع إيصالات الدفع وفعّل الباقات بعد التحقق.", "Review payment receipts and activate plans after verification.")}</p>
        </div>
        <button className="admin-save" onClick={() => void load()}>{L("تحديث", "Refresh")}</button>
      </div>
      {error && <div className="admin-notice">{error}</div>}
      {payments.length ? (
        <div className="admin-payment-grid">
          {payments.map((payment) => (
            <PaymentCard key={payment.id} locale={locale} payment={payment} busy={busyId === payment.id} onAct={(action, version, reason) => void act(action, payment.id, version, reason)} />
          ))}
        </div>
      ) : (
        <p className="admin-empty">{L("لا توجد طلبات دفع بعد.", "No payment requests yet.")}</p>
      )}
    </section>
  );
}
