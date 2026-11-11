# Motion

Whether a thing should move, how fast and on which curve, how it behaves when interrupted, what it does under reduced motion, and the recipes and removal checks for building it.

## Judge

### Whether to animate

- M1 Keyboard-initiated motion: none. A shortcut, a command palette toggle, a focus jump or arrow-key navigation that animates reads as lag, because the person repeats it hundreds of times a day. HIGH.
- M2 Frequency tiers: 100 or more times a day, no motion at all; tens of times a day (hover, frequent toggles), near-imperceptible only or nothing; occasional (modals, drawers, toasts, settings), standard motion; rare or first-time (onboarding, empty state, success, celebration), the only tier where delight, bounce or a longer beat is allowed. Core navigation, tab switches and in-app route changes sit in the top tier.
- M3 Lists are judged by frequency, not by element type: rows reached by keyboard, or scanned a hundred-plus times a day, get no motion; pointer-driven list navigation seen tens of times a day gets the reduced version.
- M4 Purpose gate: every animation names one purpose from this list: feedback (the interface heard me), spatial consistency (where it came from or went), state indication (the change is legible), softening a jarring change (content that would teleport), explanation (marketing and onboarding only), delight (rare tier only). "Looks nice" is not a purpose. No name, no animation.
- M5 Burden of proof is on the animation. "It is already there" and "it looks nice" are no defense. The opposite error is also a defect: stripping a bridge that stops a jarring change (a toast that would snap in, a panel that must show where it came from) swaps sluggishness for disorientation.
- M6 Function gate: data the person reads or acts on (charts, tables, figures, dashboards) does not move for style. Motion is allowed only to show a real change the person caused, such as a number moving from its old value to its new one after an action. A mouse-following flourish suits a marketing page; on a banking graph, no motion is better.
- M7 Re-animating functional data on every refresh or mount is decoration: charts redrawing from zero, numbers counting up on load, table rows animating in when data arrives.
- M8 A failed gate ends in an alternative, not a bare "no": offer the non-motion version (instant state change, a static affordance, a color or opacity change).
- M9 Marketing surfaces get more latitude: explanation and one hero entrance may stay. A scroll reveal repeated on every section still fails; the visitor pays for it on every section of every visit, and fast scrollers get content held back.
- M10 Infinite loops on persistent elements (pulsing badges, glowing borders, drifting gradient orbs, spinning icons that are not loading indicators) run once or go; keep the static end state.
- M11 Spinners and skeleton shimmer on loads that resolve under 300ms flash as a glitch; show nothing until the wait passes 300ms. Where a spinner is warranted, a faster-spinning one makes the same load feel faster.

### Duration and easing

- M12 Duration budgets: press feedback 100 to 160ms; tooltip and small popover 125 to 200ms; dropdown and select 150 to 250ms; modal and drawer 200 to 500ms, with 250ms the usual modal; marketing and explanatory may run longer. UI motion stays under 300ms unless the surface is large; a 180ms dropdown feels crisper than a 400ms one.
- M13 Easing by situation: entering or exiting, strong ease-out; moving or morphing on screen, strong ease-in-out; hover and color change, `ease`; constant motion (progress, marquee, spinner) and a hold-to-confirm fill, `linear`; default ease-out.
- M14 `ease-in` on UI is a defect: it starts slowly at the moment the eye is watching, so ease-out at 200ms feels faster than ease-in at 200ms. HIGH.
- M15 The browser's built-in `ease-out` is too weak for deliberate motion, and built-in `ease` or `linear` on an entrance is a finding. Use the strong curves in Build; do not hand-roll a new one.
- M16 Tokens: extend the product's existing curve and duration tokens rather than adding a parallel set. Five near-equal hand-typed beziers is a consolidation finding. LOW.
- M17 Asymmetric timing: slow where the person is deciding, snappy where the system answers. A hold-to-confirm press runs 2s linear and releases in 200ms ease-out. Symmetric timing on a press-and-release or hold is a finding. Exits run shorter than entrances.
- M18 Toasts are the exception to the budget: nothing waits on them, so on the web the entrance may run 300 to 400ms on plain `ease` when the product's character calls for it, with the exit about 20% faster.
- M19 Sheets, drawers and gesture-released motion take their physics from gestures.md, not from a duration and curve here.

### Origin, path and shape

