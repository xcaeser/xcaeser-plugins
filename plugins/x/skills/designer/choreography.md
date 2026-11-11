# Choreography

How several elements that move on one event relate: who leads, who follows, what overlaps, what waits, what stays still, and how the group behaves when interrupted or under reduced motion.

## Judge

### Roles

- K1 Every moving element has a role. Lead: the one thing the person must notice (the new view, the title, the item acted on); it moves first, travels the most and stays longest. Support: content that trails the lead with a smaller, briefer move. Decoration (pills, badges, accents, dividers): opacity only, or still. Static: all the rest, including a container whose contents animate.
- K2 Two elements competing to be the lead is a hierarchy problem; motion cannot fix it, so report it as one.
- K3 Casting roles usually shrinks the group: a side panel holding eight menu items turns into a single move, the panel itself, with the items simply present. Movement on anything that is neither lead nor support is a finding.
- K4 One entrance per container: if the parent enters, its children are already in place. A parent entrance plus a stagger of its children is two layers of waiting.
- K5 No stagger on keyboard-triggered or constantly used surfaces (dropdown items, menu rows, palettes, tab content, list rows opened many times a day): items appear together, or not animated.
- K6 Choreography never blocks interaction. Anything visible responds immediately; a late-arriving item cannot gate a control the person is already reaching for.

### Relationships

- K7 Each pair of moving parts has one chosen relationship. Together: same start, same timing family, when both belong to one visual object or one moment, and also whenever order carries no meaning (order without meaning is just delay). Overlap (a stagger): order carries meaning and both can show at once. Sequence: order carries meaning and showing both at once would look broken. Carry: the parent moves and the children come along.
- K8 Sequence only when overlap looks wrong: two dense views in a container changing size in both dimensions; one element visibly passing through another; a drawing with cause and effect (a checkbox square, then its checkmark).
- K9 Hand-offs overlap slightly: the second move starts just before the first ends, which turns a queue into one gesture. A wave and a queue look alike in the head and different on a recording.
- K10 A leaving element stops taking space at once, so siblings close the gap while it fades. A gap that closes only after the exit finishes makes two smooth movements feel like a stall.
- K11 Replacing one view with another in the same container is a crossfade, with outgoing and incoming overlapping rather than taking turns: `AnimatePresence mode="popLayout"`, not the default mode, which plays them one after the other.
- K12 Carry: when a child's own path cannot be steered (shared-layout or `layoutId` animations), animate the parent and let the children ride with it.
- K13 One timing family per component. A drawer that opens in 500ms and resizes in 200ms reads as two objects. Inner motion can use a gentler curve than the container (a slower content fade keeps the swap visible) yet stays in its easing family; an ease-in-out body inside an ease-out container feels out of sync. Set the family once, through `MotionConfig` or one shared CSS custom property, not per element.

### Stagger

- K14 Product UI: 30 to 80ms between items, total under about 300ms. Only the first handful stagger; items past the sixth share the sixth's delay, so item 20 never waits twenty steps.
- K15 Marketing and first-run moments get more room: steps of 100 to 150ms on 0.5 to 0.6s entrances read as a wave, since they are seen once and are part of the message.
- K16 A uniform stagger (same delay, distance, duration and curve on every item) is a finding: it moves like a metronome, the way `linear` does for one element. Vary by role and importance; delays that shrink as the group goes read as organic.
- K17 Order follows importance and reading direction (top to bottom for content), or radiates from the interaction point for things the person triggered. Group items that belong to one beat (a title and its first paragraph) at the same step.
- K18 Everything entering at once where a stagger belongs is a finding, but only on a surface seen occasionally (see K5). LOW.

### Syncing and adapting

- K19 Secondary motion hooks to a moment of the lead (its start, impact or settle), not to a delay that looks about right. Sync it to the cause: in hover then click, a background pulse lands with the click, not with the hover.
- K20 Accents land together with the lead, as a brief burst in the final 20% of the timeline, the most important accent first and the others about 40ms behind.
- K21 A repeated action skips its wind-up: with the hover state already showing, the click effect begins immediately, same proportions, earlier in the timeline.
- K22 Scale duration by distance: a large size change can carry the full fade, while the same fade on a tiny change reads as a flicker. Derive from the delta and clamp: `clamp(0.15s, delta / 500, 0.27s)`.
- K23 Scale bounce by size: small elements need more bounce to feel alive; the same bounce on a large view settles slowly and looks heavy. Bounce values themselves come from gestures.md.
- K24 With few states, write the values out for each transition; twelve tuned entries outperform a formula you cannot adjust. A formula is for state counts too large to tune by hand.

