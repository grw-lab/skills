---
name: arabic-copy
description: Writes and reviews natural Arabic UI text and marketing copy instead of literal translation. Picks the right register (simplified Modern Standard Arabic for product UI, Saudi, Gulf, Egyptian or Levantine for marketing when asked), addresses users without assuming gender, and gets punctuation, numbers, dates, currency and spelling right. Use when a user asks to translate an interface, app strings, a landing page, emails or notifications into Arabic, to "make the Arabic sound natural", to review Arabic copy, or to write Arabic buttons, error messages, empty states or onboarding.
---

# Arabic Copy

Write Arabic that reads as if it was written in Arabic first.

## When to use

- Translating UI strings, emails, push notifications or a landing page into Arabic.
- Reviewing existing Arabic copy that "sounds translated".
- Writing new Arabic microcopy: buttons, errors, empty states, onboarding, CTAs.

## When not to use

- Layout or direction bugs (text reversed, icons on the wrong side). Use `rtl-ui`.
- String extraction, plural rules in code, date and number formatting APIs. Use `arabic-localization`.
- Legal or medical text that needs a certified translator. Say so and offer a draft only.

## Workflow

1. **Get the brief.** Before writing, settle these (ask once if you can't infer them; otherwise use the defaults in brackets):
   - Audience country or region [Saudi Arabia and the Gulf].
   - Surface: product UI, marketing, transactional email, legal [product UI].
   - Register [simplified Modern Standard Arabic, فصحى مبسطة].
   - How to address the user: neutral, masculine, feminine, plural [neutral].
   - Digits: Western `0-9` or Arabic-Indic `٠-٩` [Western].
   - Terms to keep in English (brand, product and feature names) [all product and brand names].
2. **Translate meaning, not words.** Read the whole screen or paragraph first. Ask what the user needs to do or know, then write that in Arabic. Never translate string by string without context.
3. **Apply the patterns** below for buttons, errors, empty states and CTAs. Longer examples: [references/patterns.md](references/patterns.md).
4. **Check terms** against [references/glossary.md](references/glossary.md) so the same English word gets the same Arabic word everywhere.
5. **Review** with the checklist at the end and the error list in [references/mistakes.md](references/mistakes.md).
6. **Deliver** as a table: key or English source, Arabic, and a short note where you made a choice (register, gender, a term kept in English). Flag any string you couldn't place in context.

## Register

| Surface | Default register |
|---|---|
| Product UI (buttons, labels, settings, errors) | Simplified MSA. Short, plain, no ornate vocabulary |
| Transactional email and notifications | Simplified MSA, slightly warmer |
| Marketing (ads, social, landing hero) | MSA by default. Dialect only when the brief asks for it |
| Legal, terms, privacy | Formal MSA |

Simplified MSA is what Arabic users expect from apps across the region. It avoids both the stiffness of classical phrasing (`يرجى التكرم بـ`) and the regional limits of dialect.

Dialect works for marketing aimed at one market. Don't mix dialects in one product, and don't use dialect in errors or settings. The same line in each register:

| English | Simplified MSA | Saudi / Gulf | Egyptian | Levantine |
|---|---|---|---|---|
| Get started | ابدأ الآن | يلا نبدأ | يلا نبدأ | يلا نبلّش |
| What do you want to do today? | ماذا تريد أن تفعل اليوم؟ | وش تبي تسوي اليوم؟ | عايز تعمل إيه النهارده؟ | شو بدك تعمل اليوم؟ |
| Something went wrong | حدث خطأ ما | صار خطأ | حصلت مشكلة | صار في خطأ |
| Don't miss out | لا تفوّت الفرصة | لا يفوتك | ما تفوّتش الفرصة | ما تفوّت الفرصة |

More register guidance and when dialect backfires: [references/registers.md](references/registers.md).

## Addressing the user without assuming gender

Arabic marks gender on verbs, adjectives and some pronouns. The common default in apps is the masculine singular. It's understood by everyone, but it excludes half the audience. Use these, in order:

1. **Verbal nouns (مصدر) for buttons and labels.** They have no gender.
   `Save` → `حفظ` · `Sign in` → `تسجيل الدخول` · `Continue` → `متابعة` · `Add to cart` → `إضافة إلى السلة`
2. **Impersonal and passive statements.**
   `You can change this later` → `يمكن تغيير ذلك لاحقًا`
   `You saved your changes` → `تم حفظ التغييرات`
3. **Pronoun suffixes that look the same in writing.** Without diacritics, `ـك` is the same for both genders: `حسابك`، `طلبك`، `يمكنك`. Don't add the vowel marks that would gender them (`يمكنكَ`).
4. **Plural address** for marketing and community content: `نرحّب بكم`، `انضموا إلينا`. Natural in the Gulf and in brand voice. It sounds odd in system errors.
5. **`يُرجى` + verbal noun** for instructions in errors and forms: `يُرجى إدخال رمز التحقق`، `يُرجى إعادة المحاولة`. Neutral and polite. Don't stack it on every line; one per message is enough.
6. **Gendered forms** only when the product knows the user's gender (an explicit profile setting) or the audience is single-gender by design. Then use them correctly and everywhere.

Avoid `عزيزي العميل` in templates. Use `مرحبًا {name}` or `مرحبًا بك`.

Imperatives (`اكتب` / `اكتبي`) and present-tense verbs (`تستطيع` / `تستطيعين`) are gendered. Replace them with a verbal noun, `يمكنك`, or `يُرجى` + verbal noun:
`Enter your email` → `أدخل بريدك الإلكتروني` (masculine) → better: label `البريد الإلكتروني`, placeholder `name@example.com`, and if an instruction is needed, `يُرجى إدخال بريدك الإلكتروني`.

## Microcopy patterns

**Buttons.** One to three words. A verbal noun or a short imperative, consistent across the product. Pick one style per product and keep it.

| English | Verbal-noun style | Imperative style |
|---|---|---|
| Save | حفظ | احفظ |
| Add to cart | إضافة إلى السلة | أضف إلى السلة |
| Try again | إعادة المحاولة | حاول مرة أخرى |
| Send | إرسال | أرسل |

The verbal-noun style is gender-neutral and calmer. The imperative style is punchier and common in e-commerce CTAs, but masculine.

**Errors.** Say what happened and what to do. No blame, no codes in the main line.

- `Invalid input` → not `مدخل غير صالح`. Write `يُرجى إدخال بريد إلكتروني صحيح، مثل name@example.com`.
- `Network error` → `تعذّر الاتصال. يُرجى التحقق من الإنترنت ثم إعادة المحاولة.`
- Use `تعذّر` ("couldn't") for system failures. It's neutral and doesn't blame the user.

**Empty states.** What's missing, why it matters, one action.
`No orders yet` → `لا توجد طلبات بعد` + `ابدأ التسوق`

**Confirmations.** `تم` + verbal noun: `تم الحفظ`، `تم إرسال الرمز`، `تمت إضافة المنتج إلى السلة`. Use `تمت` when the verbal noun is feminine (`إضافة`، `إزالة`).

**Destructive actions.** Name the thing: `حذف المشروع؟ لا يمكن التراجع عن هذا الإجراء.` Buttons: `حذف` / `إلغاء`.

## Punctuation and typography

| Mark | Arabic | Code point | Rule |
|---|---|---|---|
| Comma | ، | U+060C | Never the Latin `,` in Arabic text |
| Semicolon | ؛ | U+061B | |
| Question mark | ؟ | U+061F | |
| Quotes | « » | U+00AB / U+00BB | `«النص»` with no inner spaces. `" "` is acceptable if the brand prefers it; be consistent |
| Full stop, `!`, `:` | Same as Latin | | |

- No space before a punctuation mark. One space after.
- No tatweel (ـ) to stretch words. It breaks search and copy-paste.
- Tanween on alif: write `شكرًا`، `أيضًا`، `جدًا` (mark on the letter before the alif). That is the current recommendation of most style guides. Some brands use `شكراً`; pick one and keep it.
- Diacritics: none in UI, except where a word would be misread (`تعذّر` with shadda is fine and helps).
- Don't attach Arabic letters to a Latin word (`الAPI`، `بالـiPhone`). Rephrase: `واجهة API`، `على iPhone`.

## Numbers, dates and currency

- **Digits.** Use the brief's choice everywhere, including inside sentences. Saudi and Gulf products mostly use Western digits; Egyptian government and formal print often use Arabic-Indic. Never mix the two on one screen.
- **Numbers with words.** In UI, write the digit: `3 منتجات`، `15 دقيقة`. Arabic number–noun agreement (3–10 take a plural noun, 11+ take a singular accusative noun, 1 and 2 have their own forms) must be handled in code with plural rules, not by hand. Hand that to `arabic-localization` and give the translator all forms: zero, one, two, few, many, other.
- **Currency (SAR).** The amount comes first, then the symbol: `150 ر.س` or `150 ريال`. In Latin-digit contexts `SAR 150` is also used. Keep the amount and symbol together with a no-break space so they don't wrap apart. The Saudi Central Bank introduced an official riyal sign in 2025, encoded in Unicode 17.0 as U+20C1 (not U+FDFC ﷼). Many fonts don't include it yet, so check font support before using it. `ر.س` is always safe.
  Other Gulf and nearby currencies: `د.إ` (AED), `د.ك` (KWD), `ر.ق` (QAR), `د.ب` (BHD), `ر.ع` (OMR), `ج.م` (EGP).
- **Dates.** Two month-name systems exist. Egypt, the Gulf and the Maghreb use `يناير، فبراير، مارس…`. The Levant and Iraq use `كانون الثاني، شباط، آذار…`. Choose by audience. Saudi official and government contexts also use the Hijri calendar; if you show it, label it (`١٤٤٨ هـ`).
- **Times.** `ص` (AM) and `م` (PM): `9:30 م`. 24-hour time is fine in transactional contexts.
- **Percent.** `20%` with Western digits; `٢٠٪` with Arabic-Indic digits.

## Terms to keep in English

Keep brand, product and feature names as they are: `iPhone`، `Apple Pay`، `Google`، `WhatsApp`. Keep technical terms when that is what your users actually say and search for: `API`، `URL`، `Wi-Fi`، `Bluetooth`، `QR`. When an established Arabic term exists and is common (`البريد الإلكتروني`، `كلمة المرور`، `رمز التحقق`), use it.

When unsure, check what the leading apps in the target country say for the same thing. Users learn terms from those apps.

## Length

Arabic UI text is often wider than the English source: plan for about 20% to 30% more width on labels and buttons. It varies a lot: some strings come out shorter, some much longer. Don't shorten Arabic by dropping meaning; ask for more room or rephrase. Flag strings that exceed a stated character limit.

## Review checklist

Run on every delivery:

- [ ] Reads naturally aloud. A native speaker wouldn't guess it was translated.
- [ ] One register throughout; no dialect in UI chrome or errors.
- [ ] Gender policy applied consistently; no stray gendered imperatives in a neutral product.
- [ ] Same English term → same Arabic term everywhere (glossary).
- [ ] Arabic punctuation (، ؛ ؟), no space before marks, no Latin commas.
- [ ] Spelling: hamza on `إ/أ` (`إلغاء`، `إنشاء`، `أضف`)، `ة` vs `ه`، `ى` vs `ي` (`على`، `إلى`). See [references/mistakes.md](references/mistakes.md).
- [ ] One digit system on each screen; currency after the amount.
- [ ] No `قم بـ` padding, no `الخاص بك` redundancy, no `يرجى التكرم`.
- [ ] Buttons are 1 to 3 words; errors say what to do next.
- [ ] Brand and product names untouched.
- [ ] Every string with a plural has all six forms, or is flagged for `arabic-localization`.
- [ ] Strings over length limits are flagged, not silently cut.
