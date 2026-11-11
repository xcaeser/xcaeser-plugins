# Mobile web

A web app on a phone: viewport, safe areas, viewport units, input zoom, keyboards, taps, scroll chaining, carousels, status bar color, installed mode, and testing on a real device.

## Judge

- W1 Capability, not device: branch on media queries (`hover`, `pointer`, `env()`, `dvh`), never on user-agent strings or screen width as a proxy for touch. Touch and mouse coexist (iPads with trackpads, touch laptops, phones with a mouse), so gate by what the input can do.
- W2 Zoom stays on: `user-scalable=no` and `maximum-scale=1` are accessibility failures. The page zooms into an input because its font is under 16px; fix the font size.
- W3 Inputs are 16px or larger on focus targets (`input`, `textarea`, `select`), since iOS Safari zooms below 16px and never zooms back. Where the desktop design wants smaller text, scope the 16px to `(pointer: coarse)`.
- W4 Hover styles live inside `@media (hover: hover) and (pointer: fine)`. Ungated hover sticks after a tap. `hover` alone admits odd Android devices; `pointer: fine` excludes styluses. Tailwind v4 `hover:` already compiles to the hover media query; v3 needs `future.hoverOnlyWhenSupported`.
- W5 Hover-only actions (a menu that appears on hover) are unreachable by touch; the action needs a visible touch path.
- W6 Once the tap highlight is removed, every tappable has its own `:active` state, since that was the only feedback left. Press transition is 100ms (range 100 to 160ms), `ease-out`. Feedback fires on press (`:active` or `pointerdown`), never only on `click`.
- W7 Tappables carry `touch-action: manipulation` so the double-tap-zoom wait never delays `click`.
- W8 Tap highlight: `-webkit-tap-highlight-color: transparent` set once on `html`, paired with W6.
- W9 Full-height app shells, drawers and bottom-pinned UI use `100dvh`; never `100vh`, which is the largest viewport and hides bottom UI under the URL bar on load. Heroes and first screens use `100svh`, which never overflows. `dvh` on a marketing page shifts layout mid-scroll as the chrome collapses. `lvh` is almost never right. A `100vh` fallback line is allowed only when the support matrix requires it.
- W10 Safe areas: `viewport-fit=cover` is set, and every pinned surface (fixed headers, bottom tab bars, toasts, sheets) pads with `env(safe-area-inset-*)`. Without the meta tag every inset is `0px`. Insets used inside `calc()` carry a fallback value. Ordinary page flow needs none.
- W11 Controls (buttons, tabs, chips, drag handles) set `user-select: none`, `-webkit-user-select: none` and `-webkit-touch-callout: none` so long-press never selects the label or opens a callout. Never on `body`, never on content: addresses, error messages and order numbers must stay copyable.
- W12 Root scroll: `overscroll-behavior: none` on `html` for app shells with their own scroll containers, drags or canvas. A scrolling document that wants pull-to-refresh leaves it off.
- W13 Inner scrollables (sheet content, chat list, sidebar) use `overscroll-behavior: contain`, which keeps their own bounce but stops the page behind from moving.
- W14 Never stop overscroll or scroll chaining with a `touchmove` listener that calls `preventDefault()`; it blocks scrolling and makes the listener non-passive.
- W15 `touch-action` names what the browser keeps. A horizontal gesture surface sets `pan-y`; a vertical-drag surface sets `pan-x`; `none` only on an element that owns every axis (a slider, a custom drag), or the user cannot scroll past it.
- W16 Carousels that are plain scrolling use native scroll snap (`scroll-snap-type: x mandatory` on the track, `scroll-snap-align: start` on slides), not a hand-rolled spring; `touch-action` is then unnecessary.
- W17 Status bar: one `theme-color` per color scheme, taken from whatever paint sits topmost on the page (usually the header fill), not from the brand palette. A class-based theme toggle updates the tag from JavaScript.
- W18 An installed PWA makes the same color decision in `apple-mobile-web-app-status-bar-style` and the manifest `theme_color` and `background_color`.
- W19 Keyboard hints match the field: `inputmode` numeric for codes and decimal for amounts, `type="email"` and `type="tel"`, `autocapitalize="none"` and `autocorrect="off"` on usernames and codes, and `enterkeyhint` of send, search or done so the return key names its action.
- W20 The software keyboard must not strand bottom-pinned inputs: the viewport meta sets `interactive-widget=resizes-content` so Android Chrome shrinks the layout like iOS.
- W21 Landscape text stays at its size: `-webkit-text-size-adjust: 100%` on `html`.
- W22 Fix with the platform layer first. A `useIsTouchDevice()` hook to hide hover is wrong; one declaration or meta tag is right. Apply each fix only where its reason holds.
- W23 Real hardware is the bar. Sticky hover, tap delay, rubber-banding, URL bar effects on viewport units, safe areas and the keyboard do not reproduce in desktop device emulation. A check done there is reported as emulated; say which fixes were verified from code and which need a phone. The simulator beats emulation but still misses touch feel.
- W24 Device checks cover: a phone a few years old, the keyboard open, landscape once, and the installed PWA when one is targeted, since standalone mode alters the viewport, safe areas and status bar.

