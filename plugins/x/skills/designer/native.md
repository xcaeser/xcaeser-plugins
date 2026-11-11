# Native (React Native and Expo)

Judging and building motion, press feedback, haptics and navigation in React Native and Expo apps, on a device.

## Judge

- N1 No hover: anything the web puts behind hover must live in press, position, or nowhere. A native screen that needs a pointer to reveal something is a defect.
- N2 Two runtimes: React renders and app logic run on the RN runtime; worklets run every frame on the UI runtime. Motion that touches the RN runtime stutters whenever the app does other work (a fetch, a render, a list mounting). Per-frame `setState`, `PanResponder`, core `Animated` under a finger, and animated layout properties are defects.
- N3 Verified only on hardware: a release build on the slowest device the app supports is the only valid test. Expo Go, the simulator and a dev build do not count, because a slow dev JS thread hides the very stutter being looked for. A native screen not seen that way is reported as read from code.
- N4 Frequency tiers: 100+ times a day (tab switches, keyboard open and close, scrolling, settings toggles) gets no animation, platform default or nothing. Tens of times a day (press, list navigation, row selection) stays under 150ms or does nothing. Occasional (sheets, modals, toasts, onboarding steps) gets standard motion. Rare or first-time (success, empty-state art, celebration) holds the delight budget.
- N5 Tabs never slide: they are peers, and a slide suggests a depth they lack. Tab changes use `animation: 'none'`; a tab bar is the platform's native one.
- N6 Purpose named: each animation is one of feedback, spatial consistency, state indication, cushioning an abrupt change, explanation, or delight (rare tier only). If no purpose can be named, remove it.
- N7 Screen transitions: navigation uses the platform default (iOS push is 350ms), matched, not overridden, and never rebuilt in JS. Elsewhere UI motion beats it: under 300ms. Reduced motion turns transitions into a fade.
- N8 Durations: press 100 to 150ms; toggle, chip or small state change 150 to 200ms; sheet, modal or drawer a spring that feels done in about 300ms.
- N9 Easing off the finger: entering or exiting a strong ease-out, on-screen movement a strong ease-in-out, constant motion (progress, marquee) linear, default ease-out. `Easing.in(...)` and the built-in weak curves on UI are defects.
- N10 Springs follow a finger: anything a finger touched settles on a spring seeded with the release velocity, never a restarting timing curve. Bounce only after a gesture carried momentum; a menu that faded in does not overshoot. A hard edge (a sheet leaving the bottom) must not overshoot, or a gap flashes.
- N11 Press answers on press-in, commits on press-out. A pressable that shows nothing until the tap completes feels dead. Press scale is 0.97 over 100 to 150ms, on the whole control so labels and icons scale with it.
- N12 Targets: at least 44pt on iOS and 48dp on Android. A smaller visual gets `hitSlop` rather than a bigger visual. A press survives slight finger drift (`pressRetentionOffset`).
- N13 Ripple belongs to Material-styled apps alone. A custom-designed app uses one scale press on both platforms, which is more coherent than a ripple on just one.
- N14 Haptic pairing: selection tick for a value passing a step (picker, slider detent, segmented control); light impact for a snap home, a detent catching, a drag committing; medium impact for a heavy landing or a destructive action; success or error notification for a result.
- N15 Haptic discipline: fires on the same frame as the visual, when the cause happens (the detent catching, not the animation finishing). One per user action. Never on scroll, per frame, or on an entrance the user did not cause. Never the only feedback, since haptics are off for many users and absent on most Android hardware.
- N16 Entrance on a recycled row: `entering` on a row of a virtualized list re-fires on every recycle, so the list flickers while scrolling. Animate the container once, or reflow only.
- N17 Keyboard-following UI tracks the keyboard's real position frame by frame via the keyboard controller. A listener plus a timing animation visibly lags or leads, because the keyboard rides a private system curve and the event arrives late on the JS thread.
- N18 Backdrop derived from the drag: a sheet's scrim opacity is a function of its translation, so it is always in sync. A scrim on its own timer drifts from the sheet.
- N19 Toasts: positioned inside the safe-area inset (a toast at 16 from the bottom sits under the home indicator); under 300ms; exits the way it entered; exit about 20% faster than entry. Uninvited, so it is kinder to be brisk and quiet.
- N20 Properties: `transform` and `opacity` only. `width`, `height`, `margin`, `padding`, `flex`, `top`, `left` and `gap` re-run layout for the node and its siblings every frame. Exception: an absolute element that has no children (tab pill, progress fill) may animate `width`, which keeps its corner radius where scale would smear it.
- N21 Shadows and blur: animating Android `elevation` re-renders the shadow every frame; animating `BlurView` intensity re-renders the blur every frame on Android. Crossfade the opacity of a static pre-shadowed or pre-blurred layer.
- N22 Entrance start state: `scale(0.9 to 0.97)` with opacity 0, never `scale(0)`.
- N23 Dismissal decides by velocity or distance: a flick is enough. A distance-only threshold feels heavy. Boundaries resist progressively; a hard stop is a defect.
- N24 Collapsing headers translate content inside a fixed-height clipped container, or use the native large title (iOS). Animating the header's height is a defect: it competes with the scroll itself.
- N25 Reduced motion ships with the animation, and means less and softer, not none. Opacity and color changes that explain state stay; translation, scale, parallax and overshoot go; screens fade.
- N26 Text scaling: type scales with the user's setting, so a height measured at default size is wrong at 200%. Animating to a hardcoded height is a defect; measure, or animate a transform.
- N27 Frame rate: on ProMotion iPhones animation is capped at 60fps unless the Info.plist minimum-frame-duration key is disabled; confirm it is set. The budget at 120Hz is 8ms, which is why UI-runtime motion matters more on mobile.
- N28 Native over rebuilt: sheets that are destinations, tab bars, context menus and previews, large-title headers and pull to refresh use the platform's native components. A JS rebuild is a defect unless the interaction is the product's signature.
- N29 Feel-check on device: flick the element, catch it mid-flight, reverse it, try the slowest Android available, and compare haptic timing with the visual. Code cannot settle velocity handoff or haptic timing.

