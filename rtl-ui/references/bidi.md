# Mixed-direction text (bidi)

Read this when Arabic and Latin text, numbers or symbols appear in the same line and come out in the wrong order.

## Why it breaks

The Unicode Bidirectional Algorithm (UAX #9) gives every character a type:

- **Strong:** Arabic and Hebrew letters (RTL), Latin letters (LTR).
- **Weak:** digits, `+`, `-`, `%`, currency signs. Digits keep their own left-to-right order inside a run.
- **Neutral:** spaces, most punctuation, `@`, `/`, `:`, `(`, `)`.

Neutrals take the direction of the strong characters around them. At the boundary between an RTL paragraph and an LTR run, neutrals join the paragraph direction. That is how these happen:

| Intended | Rendered in an RTL paragraph without isolation |
|---|---|
| `+966 50 123 4567` | `4567 123 50 966+` (digit groups reverse, the `+` moves to the end) |
| `support@grwlab.net` at the end of an Arabic sentence followed by `.` | the period jumps to the wrong side |
| `C++` | `++C` |
| `Order #A-1042` | `A-1042#` |

## Fixes, from best to last resort

### 1. Markup isolation (HTML you control)

```html
<p>للتواصل: <bdi>support@grwlab.net</bdi>.</p>
<p>رقم الهاتف: <span dir="ltr">+966 50 123 4567</span></p>
<p>اسم المستخدم: <bdi>{user.name}</bdi></p>
```

- `<bdi>` isolates and lets the browser detect the direction (like `dir="auto"`). Use it for values you don't control: user names, product names, search terms.
- `<span dir="ltr">` isolates and forces LTR. Use it for values that are always LTR: phone numbers, emails, URLs, code, SKUs.
- In HTML5, any element with a `dir` attribute is isolated from its surroundings.

### 2. CSS isolation

```css
.ltr-value { direction: ltr; unicode-bidi: isolate; }
.user-value { unicode-bidi: plaintext; } /* detect direction per paragraph */
```

Use `isolate`, not the older `embed` or `bidi-override`. `bidi-override` forces every character's order and breaks Arabic.

### 3. Unicode control characters (plain strings)

For places with no markup: `<title>`, `<option>`, `alert()`, notifications, push messages, SMS, CSV exports, emails sent as plain text, native toasts.

| Name | Code point | Use |
|---|---|---|
| FSI (first strong isolate) | `U+2068` | Start an isolated run whose direction is detected |
| LRI (left-to-right isolate) | `U+2066` | Start an isolated LTR run |
| RLI (right-to-left isolate) | `U+2067` | Start an isolated RTL run |
| PDI (pop directional isolate) | `U+2069` | End any of the three above |
| LRM (left-to-right mark) | `U+200E` | Invisible strong LTR character; fixes one neutral at an edge |
| RLM (right-to-left mark) | `U+200F` | Invisible strong RTL character |
| ALM (Arabic letter mark) | `U+061C` | Like RLM, for Arabic contexts |

```js
const isolate = (s) => `\u2068${s}\u2069`;          // detected direction
const ltr = (s) => `\u2066${s}\u2069`;              // forced LTR

const msg = `تم إرسال الرمز إلى ${ltr('+966 50 123 4567')}`;
document.title = `${isolate(product.name)} | المتجر`;
```

Always close what you open. An unclosed isolate leaks into the rest of the string.

Avoid the older embedding controls LRE/RLE/PDF (`U+202A`, `U+202B`, `U+202C`) and overrides LRO/RLO (`U+202D`, `U+202E`). They don't isolate, and RLO is a known spoofing vector.

### 4. Single neutral at the edge

When only one punctuation mark lands on the wrong side, an invisible mark next to it is enough. Example: an English product name at the end of an Arabic sentence pushes the final period to the wrong side. An RLM after the name gives the period an RTL neighbour:

```js
`اشترِ ${name}\u200F.`
```

Prefer isolating the whole value (section 3). A mark fixes one symptom; an isolate fixes the run.

## Patterns

| Content | Treatment |
|---|---|
| Phone numbers | `dir="ltr"` span; Western digits |
| Email, URL, username, file path | `dir="ltr"` span or LRI…PDI |
| Code, CLI commands, JSON | `<code dir="ltr">` / `<pre dir="ltr">` |
| Prices with currency | Isolate the whole amount + symbol together: `<bdi>1,250 ر.س</bdi>`; see `arabic-copy` for symbol placement |
| Brand names in Latin inside Arabic | Usually fine without isolation; isolate if followed by punctuation or numbers |
| User-generated content (comments, names, titles) | `dir="auto"` on the container, `<bdi>` inline |
| Input fields for free text | `dir="auto"` |
| Input fields for always-Latin values | `dir="ltr"` |
| Table cells with mixed content | `dir="auto"` per cell, or isolate values |
| Hashtags and mentions | Isolate: `<bdi>#عروض_اليوم</bdi>` |

## Testing strings

Paste these into your UI in an RTL page and check each renders as written:

```
اتصل على +966 50 123 4567 الآن.
راسلنا على support@example.com.
الإصدار 2.4.1 (beta) متاح.
السعر: 1,250.00 ر.س
تم تحديث C++ وNode.js.
الطلب #A-1042 قيد الشحن.
```
