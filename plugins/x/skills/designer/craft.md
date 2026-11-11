# Craft

Component details: press, entrance start states, origins, tooltips, hover, modals, materials and depth, color schemes, sound and haptics, and the unseen quality of a finished component.

## Judge

- C1 Press answer: every pressable element answers the press with `:active` at `scale(0.97)` (range 0.95 to 0.98) over 100 to 160ms ease-out. A pressable with no `:active` state is a finding. Scale also scales the children (text, icons), which is intended.
- C2 Entrance start: an entering element starts at a scale between 0.9 and 0.97 with opacity 0. `scale(0)` is a finding, since nothing real appears from nothing, and so is a pure opacity fade with no initial transform on a popover, menu, toast or dialog.
- C3 Origin: popovers, menus, dropdowns and tooltips scale from their trigger (`transform-origin` at the trigger, or the library's origin variable). Modals are not anchored to a trigger and keep a centered origin. A center origin on a popover is a finding.
- C4 Tooltip: it waits before the first show, to prevent accidental opening, then neighbors open instantly with no animation while one is already open. Enter and exit run from `scale(0.97)` with opacity 0 over 125ms.
- C5 Hover gating: hover effects sit behind `@media (hover: hover) and (pointer: fine)`, since touch fires hover on tap and leaves it stuck. `:active` is a real press on touch and needs no gating.
- C6 Backdrop in step: a modal's backdrop fades in and out together with the modal, on the same timing, so the two read as one surface. A backdrop that lags, leads or pops is a finding.
- C7 Focus and separation: a modal task gets a dimming scrim, and the page behind recedes (smaller, lower, dimmer). A panel that runs alongside the task is translucent and offset, with no scrim, so the flow stays unbroken. Stacked sheets dim each parent progressively, one step per level.
- C8 Translucent layers: navigation, toolbars and sheets are translucent layers with content scrolling under them, not opaque bars that reserve a fixed strip.
- C9 Material weight: weight encodes hierarchy. Heavier, darker materials mark structural regions (sidebars, navigation). Lighter materials pull the eye to interactive elements (buttons, controls). A light translucent surface never sits on another light one, because legibility collapses.
- C10 Surface thickness: bigger surfaces read thicker, with stronger blur and a deeper shadow than small chips. Over busy or text-filled content the shadow gets heavier to separate; over a plain background it stays light.
- C11 Vibrancy: over a translucent or blurred surface, text is higher-contrast and slightly heavier with a small tracking bump, never flat gray. Color sits on a solid layer, not on the translucent foreground.
- C12 Scroll edge: where floating UI overlaps scrolling content, a small blur or gradient fade at the edge replaces the 1px divider. Where nothing floats over content, a plain divider stays; a fade there is decoration.
- C13 Transparency and contrast: under `prefers-reduced-transparency: reduce`, translucent surfaces turn frostier or solid (higher opacity, blur off). Under `prefers-contrast: more`, they turn near-solid with a defined, contrasting border. Text contrast holds in both.
- C14 Color schemes: colors adapt to light and dark, with tokens per scheme, not inverted by filter. Large surfaces do not flash between schemes.
- C15 Deliberate values: every spacing, size, radius, timing and alignment value is a choice taken from the system and can be defended. A one-off value off the scale is a finding.
- C16 Alignment defects: misaligned icons (off the text's optical center or off the pixel grid), uneven icon weights beside each other, jittery scrolling, layouts that break on rotation or resize, and sub-pixel blur on edges read as carelessness and are findings.
- C17 Causality: sound and haptics fire on the real causal event (the toggle flipping, the item landing), and their character matches the physicality of the action.
- C18 Harmony: image, sound and vibration land on the same frame. A CSS transition that lags behind its audio or vibration breaks the illusion.
- C19 Utility: sound and haptics are reserved for meaningful moments (success, error, commit, snap). Feedback on every tap trains people to ignore all of it, and any of it needs a way to turn off.
- C20 Defaults over options: a component looks and behaves excellently with zero configuration, because most people never customize. A component that needs props to look right is a finding.
- C21 Edge cases invisible: the component handles what nobody notices when it works: timers pause while the tab is hidden, gaps between stacked items do not drop hover, a drag keeps tracking outside its bounds, a second finger does not hijack a drag.
- C22 Cohesion: easing, timing, shape, copy and name suit one another and the product's character. A professional tool is crisp, a playful one may be softer and slower, and a component whose motion clashes with its own look is a finding.
- C23 Try it: a shared component or library offers interactive examples with copyable snippets, so people can touch it before adopting it.
- C24 Materialize: a glass or blurred surface enters and leaves by animating its blur radius and scale together (blur within performance.md's 20px cap), so it reads as material arriving; a plain opacity fade on glass is a finding.
- C25 Longevity: craft is iterated. The design is revisited as features and hardware change; a screen that was right for last year's content or devices is checked again, not assumed.
- C26 No setup to adopt: a shared component works with no hooks, providers or configuration beyond mounting it once and calling it from anywhere. Every setup step it demands is friction someone pays on every project.

## Build

### Press

```css
.button { transition: transform 160ms ease-out; }
.button:active { transform: scale(0.97); }
```

- Use the same value for every pressable. Button label and icon scale with it.
- Respond on pointer-down. Use `:active`, not a click handler, for the visual state.

### Entrances and origin

```css
.popover {
  transform-origin: var(--transform-origin);
  transition: transform 160ms ease-out, opacity 160ms ease-out;
}
.popover[data-starting-style],
.popover[data-ending-style] {
  opacity: 0;
  transform: scale(0.95);
}
```

- With Base UI, `var(--transform-origin)` carries the trigger-relative origin, `data-starting-style` and `data-ending-style` mark the enter and exit states, and `data-instant` marks a state that must skip its transition.
- Without that library, set `transform-origin` from the trigger's position on the popover's side (for a popover below its trigger, `top` plus the horizontal offset), computed once when it opens.
- Modals stay at `transform-origin: center`.

### Tooltip

```css
.tooltip {
  transform-origin: var(--transform-origin);
  transition: transform 125ms ease-out, opacity 125ms ease-out;
}
.tooltip[data-starting-style],
.tooltip[data-ending-style] { opacity: 0; transform: scale(0.97); }
.tooltip[data-instant] { transition-duration: 0ms; }
```

- Keep an open-tooltip flag at group level. While it is set, the next tooltip opens with `data-instant` and no delay; clear the flag after a short idle gap once the pointer leaves the group.

### Hover gating

```css
@media (hover: hover) and (pointer: fine) {
  .card:hover { transform: translateY(-2px); }
}
```

- Put every `:hover` that changes appearance inside this query. Leave `:active` outside.

### Modal and backdrop

- Animate the backdrop and the dialog from the same state attribute with the same duration and easing, so a single class or data attribute flips both.
- Scrim: a semi-transparent dark layer. Push the page behind back with a slight scale-down and dim.
- Stacked sheets: apply one extra step of scale-down and dim per level beneath the top.
- Parallel panel: translucent background, `backdrop-filter` blur, a lateral offset, no scrim.

### Materials

```css
.toolbar {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.4);
}
```

- The bright top edge is the light catching the material. Content scrolls under the bar, so give the scroller padding equal to the bar's height.
- Scale the material with the surface: a chip gets modest blur and a small shadow, a sheet gets stronger blur and a deeper, longer shadow. Raise shadow opacity where the surface sits over text or imagery.
- Text on a material: raise contrast, set weight one step heavier, add a small positive letter-spacing (about 0.01em), and keep colored elements on a solid inner layer.
- Dark scheme: swap to a dark tint with matching alpha, and keep the same blur and saturation; the bright top edge becomes a faint light line.

### Scroll-edge fade

```css
.scroller {
  mask-image: linear-gradient(to bottom, transparent 0, #000 34px);
}
```

- Use it only where a floating bar or header overlaps scrolling content; the fade height is a step on the spacing scale. A plain divider stays everywhere else.

### Reduced transparency and contrast

```css
@media (prefers-reduced-transparency: reduce) {
  .toolbar { background: Canvas; backdrop-filter: none; }
}
@media (prefers-contrast: more) {
  .toolbar { background: Canvas; border: 1px solid CanvasText; }
}
```

- Under both, check that text still meets contrast over whatever sits behind.

### Sound and haptics on the web

- Fire both from the same handler as the visual state change, in the same frame; do not wait for a transition to end.
- Use the Vibration API (`navigator.vibrate`) with short patterns for confirmations, where supported, and feature-detect it. Sound plays from a preloaded buffer, so there is no decode lag.
- Reserve them for success, error, commit and snap. Provide a setting to turn them off.

### Component quality

- Pick the best default for easing, timing, spacing and look, then expose few options.
- Pause auto-dismiss timers on `visibilitychange` when the document is hidden, and resume them with the remaining time. Also pause on hover and focus.
- Between stacked, hover-expanded items, add a pseudo-element that fills the gap so the pointer never leaves the group.
- On drag start, call `setPointerCapture`; ignore further pointers while a drag is active.
- Name a component for identity as well as function, when the name may be memorable more than discoverable.
- Match motion and look to the component's mood: a dashboard component is crisp and fast, a playful one may move slower and softer.
- For a component others adopt, put live examples with copyable snippets on its documentation page.