## Build

### Tool choice

Walk down and stop at the first fit.

| Need | Tool |
| --- | --- |
| State change with no gesture (press, toggle, color) | Reanimated CSS transition, `transitionProperty` in the style |
| Looping, multi-stage, or mount-time play without a state change | Reanimated CSS animation via `animationName` keyframes |
| Mounting, unmounting, list reflow | Layout animations (`entering`, `exiting`, `itemLayoutAnimation`) |
| What a finger touches, what scroll drives | `useSharedValue` + `Gesture` + `useAnimatedStyle` |
| Moving between screens | Expo Router native stack options |
| Sheet that is its own screen | `presentation: 'formSheet'` |
| Tab bar | `NativeTabs` from `expo-router/unstable-native-tabs` |
| Context menu, hold-to-preview | `Link.Menu`, `Link.Preview` (iOS only) |
| Large collapsing title | `headerLargeTitleEnabled` on the native stack (iOS only; `headerLargeTitle` is deprecated) |
| Pull to refresh | `RefreshControl`; hand-roll only as a signature interaction |
| UI tracking the keyboard | `react-native-keyboard-controller` |
| Vector illustration, celebration, empty state | Lottie, never for UI state |
| Huge animated scene, freeform drawing | `@shopify/react-native-skia` |

Reanimated, never core `Animated` (it cannot be driven by a gesture without the bridge, and its native driver refuses anything but transform and opacity), and never `PanResponder`: use `Gesture.Pan()`.

A shared value earns its place when the value is continuous or must stay interruptible: a drag qualifies, a press scale (a CSS transition) does not. A worklet driving a two-state toggle is overkill.

### Install

Always `npx expo install <pkg>`, which resolves the SDK-matching version.

| Need | Package |
| --- | --- |
| Animation | `react-native-reanimated`, `react-native-worklets` |
| Gestures | `react-native-gesture-handler` |
| Routing, sheets, native tabs, menus | `expo-router` |
| Haptics | `expo-haptics` |
| UI that follows the keyboard | `react-native-keyboard-controller`, with `KeyboardProvider` at the root |
| Illustration | `lottie-react-native` |
| Large scenes, custom drawing | `@shopify/react-native-skia` |

### Setup traps ("the animation just does not run")

- In an Expo project `babel-preset-expo` wires the worklets Babel plugin; add nothing. A bare RN project lacking that preset registers it manually, as the last plugin. Without it correctly placed, runtime throws `Failed to create a worklet`.
- Wrap the app in `GestureHandlerRootView` (Expo Router: root `_layout`); otherwise gestures silently do nothing.
- Reanimated 4 needs the New Architecture enabled.
- ProMotion 120fps: Recent Expo SDKs set the key; confirm, else add it:

