# Gestures

Drag, swipe, fling, hold and sheet interactions: tracking, release, springs, thresholds, interruption and frame-level smoothness.

## Judge

- G1 Two phases: while the pointer is down, position maps 1:1 to the pointer with no easing, duration or spring; after release, a spring finishes the motion. A spring while tracking lags behind the finger, like dragging through syrup. Mixing the phases is the most common cause of a gesture that feels wrong.
- G2 Keep the grab offset: the element stays under the point where it was grabbed, never snapping its center to the pointer. Capture the pointer so tracking continues outside the element's bounds.
- G3 Feedback is continuous during the gesture, never only at the end. A drag, slider or sheet updates every move; animating only on completion is a defect.
- G4 Respond on pointer-down. Highlight on down, commit on up. Waiting for the click or touch-up to show anything reads as dead; any debounce, timer or transition wait on the input path is a regression.
- G5 Tap: about 10px of hit padding around the target, and the press cancels when the pointer drags away and re-arms when it comes back.
- G6 Commit to a drag direction only after about 10px of movement (hysteresis), then track 1:1.
- G7 Detect every plausible gesture in parallel from the first move and cancel the losers once intent is clear. Recognizers that only report a final state (swipeleft-type events) discard the continuous tracking that feedback needs.
- G8 A double-tap delays every single tap. Use it only where a double-tap action exists.
- G9 Never lock out input during a transition. A closing sheet the user grabs again follows the finger; it does not finish closing and then reopen.
- G10 Animate from the presentation value, the live on-screen position, never from the target. Starting from the logical value jumps visibly on interrupt.
- G11 Reversal blends velocity. Swapping in a different animation at the turnaround resets velocity abruptly, a brick wall; the new motion must inherit current velocity (a spring re-targeted from its live state does).
- G12 CSS transitions suit rapidly triggered state (toasts, toggles), not what a finger moves. Keyframes never on anything rapid or touchable: they restart from zero and cannot be caught mid-flight (a toast stack built on keyframes jumps when a second toast arrives).
- G13 2D motion uses independent X and Y springs. One spring on the 2D distance desyncs the axes when their velocities differ.
- G14 Release hands the gesture's velocity to the spring, so the element leaves at the speed it arrived with. A fixed-duration ease makes every fling land the same and reads as fake.
- G15 Pointer history: release velocity comes from the last few pointermove samples (position and timestamp), not the final point alone.
- G16 Velocity units: Motion takes raw px/s. APIs that want normalized velocity take `gestureVelocity / (target - current)`. Example: 100px to go at 50px/s is 0.5.
- G17 Land where momentum projects: `projected = current + (v / 1000) * d / (1 - d)` with deceleration `d` of 0.998 (0.99 for snappier), v in px/s. Snap to the target nearest the projection, not the release point, as Vaul's snap points and Embla's carousel do. `v^2 / (2 * decel)` is the wrong model.
- G18 Flick: average speed |distance| / elapsed above about 0.11px/ms, or release velocity above about 500px/s from the pointer history (Motion `info.velocity`). Dismiss when travel passes 40 to 50% of the span OR a flick fires. Distance-only thresholds make flicks feel ignored.
- G19 Reverse or commit by the sign of the velocity at release, not position alone.
- G20 Boundaries resist progressively. Past an edge the element follows a shrinking fraction of the drag (Motion `dragElastic` about 0.2; formula in Build); a hard stop reads as frozen, and fully blocking the drag is the same defect.
- G21 Springs: the UI default is critically damped (damping ratio 1, no overshoot) with response 0.3 to 0.4s; in Motion `{ type: "spring", duration: 0.4, bounce: 0 }`. Response is time to settle, not a duration: a spring has no fixed length.
- G22 Bounce only after a gesture carried momentum (flick, throw, drag release), or in a product whose character is playful: damping ratio about 0.8, Motion bounce 0.1 to 0.3. Overshoot on a menu that just appeared is wrong; on a flicked card it is right. Weird spring: raise damping first.
- G23 Per-interaction springs (damping / response): move or reposition 1.0 / 0.4s, rotation 0.8 / 0.4s, a sheet or drawer released by a flick 0.8 / 0.3s.
- G24 Zero bounce when a button closes the element: no force was applied. Bounce belongs at the end of a drag, stays small, and smaller elements need more of it to read the same.
- G25 Snap-back after a failed threshold is fast. A slow return reads as the UI disagreeing with the user.
- G26 Springs are for elements that should feel alive and for decorative pointer-following (`useSpring` stiffness 100, damping 10). Never on functional data: a banking graph animated by spring is worse than none.
- G27 Linked values derive from one drag progress value: overlay opacity, background scale, shadow. Separate animations drift apart as soon as the gesture is interrupted or reversed.
- G28 Multi-touch protection: once a drag starts, ignore additional touches. Switching fingers mid-drag otherwise teleports the element.
- G29 Dismiss in the direction the element entered. A toast that rises from the bottom dismisses downward; a panel from the right exits right. Entering and leaving on different axes must be learned instead of felt.
- G30 Hint in the direction of the gesture: in-between frames point at the outcome (a control grows up and out toward the finger) instead of interpolating blindly.
- G31 Hold gestures run `linear` during the hold, because the fill shows time passing, and release before completion snaps back with a fast ease-out. Symmetric timing is a bug.
- G32 A sheet or drawer follows the library default unless it is a one-off: Vaul for bottom sheets and drawers. A hand-rolled sheet needs overlay opacity tied to drag progress, velocity-aware dismissal, a focus trap and Escape to close; missing any is a defect.
- G33 Sheet timing: a full-width edge-attached sheet may run over 500ms on a steep ease-out curve; a small floating drawer runs about 200ms. A 500ms timing on a small floating element feels slow.
- G34 A component's sub-animations (height change, content crossfade, overlay) share one timing family with its main motion; one slow part makes the whole thing feel broken.
- G35 Interactive children inside a draggable sheet opt out of the drag (`data-vaul-no-drag`), so pressing a button does not start a drag.
- G36 No React state per move event. Motion values or direct style writes; a re-render per pointermove drops frames.
- G37 Write `transform` on the dragged element itself. A parent CSS variable that children's transforms read recalculates every descendant per frame (see performance.md).
- G38 Per-frame positional change stays under the strobing threshold: motion that jumps farther than the eye can link between frames flickers instead of moving.
- G39 Very fast motion carries a subtle blur or stretch that encodes speed; a sharp hard streak reads worse.
- G40 `requestAnimationFrame` is the clock for any hand-rolled loop; never `setTimeout` or `setInterval`.
- G41 `touch-action` names the panning the browser keeps: a vertical-drag surface sets `pan-x`, a horizontal carousel `pan-y`; `none` only when the element owns every axis. Hit targets at least 44x44px.
- G42 Hover effects gate behind `@media (hover: hover) and (pointer: fine)`; touch fires phantom hovers on tap.
- G43 Reduced motion: tracking stays, since the user produces the motion. Flings, momentum, bounce and decorative motion around the gesture go; release settles with a short opacity or position change.
- G44 Verify on a real phone through the dev server's local IP. A trackpad or emulator misjudges touch, and a 120Hz screen shows roughness a 60Hz monitor hides. Without a phone, the iOS Simulator is the fallback, reported as such: better than emulation, still blind to touch feel.
- G45 Still feels wrong: raise damping for a weird spring; treat stutter as a performance problem (check G36, G37 and performance.md); capture a screen recording of the gesture and step through it frame by frame, since full speed hides the fault.

