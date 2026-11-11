# Apple (SwiftUI, with UIKit where it falls short)

Judging and building screens, motion, haptics and accessibility for Swift apps on iOS, iPadOS, watchOS, macOS and widgets, on a simulator or device.

## Judge

### System first

- A1 Native over rebuilt: navigation (`NavigationStack`, `NavigationSplitView`), `TabView`, sheets, menus, toolbars, `List`, `Form`, pickers, toggles, context menus and pull to refresh use the platform component. A rebuild is a defect unless the interaction is the product's signature, and any rebuild that loses back swipe, Dynamic Type, VoiceOver, pointer or keyboard behavior is HIGH.
- A2 Back swipe: every pushed screen on iOS returns with the edge swipe. After any custom back button, hidden bar or full-width gesture, confirm on device that it still works; a gesture that fights it is a defect.
- A3 Tabs are peers: selecting one never slides or animates, each keeps its own navigation state, and the bar is the system's. A custom tab bar is a defect.
- A4 Navigation transitions: push, pop, sheet and cover use the platform default, matched, never rebuilt with offsets. The one custom transition allowed is a zoom from a card or thumbnail to its detail (`navigationTransition(.zoom)`), which stays interactive on dismissal. `matchedGeometryEffect` is for a morph inside one screen.
- A5 Sheets: a short interruption (filter, picker, share, quick edit) is a sheet with `presentationDetents` and a visible grabber when it resizes. A task sheet has Cancel and Save in the toolbar. Swipe-down dismissal is never blocked unless work would be lost, and then `interactiveDismissDisabled` comes with a confirmation. Full-screen cover is for immersive flows only.
- A6 Confirmation dialogs guard only the destructive and irreversible, with a `.destructive` role on that button. Routine removal gets undo (flow.md S4).
- A7 Toolbar placement is semantic (`cancellationAction`, `confirmationAction`, `primaryAction`, `topBarTrailing`), never hand-positioned. Exactly one primary action per bar, and a destructive button never sits beside it.
- A8 Hit targets: at least 44 x 44pt on iOS and iPadOS, including icon-only buttons and rows. A smaller glyph gets `contentShape` padding, not a bigger glyph; on the scale this is a 34pt glyph in a 55pt shape (craft.md C15). Neighbouring targets are 8pt apart or more. On macOS a custom control is never shorter than the system control of the same role and `controlSize`; on watchOS prefer system buttons, and a custom one meets 44pt.
- A9 Press feedback: a custom control answers touch-down within 100 to 150ms (craft.md C1: `scale(0.97)`) through a `ButtonStyle` reading `isPressed`. `onTapGesture` on a view standing in for a button has no press state, no VoiceOver trait and no keyboard activation, and is a defect.

### Type, symbols, color

- A10 Dynamic Type: reading text uses text styles (`.body`, `.headline`, `.caption`), never `.font(.system(size:))`. Custom sizes scale through `@ScaledMetric(relativeTo:)` on a step of the φ scale. A fixed size is acceptable only for a figure inside a fixed-size graphic (a ring, a glyph) whose value is also exposed to VoiceOver.
- A11 Accessibility sizes: at the largest accessibility text size nothing essential is clipped, overlapped or truncated; rows reflow from horizontal to vertical; no hardcoded heights on text containers; icon-only fallbacks keep a label. A fixed height measured at the default size is a finding (type.md T6).
- A12 Symbols: an SF Symbol beside text shares its font, weight and scale (`Label`, or the same `.font` on both); two symbols side by side share one weight and rendering mode; the filled variant marks the selected state. A symbol at a different weight than its label is a finding (craft.md C16).
- A13 Semantic color: foreground is `.primary` / `.secondary` / `.tint`, surfaces are system backgrounds or asset-catalog colors with light, dark and increased-contrast variants. A literal `Color(red:)` on text or a surface is a finding. Body text reaches 4.5:1 and large text 3:1 in both schemes. The tint colors interactive things only.
- A14 Materials: floating bars and sheets use system materials (`.regularMaterial` and its siblings) over content that scrolls under them; a material never sits on another translucent layer (craft.md C9). Text on a material uses primary or secondary styles, not custom gray.
- A15 Liquid Glass: on iOS 26 and later, bars, tab bars, sheets and toolbars take the system glass by building with the new SDK; leave them alone. Custom `glassEffect` is for a few floating controls above content, never the content layer and never glass on glass, and neighbouring glass shares one `GlassEffectContainer`. With a deployment target below 26 every use is gated with `#available` and falls back to a material, so no screen is blank or flat on iOS 18. A fake glass built from blur and strokes on iOS 26 is a defect.

