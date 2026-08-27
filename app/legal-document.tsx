"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Database, FileText, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { useWisalLocale } from "@/app/use-wisal-locale";

type DocumentType = "privacy" | "terms";

const privacySections = [
  {
    icon: Database,
    arTitle: "البيانات التي نجمعها",
    enTitle: "Data we collect",
    arBody: "نجمع بيانات الحساب، وتفاصيل المناسبة، وقائمة الضيوف، وردود الحضور، والملفات وبيانات التحويل التي تضيفونها لتقديم الخدمة. نستخدم بيانات الدفع اليدوي لمراجعة الطلب وتفعيل الباقة فقط.",
    enBody: "We collect account details, event information, guest lists, RSVP responses, files, and transfer details you provide to deliver the service. Manual payment details are used only to review requests and activate plans.",
  },
  {
    icon: ShieldCheck,
    arTitle: "كيف نستخدم البيانات",
    enTitle: "How we use data",
    arBody: "نستخدم البيانات لإنشاء الدعوات وتشغيل الروابط الشخصية وإظهار إحصاءات الحضور وتقديم الدعم وحماية المنصة. لا نبيع بيانات المستخدمين أو الضيوف.",
    enBody: "We use data to create invitations, operate personal links, show RSVP analytics, provide support, and protect the platform. We do not sell user or guest data.",
  },
  {
    icon: LockKeyhole,
    arTitle: "المشاركة والحماية",
    enTitle: "Sharing and protection",
    arBody: "قد تعالج خدمات البنية التحتية والاستضافة وقاعدة البيانات البيانات بالقدر اللازم لتشغيل وِصال. نستخدم صلاحيات وصول وروابط مخصصة وضوابط تقنية لتقليل الوصول غير المصرح به.",
    enBody: "Infrastructure, hosting, and database services may process data as needed to operate Wisal. We use access controls, personal links, and technical safeguards to reduce unauthorized access.",
  },
  {
    icon: FileText,
    arTitle: "الاحتفاظ والطلبات",
    enTitle: "Retention and requests",
    arBody: "نحتفظ بالبيانات أثناء استخدام الحساب وبالقدر المطلوب للتشغيل والأمان والالتزامات القانونية. يمكن لصاحب الحساب طلب التصحيح أو الحذف من خلال تذكرة دعم داخل لوحة المناسبة.",
    enBody: "We retain data while the account is in use and as needed for operations, security, and legal obligations. Account owners can request correction or deletion through a support ticket in the event dashboard.",
  },
];

const termsSections = [
  {
    icon: Scale,
    arTitle: "استخدام المنصة",
    enTitle: "Using the platform",
    arBody: "يجب استخدام وِصال لإنشاء وإدارة دعوات مشروعة، مع امتلاك الحق في النصوص والصور وبيانات الضيوف التي تتم إضافتها. يُمنع إساءة الاستخدام أو محاولة الوصول إلى حسابات أو دعوات أخرى.",
    enBody: "Wisal must be used to create and manage lawful invitations, and you must have the right to use the text, images, and guest data you add. Misuse or attempts to access other accounts or invitations are prohibited.",
  },
  {
    icon: ShieldCheck,
    arTitle: "مسؤولية صاحب المناسبة",
    enTitle: "Event owner responsibility",
    arBody: "صاحب المناسبة مسؤول عن دقة المحتوى والحصول على موافقة مناسبة لاستخدام بيانات الضيوف وإدارة من يمكنه رؤية كل موقع أو مرحلة داخل الدعوة.",
    enBody: "The event owner is responsible for content accuracy, appropriate permission to use guest data, and deciding who can see each venue or stage in the invitation.",
  },
  {
    icon: LockKeyhole,
    arTitle: "توفر الخدمة",
    enTitle: "Service availability",
    arBody: "نسعى لتقديم خدمة مستقرة وآمنة، لكن قد تحدث أعمال صيانة أو أعطال خارجة عن السيطرة. يجب الاحتفاظ بنسخة من بيانات الضيوف المهمة قبل المناسبة.",
    enBody: "We aim to provide a stable and secure service, but maintenance or events outside our control may occur. Keep a copy of important guest data before the event.",
  },
  {
    icon: FileText,
    arTitle: "الخطط والدفع",
    enTitle: "Plans and payments",
    arBody: "تُدفع الخطط يدويًا عبر وسيلة التحويل الموضحة في صفحة الدفع، ثم يرفع صاحب الحساب الإيصال للمراجعة. لا تُفعّل الباقة إلا بعد اعتماد الطلب، وتُعرض أي شروط إلغاء أو استرداد قبل الإرسال.",
    enBody: "Plans are paid manually using the transfer method shown at checkout. The account owner uploads a receipt for review, and the plan is activated only after approval. Any cancellation or refund terms are shown before submission.",
  },
];