- M20 Never `scale(0)`: start from `scale(0.9)` to `scale(0.97)` with `opacity: 0`. A pure fade with no initial transform on an occasional surface is a finding; the opacity-only form is correct only for a frequent surface or a reduced-motion variant. HIGH for `scale(0)`.
- M21 Origin: a popover, dropdown, menu or tooltip scales from its trigger, not from its center. Modals are exempt and stay centered. MEDIUM.
- M22 Spatial consistency: a surface leaves along the path it arrived by (in from the right, out to the right; in from the bottom edge, out through it). Enter and exit along different paths read as disconnected.
- M23 Mirror the easing on reversible transitions: the return path uses the inverse of the outbound cubic-bezier (swap and flip the control points).
- M24 A large surface that moves a long way (a big reposition) fades out while it travels and back in once it settles; a big surface sweeping across the screen at full opacity reads as aggressive.
- M25 Crossfade bridge: when two states visibly double-expose during a crossfade and easing and duration tuning does not fix it, bridge the seam with about 2px of blur and opacity near 0.7 during the change. A jarring crossfade left unbridged is a finding. LOW.

### Interruptibility and properties

- M26 Anything that can fire rapidly or be reversed mid-motion (toasts, toggles, expand and collapse, stacking items) uses transitions, which pick up from the current value; keyframes jump back to zero, so they serve one-shot motion only. Keyframes on a toast, toggle or anything fireable twice in a second is a defect. MEDIUM.
- M27 Decision-level property rule: transform and opacity by default. `clip-path`, `filter` and `background-color` are composite-only in current Chromium and Firefox (verify in Safari). An accordion may animate its measured height (never to `auto`) with opacity over about 200ms. An absolutely positioned childless element (a tab pill, a progress fill) may animate width to keep its corner radius. Every other layout property (`width`, `height`, `margin`, `padding`, `top`, `left`) is a defect. Costs and swaps live in performance.md.
- M28 `transition: all` is a defect: name the properties.
- M29 Pointer-tracking that is purely decorative is smoothed with a spring instead of binding the value straight to the pointer; a functional value is never smoothed this way.

### Reduced motion and vestibular safety

- M30 Reduced motion means fewer and gentler, not none. Under `prefers-reduced-motion: reduce`, slides, springs, parallax and overshoot become a short opacity crossfade (about 200ms) or a static change; opacity and color changes that carry meaning stay. Missing handling on movement is a defect. MEDIUM.
- M31 Reduce recipes, applied as a smaller version of the same motion: hover scale, lift or shadow growth becomes a color or opacity change, at most 150ms `ease`; a slide or scale entrance on a surface seen constantly becomes opacity-only, 150ms ease-out; a slide or scale anywhere a fade carries the same meaning becomes the fade; anything over 300ms becomes 200 to 250ms on the same curve; a stagger over 80ms per item or 300ms total becomes at most 30ms per item or one fade of the whole group; an infinite loop on a persistent element runs once or goes.
- M32 If reducing leaves motion too small to carry its purpose, delete it.
- M33 Vestibular: no full-viewport moving backgrounds; no slow looping oscillation near 0.2Hz (one cycle per 5s); ease light and dark theme changes and avoid abrupt brightness jumps; large moving objects are semi-transparent while they travel.
- M34 Reduced-motion branches in JavaScript read the user's setting (`useReducedMotion` in Motion) and swap the value, for example a closed offset of `0` instead of `-100%`.

### Cohesion, gaps and priorities

- M35 Cohesion: motion matches the product's character. A dashboard stays crisp and fast; a playful app may be bouncier or slower; a component's curve and duration fit its own look. A mismatched personality is a finding.
- M36 Respect documented deliberate motion: a comment or design note that explains why a specific animation exists means keep it and do not report it.
- M37 Missing motion (additive, never the main finding): content that teleports (conditional renders, accordions that snap, items added or removed with no bridge), presses with no answer, panels with no link to their trigger, surfaces that leave by a different path than they came, rare high-emotion moments left flat. Sweep for them: elements mounted or hidden instantly (`{isOpen &&`, `display: none` toggles), clickable elements that lack an `:active` style (`onClick`), `details` and accordion markup, drag handlers, `.map(` renders of lists that gain items, and empty-state and success components.
- M38 Cap suggested new animations at 5 to 7 for a whole app and 2 to 4 for one view, ordered by leverage rather than by how fun they are to build, each grounded in a seam actually observed, each carrying frequency, purpose and exact values. If nothing survives the gate, say so; that is a good result.
- M39 Fix order, earliest first: delete; reduce (shorter, smaller, fewer properties); fix the easing; fix origin and physicality; make it interruptible; move it to cheaper properties; asymmetric timing; polish (blur bridge, stagger, `@starting-style`, spring); reduced motion and cohesion. When unsure a piece feels right, deleting it is often the strongest move.
- M40 Severity. HIGH: wrong easing on UI, motion on keyboard or high-frequency actions, dropped frames, `scale(0)`. MEDIUM: wrong origin, non-interruptible dynamic UI, missing reduced motion. LOW: stagger, blur-masked crossfades, token consolidation.
- M41 Feel-check method: correct values can still feel wrong. Play it at 2 to 5 times its duration, or at 10% in the DevTools Animations panel; step it frame by frame; check that coordinated properties stay in sync, colors cross over cleanly instead of two states showing at once, the origin is right and the curve does not stop abruptly; trigger it repeatedly and confirm it never restarts from zero; emulate reduced motion in the Rendering panel and confirm movement is gone while opacity feedback stays; test gestures on a real device; look again the next day.
- M42 Opacity against height when list items enter or leave has no formula: adjust until it feels right, then look again with fresh eyes.
- M43 Feel that code cannot show (a crossfade's overlap, a spring's bounce) is never judged from code: say so, and name the feel-check that would settle it.
- M44 Map before judging: the stack and motion libraries, where motion lives (global tokens, Tailwind config, keyframes, gesture handlers), the existing conventions, the product's character, and how often each animated element is seen. Severity comes from that frequency map.
- M45 Vet every finding before reporting it: re-read the cited code, and drop what is by design, misattributed, a duplicate or exempt (a centered modal, a long marketing beat). An unconfirmed finding is not reported.