### Motion and gestures

- A16 Frequency tiers (motion.md M2): tab switches, keyboard show and hide, scrolling, list selection and settings toggles get the platform default or nothing. Press and row selection stay under 150ms. Sheets, banners and onboarding steps get standard motion. Celebration and first-run art hold the delight budget.
- A17 Springs map to gestures.md: `.smooth` is the default (critically damped, G21), `.snappy` for small quick state changes, `.bouncy` or a `bounce` above 0 only after a gesture carried momentum or in a playful product (G22), and bounce 0 when a button closes something (G24). Timing curves are for what no finger touched: `.timingCurve` with motion.md's strong curves, `.linear` for progress and holds; bare `.easeIn` is a defect (M14).
- A18 Interruptible: SwiftUI retargets an animation from its on-screen value, so motion stays catchable (G9, G10). Defects: sequencing with `Task.sleep` or `asyncAfter`, a flag that ignores input while animating, and a completion handler that must finish before the next state.
- A19 Tracking then release: while a finger is down the view follows the touch 1:1 with no animation (G1, `DragGesture` writing `@GestureState` or `@State` outside `withAnimation`); on release a spring takes over, seeded with release velocity (G14) where the API accepts one (`interpolatingSpring(initialVelocity:)`, normalized per G16). Dismissal decides by `predictedEndTranslation` or velocity, not distance alone (G17 to G19), and the rubber band past an edge resists progressively (G20).
- A20 Linked values derive from one progress: a custom sheet's scrim, scale and shadow are functions of its offset (G27), never separate animations; native sheets already do this.
- A21 Entrance start state: `.transition(.scale)` scales from 0, so it is a defect (motion.md M20). Use `.scale(scale: 0.95)` combined with `.opacity`, anchored at the trigger for a popover or menu (M21) and centered for a modal.
- A22 Animation scope: a bare `.animation(_:)` is deprecated and a bare `.animation(.smooth)` reached through a container leaks onto unrelated children. Use `.animation(_:value:)` on the leaf, `withAnimation` at the cause, or `transaction` to cancel an inherited animation.
- A23 Cheap properties: animate `opacity`, `offset`, `scaleEffect`, `rotationEffect`; animating `.frame` or `.padding` on a view with a large subtree re-lays-out it every frame (performance.md P3). Animated blur stays at or under 20pt (P16). Changing numbers use `.contentTransition(.numericText())` and `monospacedDigit` (type.md T10), not a crossfade of the whole label.
- A24 Scroll: paging and snapping use `scrollTargetBehavior` (`.viewAligned`, `.paging`), not a `DragGesture` on a `ScrollView`. Scroll-driven effects use `scrollTransition`, subtle (gentle scale or opacity), on content the person scrolls through, never on functional data (motion.md M6). Collapsing titles are the native large title; animating a header's height is a defect.
- A25 Lists: long lists are `List` or `LazyVStack`, never a plain `VStack` of hundreds of rows. An entrance animation in `onAppear` on a lazy row replays every time it scrolls back and is a defect; animate the container once or reflow only.
- A26 Reduced motion ships with every animation and means less and softer: read `accessibilityReduceMotion`, turn slides, zooms, parallax, springs with bounce and scroll transitions into a short fade or none, keep opacity and color that explain state (motion.md M30, G43).
- A27 Reduced transparency and contrast: custom translucent surfaces read `accessibilityReduceTransparency` and turn solid, and `colorSchemeContrast == .increased` adds a defined border; system materials adapt on their own (craft.md C13).