export default function LegalDocument({ type }: { type: DocumentType }) {
  const [locale, setLocale] = useWisalLocale();
  const ar = locale === "ar";
  const sections = type === "privacy" ? privacySections : termsSections;
  const title = type === "privacy" ? (ar ? "سياسة الخصوصية" : "Privacy policy") : (ar ? "شروط الاستخدام" : "Terms of use");
  const description = type === "privacy"
    ? (ar ? "كيف تتعامل وِصال مع بيانات أصحاب المناسبات والضيوف وتحميها." : "How Wisal handles and protects event-owner and guest data.")
    : (ar ? "القواعد الأساسية لاستخدام منصة وِصال خلال المرحلة التجريبية." : "The essential rules for using Wisal during its beta stage.");
  const BackIcon = ar ? ArrowRight : ArrowLeft;

  return (
    <main className="legal-page" dir={ar ? "rtl" : "ltr"} lang={locale}>
      <header className="legal-nav">
        <Link className="legal-brand" href="/"><Image src="/brand/wisal-monogram-64.png" width={42} height={42} alt="" unoptimized /><span><b>{ar ? "وِصال" : "Wisal"}</b><small>{ar ? "دعوات رقمية تليق ببدايتكم" : "Digital invitations, beautifully yours"}</small></span></Link>
        <button type="button" onClick={() => setLocale(ar ? "en" : "ar")}>{ar ? "English" : "العربية"}</button>
      </header>

      <section className="legal-hero">
        <span>{type === "privacy" ? <ShieldCheck aria-hidden="true" /> : <Scale aria-hidden="true" />}</span>
        <div><small>{ar ? "مستندات الثقة" : "Trust center"}</small><h1>{title}</h1><p>{description}</p><time dateTime="2026-08-20">{ar ? "آخر تحديث: ٢٠ أغسطس ٢٠٢٦" : "Last updated: 20 August 2026"}</time></div>
      </section>

      <section className="legal-content">
        <aside><b>{ar ? "ملخص واضح" : "Plain-language summary"}</b><p>{ar ? "كتبنا هذا المستند بلغة مباشرة ليسهل فهم كيفية عمل الخدمة. تُراجع النسخة القانونية النهائية قبل البيع العام." : "This document uses direct language to explain how the service works. A final legal review is required before public sales."}</p></aside>
        <div className="legal-sections">{sections.map(({ icon: SectionIcon, arTitle, enTitle, arBody, enBody }) => <article key={enTitle}><span><SectionIcon aria-hidden="true" /></span><div><h2>{ar ? arTitle : enTitle}</h2><p>{ar ? arBody : enBody}</p></div></article>)}</div>
      </section>

      <section className="legal-contact"><div><h2>{ar ? "لديك سؤال أو طلب بخصوص بياناتك؟" : "Have a question or data request?"}</h2><p>{ar ? "سجّل الدخول وافتح تذكرة دعم من لوحة المناسبة، وسنحتفظ بسجل واضح للطلب والمتابعة." : "Sign in and open a support ticket from your event dashboard so the request and follow-up stay recorded."}</p></div><a href="/auth/sign-in?returnTo=%2Fworkspace%3Fsection%3Dsupport">{ar ? "فتح مركز الدعم" : "Open support center"} <BackIcon aria-hidden="true" /></a></section>

      <footer className="legal-footer"><Link href="/"><BackIcon aria-hidden="true" /> {ar ? "العودة إلى وِصال" : "Back to Wisal"}</Link><nav><a href="/privacy">{ar ? "الخصوصية" : "Privacy"}</a><a href="/terms">{ar ? "الشروط" : "Terms"}</a></nav></footer>
    </main>
  );
}
