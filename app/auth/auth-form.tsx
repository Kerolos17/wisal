"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Globe2, LoaderCircle } from "lucide-react";
import { useWisalLocale } from "@/app/use-wisal-locale";

type Mode = "sign-in" | "sign-up";

export default function AuthForm({ mode, returnTo, initialError = "" }: { mode: Mode; returnTo: string; initialError?: string }) {
  const [locale, setLocale] = useWisalLocale();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState(initialError);
  const ar = locale === "ar";
  const isSignUp = mode === "sign-up";
  const L = (arabic: string, english: string) => ar ? arabic : english;

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setLoading("email");
    setError("");
    try {
      const endpoint = isSignUp ? "/api/auth/sign-up/email" : "/api/auth/sign-in/email";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, ...(isSignUp ? { name } : {}), callbackURL: returnTo }),
      });
      const data = await response.json().catch(() => ({})) as { message?: string; error?: { message?: string }; url?: string };
      if (!response.ok) throw new Error(data.error?.message || data.message || L("تعذر إكمال العملية. راجع البيانات وحاول مرة أخرى.", "We could not complete this request. Check your details and try again."));
      window.location.assign(data.url || returnTo);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : L("حدث خطأ غير متوقع.", "Something unexpected happened."));
      setLoading(null);
    }
  }

  async function continueWithGoogle() {
    setLoading("google");
    setError("");
    try {
      const callbackURL = new URL("/auth/callback", window.location.origin);
      callbackURL.searchParams.set("returnTo", returnTo);
      const errorURL = new URL("/auth/sign-in", window.location.origin);
      errorURL.searchParams.set("returnTo", returnTo);
      const response = await fetch("/api/auth/sign-in/social", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider: "google", callbackURL: callbackURL.toString(), errorCallbackURL: errorURL.toString() }),
      });
      const data = await response.json().catch(() => ({})) as { url?: string; message?: string; error?: string | { message?: string } };
      const providerError = typeof data.error === "string" ? data.error : data.error?.message;
      if (!response.ok || !data.url) throw new Error(providerError === "Invalid callbackURL" ? L("تسجيل الدخول عبر Google غير مفعّل لرابط المعاينة هذا. افتح الرابط الإنتاجي أو اطلب من الإدارة إضافة نطاق المعاينة الموثوق.", "Google sign-in is not enabled for this preview URL. Open the production URL or ask an administrator to add the trusted preview domain.") : providerError || data.message || L("تسجيل الدخول عبر Google غير متاح حاليًا.", "Google sign-in is not available right now."));
      window.location.assign(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : L("تعذر بدء تسجيل الدخول.", "We could not start sign-in."));
      setLoading(null);
    }
  }

  return (
    <main className="auth-page" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <section className="auth-story" aria-label={L("هوية وِصال", "Wisal brand story")}>
        <Image src="/brand/cinematic-palace-hero.webp" alt="" fill priority unoptimized sizes="(max-width: 900px) 100vw, 52vw" />
        <div className="auth-story-shade" />
        <Link className="auth-brand" href="/" aria-label={L("العودة إلى وِصال", "Back to Wisal")}>
          <Image src="/brand/wisal-monogram-64.png" alt="" width={48} height={48} unoptimized />
          <span><b>{ar ? "وِصال" : "Wisal"}</b><small>{L("دعوة تليق ببدايتكم", "Invitations worthy of your beginning")}</small></span>
        </Link>
        <div className="auth-quote"><span>✦</span><h1>{L("كل بداية تستحق أن تُروى بأجمل صورة.", "Every beginning deserves to be told beautifully.")}</h1><p>{L("صمّموا دعوتكم وشاركوها وتابعوا حضور ضيوفكم من مكان واحد.", "Design, share, and manage every RSVP from one thoughtful place.")}</p></div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel-top"><Link href="/">{L("العودة للرئيسية", "Back home")}</Link><button type="button" onClick={() => setLocale(ar ? "en" : "ar")}><Globe2 size={16} /> {ar ? "English" : "العربية"}</button></div>
        <div className="auth-card">
          <span className="auth-kicker">{L("مساحتكم الخاصة", "Your private space")}</span>
          <h2>{isSignUp ? L("ابدأوا حكايتكم مع وِصال", "Begin your story with Wisal") : L("أهلًا بعودتكم", "Welcome back")}</h2>
          <p>{isSignUp ? L("أنشئوا حسابًا وابدأوا تصميم دعوتكم الأولى.", "Create your account and start designing your first invitation.") : L("سجّلوا الدخول للعودة إلى دعوتكم وضيوفكم.", "Sign in to return to your invitation and guests.")}</p>

          <button className="auth-google" type="button" onClick={() => void continueWithGoogle()} disabled={Boolean(loading)}>{loading === "google" ? <LoaderCircle className="auth-spin" size={18} /> : <b>G</b>}{L("المتابعة باستخدام Google", "Continue with Google")}</button>
          <div className="auth-divider"><span />{L("أو بالبريد الإلكتروني", "or with email")}<span /></div>

          <form onSubmit={submitEmail}>
            {isSignUp && <label>{L("الاسم", "Name")}<input autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder={L("الاسم كما سيظهر في الحساب", "Your account name")} /></label>}
            <label>{L("البريد الإلكتروني", "Email address")}<input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="name@example.com" /></label>
            <label>{L("كلمة المرور", "Password")}<span className="auth-password"><input type={showPassword ? "text" : "password"} autoComplete={isSignUp ? "new-password" : "current-password"} minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder={L("٨ أحرف على الأقل", "At least 8 characters")} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={L("إظهار أو إخفاء كلمة المرور", "Show or hide password")}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
            {!isSignUp && <Link className="auth-forgot" href={`/auth/forgot-password?returnTo=${encodeURIComponent(returnTo)}`}>{L("نسيت كلمة المرور؟", "Forgot password?")}</Link>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={Boolean(loading)}>{loading === "email" && <LoaderCircle className="auth-spin" size={18} />}{isSignUp ? L("إنشاء الحساب", "Create account") : L("تسجيل الدخول", "Sign in")}</button>
          </form>

          <p className="auth-switch">{isSignUp ? L("لديكم حساب بالفعل؟", "Already have an account?") : L("ليس لديكم حساب؟", "New to Wisal?")} <Link href={`/auth/${isSignUp ? "sign-in" : "sign-up"}?returnTo=${encodeURIComponent(returnTo)}`}>{isSignUp ? L("تسجيل الدخول", "Sign in") : L("إنشاء حساب", "Create an account")}</Link></p>
          <small className="auth-terms">{L("بالمتابعة، أنتم توافقون على شروط الاستخدام وسياسة الخصوصية.", "By continuing, you agree to our Terms and Privacy Policy.")}</small>
        </div>
      </section>
    </main>
  );
}
