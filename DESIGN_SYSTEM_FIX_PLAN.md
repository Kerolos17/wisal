# خطة إصلاح الألوان والتناسق البصري - Wisal

## تحليل المشكلة الحالية

### الأنظمة المتضاربة الحالية:
1. **globals.css** (السطر 3): `--plum:#241329`, `--rose:#c98779`, `--ivory:#f8f3ef`, `--sage:#78836f`, `--ink:#241d25`, `--muted:#796f79`, `--line:#e8ded8`, `--green:#4c7356`, `--gold:#b58a4c`
2. **wisal-atelier.css**: `--atelier-lilac:#d8c5ec`, `--atelier-aubergine:#432846`, `--atelier-lime:#d8ff6d`, `--atelier-porcelain:#fbf9fc`
3. **tokens.css** (DS 2.0): `--ds-brand:#432846`, `--ds-action:#d8ff6d`, `--ds-action-ink:#332137`, `--ds-surface:#ffffff`, etc.

### المشاكل المكتشفة:
1. **3 أنظمة ألوان متضاربة** تعمل في نفس الوقت
2. **ألوان hardcoded** منتشرة: `#faf7f4`, `#f7f5f3`, `#f8f3ee`, `#f3e7d5`, `#f3e8d7`, `#f0e8f8`, `#e8eded`, `#f0e8f8`, `#f4e8e5`, `#f3e7d5`
3. **متغيرات متضاربة**: `--plum` vs `--atelier-aubergine` vs `--ds-brand` (كلها نفس اللون تقريبًا)
4. **أزرار غير متناسقة**: `.primary` يستخدم `--plum`، `.atlas-primary` يستخدم `--atelier-lime`
5. **ألوان hardcoded** في الكومبوننتات: `#faf7f4`, `#f7f5f3`, `#f3e7d5`, `#f0e8f8`, `#d8b9ae`, `#e8eded`, `#f0e8f8`, `#f4e8e5`, `#f3e7d5`
6. **أزرار بأشكال مختلفة**: `.primary`, `.atlas-primary`, `.atlas-link`, `.ghost`, `.danger-button`, `.text-button`, `.reminder-button`, `.copy-message`, `.admin-shortcut`, `.admin-save`, `.btn-primary`, `.btn-secondary`
6. **Border radius غير متناسق**: 15+ قيم مختلفة (2px, 3px, 4px, 6px, 8px, 9px, 9px, 10px, 11px, 12px, 13px, 14px, 14px, 15px, 16px, 24px, 999px, 9999px)
7. **ظلال وألوان hardcoded** في الكومبوننتات

---

## خطة الإصلاح الشاملة

### المرحلة 1: توحيد المتغيرات اللونية (الأولوية: حرجة)
**الهدف**: جعل `tokens.css` المصدر الوحيد للألوان

**المهام:**
1. [ ] ترحيل جميع متغيرات `globals.css:3` إلى `tokens.css` مع أسماء semantic موحدة
2. [ ] ترحيل متغيرات `wisal-atelier.css` إلى `tokens.css` بأسماء semantic موحدة
3. [ ] إزالة المتغيرات المكررة من `globals.css` و `wisal-atelier.css`
3. [ ] جعل `tokens.css` المصدر الوحيد للاستيراد في `layout.tsx`
3. [ ] إضافة `color-mix()` للدرجات المشتقة بدلاً من قيم hardcoded

### المرحلة 2: توحيد نظام الأزرار (الأولوية: حرجة)
**الهدف**: 4 variants فقط باستخدام tokens

**الحالة الحالية (7 variants):**
- `.primary` / `.header-cta` → `--plum` / `999px`
- `.atlas-primary` → `--atelier-lime` / `13px`
- `.atlas-link` → outline / `13px`
- `.ghost` → `--line` border / `99px`
- `.danger-button` → `#e8c5c2` / `99px`
- `.text-button` / `.reminder-button` / `.copy-message` / `.admin-shortcut` / `.admin-save` / `.admin-save-primary` / `.admin-toggle`

**الهدف (4 variants):**
| Variant | الاستخدام | Background | Text | Border | Radius |
|---------|-----------|------------|------|--------|--------|
| `primary` | CTA أساسي | `var(--ds-action)` | `var(--ds-action-ink)` | none | `var(--ds-radius-md)` |
| `secondary` | إجراءات ثانوية | `transparent` | `var(--ds-brand)` | `var(--ds-line)` | `var(--ds-radius-md)` |
| `danger` | إجراءات خطيرة | `var(--ds-error)` | `white` | none | `var(--ds-radius-md)` |
| `text` | روابط/إجراءات بسيطة | `transparent` | `var(--ds-brand)` | none | `none` |

