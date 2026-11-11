# Performance

Whether each animation frame finishes in time: property cost, which thread drives it, per-frame rendering traps, and how to find the cause.

## Judge

- P1 The bar is a mid-range phone, not the developer's laptop. A fast machine hides nearly every problem; never conclude "it's fine" from one. Label each finding as read from code or as needing a device recording.
- P2 Frame budget: 16.7ms at 60Hz, 8ms at 120Hz, which is most phones and many laptops now. Design against 8ms. One layout pass on a heavy page can exceed 100ms, which is a dozen missed frames at once.
- P3 `transform` and `opacity` by default. Any other animated property needs a reason; when a cheaper property yields the same look, take it even if the costly one seems acceptable.
- P4 Cost tiers. Composite only (cheapest): `transform`, `opacity`, and in current Chromium and Firefox also `filter`, `clip-path`, `background-color` (verify in Safari). Paint plus composite: `box-shadow`, `border-radius`, `color`. Layout plus paint plus composite (most expensive): `width`, `height`, `padding`, `margin`, `top`, `left`, `border-width`.
- P5 Exceptions on layout properties: an accordion may animate its measured height (never to `auto`) with opacity over about 200ms; an absolutely positioned childless element (tab pill, progress fill) may animate width to keep its corner radius. Every other layout property in motion is a defect.
- P6 Layout animation moves neighbors. A sidebar animating `margin-left` re-lays-out the content beside it every frame; `translateX` does not. A layout animation and its `scale()` equivalent look the same, and only one cannot regress on a slower device.
- P7 Animated `box-shadow` repaints the element every frame. Swap to `filter: drop-shadow()` or animate the opacity of a pre-rendered shadow layer.
- P8 `transition: all` is a defect: it picks up any property that changes later, layout ones included. Name each property.
- P9 JavaScript runs on the main thread, always. A `requestAnimationFrame` animation (GSAP, Motion layout animations) misses frames whenever the main thread is busy. CSS transitions and keyframes and the Web Animations API can be accelerated off the main thread and stay smooth regardless of JS load. A library that delegates to WAAPI may be accelerated; a rAF loop never is.
- P10 Motion that plays while the page does heavy work is the pattern to watch: page transitions, tab indicators during navigation, anything alongside fetching or hydration. A shared-layout tab indicator dropped frames on page load until it moved to a CSS animation. Move such motion to CSS or WAAPI.
- P11 Motion shorthands: `x`, `y`, `scale`, `rotate` on an HTML element are accelerated from `motion` 14.2 and run on the main thread before it. Before 14.2, animate the full `transform` string when the animation must survive a busy main thread. `opacity`, `transform`, `clip-path` and `filter` go to WAAPI in every version.
- P12 Main thread in every Motion version, whatever the release: layout animations (`layout`, `layoutId`), `onUpdate`, `transformTemplate`, inertia, and any value a motion value updates each frame (motion-value drag, `useTransform`). Do not expect them to hold up under load.
- P13 Acceleration is progressive enhancement. Browsers may quietly refuse it, on rules that shift by version (Chrome once skipped percentage-based transforms). Keep `translateY(100%)` for elements of unknown size; correctness outranks a best-effort optimization. Control which properties animate, which is the part you own.
- P14 No state updates per frame. A hand-rolled animation calling `setState` in `requestAnimationFrame`, `pointermove`, `scroll` or a drag handler re-renders every 16.7ms and blows the budget. Write `ref.current.style.transform` or `motionValue.set()`. Animation libraries already animate outside the render cycle.
- P15 An inherited CSS variable that drives a transform is a defect: custom properties inherit, so editing one on a parent forces style recalculation across all descendants each frame, and cost scales with content (a drawer dragged through 20 or more items got laggy with no re-render). Set `transform` on the animating element instead. Suspect this whenever a transform animation degrades as content grows.
- P16 Animated `blur()` stays at or under 20px; cost climbs fast, especially in Safari. 2 to 5px is enough to soften a crossfade.
- P17 `will-change` is the last step, not the first. Add `will-change: transform` only on the element that animates, either just before motion that is about to start (set on pointer-down or when a sheet opens, removed when it settles) or once a 1px shift at motion start or end, or measured dropped frames, appears. Never set it permanently as a precaution. Never on `*` or large containers: browsers already promote `transform` and `opacity` animations, and each promoted layer costs GPU memory.
- P18 `will-change` earns its place on an expensive paint such as a large blurred or filtered layer; keep the layer small; compositing a small layer costs less than a full-screen one.
- P19 It is not wrong to animate in JS. Main-thread animation only suffers if the page is busy at that moment, an uncommon case. Split: CSS or WAAPI for simple motion and for whatever runs during page load or other heavy work; Motion for complex, interruptible, gesture-driven motion, springs, shared layout, exit animations and momentum that CSS cannot do.
- P20 Every fix names the cause it addresses. A fix like adding `will-change` because it seems smoother is no diagnosis. Wrong property or a busy main thread cause most jank, and `will-change` cures neither.
- P21 Confirm with a recording, not by feel (see Build). Desktop CPU throttling imitates a slow processor only; GPU weakness and memory limits go unmodeled.
- P22 Order findings by cost: layout before paint, and a busy main thread before an idle one.

