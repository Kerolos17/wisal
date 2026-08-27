"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useWisalLocale } from "../use-wisal-locale";

type CheckoutPlan = {
  code: string;
  nameAr: string;
  nameEn: string;
  priceEgp: number;
  guestLimit: number | null;
  featuresAr: string[];
  featuresEn: string[];
};

const METHODS: Array<{ value: string; ar: string; en: string }> = [
  { value: "instapay", ar: "إنستا باي", en: "InstaPay" },
  { value: "vodafone_cash", ar: "فودافون كاش", en: "Vodafone Cash" },
  { value: "etisalat_cash", ar: "اتصالات كاش", en: "Etisalat Cash" },
  { value: "bank_transfer", ar: "تحويل بنكي", en: "Bank transfer" },
];

export default function CheckoutClient({ plan }: { plan: CheckoutPlan }) {
  const [locale] = useWisalLocale();
  const router = useRouter();
  const L = (ar: string, en: string) => (locale === "ar" ? ar : en);
  const idempotency = useRef(crypto.randomUUID());

  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("instapay");
  const [amountPaid, setAmountPaid] = useState(String(plan.priceEgp));
  const [receipt, setReceipt] = useState<File | null>(null);
  const [state, setState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [paymentId, setPaymentId] = useState<string | null>(null);

  const planName = locale === "ar" ? plan.nameAr : plan.nameEn;

  const submit = async () => {
    if (!receipt) { setMessage(L("ارفع صورة الإيصال أولًا", "Upload the receipt first")); setState("error"); return; }
    if (!payerName.trim()) { setMessage(L("أدخل اسم المودع", "Enter the payer name")); setState("error"); return; }
    const amount = Number(amountPaid);
    if (!Number.isFinite(amount) || amount < 0) { setMessage(L("المبلغ غير صالح", "Invalid amount")); setState("error"); return; }

    setState("submitting");
    setMessage("");
    try {
      const createRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planCode: plan.code, idempotencyKey: idempotency.current }),
      });
      if (createRes.status === 401) { router.push(`/auth/sign-in?returnTo=${encodeURIComponent(`/checkout?plan=${plan.code}`)}`); return; }
      if (!createRes.ok) { const data = await createRes.json().catch(() => ({})); throw new Error(data.error || L("تعذر بدء الطلب", "Could not start the request")); }
      const { payment } = await createRes.json() as { payment: { id: string } };
      setPaymentId(payment.id);

      const form = new FormData();
      form.append("receipt", receipt);
      form.append("paymentMethod", paymentMethod);
      form.append("amountPaid", String(amount));
      form.append("referenceNumber", referenceNumber.trim());
      form.append("payerName", payerName.trim());
      form.append("payerPhoneMasked", payerPhone.trim());

      const submitRes = await fetch(`/api/payments/${payment.id}/submit`, { method: "PATCH", body: form });
      if (!submitRes.ok) { const data = await submitRes.json().catch(() => ({})); throw new Error(data.error || L("تعذر إرسال الطلب", "Could not submit the request")); }
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : L("حدث خطأ غير متوقع", "An unexpected error occurred"));
      setState("error");
    }
  };

  if (state === "success") {
    return (
      <section className="checkout-shell">
        <div className="checkout-card success">
          <span className="checkout-icon">✓</span>
          <h1>{L("وصلنا طلب الدفع", "Payment request received")}</h1>
          <p>{L("سنراجع الإيصال ونفعّل باقتك خلال وقت قصير. ستصلك رسالة عند التفعيل.", "We will review the receipt and activate your plan shortly. You will be notified when approved.")}</p>
          {paymentId && <Link className="checkout-link" href={`/checkout/${paymentId}/status`}>{L("تتبّع حالة الطلب", "Track request status")}</Link>}
          <button className="primary" onClick={() => router.push("/workspace")}>{L("الذهاب إلى مناسبتي", "Go to my event")}</button>
        </div>
      </section>
    );
  }

  return (
    <section className="checkout-shell">
      <div className="checkout-card">
        <header className="checkout-head">
          <small>{L("إتمام الاشتراك", "Complete subscription")}</small>
          <h1>{planName}</h1>
          <b className="checkout-price">{plan.priceEgp} {L("جنيه مصري", "EGP")}</b>
          <p className="checkout-sub">{plan.guestLimit ? L(`حتى ${plan.guestLimit} ضيفًا`, `Up to ${plan.guestLimit} guests`) : L("ضيوف بلا حد", "Unlimited guests")}</p>
        </header>
        <ul className="checkout-features">
          {(locale === "ar" ? plan.featuresAr : plan.featuresEn).map((feature) => <li key={feature}>✓ {feature}</li>)}
        </ul>
        <ol className="checkout-steps">
          <li>{L("ادفع المبلغ عبر طريقة الدفع المفضلة لديك.", "Pay the amount using your preferred payment method.")}</li>
          <li>{L("ارفع صورة الإيصال مع بيانات التحويل.", "Upload a photo of the receipt with the transfer details.")}</li>
          <li>{L("سيصل إشعار التفعيل بعد المراجعة.", "You will get an activation notice after review.")}</li>
        </ol>
        <div className="checkout-form">
          <label>{L("طريقة الدفع", "Payment method")}
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              {METHODS.map((method) => <option key={method.value} value={method.value}>{locale === "ar" ? method.ar : method.en}</option>)}
            </select>
          </label>
          <label>{L("المبلغ المدفوع (جنيه مصري)", "Amount paid (EGP)")}
            <input type="number" min="0" value={amountPaid} onChange={(event) => setAmountPaid(event.target.value)} />
          </label>
          <label>{L("اسم المودع", "Payer name")}
            <input value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder={L("الاسم على التحويل", "Name on the transfer")} />
          </label>
          <label>{L("رقم الهاتف (اختياري)", "Phone (optional)")}
            <input value={payerPhone} onChange={(event) => setPayerPhone(event.target.value)} placeholder="01xxxxxxxxx" />
          </label>
          <label>{L("رقم المرجع (اختياري)", "Reference number (optional)")}
            <input value={referenceNumber} onChange={(event) => setReferenceNumber(event.target.value)} />
          </label>
          <label className="checkout-file">{L("صورة الإيصال", "Receipt image")}
            <input type="file" accept="image/*,application/pdf" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} />
          </label>
        </div>
        {state === "error" && <p className="checkout-error" role="alert">{message}</p>}
        <button className="primary checkout-submit" disabled={state === "submitting"} onClick={() => void submit()}>
          {state === "submitting" ? L("جارٍ الإرسال…", "Submitting…") : L("إرسال طلب الدفع", "Submit payment request")}
        </button>
      </div>
    </section>
  );
}