### Haptics

- A28 Pairing: `.selection` for a value passing a step (picker, slider detent, segment); `.impact(weight: .light)` for a snap home, a detent catching or a drag committing; `.impact(weight: .medium)` for a heavy landing or a destructive act; `.success`, `.warning` or `.error` for a result.
- A29 Discipline: the haptic fires on the frame of its cause, which is the state change its trigger watches (the detent catching, not the animation ending); one per user action; never on scroll, per frame or on an entrance the person did not cause; never the only feedback, since haptics are off for many people and absent on simulators and iPads (craft.md C17 to C19). An app that fires haptics on routine interactions offers an off switch.

### Accessibility, layout, input

- A30 VoiceOver: every control has a label saying what it does (icon-only buttons included), state in `accessibilityValue` and traits instead of words in the label, decorative images hidden, and a row combined into one element when its parts are not separately actionable. A control whose label is its symbol name ("plus.circle") is a defect.
- A31 Gesture equivalents: every swipe action, drag, reorder and long press has an `accessibilityAction`, and an adjustable control exposes increment and decrement. Custom bar items that cannot grow with text offer the Large Content Viewer.
- A32 Safe areas: content respects them, backgrounds extend through them, and floating UI (toast, bottom bar, input bar) attaches with `safeAreaInset` rather than a fixed offset from the screen edge, which sits under the home indicator or Dynamic Island. Toasts run under 300ms and exit about 20% faster than they enter, the way they came (G29).
- A33 Keyboard: the system's avoidance is kept; no hand-rolled offset from keyboard notifications, which lags the real curve. A bar that rides the keyboard is a bottom `safeAreaInset`. Forms scroll with `scrollDismissesKeyboard`, advance with `submitLabel` and `@FocusState`, and keep the focused field visible. `ignoresSafeArea(.keyboard)` is deliberate and rare.
- A34 Adaptive size: layout follows available width and size class, never device idiom, and holds on iPad in Split View, Slide Over, Stage Manager windows and at every rotation. iPad and macOS use `NavigationSplitView`; custom tappables on iPad have a pointer `hoverEffect`; commands on iPad get keyboard shortcuts.

### watchOS

- A35 Glanceable: a screen has one job readable in about two seconds, in large text styles, with no dense lists of small controls; flows are short sessions of a few taps, and the Digital Crown drives the value when there is one.
- A36 Crown and haptics: a value on the Crown uses `digitalCrownRotation` with detents and a haptic at each, and the same value is reachable by touch. Haptics are a main channel on the wrist, and still never the only feedback.
- A37 Always On: under `isLuminanceReduced` the screen dims, drops seconds, animation and sensitive or secondary detail, and keeps contrast; no continuous animation runs.
- A38 Navigation stays platform: `NavigationStack`, vertical-page `TabView` where pages are peers, a bottom toolbar for the primary action; no custom paging.

### Widgets

- A39 One idea per widget, readable at a glance, with no text below the system's smallest text styles, and each family (small, medium, accessory) laid out for its own size rather than scaled.
- A40 Relevance: timeline entries carry relevance where one matters more at a moment, and the widget shows something true for the whole interval until its next entry.
- A41 Rendering modes: the widget is judged in full color, accented and vibrant. Content that must stand out is `widgetAccentable`, images have an accented treatment, color is never the only carrier of meaning, and the background is `containerBackground(for: .widget)`. A widget unreadable when tinted is a defect.
- A42 Motion in widgets is only what WidgetKit allows: system content transitions (`.numericText`) and `Button(intent:)` / `Toggle(intent:)` that update at once. Custom animation, gestures and scrolling are defects; reduced motion still applies.

### macOS