```json
{ "expo": { "ios": { "infoPlist": { "CADisableMinimumFrameDurationOnPhone": true } } } }
```

### Properties

- The `transform` array applies in order: `[{ translateY }, { scale }]` moves first, then scales; swapped, the translation gets scaled as well. Put translate first.
- `translate` accepts percentages of the element's own size, so `translateY('100%')` shifts a sheet by exactly its height, whatever it holds.
- Absolute, childless elements may animate `width` (tab pill, progress fill).

### Springs and easing

Reanimated springs take the designer pair, not mass, stiffness and damping.

| Interaction | Config |
| --- | --- |
| Default settle, move, no overshoot | `{ duration: 400, dampingRatio: 1 }` |
| Snap back after a flicked drag | `{ duration: 400, dampingRatio: 0.8, velocity }` |
| Sheet or drawer released by a flick | `{ duration: 300, dampingRatio: 0.8, velocity }` |
| Sheet closed by a button | `{ duration: 300, dampingRatio: 1 }`, never bounces |
| Must not pass a hard edge | add `overshootClamping: true` |

`duration` is time to settle, not a fixed run length. Pass `velocity` from the gesture on release.

```js
const EASE_OUT = Easing.bezier(0.23, 1, 0.32, 1);      // entering, exiting
const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);  // moving on screen
const EASE_SHEET = Easing.bezier(0.32, 0.72, 0, 1);    // iOS sheet curve
```

### Keeping work off the RN runtime

- No `setState` inside gesture or scroll handlers: a React render each frame is the top source of RN jank. Shared value into `useAnimatedStyle`.
- `scheduleOnRN(fn, ...args)` from `react-native-worklets` replaces the deprecated `runOnJS`. Keep it out of `onUpdate` and scroll handlers, where it would run 60 to 120 times a second. Use it in `onEnd`, or from `useAnimatedReaction` when a value crosses a threshold. Haptics from a worklet: `scheduleOnRN(Haptics.selectionAsync)`.
- Read and write shared values with `.get()` and `.set()` (also `sv.set((v) => v + 1)`), the React Compiler safe form. Never read or write one during render: a read is a stale snapshot, a write replays on any re-render.
- A function called from a worklet starts with `'worklet'`, or it throws on device while working in the debugger.
- Wrap gestures in `useMemo`; a gesture rebuilt on each render may reattach its recognizer and lose a drag in progress. Layout-animation builders live at module scope or in `useMemo`.
- Gesture Handler v3 (Expo installs v2) retires the builder: each gesture becomes a hook such as `usePanGesture({...})` with one config object; `onStart` becomes `onActivate`, `onEnd` becomes `onDeactivate`, the `success` flag becomes an inverted `event.canceled`; drop the `useMemo`.

### Reduced motion

```js
const reduced = useReducedMotion();
withSpring(0, { duration: 300, dampingRatio: 1, reduceMotion: ReduceMotion.System });
```

Use `useReducedMotion()` to choose initial values or transitions, or `ReduceMotion.System` per animation. Set `animation: 'fade'` on screens when reduced.

### Shared worklets

```js
// Where a flick would come to rest (exponential-decay form).
function project(velocity, rate = 0.998) {
  'worklet';
  return ((velocity / 1000) * rate) / (1 - rate);
}
// Resistance past an edge.
function rubberband(over, dim, c = 0.55) {
  'worklet';
  return (over * dim * c) / (dim + c * Math.abs(over));
}
```

### Recipes

Setup: `npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics` (plus the keyboard package only for that recipe). Wrap the root `_layout` in `GestureHandlerRootView style={{ flex: 1 }}`.

**Press feedback.** `Pressable` with `onPressIn`/`onPressOut` toggling a state (two renders per press, not per frame) that switches a style on an `Animated.View`: `transitionProperty: 'transform'`, `transitionDuration: '120ms'`, `transitionTimingFunction: 'cubic-bezier(0.23, 1, 0.32, 1)'`, pressed `scale 0.97`. Add `hitSlop` (about 12) to reach 44pt and `pressRetentionOffset` (about 16).

