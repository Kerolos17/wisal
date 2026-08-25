"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { useWisalLocale } from "@/app/use-wisal-locale";

export default function ConnectGoogleCard({ returnTo, email, initialError = "" }: { returnTo: string; email: string; initialError?: string }) {
  const [locale, setLocale] = useWisalLocale();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError);
  const ar = locale === "ar";
  const L = (arabic: string, english: string) => ar ? arabic : english;

  async function connectGoogle() {
    setLoading(true);
    setError("");
    try {
      const callbackURL = new URL(returnTo, window.location.origin);
      callbackURL.searchParams.set("google", "linked");
      const errorURL = new URL("/auth/connect-google", window.location.origin);
      errorURL.searchParams.set("returnTo", returnTo);
      const response = await fetch("/api/auth/link-social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: callbackURL.toString(), errorCallbackURL: errorURL.toString() }),
      });
      const data = await response.json().catch(() => ({})) as { url?: string; message?: string; error?: { message?: string } };
      if (!response.ok || !data.url) throw new Error(data.error?.message || data.message || L("تعذر بدء ربط Google.", "We could not start Google linking."));
      window.location.assign(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : L("تعذر ربط الحساب.", "We could not link this account."));
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <section className="auth-story" aria-label={L("هوية وِصال", "Wisal brand story")}>
        <Image src="/brand/cinematic-palace-hero.webp" alt="" fill priority unoptimized sizes="(max-width: 900px) 100vw, 52vw" />
        <div className="auth-story-shade" />
        <Link className="auth-brand" href="/"><Image src="/brand/wisal-monogram-64.png" alt="" width={48} height={48} unoptimized /><span><b>{ar ? "وِصال" : "Wisal"}</b><small>{L("دعوة تليق ببدايتكم", "Invitations worthy of your beginning")}</small></span></Link>
        <div className="auth-quote"><span>✦</span><h1>{L("حساب واحد، وطريقة دخول أسهل.", "One account, an easier way in.")}</h1><p>{L("نربط Google بحسابكم الحالي دون إنشاء حساب مكرر.", "Connect Google to your existing account without creating a duplicate.")}</p></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><Link href={returnTo}>{L("العودة للوحة", "Back to dashboard")}</Link><button type="button" onClick={() => setLocale(ar ? "en" : "ar")}>{ar ? "English" : "العربية"}</button></div>
        <div className="auth-card auth-connect-card">
          <span className="auth-kicker">{L("خطوة أمان واحدة", "One secure step")}</span>
          <ShieldCheck className="auth-connect-icon" aria-hidden="true" />
          <h2>{L("اربط حساب Google", "Connect your Google account")}</h2>
          <p>{L(`تم تسجيل الدخول إلى ${email}. أكمل موافقة Google مرة واحدة فقط.`, `You’re signed in as ${email}. Complete Google approval once.`)}</p>
          <ul className="auth-connect-list">
            <li><CheckCircle2 aria-hidden="true" />{L("لن يتم إنشاء حساب جديد", "No duplicate account will be created")}</li>
            <li><CheckCircle2 aria-hidden="true" />{L("ستظل بيانات دعواتكم كما هي", "Your invitation data stays unchanged")}</li>
          </ul>
          {error && <p className="auth-error" role="alert">{error}</p>}
          <button className="auth-submit" type="button" onClick={() => void connectGoogle()} disabled={loading}>{loading ? <LoaderCircle className="auth-spin" size={18} /> : <b>G</b>}{L("ربط Google بأمان", "Securely connect Google")}</button>
          <Link className="auth-connect-skip" href={returnTo}>{L("المتابعة الآن بدون ربط", "Continue without linking")}</Link>
        </div>
      </section>
    </main>
  );
}