## Build

### Pointer tracking

- Use Pointer Events. On pointerdown: `setPointerCapture(e.pointerId)`, store the grab offset (`e.clientY - rect.top`), start a history of `{x, y, t}` samples.
- On pointermove, push the sample, drop all but the last few, write `transform` straight to the element (or `motion.set`). No state, no spring, no transition.
- If a drag is already active, return early from pointerdown for any other pointer id.
- On pointerup, read velocity from the history (oldest retained sample to the latest), then enter release.

### Release

1. Compute velocity in px/s from the history.
2. Projection: `const project = (v, d = 0.998) => (v / 1000) * d / (1 - d)`.
3. Pick the snap target nearest `current + project(v)`.
4. Run a spring to that target seeded with the velocity. Motion: `animate(value, target, { type: "spring", duration: 0.4, bounce: 0, velocity })` with raw px/s. After a flick use `bounce: 0.2`; after a button press `bounce: 0`.
5. Dismiss rule: `Math.abs(offset) > span * 0.45 || Math.abs(velocity) > 500` (or |distance| / elapsed above 0.11px/ms when only start and end are known). Otherwise snap back fast.

### Rubber-band

```js
const rubberband = (over, dim, c = 0.55) =>
  (over * dim * c) / (dim + c * Math.abs(over));
```

