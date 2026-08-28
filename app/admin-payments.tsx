"use client";

import { useEffect, useState } from "react";

type Locale = "ar" | "en";

type AdminPayment = {
  id: string;
  planCode: string;
  status: "draft" | "pending_review" | "approved" | "rejected" | "needs_info" | "cancelled";
  planNameSnapshot: string | null;
  priceEgpSnapshot: number | null;
  amountPaid: number | null;
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
    needs_info: ["معلومات مطلوبة", "Info requested"],
    cancelled: ["ملغي", "Cancelled"],
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
  const canReview = payment.status === "pending_review";
  const money = `${payment.priceEgpSnapshot ?? 0} ${payment.currency}`;
  const submitted = payment.submittedAt ?? payment.createdAt;

  return (
    <article className="admin-payment-card">
      <header>
        <div>
          <b>{payment.planNameSnapshot || payment.planCode}</b>
          <small>{L("المطلوب", "Expected")}: {money} · {L("المدفوع", "Paid")}: {payment.amountPaid ?? "—"} {payment.currency}{payment.guestLimitSnapshot ? ` · ${L(`حتى ${payment.guestLimitSnapshot} ضيف`, `up to ${payment.guestLimitSnapshot} guests`)}` : ""}</small>
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
            id={`payment-review-reason-${payment.id}`}
            aria-label={L("سبب الرفض أو طلب المعلومات", "Rejection or information request reason")}
            aria-required="true"
            aria-describedby={`payment-review-reason-help-${payment.id}`}
            placeholder={L("سبب الرفض أو طلب المعلومات (مطلوب للإجراءين الآخرين)", "Reject / info reason (required for those actions)")}
            onChange={(event) => setReason(event.target.value)}
          />
          <small id={`payment-review-reason-help-${payment.id}`} className="admin-reason-hint">
            {L("اكتب سببًا واضحًا قبل الرفض أو طلب معلومات إضافية.", "Add a clear reason before rejecting or requesting more information.")}
          </small>
          <div className="admin-payment-buttons">
            <button type="button" className="admin-approve" disabled={busy} onClick={() => onAct("approve", payment.statusVersion)}>{L("اعتماد", "Approve")}</button>
            <button type="button" className="admin-reject" disabled={busy || !reason.trim()} onClick={() => onAct("reject", payment.statusVersion, reason.trim())}>{L("رفض", "Reject")}</button>
            <button type="button" className="admin-request-info" disabled={busy || !reason.trim()} onClick={() => onAct("request-info", payment.statusVersion, reason.trim())}>{L("طلب معلومات", "Request info")}</button>
          </div>
        </div>
      )}
    </article>
  );
}

type PaymentDestination = { method: "instapay" | "vodafone_cash" | "orange_cash" | "etisalat_cash" | "bank_transfer"; labelAr: string; labelEn: string; recipientName: string; accountIdentifier: string; bankName: string; instructionsAr: string; instructionsEn: string; paymentUrl: string; active: boolean; position: number };

const destinationDefaults: PaymentDestination[] = [
  { method: "instapay", labelAr: "إنستا باي", labelEn: "InstaPay", recipientName: "", accountIdentifier: "", bankName: "", instructionsAr: "", instructionsEn: "", paymentUrl: "", active: false, position: 1 },
  { method: "vodafone_cash", labelAr: "فودافون كاش", labelEn: "Vodafone Cash", recipientName: "", accountIdentifier: "", bankName: "", instructionsAr: "", instructionsEn: "", paymentUrl: "", active: false, position: 2 },
  { method: "orange_cash", labelAr: "أورانج كاش", labelEn: "Orange Cash", recipientName: "", accountIdentifier: "", bankName: "", instructionsAr: "", instructionsEn: "", paymentUrl: "", active: false, position: 3 },
  { method: "etisalat_cash", labelAr: "اتصالات كاش", labelEn: "Etisalat Cash", recipientName: "", accountIdentifier: "", bankName: "", instructionsAr: "", instructionsEn: "", paymentUrl: "", active: false, position: 4 },
  { method: "bank_transfer", labelAr: "تحويل بنكي", labelEn: "Bank transfer", recipientName: "", accountIdentifier: "", bankName: "", instructionsAr: "", instructionsEn: "", paymentUrl: "", active: false, position: 5 },
];