### Direction and exits

- K25 Direction follows the person's mental model: going forward pushes content left, so new content arrives from the right; going back reverses it. Next and Back sliding identically contradicts the action. Switching between sibling menus brings content in from the side of the previous trigger.
- K26 An exit reads its direction at the moment it starts. Pass the direction to both `AnimatePresence` (`custom`) and the child, or the leaving element uses the direction it mounted with.
- K27 Exits run simultaneously, shorter and simpler than entrances; never reverse-stagger items out. The person has already decided to leave. An exit matches its entry (in from the right, out toward the right), not just a fade.

### Interruption and loops

- K28 Every sequence survives interruption. Re-trigger mid-flight (leave a hover halfway, press Next twice quickly, change menus while one is still opening): the new run stops the in-flight animations before starting new ones and never stacks them.
- K29 Await completion before chaining: an idle loop resumes after a hover-out only when all reset animations have finished (`await Promise.all(...)`), or it fights the reset.
- K30 Gate actions on completion with a ref rather than state; a flag that never drives rendering needs no re-render.
- K31 Rapid view switching can leave two children mounted. Every child has a stable, unique `key`; a missing key is the first suspect when an exit does not play.
- K32 Attention loops (an icon that wiggles, a hand that taps): first run after about 2.5s, repeat about every 6s, stop while the person interacts, resume only after the interaction's reset has finished. A pulse that never stops is a defect (see motion.md).

### Reduced motion

- K33 Under `prefers-reduced-motion: reduce`, collapse the choreography rather than shortening it: remove delays and movement, keep opacity, and show the group together. When the sequence itself is the explanation (a step-by-step illustration), cut between its frames rather than animating between them.

### Method

- K34 Verify on a recording: step through it frame by frame, run the interruption checks of K28 to K31, then imagine the fiftieth use of the day. If it would be skipped, cut it.

## Build

### Casting before timing

Inventory each element that moves on the event, give it a role (K1), remove movement from anything that is neither lead nor support, pick a relationship per pair (K7), then write the timeline (element, role, start, duration, motion, relationship) and check it against the budgets: a product group finishes in about 300ms or less, and high-frequency surfaces do not stagger. Use the lightest tool: CSS index variable for a one-shot entrance; Motion variants for groups driven by React state, entering and leaving; `useAnimate` only for multi-event coordination where completion must be awaited.

### CSS stagger with an index variable

Suited to a one-shot entrance. Each item's delay derives from a custom property, so no per-item class is needed.

```css
.stagger > * {
  --step: 120ms;
  animation: enter 0.6s ease both;
  animation-delay: calc(var(--step) * var(--i));
}
@keyframes enter { from { opacity: 0; transform: translateY(10px); } }

@media (prefers-reduced-motion: reduce) {
  .stagger > * { animation-name: fade; animation-delay: 0ms; }
  @keyframes fade { from { opacity: 0; } }
}
```

Each child sets `style={{ "--i": n }}`; the title and first paragraph share `0`. `both` is required: the backwards half applies the starting keyframe through the delay, so late items never flash their final state first, and the forwards half keeps the end state. Leaving out `to` animates toward the element's own styles. A changed custom property restyles every descendant: fine for a one-shot entrance, wrong for per-frame values over a large tree. The 120ms step and 0.6s are marketing values; for product UI use 30 to 80ms and a shorter run (K14).

### Motion variants, uneven stagger

```tsx
const list = { hidden: {}, show: { transition: { delayChildren: stagger(0.06, { ease: "easeOut" }) } } };
const lead = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } } };
const support = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } } };
const decoration = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.3 } } };
```

- A variant per role carries distance and duration, and the stagger decides only start times. Role values: lead y 12 over 0.5s, support y 6 over 0.4s, decoration opacity over 0.3s.
- `stagger(0.05, { from: "center" })` radiates from the middle; a numeric `from` index radiates from the item the person interacted with. The `ease` option shrinks the delays as the group goes on.
- Older Motion versions take `staggerChildren: 0.06` in place of `delayChildren: stagger(...)`.
- Cap long lists: items beyond the sixth reuse the sixth's delay so the total stays near 300ms.

### Leaving element stops taking space

```tsx
<AnimatePresence mode="popLayout" initial={false}>
  {chips.map((c) => (
    <motion.li key={c.id} layout exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}>{c.label}</motion.li>
  ))}
</AnimatePresence>
```

