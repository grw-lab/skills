# Microcopy patterns with examples

Read this when writing screens from scratch or rewriting a full flow. All examples use simplified MSA, gender-neutral address and Western digits.

## Errors

Structure: what happened. What to do now. Optional: why.

| Situation | English source | Arabic |
|---|---|---|
| Required field | This field is required | هذا الحقل مطلوب |
| Bad email | Please enter a valid email | يُرجى إدخال بريد إلكتروني صحيح، مثل name@example.com |
| Short password | Password must be at least 8 characters | يجب ألا تقل كلمة المرور عن 8 أحرف |
| Passwords differ | Passwords don't match | كلمتا المرور غير متطابقتين |
| Wrong credentials | Incorrect email or password | البريد الإلكتروني أو كلمة المرور غير صحيحة |
| Wrong OTP | The code is incorrect | الرمز غير صحيح. يُرجى التحقق منه والمحاولة مرة أخرى |
| Expired OTP | The code has expired | انتهت صلاحية الرمز. يُرجى طلب رمز جديد |
| No connection | You're offline | لا يوجد اتصال بالإنترنت |
| Server error | Something went wrong. Please try again | حدث خطأ ما. يُرجى المحاولة مرة أخرى |
| Payment declined | Your card was declined | تعذّر إتمام الدفع. يُرجى استخدام بطاقة أخرى أو التواصل مع البنك |
| Upload too large | File is too large (max 10 MB) | حجم الملف أكبر من الحد المسموح (10 ميجابايت) |
| Not found | Page not found | الصفحة غير موجودة |
| No permission | You don't have access to this page | ليست لديك صلاحية الوصول إلى هذه الصفحة |

`لديك` is gender-neutral in writing. `لا تملك` would be masculine (feminine: `لا تملكين`).

## Empty states

Structure: what's empty. One line on value. One action.

| Screen | Arabic |
|---|---|
| Orders | **لا توجد طلبات بعد** · ستظهر طلباتك هنا بعد أول عملية شراء. · [تصفّح المنتجات] |
| Cart | **السلة فارغة** · أضف منتجات لتبدأ الطلب. · [متابعة التسوق] |
| Search | **لا توجد نتائج لـ «{query}»** · جرّب كلمات أخرى أو تحقق من الإملاء. |
| Notifications | **لا إشعارات جديدة** |
| Projects | **لا توجد مشاريع** · أنشئ أول مشروع لتنظيم عملك. · [مشروع جديد] |

The cart line uses the imperative `أضف` because e-commerce users expect it; switch to `إضافة منتجات لبدء الطلب` for a strictly neutral voice.

## Confirmations and toasts

| Event | Arabic |
|---|---|
| Saved | تم الحفظ |
| Settings saved | تم حفظ الإعدادات |
| Added to cart | تمت إضافة المنتج إلى السلة |
| Removed | تمت الإزالة |
| Copied | تم النسخ |
| Email sent | أرسلنا رسالة إلى {email} |
| Code sent | أرسلنا رمز التحقق إلى {phone} |
| Order placed | تم استلام طلبك رقم {id} |
| Password changed | تم تغيير كلمة المرور |
| Undo | تراجع |

Use first person plural (`أرسلنا`) for things the company did. It is warmer than `تم إرسال` and avoids addressing the user.

## Destructive confirmations

```
حذف «{project}»؟
سيُحذف المشروع وكل ملفاته نهائيًا، ولا يمكن التراجع عن ذلك.
[حذف]  [إلغاء]
```

Name the thing. Say what is lost. Put the destructive verb on the button, never `نعم` / `لا`.

## Onboarding

| Step | Arabic |
|---|---|
| Welcome title | مرحبًا بك في {brand} |
| Value line | كل طلباتك وفواتيرك في مكان واحد. |
| Permission ask (notifications) | فعّل الإشعارات لتصلك تحديثات الطلب أولًا بأول. · [تفعيل] [ليس الآن] |
| Progress | الخطوة 2 من 3 |
| Finish | كل شيء جاهز! |

`ليس الآن` is the standard soft decline. Avoid `لا شكرًا` in permission dialogs.

## Calls to action

| Goal | Arabic |
|---|---|
| Start | ابدأ الآن |
| Free trial | جرّب مجانًا لمدة 14 يومًا |
| Buy | اشترِ الآن |
| Book | احجز موعدك |
| Contact sales | تواصل مع المبيعات |
| Download app | حمّل التطبيق |
| Subscribe to newsletter | اشترك في النشرة البريدية |
| See plans | اطّلع على الباقات |

CTAs are usually imperative, even in neutral products, because it reads naturally and the masculine imperative is the accepted generic form for short commands. If the brief requires strict neutrality, use the verbal noun: `بدء التجربة المجانية`.

`حمّل التطبيق` uses `حمّل` because that is the established phrase for app downloads in app-store language; in file UI prefer `تنزيل`.

## Notifications (push and SMS)

Keep under about 60 characters for the title. Put the useful part first.

| Event | Arabic |
|---|---|
| Shipped | طلبك {id} في الطريق 🚚 |
| Delivered | تم توصيل طلبك {id} |
| Abandoned cart | منتجاتك ما زالت في السلة |
| OTP SMS | رمز التحقق: {code}. لا تشاركه مع أي شخص. |
| Price drop | انخفض سعر {product} إلى {price} ر.س |

For SMS with codes and phone numbers, isolate Latin and numeric runs with Unicode isolates; see the `rtl-ui` skill, `references/bidi.md`.

## Forms

| Element | Pattern | Example |
|---|---|---|
| Label | Noun, no colon | الاسم الكامل |
| Placeholder | Example value, not a repeat of the label | مثال: محمد عبدالله |
| Helper text | Short, why or format | سنرسل رمز التحقق إلى هذا الرقم |
| Optional marker | (اختياري) after the label | اسم الشركة (اختياري) |
| Submit | Verbal noun or the action's result | إنشاء الحساب |