### المرحلة 3: توحيد البطاقات (الأولوية: عالية)
**الهدف**: نظام بطاقات موحد بـ 4 variants

| Variant | الاستخدام | Background | Border | Shadow | Radius |
|---------|-----------|------------|--------|--------|--------|
| `default` | افتراضي | `var(--ds-surface)` | `var(--ds-line)` | none | `var(--ds-radius-lg)` |
| `elevated` | بارزة | `var(--ds-surface)` | `var(--ds-line)` | `var(--ds-shadow-soft)` | `var(--ds-radius-lg)` |
| `outlined` | بحد واضح | `var(--ds-surface)` | `var(--ds-brand)` | none | `var(--ds-radius-lg)` |
| `elevated-strong` | بارزة بقوة | `var(--ds-surface)` | `var(--ds-line)` | `var(--ds-shadow-strong)` | `var(--ds-radius-lg)` |

### المرحلة 4: توحيد الـ Modal/Dialog (الأولوية: عالية)
**الهدف**: Modal موحد مع radius و shadow من tokens

- radius: `var(--ds-radius-lg)` للـ modal، `var(--ds-radius-full)` للأزرار الداخلية
- shadow: `var(--ds-shadow-strong)` للـ backdrop، `var(--ds-shadow-soft)` للبطاقات
- backdrop: `rgba(34,19,31,.58)` مع `blur(8px)`

### المرحلة 5: تنظيف الألوان hardcoded (الأولوية: عالية)
**استبدال جميع القيم hardcoded بـ tokens:**

| Hardcoded | استبدال بـ |
|-----------|------------|
| `#faf7f4` | `var(--ds-bg)` |
| `#f7f5f3` | `var(--ds-bg)` |
| `#f8f3ee` | `var(--ds-bg)` |
| `#f3e7d5` | `var(--ds-bg)` |
| `#f3e8d7` | `var(--ds-bg)` |
| `#f0e8f8` | `var(--ds-surface)` |
| `#d8b9ae` | `color-mix(in srgb, var(--ds-brand) 20%, var(--ds-surface))` |
| `#e8eded` | `var(--ds-line)` |
| `#f0e8f8` | `var(--ds-surface)` |
| `#f4e8e5` | `color-mix(in srgb, var(--ds-brand) 15%, var(--ds-surface))` |
| `#f3e7d5` | `var(--ds-bg)` |
| `#f7e9e4` | `color-mix(in srgb, var(--ds-brand) 10%, var(--ds-surface))` |
| `#ead4cd` | `color-mix(in srgb, var(--ds-brand) 15%, var(--ds-surface))` |
| `#f1e8f8` | `var(--ds-surface)` |
| `#f3e8d7` | `var(--ds-bg)` |
| `#f8f0eb` | `var(--ds-bg)` |

### المرحلة 6: توحيد Border Radius (الأولوية: متوسطة)
**استبدال 15+ قيم بـ 4 قيم موحدة:**

| القيمة الحالية | الاستبدال |
|--------------|-----------|
| `2px`, `3px`, `4px` | `var(--ds-radius-sm)` = 6px |
| `6px`, `8px`, `9px`, `10px`, `11px` | `var(--ds-radius-md)` = 12px |
| `12px`, `13px`, `14px`, `15px`, `16px` | `var(--ds-radius-md)` = 12px |
| `18px`, `20px`, `22px` | `var(--ds-radius-lg)` = 20px |
| `24px` | `var(--ds-radius-lg)` = 20px (أو `var(--ds-radius-xl)` جديد = 24px) |
| `999px`, `9999px` | `var(--ds-radius-full)` = 9999px |

**استثناءات (تحتفظ بشكلها):**
- `160px 160px 24px 24px` (invite-card) → تبقي
- `160px 160px 6px 6px` (opening-envelope) → تبقي
- `170px 170px 6px 6px` (opening-envelope) → تبقي
- `100px 100px 0 0` (opening) → تبقي
- `120px 120px 0 0` / `120px 120px 12px 12px` → تبقي

### المرحلة 7: توحيد الظلال (الأولوية: متوسطة)
**ظلال موحدة:**

| Token | القيمة | الاستخدام |
|-------|---------|-----------|
| `--ds-shadow-soft` | `0 24px 70px rgba(67,40,70,.16)` | بطاقات، مودال |
| `--ds-shadow-raised` | `0 12px 28px rgba(83,70,32,.16)` | أزرار primary، عناصر بارزة |
| `--ds-shadow-strong` | `0 30px 80px rgba(35,15,30,.3)` | مودال، دروور |
| `--ds-shadow-none` | `none` | عناصر مسطحة |