- A43 Commands: every action is in the menu bar with a keyboard shortcut where one makes sense, through `commands`. Standard shortcuts (⌘, for Settings, ⌘W, ⌘Z, ⌘N) are never rebound; Preferences is a `Settings` scene.
- A44 Windows: they restore size and position, set a minimum and default size, are resizable, and a sidebar is `NavigationSplitView` with the toolbar in the title bar. Content never assumes one window.
- A45 Pointer is normal here (the opposite of touch): hover states, tooltips (`help`), cursor changes (`pointerStyle`) and right-click context menus are expected, and hover may reveal secondary controls only when the action is also in a menu or reachable by keyboard.
- A46 Focus: keyboard focus is visible and the tab order follows reading order; `focusEffectDisabled` without a replacement ring is a defect. No motion on keyboard-initiated actions (motion.md M1) and lighter motion than on touch.

### Commerce

- A47 Paywall honesty: before the buy button the screen shows the localized price from `Product.displayPrice`, the billing period, the trial length and the date it ends or renews; the button label names the commitment. Restore Purchases is reachable on the paywall, close is visible without delay, no trial toggle is pre-armed, and terms and privacy links are present. A hard-coded price string is a defect.

### Performance and verification

- A48 Release build on the slowest supported device is the only valid test. The Simulator and debug builds misjudge feel (slower SwiftUI, no haptics, different GPU), so feel found there is reported as read from code and the feel-check named (motion.md M43).
- A49 Frame budget: 8ms at 120Hz ProMotion, 16.7ms at 60Hz; design to 8 (performance.md P2). Confirm with Instruments rather than by feel: Animation Hitches for drops, the SwiftUI instrument for what re-evaluates and why, Time Profiler for the main thread.
- A50 State scope: a drag or scroll writes state only in the subview that moves. A parent whose `body` re-runs every frame during a gesture is a defect (performance.md P14); expensive work in `body` (formatters, sorting, image decoding) is too.
- A51 UIKit only where a named SwiftUI limit exists (variable-intensity haptics, a custom sheet presentation, a huge heterogeneous feed, a system control with no SwiftUI form). It sits behind a small representable that owns its lifecycle and keeps Dynamic Type, VoiceOver and safe areas working.
- A52 Device feel-check: flick the element, catch it mid-flight, reverse it, hold it, then compare the haptic's timing with the visual. Code cannot settle velocity hand-off or haptic timing (G44, G45).

## Build

### Tokens

One enum holds the φ scale (craft.md C15, points); every padding, size and radius reads from it.

```swift
enum Scale {
    static let s3: CGFloat = 3, s5: CGFloat = 5, s8: CGFloat = 8, s13: CGFloat = 13
    static let s21: CGFloat = 21, s34: CGFloat = 34, s55: CGFloat = 55, s89: CGFloat = 89, s144: CGFloat = 144, s233: CGFloat = 233
}
```

### Structure

```swift
enum AppTab: Hashable { case today, history }

struct RootView: View {
    @State private var tab = AppTab.today
    var body: some View {
        TabView(selection: $tab) {
            Tab("Today", systemImage: "sun.max", value: AppTab.today) {
                NavigationStack { TodayScreen() }
            }
            Tab("History", systemImage: "clock", value: AppTab.history) {
                NavigationStack { HistoryScreen() }
            }
        }
    }
}
```

- `TabView` with `Tab` (iOS 18) is the peer switcher; on iPad and macOS it adapts to a sidebar. On iOS 26, `tabBarMinimizeBehavior(.onScrollDown)` collapses the bar while scrolling; gate it. Master and detail on iPad and Mac is `NavigationSplitView`; a `NavigationStack` per tab keeps its own path.

```swift
struct EditSheet: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            Form { Text("Fields") }
                .navigationTitle("Edit")
                .toolbar {
                    ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                    ToolbarItem(placement: .confirmationAction) { Button("Save") { dismiss() } }
                }
        }
        .presentationDetents([.medium, .large])
        .presentationDragIndicator(.visible)
    }
}
```

- Destructive guard: `.confirmationDialog("Delete this entry?", isPresented: $confirm, titleVisibility: .visible) { Button("Delete", role: .destructive) { remove() } }`.
- `presentationBackgroundInteraction(.enabled(upThrough: .medium))` lets the page behind stay live at the small detent for a parallel panel (craft.md C7).

