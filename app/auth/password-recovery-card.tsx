"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, KeyRound, LoaderCircle, MailCheck } from "lucide-react";
import { useWisalLocale } from "@/app/use-wisal-locale";

type Props = { mode: "request"; returnTo: string } | { mode: "reset"; returnTo: string; token: string; invalidToken?: boolean };

export default function PasswordRecoveryCard(props: Props) {
  const [locale, setLocale] = useWisalLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const ar = locale === "ar";
  const L = (arabic: string, english: string) => ar ? arabic : english;
  const isReset = props.mode === "reset";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (isReset && password !== confirmPassword) {
      setError(L("كلمتا المرور غير متطابقتين.", "The passwords do not match."));
      return;
    }
    setLoading(true);
    try {
      const endpoint = isReset ? "/api/auth/reset-password" : "/api/auth/request-password-reset";
      const redirectTo = new URL("/auth/reset-password", window.location.origin);
      redirectTo.searchParams.set("returnTo", props.returnTo);
      const body = isReset ? { token: props.token, newPassword: password } : { email, redirectTo: redirectTo.toString() };
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json().catch(() => ({})) as { message?: string; error?: { message?: string } };
      if (!response.ok) throw new Error(data.error?.message || data.message || L("تعذر إكمال الطلب.", "We could not complete this request."));
      if (isReset) {
        const signInURL = new URL("/auth/sign-in", window.location.origin);
        signInURL.searchParams.set("returnTo", props.returnTo);
        signInURL.searchParams.set("reset", "success");
        window.location.assign(signInURL.toString());
      } else {
        setSent(true);
        setLoading(false);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : L("حدث خطأ غير متوقع.", "Something unexpected happened."));
      setLoading(false);
    }
  }

  return (
    <main className="auth-page" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <section className="auth-story" aria-label={L("هوية وِصال", "Wisal brand story")}>
        <Image src="/brand/cinematic-palace-hero.webp" alt="" fill priority unoptimized sizes="(max-width: 900px) 100vw, 52vw" />
        <div className="auth-story-shade" />
        <Link className="auth-brand" href="/"><Image src="/brand/wisal-monogram-64.png" alt="" width={48} height={48} unoptimized /><span><b>{ar ? "وِصال" : "Wisal"}</b><small>{L("دعوة تليق ببدايتكم", "Invitations worthy of your beginning")}</small></span></Link>
        <div className="auth-quote"><span>✦</span><h1>{L("عودتكم إلينا تبدأ بخطوة آمنة.", "A secure step brings you back.")}</h1><p>{L("استعيدوا الوصول دون المساس بدعواتكم أو بيانات ضيوفكم.", "Recover access without affecting your invitations or guest data.")}</p></div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-top"><Link href={`/auth/sign-in?returnTo=${encodeURIComponent(props.returnTo)}`}>{L("العودة لتسجيل الدخول", "Back to sign in")}</Link><button type="button" onClick={() => setLocale(ar ? "en" : "ar")}>{ar ? "English" : "العربية"}</button></div>
        <div className="auth-card auth-recovery-card">
          <span className="auth-kicker">{L("استعادة آمنة", "Secure recovery")}</span>
          {sent ? <MailCheck className="auth-connect-icon" aria-hidden="true" /> : <KeyRound className="auth-connect-icon" aria-hidden="true" />}
          <h2>{sent ? L("راجع بريدك الإلكتروني", "Check your email") : isReset ? L("أنشئ كلمة مرور جديدة", "Create a new password") : L("نسيت كلمة المرور؟", "Forgot your password?")}</h2>
          <p>{sent ? L("أرسلنا رابطًا صالحًا لمدة محدودة. راجع صندوق الوارد والرسائل غير المرغوب فيها.", "We sent a time-limited recovery link. Check your inbox and spam folder.") : isReset ? L("اختر كلمة مرور قوية لا تقل عن ٨ أحرف.", "Choose a strong password with at least 8 characters.") : L("أدخل بريد حساب وِصال وسنرسل لك رابط الاستعادة.", "Enter your Wisal account email and we’ll send a recovery link.")}</p>
          {!sent && <form onSubmit={submit}>
            {isReset ? <>
              <label>{L("كلمة المرور الجديدة", "New password")}<span className="auth-password"><input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={L("إظهار أو إخفاء كلمة المرور", "Show or hide password")}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span></label>
              <label>{L("تأكيد كلمة المرور", "Confirm password")}<input type={showPassword ? "text" : "password"} autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required /></label>
            </> : <label>{L("البريد الإلكتروني", "Email address")}<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="name@example.com" /></label>}
            {props.mode === "reset" && props.invalidToken && <p className="auth-error" role="alert">{L("الرابط غير صالح أو انتهت مدته. اطلب رابطًا جديدًا.", "This link is invalid or expired. Request a new one.")}</p>}
            {error && <p className="auth-error" role="alert">{error}</p>}
            <button className="auth-submit" disabled={loading || (props.mode === "reset" && props.invalidToken)}>{loading && <LoaderCircle className="auth-spin" size={18} />}{isReset ? L("حفظ كلمة المرور", "Save new password") : L("إرسال رابط الاستعادة", "Send recovery link")}</button>
          </form>}
          {sent && <Link className="auth-submit auth-recovery-back" href={`/auth/sign-in?returnTo=${encodeURIComponent(props.returnTo)}`}>{L("العودة لتسجيل الدخول", "Back to sign in")}</Link>}
          {props.mode === "reset" && props.invalidToken && <Link className="auth-connect-skip" href={`/auth/forgot-password?returnTo=${encodeURIComponent(props.returnTo)}`}>{L("طلب رابط جديد", "Request a new link")}</Link>}
        </div>
      </section>
    </main>
  );
}
