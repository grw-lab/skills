# Common mistakes in translated Arabic

Read this when reviewing Arabic copy, especially machine-translated or agency-translated text. Each row: the mistake, an example, the fix.

## Bloat and stiffness

| Mistake | Wrong | Right |
|---|---|---|
| `قم بـ` + verbal noun (calque of "do the action of") | قم بتسجيل الدخول | سجّل الدخول / تسجيل الدخول |
| `الخاص بك` after a possessive (calque of "your own") | حدّث معلوماتك الخاصة بك | حدّث معلوماتك |
| Possessive on every noun (calque of "your") | أدخل اسمك وبريدك الإلكتروني ورقم جوالك لإنشاء حسابك | أدخل الاسم والبريد الإلكتروني ورقم الجوال لإنشاء حساب |
| Over-formal politeness | يرجى التكرم بالضغط على الزر | اضغط على الزر / يُرجى الضغط على الزر |
| `يرجى` on every line | يرجى إدخال… يرجى اختيار… يرجى الضغط… | One `يُرجى` per message, or none |
| `من فضلك` in system text | من فضلك انتظر | جارٍ التحميل… |
| `لقد` padding in confirmations | لقد تم حفظ التغييرات بنجاح | تم حفظ التغييرات |
| `بنجاح` everywhere | تم الحفظ بنجاح | تم الحفظ |
| `عملية` padding | عملية الدفع | الدفع |

## Literal translation

| Source | Literal (wrong) | Natural |
|---|---|---|
| Piece of cake | قطعة من الكعك | سهل جدًا |
| You're all set | أنت مُعد بالكامل | كل شيء جاهز |
| Hang tight | تمسّك جيدًا | لحظات من فضلك / لحظات ونكمل |
| Oops! | أوبس! | عذرًا، |
| Heads up | ارفع رأسك | تنبيه: |
| Check out our new features | تحقق من ميزاتنا الجديدة | اكتشف الميزات الجديدة |
| Let's go! | دعنا نذهب! | يلا! / هيا بنا! (marketing) / ابدأ الآن (UI) |
| Powered by X | مدعوم من X | بواسطة X |
| Sign up for free | سجّل مجانًا | أنشئ حسابك مجانًا |
| Hit the button | اضرب الزر | اضغط على الزر |

`دعنا` and `دعونا` are calques of "let's" and sound translated. Use a direct form: `لنبدأ`، `هيا نبدأ`, or rephrase.

## Word order and grammar

| Mistake | Wrong | Right |
|---|---|---|
| English adjective order | الجديدة الميزات | الميزات الجديدة |
| Noun–adjective agreement | المنتجات الجديد | المنتجات الجديدة |
| `تم` agreement with feminine verbal nouns | تم إضافة المنتج | تمت إضافة المنتج |
| Numbers 3–10 with singular noun | 3 منتج | 3 منتجات |
| Numbers 11+ with plural noun | 15 منتجات | 15 منتجًا (or handle with plural rules in code) |
| Passive overuse from English | تم الضغط على الزر بواسطة المستخدم | ضغط المستخدم على الزر |

## Spelling

| Mistake | Wrong | Right |
|---|---|---|
| Missing hamza on alif (form IV verbal nouns and imperatives) | الغاء، انشاء، اعدادات، اضف، ارسال | إلغاء، إنشاء، إعدادات، أضف، إرسال |
| Hamza where none belongs (form VIII/X verbal nouns) | إستخدام، إستمرار، إختيار | استخدام، استمرار، اختيار |
| `ه` instead of `ة` | الصفحه، الخدمه | الصفحة، الخدمة |
| `ي` instead of `ى` | علي (when meaning "on")، الي، حتي | على، إلى، حتى |
| `ى` instead of `ي` | فى، الذى | في، الذي |
| Tanween placement inconsistency | شكراً … جداً … أيضًا | Pick one: شكرًا، جدًا، أيضًا (recommended) |
| `مسئول` vs `مسؤول` | mixed | Pick one; `مسؤول` is the common modern form |
| Latin comma in Arabic | الاسم, البريد | الاسم، البريد |
| Space before punctuation | هل أنت متأكد ؟ | هل أنت متأكد؟ |
| Tatweel for emphasis | عـــرض | عرض |

Quick rule for hamza at the start: verbal nouns and imperatives of form IV verbs take `إ`/`أ` (`أرسل` → `إرسال`). Forms VII, VIII and X take a plain `ا` (`انطلاق`، `اختيار`، `استخدام`).

## Gender slips

| Mistake | Example | Fix |
|---|---|---|
| Masculine imperative in a "neutral" product | اختر خطتك | اختيار الباقة / يُرجى اختيار الباقة |
| Mixed genders in one flow | أهلًا بكِ … اختر … | Pick one policy and apply it to the whole flow |
| `عزيزي العميل` in templates | عزيزي العميل، | مرحبًا {name}، |
| Diacritics that add gender | يمكنكَ | يمكنك |

## Numbers and symbols

| Mistake | Fix |
|---|---|
| Western and Arabic-Indic digits on one screen | One system per product |
| `SAR150` or `ر.س 150` in Arabic text | `150 ر.س` |
| Percent sign on the wrong side with Arabic-Indic digits | `٢٠٪` |
| Phone number reversed in RTL | Isolate it; see the `rtl-ui` skill |
| Dates as `10/08/2026` with no context | Write the month: `8 أكتوبر 2026` (Gulf, Egypt) or `8 تشرين الأول 2026` (Levant) |