```swift
struct GalleryScreen: View {
    @Namespace private var zoom
    let items: [Item]
    var body: some View {
        NavigationStack {
            List(items) { item in
                NavigationLink(value: item) { Thumbnail(item: item) }
                    .matchedTransitionSource(id: item.id, in: zoom)
            }
            .navigationDestination(for: Item.self) { item in
                DetailScreen(item: item).navigationTransition(.zoom(sourceID: item.id, in: zoom))
            }
        }
    }
}
```

The zoom (iOS 18, not macOS) pairs `matchedTransitionSource` on the row with `navigationTransition(.zoom)` on the destination.

### Targets and press

```swift
struct IconButton: View {
    let systemName: String
    let label: LocalizedStringKey
    let action: () -> Void
    var body: some View {
        Button(action: action) {
            Image(systemName: systemName)
                .font(.body.weight(.semibold))
                .frame(width: Scale.s34, height: Scale.s34)
        }
        .frame(minWidth: Scale.s55, minHeight: Scale.s55)
        .contentShape(.rect)
        .buttonStyle(PressScale())
        .accessibilityLabel(label)
    }
}

struct PressScale: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1)
            .animation(.timingCurve(0.23, 1, 0.32, 1, duration: 0.12), value: configuration.isPressed)
    }
}
```

- System button styles already highlight; keep one custom press style for the app.

### Type and symbols

```swift
struct StatRow: View {
    @Environment(\.dynamicTypeSize) private var typeSize
    @ScaledMetric(relativeTo: .body) private var glyph = Scale.s21
    var body: some View {
        let layout = typeSize.isAccessibilitySize
            ? AnyLayout(VStackLayout(alignment: .leading, spacing: Scale.s8))
            : AnyLayout(HStackLayout(spacing: Scale.s13))
        layout {
            Image(systemName: "flame.fill")
                .symbolRenderingMode(.hierarchical)
                .frame(width: glyph, height: glyph)
            Text("Streak").font(.headline)
            Text("12 days")
                .font(.body.monospacedDigit())
                .contentTransition(.numericText())
        }
    }
}
```

- `Label("Streak", systemImage: "flame.fill")` keeps symbol and text matched for free. For a lone symbol, set `.font(.title3.weight(.semibold))` or `.imageScale(.large)` to match its neighbours.
- Swap a symbol with `.contentTransition(.symbolEffect(.replace))`.

### Materials and glass

```swift
extension View {
    @ViewBuilder
    func floatingSurface() -> some View {
        if #available(iOS 26, macOS 26, *) {
            glassEffect(.regular.interactive(), in: .capsule)
        } else {
            background(.regularMaterial, in: .capsule)
        }
    }
}
```

- Neighbouring glass shares one `GlassEffectContainer(spacing:)` (iOS 26). `.buttonStyle(.glass)` and `.glassProminent` are the system glass buttons; one prominent per screen (flow.md S13). Tint glass only to carry meaning.
- On iOS 26 `scrollEdgeEffectStyle(_:for:)` and `backgroundExtensionEffect()` replace hand-built edge fades and hero bleeds; gate and fall back to a plain divider (craft.md C12).
```swift
struct Banner: View {
    @Environment(\.accessibilityReduceTransparency) private var reduceTransparency
    @Environment(\.colorSchemeContrast) private var contrast
    let text: String
    var body: some View {
        Text(text)
            .padding(Scale.s13)
            .background(reduceTransparency ? AnyShapeStyle(.background) : AnyShapeStyle(.regularMaterial), in: .rect(cornerRadius: Scale.s21))
            .overlay {
                if contrast == .increased { RoundedRectangle(cornerRadius: Scale.s21).strokeBorder(.primary) }
            }
    }
}
```

### Springs

| Interaction | SwiftUI |
| --- | --- |
| Default settle, move, no overshoot | `.smooth` or `.spring(duration: 0.4, bounce: 0)` |
| Small quick state change (toggle, chip) | `.snappy` (duration 0.3 to 0.4s feel, small bounce) |
| Sheet or card released by a flick | `.spring(duration: 0.3, bounce: 0.2)`, velocity seeded |
| Closed by a button | `.smooth(duration: 0.3)`, never bounces |
| Playful, after momentum only | `.bouncy` |
| Entering or exiting, no finger | `.timingCurve(0.23, 1, 0.32, 1, duration: 0.25)` |
| Progress, hold fill | `.linear(duration:)` |