`over` is the signed distance past the bound and `dim` the viewport size along that axis. In Motion, `dragElastic: 0.2` gives the same feel.

### Spring configuration

- Two knobs: damping ratio (1 is no overshoot, lower overshoots more) and response (time to settle in seconds, lower is snappier).
- Motion maps bounce plus duration onto them: `{ type: "spring", duration: 0.4, bounce: 0 }` for the default, `{ duration: 0.5, bounce: 0.2 }` for a momentum or playful result. Keep bounce within 0.1 to 0.3.
- Physics form when finer control is needed: `{ type: "spring", mass: 1, stiffness: 100, damping: 10 }`.
- Decorative pointer-following: `useSpring(target, { stiffness: 100, damping: 10 })` so the element carries momentum instead of snapping to the cursor.
- Springs keep their velocity when re-targeted mid-flight, which is why they are right for anything the user may change their mind about (click to expand, press Escape, and it reverses from where it is).

### Linked values

```jsx
const y = useMotionValue(0);
const overlayOpacity = useTransform(y, [0, sheetHeight], [1, 0]);
```

One source of truth keeps overlay, backdrop scale and shadow exactly in step during the drag and after a reversal.

### Motion drag props

```jsx
<motion.div
  drag="y"
  dragConstraints={{ top: 0 }}
  dragElastic={0.2}
  dragMomentum={false}
  onDragEnd={(_, info) => {
    if (info.offset.y > threshold || info.velocity.y > 500) dismiss();
  }}
/>
```

- `drag`: `true`, `"x"` or `"y"`.
- `dragConstraints`: a ref to a container element or a bounds object (`{ top, left, right, bottom }`).
- `dragElastic`: 0 to 1, how far past the constraints it follows; about 0.2.
- `dragMomentum`: enabled unless set false; suits a thrown card, so set false when the element should halt exactly where the finger lifts.
- `onDragEnd(event, info)`: `info.offset` and `info.velocity` drive the dismiss rule.
- Motion-value drag and inertia run on the main thread (see performance.md).

### Sheets

- Default to Vaul for a bottom sheet or drawer. Hand-roll only for bespoke interactions (swipe cards, custom drags).
- Vaul's curve is `cubic-bezier(0.32, 0.72, 0, 1)` over 500ms: extremely steep at the start, so it feels fast and settles gently. Right for a full-width edge-attached sheet.
- A small floating drawer overrides to about 200ms with `cubic-bezier(0.165, 0.84, 0.44, 1)` on both drawer and overlay:

```css
[vaul-drawer]  { transition: transform 0.2s cubic-bezier(0.165, 0.84, 0.44, 1); }
[vaul-overlay] { transition: opacity 0.2s cubic-bezier(0.165, 0.84, 0.44, 1); }
```

- Keep height changes and content crossfades inside the same timing family as the open and close.
- Mark buttons, inputs and scrollers inside with `data-vaul-no-drag`.
- A sheet that is not Vaul still needs: overlay opacity from drag progress, velocity dismissal, focus trap, Escape.

### Hold gestures

- Fill: `transition: clip-path 2s linear` (or the transform equivalent) while pressed.
- Release before completion: `transition: clip-path 200ms ease-out` back to the start.
- Completion fires on the end of the fill, not on a timer that can drift from it.

### Smoothness

- Cap per-frame travel for fast motion (shorter distance per frame, or add stretch or blur on the axis of movement) so objects do not strobe.
- Drive hand-rolled motion from `requestAnimationFrame`.
- Hint the outcome: scale or translate the in-between frames toward the finish, such as a control growing toward the finger.

### Touch checklist

Run for every gesture shipped:

- Real phone via local IP, at its native refresh rate.
- Hit targets 44x44px or larger, enlarged with an invisible `::before` instead of layout growth.
- `touch-action` per G41.
- Hover gated per G42.
- Second finger during a drag ignored.
- Catch it mid-release and redirect: no jump, no waiting.
- Failed threshold snaps back fast; a flick shorter than the threshold still dismisses.
- Reduced motion: flick, bounce and decoration removed, tracking kept.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  .sheet { transition: opacity 200ms ease; }
}
```

In JS, detect the setting and pass `bounce: 0` plus a short opacity or position settle instead of the fling.