## Build

### Baseline

Ship before the first component of a mobile-facing app.

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content" />
<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff" />
<meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0a0a0a" />
<meta name="color-scheme" content="light dark" />
```

```css
html {
  -webkit-tap-highlight-color: transparent;
  -webkit-text-size-adjust: 100%;
  overscroll-behavior: none; /* omit for a scrolling document that wants pull-to-refresh */
}

input, textarea, select { font-size: 16px; }

button, a, [role="button"] {
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}

@media (hover: hover) and (pointer: fine) {
  /* every :hover rule lives here */
}
```

### Hover and press

```css
@media (hover: hover) and (pointer: fine) {
  .button:hover { background: var(--surface-hover); }
}

.button { transition: transform 100ms ease-out, background-color 100ms ease-out; }
.button:active { transform: scale(0.97); }
```

If the project already defines motion tokens, use them rather than a new curve. With JavaScript, listen to `pointerdown`.

### Viewport height

```css
.app  { height: 100dvh; }     /* tracks the visible area as chrome shows and hides */
.hero { min-height: 100svh; } /* stable, never overflows */
```

### Input zoom scoped to touch

```css
@media (pointer: coarse) {
  input, textarea, select { font-size: 16px; }
}
```

### Safe areas

```css
.app-header { padding-top: env(safe-area-inset-top, 0px); }
.tab-bar    { padding-bottom: env(safe-area-inset-bottom, 0px); }
.sheet      { padding-bottom: calc(1rem + env(safe-area-inset-bottom, 0px)); }
```

Header, tab bar, toast and sheet each take their own edge.

### Control selection

```css
button, [role="button"], .tab, .chip, .drag-handle {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
}
```

### Scroll containment

```css
html { overscroll-behavior: none; }
.sheet-content, .chat-list, .sidebar { overflow-y: auto; overscroll-behavior: contain; }
```

### Touch-action by surface

```css
.carousel-js    { touch-action: pan-y; }  /* gesture handles horizontal */
.sheet-handle   { touch-action: pan-x; }  /* gesture handles vertical */
.slider, .canvas { touch-action: none; }  /* owns every axis */
```

### Native carousel

```css
.track { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }
.slide { flex: 0 0 auto; scroll-snap-align: start; }
```

### Status bar color

Use the topmost surface's color for each scheme. A class-based theme toggle is invisible to the media-scoped tags, so on toggle drop the `media` attribute from the tags and set `content` to the active theme's top color:

```js
for (const tag of document.querySelectorAll('meta[name="theme-color"]')) {
  tag.removeAttribute("media");
  tag.content = color;
}
```

Next.js sets it through the `viewport` export:

```ts
export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};
```

For a PWA, set `apple-mobile-web-app-status-bar-style` and the manifest `theme_color` and `background_color` to the same top-of-page colors.

### Keyboard hints

```html
<input inputmode="decimal" enterkeyhint="done" />
<input type="email" autocapitalize="none" autocorrect="off" enterkeyhint="send" />
<input type="search" enterkeyhint="search" />
```

### Real-device recipe

1. Start the dev server bound to `0.0.0.0` and open it on the phone by the computer's LAN IP.
2. iOS: Safari, Develop menu, the connected device (Web Inspector). Android: `chrome://inspect` over USB.
3. Run on an older phone, with the keyboard open, rotated to landscape once, and installed as a PWA when that is a target.
4. Walk the baseline: tap flash, sticky hover, URL bar and `dvh`, input zoom, tap delay, overscroll, notch and home indicator, status bar color.

### Never ship

| Never | Instead |
| --- | --- |
| `user-scalable=no`, `maximum-scale=1` | 16px inputs |
| Ungated `:hover` | hover and fine-pointer media query |
| `100vh` on an app shell or anything pinned low | `100dvh` |
| `100dvh` for a landing hero | `100svh` |
| Press feedback on `click` only | `:active` or `pointerdown` |
| `touchmove` plus `preventDefault()` for overscroll | `overscroll-behavior` |
| `user-select: none` on `body` | controls only |
| `touch-action: none` on something users scroll past | `pan-x` or `pan-y` |
| `env(safe-area-inset-*)` without `viewport-fit=cover` | add the meta tag |
| One `theme-color` for both schemes | one per scheme |
| User-agent sniffing for touch | `hover` and `pointer` queries |
| Declaring it fixed from emulation | real hardware |