`duration` is time to settle, not a fixed run length. A hard edge (a sheet leaving the bottom) uses bounce 0, or a gap flashes.

```swift
struct DismissableCard: View {
    let travel: CGFloat
    let onDismiss: () -> Void
    @State private var dy: CGFloat = 0
    var body: some View {
        RoundedRectangle(cornerRadius: Scale.s21)
            .frame(height: Scale.s233)
            .offset(y: dy)
            .gesture(
                DragGesture()
                    .onChanged { dy = max(0, $0.translation.height) }
                    .onEnded { drag in
                        let flick = drag.predictedEndTranslation.height > Scale.s144
                        if flick {
                            withAnimation(.smooth(duration: 0.3)) { dy = travel } completion: { onDismiss() }
                        } else {
                            let velocity = drag.velocity.height / max(dy, 1)
                            withAnimation(.interpolatingSpring(duration: 0.3, bounce: 0.2, initialVelocity: velocity)) { dy = 0 }
                        }
                    }
            )
    }
}
```

- `onChanged` writes outside `withAnimation`, so tracking is 1:1. Release hands velocity to the spring normalized by the distance left (gestures.md G16). Rubber band past an edge: follow a shrinking fraction of the overshoot (G20).

### Scroll

```swift
struct Carousel: View {
    let cards: [Card]
    var body: some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: Scale.s13) {
                ForEach(cards) { card in
                    CardView(card: card)
                        .containerRelativeFrame(.horizontal)
                        .scrollTransition(axis: .horizontal) { content, phase in
                            content.opacity(phase.isIdentity ? 1 : 0.6)
                        }
                }
            }
            .scrollTargetLayout()
        }
        .scrollTargetBehavior(.viewAligned)
        .contentMargins(.horizontal, Scale.s21, for: .scrollContent)
    }
}
```

- `.paging` for full-page snaps. `scrollPosition(id:)` reads and sets the current item. `.scrollDismissesKeyboard(.interactively)` on forms.

### Haptics

```swift
struct RestPicker: View {
    @State private var seconds = 60
    var body: some View {
        Picker("Rest", selection: $seconds) {
            ForEach([30, 60, 90], id: \.self) { Text("\($0) s").tag($0) }
        }
        .pickerStyle(.segmented)
        .sensoryFeedback(.selection, trigger: seconds)
    }
}
```

- The trigger is the state whose change is the cause, so the haptic lands with the visual. For a result that can be success or failure, `sensoryFeedback(trigger:) { old, new in ... }` returns the feedback, or `nil` for none.
- `sensoryFeedback` has no intensity or latency control. Where that matters (a detent crossed during a drag), use UIKit:

```swift
import UIKit

@MainActor
struct DetentHaptic {
    private let generator = UIImpactFeedbackGenerator(style: .light)
    func prepare() { generator.prepare() }
    func fire(intensity: CGFloat = 1) { generator.impactOccurred(intensity: intensity) }
}
```

Call `prepare()` when the drag begins, `fire` once on each crossing (a comparison on the previous value, not every frame).

### Reduced motion

```swift
struct Reveal: View {
    @Environment(\.accessibilityReduceMotion) private var reduceMotion
    let shown: Bool
    var body: some View {
        Group {
            if shown {
                Text("Saved")
                    .transition(reduceMotion ? .opacity : .move(edge: .top).combined(with: .opacity))
            }
        }
        .animation(reduceMotion ? .easeOut(duration: 0.2) : .smooth, value: shown)
    }
}
```

- A fade stays, the slide goes; matched zooms and parallax fall back to the fade.

### Accessibility

```swift
struct SetRow: View {
    @Binding var reps: Int
    var body: some View {
        Text("\(reps)").monospacedDigit()
            .accessibilityValue("\(reps) reps")
            .accessibilityAdjustableAction { direction in
                switch direction {
                case .increment: reps += 1
                case .decrement: reps = max(0, reps - 1)
                @unknown default: break
                }
            }
            .accessibilityAction(named: "Reset") { reps = 0 }
    }
}
```