---

## خطة التنفيذ (التنفيذ على مراحل)

### Sprint 1 (الأسبوع 1): الأساسيات
- [ ] **Task 1.1**: تحديث `tokens.css` بكل المتغيرات المطلوبة
- [ ] **Task 1.2**: تحديث `layout.tsx` لاستيراد `tokens.css` أولاً فقط
- [ ] **Task 1.3**: إزالة المتغيرات القديمة من `globals.css:3` و `wisal-atelier.css:3-10`
- [ ] **التحقق**: `npm run build && npm test` ✅

### Sprint 2 (الأسبوع 2): نظام الأزرار
- [ ] إنشاء `app/components/ui/Button.tsx` بـ 4 variants
- [ ] استبدال جميع استخدامات `.primary`, `.atlas-primary`, `.ghost`, `.danger-button`, إلخ بـ `<Button variant="..." />`
- [ ] تحديث `wisal-atelier.css` و `globals.css` لإزالة أنماط الأزرار القديمة
- [ ] **التحقق**: Visual regression tests + `npm run build && npm test`

### Sprint 3 (الأسبوع 3): البطاقات والنماذج
- [ ] إنشاء `app/components/ui/Card.tsx` بـ 4 variants
- [ ] تحديث `Card.tsx` الموجود في `page.tsx` لاستخدام المكون الجديد
- [ ] تحديث `Input`, `Textarea`, `Select` لاستخدام tokens
- [ ] **التحقق**: Visual regression + tests

### Sprint 4 (الأسبوع 4): Modal/Dialog وتنظيف الألوان
- [ ] إنشاء `Modal.tsx` موحد
- [ ] استبدال جميع `hardcoded colors` بقيم من `tokens.css`
- [ ] تنظيف `globals.css` و `wisal-atelier.css` من المتغيرات القديمة
- [ ] توحيد `border-radius` و `box-shadow`
- [ ] **التحقق**: Visual regression + build + tests

### Sprint 5 (الأسبوع 5): Polish & QA
- [ ] مراجعة شاملة للـ Dashboard، Studio، Invitations
- [ ] اختبار RTL + Dark mode (إذا مطبق)
- [ ] Accessibility audit
- [ ] Performance check
- [ ] توثيق Design System 2.0 النهائي

---

## ملفات ستتأثر (قائمة شاملة)

### ملفات الحذف/التعديل الجذري:
| الملف | نوع التغيير |
|--------|-------------|
| `app/globals.css` | تنظيف جذري: إزالة vars القديمة، استبدال hardcoded colors، توحيد radius/shadow |
| `app/wisal-atelier.css` | إزالة vars القديمة، الاحتفاظ فقط بأنماط Atelier الخاصة |
| `app/wisal-atlas.css` | تبسيط، إزالة المتغيرات المكررة |
| `app/design/tokens.css` | **المصدر الوحيد** - إضافة جميع المتغيرات المطلوبة |

### ملفات الإنشاء الجديدة:
| الملف | الوصف |
|--------|---------|
| `app/components/ui/Button.tsx` | مكون زر موحد (4 variants) |
| `app/components/ui/Card.tsx` | مكون بطاقة موحد (4 variants) |
| `app/components/ui/Input.tsx` | Input موحد |
| `app/components/ui/Modal.tsx` | Modal موحد |
| `app/components/ui/Badge.tsx` | Badge/Status موحد |
| `app/components/ui/index.ts` | Barrel export |

### ملفات التحديث (استبدال الكلاسات بـ مكونات):
| الملف | نوع التغيير |
|--------|-------------|
| `app/page.tsx` | استبدال `.primary`, `.atlas-primary`, `.ghost`, etc بـ `<Button>` |
| `app/page.tsx` | استبدال `.studio-templates>button`, `.template-card` بـ `<Card>` |
| `app/page.tsx` | استبدال `.create-modal`, `.modal-backdrop` بـ `<Modal>` |
| `app/page.tsx` | استبدال `.ghost`, `.danger-button`, `.text-button` بـ `<Button variant="...">` |
| `app/invite/[slug]/InvitationClient.tsx` | تحديث الألوان والـ radius |
| `app/invite/preview/[concept]/page.tsx` | تحديث الألوان |
| `app/admin-dashboard.tsx` | تحديث الجداول والبطاقات |
| `app/admin-payments.tsx` | تحديث البطاقات |
| `app/account-center.tsx` | تحديث النماذج |
| `app/checkout/[id]/status/page.tsx` | تحديث البطاقات |
| `app/auth/*/page.tsx` | تحديث النماذج والأزرار |