function PaymentDestinationsPanel({ locale }: { locale: Locale }) {
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const [destinations, setDestinations] = useState<PaymentDestination[]>(destinationDefaults);
  const [state, setState] = useState<"loading" | "idle" | "saving" | "saved" | "error">("loading");
  const update = (method: PaymentDestination["method"], key: keyof PaymentDestination, value: string | boolean) => setDestinations((items) => items.map((item) => item.method === method ? { ...item, [key]: value } : item));
  useEffect(() => { void fetch("/api/admin/payment-destinations", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); const data = await response.json() as { destinations: PaymentDestination[] }; setDestinations(destinationDefaults.map((item) => ({ ...item, ...(data.destinations.find((saved) => saved.method === item.method) ?? {}) }))); setState("idle"); }).catch(() => setState("error")); }, []);
  const save = async () => { setState("saving"); const response = await fetch("/api/admin/payment-destinations", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ destinations }) }); setState(response.ok ? "saved" : "error"); };
  return <section className="admin-payment-destinations"><div className="admin-panel-title"><div><h2>{L("بيانات استقبال الدفع", "Payment receiving details")}</h2><p>{L("تظهر هذه البيانات فقط للعميل المسجل داخل صفحة الدفع. لا تضف أي رقم تجريبي.", "These details appear only to signed-in customers at checkout. Never enter sample numbers.")}</p></div><button className="admin-save" disabled={state === "saving"} onClick={() => void save()}>{state === "saving" ? L("جارٍ الحفظ…", "Saving…") : L("حفظ البيانات", "Save details")}</button></div>{state === "error" && <p className="admin-notice">{L("تعذر تحميل أو حفظ بيانات الاستلام.", "Could not load or save receiving details.")}</p>}<div className="admin-destination-list">{destinations.map((item) => <article key={item.method}><header><b>{locale === "ar" ? item.labelAr : item.labelEn}</b><label><input type="checkbox" checked={item.active} onChange={(event) => update(item.method, "active", event.target.checked)} />{L("مفعّلة", "Active")}</label></header><div><label>{L("اسم المستفيد", "Recipient")}<input value={item.recipientName} onChange={(event) => update(item.method, "recipientName", event.target.value)} /></label><label>{L("رقم الحساب أو المحفظة", "Account or wallet number")}<input dir="ltr" value={item.accountIdentifier} onChange={(event) => update(item.method, "accountIdentifier", event.target.value)} /></label><label>{L("رابط الدفع المباشر (https)", "Direct payment link (https)")}<input dir="ltr" type="url" value={item.paymentUrl} onChange={(event) => update(item.method, "paymentUrl", event.target.value)} /></label><label>{L("البنك (إن وجد)", "Bank (if applicable)")}<input value={item.bankName} onChange={(event) => update(item.method, "bankName", event.target.value)} /></label><label>{L("تعليمات بالعربية", "Arabic instructions")}<input value={item.instructionsAr} onChange={(event) => update(item.method, "instructionsAr", event.target.value)} /></label><label>{L("English instructions", "English instructions")}<input value={item.instructionsEn} onChange={(event) => update(item.method, "instructionsEn", event.target.value)} /></label></div></article>)}</div>{state === "saved" && <p className="admin-payment-saved">{L("تم حفظ بيانات الاستلام.", "Receiving details saved.")}</p>}</section>;
}

export default function AdminPayments({ locale, onReviewed }: { locale: Locale; onReviewed?: () => void }) {
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
    try {
      const response = await fetch(`/api/admin/payments/${id}/${action}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(reason ? { statusVersion, reason } : { statusVersion }),
      });
      if (response.ok) {
        const data = await response.json() as { payment: AdminPayment };
        setPayments((prev) => (prev ? prev.map((item) => (item.id === id ? data.payment : item)) : prev));
        onReviewed?.();
      } else {
        const data = await response.json().catch(() => ({})) as { error?: string };
        setError(data.error || L("تعذر تنفيذ الإجراء", "Could not perform action"));
      }
    } catch {
      setError(L("تعذر الاتصال بالخادم. حاول مرة أخرى.", "Could not reach the server. Try again."));
    } finally {
      setBusyId("");
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
      <PaymentDestinationsPanel locale={locale} />
    </section>
  );
}