`mode="popLayout"` takes the exiting element out of flow, so siblings reflow during its fade. Without a library: read the element's offset, set `position: absolute` with that `top` and `left` (the parent is `position: relative`), then animate it out; siblings reflow or are animated with FLIP.

### Crossfade inside a resizing container

Container height and swapped content are one object, so they share durations and an easing family. Measure the content (for example with `react-use-measure`), animate the wrapper's `height` to the measured value with `overflow: hidden` over 0.27s on a strong ease-out (`[0.25, 1, 0.5, 1]`), and swap content inside `AnimatePresence initial={false} mode="popLayout"` keyed by view.

- Content enters and exits `opacity 0 to 1` and `scale 0.96 to 1`, with a lighter curve from the same family (`[0.26, 0.08, 0.25, 1]`).
- The fade duration scales with the jump: clamp the height delta over 500 between 0.15s and 0.27s (K22); the first render uses 0.15s.
- When the container is part of a bigger component such as a drawer, match that component's open duration to this one.

### Direction-aware steps

```tsx
const [[step, direction], setStep] = useState([0, 0]);
const variants = {
  initial: (d) => ({ x: `${110 * d}%`, opacity: 0 }),
  active: { x: "0%", opacity: 1 },
  exit: (d) => ({ x: `${-110 * d}%`, opacity: 0 }),
};
// <MotionConfig transition={{ type: "spring", duration: 0.5, bounce: 0 }}>
//   <AnimatePresence mode="popLayout" initial={false} custom={direction}>
//     <motion.div key={step} custom={direction} variants={variants} initial="initial" animate="active" exit="exit" />
```

Pass `custom` to `AnimatePresence` and to the child (K26). The Back and Continue footer is a `layout` element so it tracks the height change. For small containers or look-alike views, use a crossfade instead of the 110% slide, adding an 8px offset and a slight blur: the gaze barely travels and the change still registers.

### Sequence: one draw after another (checkbox)

Both paths use `pathLength="100"`, `stroke-dasharray: 100` and a `stroke-dashoffset: 100` start, so the numbers stay round. The square draws 0.6s on `cubic-bezier(0.645, 0.045, 0.355, 1)` with `forwards`; the checkmark draws 0.4s on the same curve with `animation-delay` equal to the square's duration (0.6s), also `forwards`, so it holds its end. Both animate `stroke-dashoffset` to `0`. To read as one gesture, start the checkmark a little early (about 0.5s).

### Crossfading two dense states

When dense views change both container dimensions, `mode="wait"` is the safe default. To crossfade anyway, duplicate the view:

1. Mount the current view twice. Copy A handles entering alone. Copy B is `position: absolute`, rests at `opacity: 0`, and appears only on exit, through a keyframe fading from `opacity: 1`.
2. Transform the exiting copy according to the container's destination: scale up when the next state is larger, down when smaller, and pull it inward with `scaleX` when the container narrows so it stays inside the edges.
3. With few states, hardcode the transform and bounce for each state pair, delivered via `custom`; smaller states bounce more (K23, K24).

### Carry through the parent

Items morphing into a target by `layoutId` cannot be steered individually, so move their container and let them ride along:

```tsx
<motion.div animate={{ y: 73 }} transition={{ delay: 0.13, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}>
  {selected.map((img) => <motion.img key={img.id} layoutId={img.id} src={img.src} />)}
</motion.div>
```

The images morph into the bin and descend with it. Reveal the bin's front face on a delay, timed for when the images have nearly landed, so none appear to cross it.

### Imperative orchestration with useAnimate

Only when several elements coordinate across events and completion must be awaited.

- Target elements by `data-animate` selectors inside the scope instead of one ref per element.
- Track running animations in a ref and `.stop()` each before starting a new set, so sequences never stack.
- Keep "ready" flags in a `useRef` boolean, not state (K30).
- Await `Promise.all` of all the steps when durations differ; awaiting only one is safe only when they share a duration.
- Example values: icon lift `y: -4` over 0.3s; accent lines `strokeDashoffset: [1.05, 0]` over 0.5s with `times: [0.7, 0.9]` (the last 20%), the key line at delay 0 and the others at 0.04s; a click pulse `scale: [1, 0.96, 1.02, 1]` over 0.4s that plays immediately once ready.
- On leave, `await` the reset of every element, then start the idle loop; the loop is itself a tracked animation (`delay: 2.5`, `repeat: Infinity`, `repeatDelay: 6`) so the next enter stops it.