---

## معايير القبول (Definition of Done)

### لكل Phase:
- [ ] `npm run build` ✅
- [ ] `npm run lint` ✅ (صفر errors)
- [ ] `npm run test` ✅ (213/213 pass)
- [ ] `npm run build` production build successful
- [ ] Visual regression: صفر اختلافات في 8 عرض مختلف (320, 375, 390, 414, 768, 1024, 1280, 1440)
- [ ] لا ألوان hardcoded في الكود الجديد (`grep -r "#[0-9a-fA-F]\{3,6\}" app --include="*.tsx" | grep -v "node_modules" | grep -v ".css"` = 0)
- [ ] لا متغيرات لونية قديمة في CSS الجديد (`grep -r "plum|rose|ivory|sage|ink|gold|paper" app --include="*.css" | grep -v "tokens.css" | grep -v "var(--ds-"` = 0)
- [ ] جميع `border-radius` من tokens فقط (`grep -r "border-radius:" app --include="*.css" | grep -v "var(--ds-radius"` = 0 أو فقط الاستثناءات الموثقة)
- [ ] جميع `box-shadow` من tokens فقط
- [ ] Accessibility: contrast ratio ≥ 4.5:1 للنصوص، 3:1 للعناصر الكبيرة
- [ ] RTL: يعمل بشكل صحيح مع `dir="rtl"`
- [ ] Dark mode (إن وجد): الألوان تتكيف تلقائياً عبر tokens

---

## أوامر التحقق التلقائية

```bash
# التحقق من عدم وجود ألوان hardcoded في TSX
grep -rn "#[0-9a-fA-F]\{3,6\}" app --include="*.tsx" | grep -v "node_modules" | grep -v "\.css" | grep -v "tokens.css"

# التحقق من عدم وجود متغيرات قديمة في CSS
grep -r "plum\|rose|ivory|sage|ink|gold|paper|sage" app --include="*.css" | grep -v "tokens.css" | grep -v "var(--ds-"

# التحقق من border-radius
grep -r "border-radius:" app --include="*.css" | grep -v "var(--ds-radius" | grep -v "50%" | grep -v "160px\|170px\|120px\|100px"

# التحقق من box-shadow
grep -r "box-shadow:" app --include="*.css" | grep -v "var(--ds-shadow"

# تشغيل الاختبارات الكاملة
npm run lint && npm run build && npm test

# Visual regression
npm run test:visual  # إذا مُعد
```

---

## جدول زمني مقترح

| الأسبوع | المرحلة | المخرجات |
|---------|---------|----------|
| 1 | Phase 1: توحيد المتغيرات | `tokens.css` محدث، `layout.tsx` محدث، متغيرات قديمة محذوفة |
| 2 | Phase 2: الأزرار | `Button.tsx`، استبدال 7 variants بـ 4 |
| 3 | Phase 3: البطاقات + النماذج | `Card.tsx`، `Input.tsx`، `Select.tsx` |
| 4 | Phase 4: Modal + تنظيف الألوان | `Modal.tsx`، تنظيف `globals.css` |
| 4 | Phase 5: Radius + Shadows | توحيد radius/shadow، تنظيف CSS |
| 5 | Polish + QA | مراجعة شاملة، accessibility، RTL، performance |

---

## ملاحظات هامة للتنفيذ

1. **لا تكسر الموجود**: كل تغيير يمر بـ `npm run build && npm test` قبل الكوميت
2. **Visual Regression**: استخدم `npm run test:visual` أو screenshots يدوية بعد كل phase
3. **Backward Compatibility**: المكونات الجديدة (`Button`, `Card`) يجب أن تدعم نفس API القديم + improvements
4. **RTL First**: كل تغيير يُختبر مع `dir="rtl"` و `dir="ltr"`
5. **Dark Mode**: إذا أُضيف لاحقاً، الـ tokens جاهزة (`color-mix` مع `--ds-surface`)

---

## الخطوة التالية الفورية

**ابدأ بـ Phase 1.1**: تحديث `app/design/tokens.css` لإضافة جميع المتغيرات المفقودة، ثم تحديث `layout.tsx` لاستيراد `tokens.css` أولاً، ثم إزالة المتغيرات القديمة من `globals.css` و `wisal-atelier.css`.

هل تريد أن أبدأ بتنفيذ **Phase 1.1** الآن؟