**Bottom sheet, drag to dismiss.** A sheet that is a destination should be `formSheet`; hand-build only a sheet embedded in a screen.
- `Gesture.Pan().activeOffsetY([-10, 10])` so a horizontal swipe wins and intent is required.
- `onStart`: `context.set(translateY.get())`, so a catch mid-animation continues from the on-screen value.
- `onUpdate`: `next = context + translationY`; free downward, `rubberband` upward past the top.
- `onEnd`: `projected = translateY + project(velocityY)`; if above 40% of the height, spring to height with `{ duration: 300, dampingRatio: 1, velocity, overshootClamping: true }` and call `onClose` through `scheduleOnRN` in the finish callback; otherwise spring to 0 with `{ duration: 300, dampingRatio: 0.8, velocity }` and fire a light impact.
- Backdrop: `interpolate(translateY, [0, HEIGHT], [1, 0], Extrapolation.CLAMP)`.
- Velocity decides, not distance; velocity handed to the spring leaves no seam at release.

**Swipe to delete.** For revealed action buttons, use gesture-handler's `ReanimatedSwipeable`. Build by hand only for swipe-to-commit with momentum.
- `activeOffsetX([-10, 10])`: declare the axis or the pan steals vertical scroll and reads as a scrolling bug.
- `onStart` captures the current x; `onUpdate` sets `Math.min(0, context + translationX)`.
- `onEnd`: if `x + project(velocityX)` is past `-SWIPE_THRESHOLD`, `withTiming(-WIDTH, { duration: 200, easing: EASE_OUT })` then `scheduleOnRN(onDelete, id)` on finish; else `withSpring(0, { duration: 300, dampingRatio: 1, velocity })`.
- The gap closes through the list: `itemLayoutAnimation={LinearTransition.duration(200)}` on `Animated.FlatList`, built at module scope.

**Collapsing header.** `useAnimatedScrollHandler` writes `scrollY`; the title style interpolates `scrollY` over `[0, 60]` to opacity `[1, 0]` and translateY `[0, -12]`, both with `Extrapolation.CLAMP` (without it opacity goes negative and the header reappears inverted). `scrollEventThrottle={16}`. Fixed-height container, `overflow: 'hidden'`, never animate height.

**List entrance.** Memoize `FadeInDown.duration(250).delay(index * 40)` per row with `useMemo`. Stagger 30 to 80ms. Only for content the person asked for and waits on; a list scrolled all day is already there. Never on virtualized rows.

**Keyboard-synced UI.** Install `react-native-keyboard-controller`; mount `KeyboardProvider` in the root `_layout` beside the gesture root (hooks do nothing without it). `const { height } = useReanimatedKeyboardAnimation()` runs from 0 to the negative keyboard height on the UI runtime; style `translateY: height.get()`. Never `Keyboard.addListener` plus a timer.

**Tab or segmented indicator.** Measure each tab once with `onLayout` into state. On `active` change, `withTiming` both `x` (as `translateX`) and `width` to the measured values, 250ms, `EASE_IN_OUT`. The pill is absolute and childless, so animating `width` is allowed. Fire `Haptics.selectionAsync()` on the press, not on landing.

**Screen transitions (Expo Router native stack).** `screenOptions={{ animation: reduced ? 'fade' : 'default' }}`.

| Navigation | Option |
| --- | --- |
| Deeper in a hierarchy | `animation: 'default'` |
| Self-contained, abandonable task | `presentation: 'modal'` |
| Short interruption (picker, filter, share) | `presentation: 'formSheet'`, with `sheetAllowedDetents`, `sheetGrabberVisible: true` |
| Between tabs | `animation: 'none'` |
| Reduced motion | `animation: 'fade'` |

With a custom `animation` such as `slide_from_right`, set `animationMatchesGesture: true` so the iOS back swipe reverses it under the finger. Form sheet caveats: Android caps detents at three (longer arrays silently truncate); `sheetGrabberVisible` is iOS only, so the grabber cannot be the only draggable hint; Android form sheets cannot host native headers or nested stacks (use `modal` instead); `fitToContents` needs explicitly sized content, since a `flex: 1` root has no intrinsic height.

**Toast.** Module-scope `FadeInDown.duration(300).easing(EASE_OUT)` entering and `FadeOutDown.duration(250).easing(EASE_OUT)` exiting; absolute at `bottom: insets.bottom + 16`, `left: 16`, `right: 16`. For stacked toasts add `itemLayoutAnimation` and tune opacity against the reflow by eye; revisit it the next day.

**Fire once at a threshold.** `useAnimatedReaction(() => pull.get() > THRESHOLD, (now, was) => { if (now !== was) { armed.set(now); scheduleOnRN(Haptics.impactAsync, Haptics.ImpactFeedbackStyle.Light); } })`. The comparison runs per frame on the UI runtime; the RN call happens once per crossing. This is the pattern for any action triggered when motion reaches a value.