## Build

### Gate before writing

Run the order: frequency tier (M2), purpose (M4), function (M6), then tool, properties, curve, interruption, exit, reduced motion. A request that fails the first three produces no animation and offers the non-motion alternative.

### Tool ladder

Take the first that fits.

1. CSS transition: hover, press, color, a state toggle driven by a class or attribute.
2. `@starting-style`: entry on mount with no JS state.
3. CSS animation: fixed motion that has to stay smooth while the page loads or runs scripts (it avoids the main thread).
4. WAAPI (`element.animate()`): programmatic control with CSS performance and no library.
5. Motion: springs, layout animations, exit animations, values driven by a gesture.

A toast, drawer, command menu or dropdown is a component, not an animation: use a library for it (see libraries.md) instead of a hand-rolled div with no focus handling.

### Curves

```css
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* entrances, exits */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);  /* on-screen movement */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);   /* sheet and drawer travel */
```

A curve outside these comes from a curve catalog such as easing.dev or easings.co, defined once as a token.

### Transform facts

- In `translate()`, a percentage refers to the element's own box, so `translateY(100%)` shifts a drawer or toast by exactly its height, whatever it contains. Prefer it over pixel offsets.
- `scale()` also shrinks or grows the children, so text and icons go with it; that is why a press feels physical.
- `transform-origin` is the anchor of every transform; set it at the trigger for anchored surfaces.
- 3D: `rotateX()` and `rotateY()` with `transform-style: preserve-3d` give orbits, coin flips and depth with no JS.
- Set a dragged element's `transform` on the element itself (see performance.md for why).

### @starting-style and the mount fallback

```css
.toast {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 400ms ease, transform 400ms ease;
  @starting-style { opacity: 0; transform: translateY(100%); }
}
```

Where `@starting-style` is unsupported, set a flag in an effect after first render and key the start state off it:

```jsx
useEffect(() => setMounted(true), []);
// <div data-mounted={mounted}>
```

### Recipes

