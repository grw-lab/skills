# Which icons and images to mirror

Read this when deciding icon by icon. The rule: mirror what shows movement or order along the reading line. Keep what represents a real-world object, a universal convention, or the brand.

## Mirror in RTL

| Icon | Why |
|---|---|
| Back / forward arrows | Back points toward the inline start |
| Chevrons for "next", breadcrumbs, expand-to-the-side | Point toward the inline end |
| Arrow on "Continue", "Read more", CTA buttons | Same |
| Pagination previous / next | Same |
| Undo / redo | Swap: undo points toward the inline start |
| Reply / reply all / forward (email) | Show direction of the message |
| Send (paper plane) | Flies toward the inline end |
| Bulleted and numbered list | Bullets sit at the inline start |
| Indent / outdent | Follow the text |
| Text align start / end | Follow the text |
| Progress bars, sliders, steppers | Fill from the inline start |
| Sidebar open / close, drawer toggle | Panel side follows layout |
| Logout / exit (door with arrow) | Arrow leaves toward the inline end in most sets |
| Speech bubble with a tail | Tail usually points to the start |
| Star rating partial fills (half star) | The filled half follows direction |
| "Trending" / chart line going up and right | Usually mirrored in RTL dashboards; be consistent |

## Do not mirror

| Icon | Why |
|---|---|
| Logos, brand marks, app icons | Brand identity |
| Play, pause, fast-forward, rewind, skip | Follow tape and media convention worldwide |
| Checkmark | Universal |
| Clock, timer, history (circular arrow around a clock) | Clocks run clockwise everywhere |
| Refresh / reload / sync (circular) | Rotation, not reading direction |
| Search (magnifier) | Most systems keep it; mirroring is optional and rarely worth it |
| Slash icons (mute, no-camera, hide) | The slash direction is a convention |
| Anything containing Latin letters or digits | Text would read backwards |
| Numeric chart axes | Numbers stay left to right |
| Real objects: camera, phone, keyboard, headphones, bicycle | Objects don't have a reading direction |
| Hand icons that show the right hand | Most people are right-handed in every script |
| Help / question mark | `?` is a Latin glyph; the Arabic `؟` is a different character |
| Plus, minus, close (×) | Symmetric |
| Upload / download | Vertical |

## Your call (pick once, apply everywhere)

- External link (box with arrow up and out).
- Shopping cart (handle side). Many Arabic stores mirror it; many don't.
- Volume with sound waves.
- Map pins, location arrows (geography doesn't flip).

## How to mirror

Prefer a separate asset or the opposite icon from the same set (`chevron-left` ↔ `chevron-right`) when:

- the icon has an inner shadow, gradient or highlight that would also flip;
- the icon contains text.

Otherwise flip with CSS, scoped to a marker class:

```css
[dir="rtl"] .icon-dir { transform: scaleX(-1); }
```

If the icon already has a transform (rotate for an expanded chevron), combine them:

```css
.chevron { transform: rotate(var(--rot, 0deg)); }
.chevron[aria-expanded="true"] { --rot: 90deg; }
[dir="rtl"] .chevron { transform: scaleX(-1) rotate(var(--rot, 0deg)); }
```

Never put `scaleX(-1)` on a container. It mirrors text, images and children too.

## Images and illustrations

- Photos of people and places: never mirror (faces and signs read wrong).
- Illustrations with a direction story (a figure walking "forward", a rocket going "ahead"): mirror or redraw.
- Screenshots of the product: use the RTL screenshot; don't mirror an LTR one.