- Labels say the action ("Add set"), not the symbol. `accessibilityHidden(true)` on decoration. `.accessibilityAddTraits(.isHeader)` on section titles. `accessibilityShowsLargeContentViewer()` on custom bar items.
- Swipe actions, drags and long presses each get an `accessibilityAction(named:)` doing the same thing.

### Safe areas, keyboard, toast

```swift
extension View {
    func toast(_ message: String?) -> some View {
        safeAreaInset(edge: .bottom) {
            if let message {
                Text(message)
                    .padding(.horizontal, Scale.s21)
                    .padding(.vertical, Scale.s13)
                    .background(.regularMaterial, in: .capsule)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
            }
        }
        .animation(.smooth(duration: 0.3), value: message)
    }
}
```

- The same bottom `safeAreaInset` carries an input bar and rides the keyboard with the system's own curve. Exit goes the way it came in (G29).

### watchOS

```swift watchos
struct RestDial: View {
    @State private var seconds = 60.0
    @Environment(\.isLuminanceReduced) private var dimmed
    var body: some View {
        VStack {
            Text("\(Int(seconds)) s")
                .font(.largeTitle.monospacedDigit())
                .opacity(dimmed ? 0.6 : 1)
            Text("Rest").font(.footnote).foregroundStyle(.secondary)
        }
        .focusable()
        .digitalCrownRotation($seconds, from: 15, through: 180, by: 5, sensitivity: .medium, isContinuous: false, isHapticFeedbackEnabled: true)
    }
}
```

- Pages that are peers: `TabView { ... }.tabViewStyle(.verticalPage)`. Under `isLuminanceReduced` drop animation and secondary detail; the system also stops updating you, so show a value true for the minute.

### Widgets

```swift
import WidgetKit

struct StreakView: View {
    @Environment(\.widgetRenderingMode) private var mode
    let days: Int
    var body: some View {
        VStack(alignment: .leading, spacing: Scale.s5) {
            Text("Streak").font(.caption).foregroundStyle(.secondary)
            Text("\(days)")
                .font(.largeTitle.bold().monospacedDigit())
                .contentTransition(.numericText())
                .widgetAccentable()
        }
        .foregroundStyle(mode == .fullColor ? Color.accentColor : .primary)
        .containerBackground(.fill.tertiary, for: .widget)
    }
}
```

- Entries carry `TimelineEntryRelevance(score:)` where a moment matters more. Preview in all three rendering modes (Xcode previews with `.widgetAccentedRenderingMode` images where there is art). Interactions are `Button(intent:)`.

### macOS

```swift macos
struct NotesApp: App {
    var body: some Scene {
        WindowGroup { NotesRoot() }
            .defaultSize(width: Scale.s233 * 3, height: Scale.s144 * 4)
            .commands {
                CommandMenu("Note") {
                    Button("New Note") {}.keyboardShortcut("n")
                }
            }
        Settings { NotesSettings() }
    }
}
```

- Hover: `.onHover`, `.pointerStyle(.link)`, `.help("Open")`, with `Color.primary.opacity(0.08)` for the hover fill. Default shortcuts come with system commands (`CommandGroup(replacing:)` only with reason). `windowResizability(.contentMinSize)` plus a `frame(minWidth:minHeight:)` on the root sets the minimum.
- Hover is chrome, not information: `Color.primary.opacity(...)` adapts to both schemes.

### StoreKit paywall

```swift
import StoreKit

struct PaywallFooter: View {
    let product: Product
    var body: some View {
        VStack(spacing: Scale.s8) {
            Text("\(product.displayPrice) after the trial. Renews until cancelled.").font(.footnote)
            Button("Restore Purchases") { Task { try? await AppStore.sync() } }.font(.footnote)
        }
    }
}
```

- State the trial length and end date beside the price in the same type size as the price. `SubscriptionStoreView` supplies compliant terms and a restore control when a stock paywall will do.