- Button press: `transition: transform 160ms var(--ease-out)`; `:active { transform: scale(0.97) }`. Any pressable element, scale 0.95 to 0.98. No hover gate needed for `:active`; gate separate `:hover` styling.
- Popover, dropdown, menu, select: `transform-origin: var(--transform-origin)` (supplied by Base UI; otherwise set it from the trigger's position). Start and end style `opacity: 0; transform: scale(0.95)`; `transition: opacity 200ms, transform 200ms` on `--ease-out`.
- Tooltip: start and end `opacity: 0; transform: scale(0.97)`, 125ms on `--ease-out`, origin at the trigger. Keep the initial hover delay to prevent accidental opening, but once one tooltip is open its neighbors open with `transition-duration: 0ms` and no delay; the toolbar then feels faster.
- Modal: stays `transform-origin: center`; `opacity: 0; transform: scale(0.96)` to rest over 250ms on `--ease-out`; the backdrop fades over the same 250ms on the same curve so the two read as one surface.
- Drawer or sheet: rest at `translateY(0)`, closed at `translateY(100%)`, `transition: transform 500ms var(--ease-drawer)`. Adding drag makes it a gesture problem (gestures.md).
- Toast: the `@starting-style` block above; the exit takes about 20% less time than the entrance and leaves through the edge it came from. When stacked toasts reflow, tune opacity against height by eye (M42).
- Accordion: `overflow: hidden`; `transition: height 200ms var(--ease-out), opacity 200ms var(--ease-out)`. Measure the content height in JS or take it from a headless primitive; never animate to `auto`. Keep it short: this costs layout every frame.
- Hold to confirm: an overlay at `clip-path: inset(0 100% 0 0)` with `transition: clip-path 200ms var(--ease-out)` (release); while `:active`, `inset(0 0 0 0)` with `transition: clip-path 2s linear` (press); the button also takes `scale(0.97)`. Linear because the fill is a progress indicator.
- Tab indicator with color change: make a second copy of the tab list styled as the selected state (its own background and text color), and clip that copy down to just the selected tab (for example `clip-path: inset(0 60% 0 20%)`, computed from the active tab's rect), and animate the clip over 250ms on `--ease-in-out`. Text and background arrive as one revealed element, so they cannot drift apart.
- Scroll reveal (marketing only): `clip-path: inset(0 0 100% 0)` to `inset(0 0 0 0)` over 600ms on `--ease-in-out`, triggered by `IntersectionObserver` or Motion's `useInView` with `{ once: true, margin: "-100px" }`. Fire once; never re-animate on every scroll-by.
- Group entrance with stagger: each item starts at `opacity: 0; transform: translateY(8px)` and runs a 300ms ease-out keyframe to rest, with delays in 50ms steps. Never blocks interaction. Rules for groups live in choreography.md.
- Crossfade bridge: during the swap the content takes `filter: blur(2px); opacity: 0.7` through `transition: filter 200ms ease, opacity 200ms ease`. Keep any animated blur at or under 20px.

### clip-path

`clip-path: inset(top right bottom left)` clips a rectangle; each value eats in from its own side. `inset(0 100% 0 0)` is fully hidden from the right, `inset(0)` fully visible. It animates composite-only in current Chromium and Firefox, with no layout. Uses: reveals, hold fills, tab color switching, and a comparison slider (two images stacked, the top one clipped with `inset(0 50% 0 0)` and the right inset driven by drag position, no extra elements).

### WAAPI

```js
element.animate(
  [{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0)' }],
  { duration: 1000, fill: 'forwards', easing: 'cubic-bezier(0.77, 0, 0.175, 1)' }
);
```

Interruptible, accelerated, no bundle cost.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .element { animation: fade 200ms ease; } /* opacity only; no transform motion */
}
```

```jsx
const reduce = useReducedMotion();
const closedX = reduce ? 0 : '-100%';
```

Apply the M31 reductions per component; check each result with the Rendering panel's reduced-motion emulation.

### Removing animations safely

A removal is not a find-and-replace. Before deleting or reducing, check:

- Hidden start states: `animation-fill-mode: forwards` from `opacity: 0`, Motion's `initial={{ opacity: 0 }}`, a reveal class that holds `opacity: 0` until an observer fires. Delete the start state with the animation, or the element stays invisible forever.
- Waiters on the animation: `onAnimationEnd`, `transitionend` listeners, `onExitComplete`, and timeouts sized to a duration. Delete the wait too, or the interface keeps pausing for motion that is gone.
- Exits that postpone unmounting: `AnimatePresence` keeps a component mounted until its exit finishes. With the exit gone, it unmounts immediately, so relocate anything that ran in `onExitComplete` to the moment of closing.
- Layout or FLIP animations masking a layout shift: removing them reveals the jump. If it appears, keep the animation and report the shift.
- Focus moved from inside an animation callback: move it directly once no animation remains.
- Tests that pause on animation classes or timings: drop those pauses too.

Never uninstall a motion library unprompted; propose it and wait. Only subtract while removing: no retuning of curves, springs or durations on the motion that stays.

Hunt classes: keyboard and high-frequency (palette or menu open and close, tab and sidebar slides, in-app route transitions, hover transforms on rows); decoration (scroll fade-ins on every section, hover scale on non-primary cards, infinite loops, staggered entrances on lists loaded daily); functional data (charts redrawing, count-ups on load, table rows animating in); over-engineering (spinners and skeletons under 300ms, `transition: all`). Grep for `transition`, `animation`, `@keyframes`, `motion.`, `animate={`, `whileInView`, `whileHover`, `AnimatePresence`, `layout`, `stagger`, `infinite`, `animate-`, `IntersectionObserver`, `transition: all`.

A review sweep adds the defect greps: `useSpring`, `ease-in`, `scale(0)`, `prefers-reduced-motion` (and its absence), `transform-origin` and `@starting-style`.

Cleanup after removal: orphaned `@keyframes` and animation utilities; `motion.*` elements with no motion props left become plain elements; empty `AnimatePresence` wrappers and unused variants objects; unused imports of the motion library; Tailwind config or token entries nothing references. Verify by running the typecheck and tests, then grepping each removed keyframe, class and variant name for survivors.