## Build

### Symptom table

| Symptom | Cause and fix |
| --- | --- |
| Animation stutters | Layout properties animating; animate `transform` or `opacity` instead of `width`, `height`, `top`, `margin` |
| Shadow animation choppy | `box-shadow` repaints; use `filter: drop-shadow()` |
| Jank only during navigation, loading or hydration | Main thread busy; move the animation to CSS or WAAPI |
| Motion `x`/`y` loses frames | Pre-14.2 main-thread path; move to `motion` 14.2+ or give the whole `transform` string |
| Custom animation in React loses frames | Per-frame state; write `ref.current.style` |
| Drag gets laggier as the list grows | Inherited CSS variable; set `transform` directly on the element |
| Blur transition lags (Safari most) | Keep animated `blur()` under 20px |
| Unexpected properties animate | `transition: all`; list the properties |
| Element shifts 1px at start or end | CPU to GPU hand-off; `will-change: transform`, only once seen |

### Swaps down a tier

| Replace | With |
| --- | --- |
| `width`, `height`, `padding` for size change | `scale()` |
| `top`, `left`, `margin` for movement | `translate()` (its percentages refer to the element's own size) |
| `display` or `visibility` swaps | `opacity` |
| `box-shadow` | `filter: drop-shadow(...)` |

`scale()` scales children too; where that distorts content, take the exception in P5 instead.

### Drivers

| Driver | Thread |
| --- | --- |
| JS plus `requestAnimationFrame` (GSAP, Motion layout animations) | Main, always |
| WAAPI (`element.animate()`, Motion's `animate()` and `motion/react` components) | Can be accelerated |
| CSS transitions and keyframes | Can be accelerated |

Reliably accelerated: `transform`, `opacity`. Newer and uneven: `filter`, `clip-path`, `background-color`; test across browsers and devices.

```jsx
<motion.div animate={{ x: 100 }} />                          // accelerated on motion 14.2+
<motion.div animate={{ transform: "translateX(100px)" }} />  // accelerated in every version
```

On 14.2 and later, shorthands on an HTML element merge into a single accelerated transform animation, so leave them.

WAAPI gives JS control with CSS performance, interruptible and without a library:

```js
el.animate(
  [{ clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0 0)" }],
  { duration: 1000, fill: "forwards", easing: "cubic-bezier(0.77, 0, 0.175, 1)" },
);
```

### Per-frame writes

```js
setY(next);                                        // re-render every frame: drops frames
ref.current.style.transform = `translateY(${next}px)`;  // no render
y.set(next);                                       // motion value, no render
```

```js
el.style.setProperty("--drag", `${d}px`);  // recalculates every descendant, every frame
el.style.transform = `translateY(${d}px)`; // touches this element only
```

Look for state updates inside rAF, pointermove, scroll and drag handlers.

### will-change

```css
.drawer { will-change: transform; }
```

One animating element at a time, added after the symptom appears. Large blurred layers are the case where it pays: promote them and keep them small.

### Inventory

Prior to diagnosis, tabulate each animation in scope using these columns:

| Item | Driver | Animated properties | Runs while |
| --- | --- | --- | --- |
| Tab pill | `layoutId` shared layout | layout | route change |
| Sheet | CSS transition | `transform` | user drag |
| Card | CSS transition | `all` expanded to real list | hover |

Replace `transition: all` and Motion shorthands with the exact properties that move.

### Diagnosis order

Most frequent cause first:

1. Property check. Suspect anything outside `transform` and `opacity`: layout properties first, then `box-shadow` and `border-radius`, which pass for harmless and get missed.
2. Timing check. If frames drop only while the page is busy (navigation, fetching, hydration, long tasks), hand the animation to CSS or WAAPI.
3. React check. Look for renders per frame from rAF, pointer or scroll handlers.
4. Scale check. Slower as content grows points to a CSS variable inherited by many nodes, or to many nodes animating together.
5. Variable check. Any animated CSS variable, or Motion `x`/`y`/`scale` below 14.2.
6. Blur check. Any animated `blur()` over 20px.
7. Last resort. Shift or stutter persists: add `will-change: transform` to the animating element.

### Profiling

- Chrome DevTools Performance panel: shows dropped frames and long tasks.
- Animations panel to slow playback and step frames.
- A real mid-range phone over remote debugging (USB, dev server by local IP). Desktop CPU throttling does not model a weak GPU or small memory.

### Finding format

Each finding gives the element with `file:line`, its cause from the diagnosis list, the code before and after (for instance `transition: all 200ms` that animates `padding` becomes `transition: transform 200ms` driving `scale(0.97)`), and whether it was read from code or still needs a device recording.
