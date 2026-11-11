# Vocabulary

A glossary of motion and interaction terms, for naming an effect precisely.

## Entrances and exits

- Fade in / fade out: opacity alone brings an element in or takes it out.
- Slide in: the element travels in from beyond an edge of the screen.
- Scale in: the element swells from a smaller size while arriving, typically fading too.
- Pop in: arrival with a slight overshoot, so it seems to bounce into place.
- Reveal: content gets uncovered step by step, normally via an animated clip-path or mask.
- Enter / exit: whatever plays on mount and on unmount.

## Sequencing and timing

- Keyframes: authored waypoints (0%, 50%, 100%); the engine supplies the frames between.
- Interpolation / tween: computing each intermediate value between start and end, which makes motion continuous.
- Stagger: a small offset in start time per item, producing a cascade.
- Orchestration: planning the timing of several animations so together they read as a single move.
- Delay: waiting time ahead of the start.
- Duration: total running time.
- Fill mode: whether styles from the first or last frame stick outside the animation's run (forwards, backwards).
- Stepped animation: motion in discrete jumps instead of a smooth run, as in a countdown.

## Movement and transforms

- Translate: shift along X or Y.
- Scale: resize larger or smaller.
- Rotate: turn around a point.
- Skew: shear along an axis, so rectangles lean.
- 3D tilt / flip: turning through depth with rotateX or rotateY.
- Perspective: how pronounced the 3D looks; a smaller value pushes the viewer closer and exaggerates depth.
- Transform origin: the pivot that scaling and rotation work from.
- Origin-aware animation: growth out of the trigger (a popover leaving its button), not out of the element's own middle, which CSS does by default.

## Transitions between states

- Crossfade: two elements swap in the same place, one fading out as the other fades in.
- Continuity transition: a change whose before and after are visibly linked so the person keeps their bearings, such as a single rectangle enlarging and shrinking.
- Morph: a shape flowing into a different shape (Dynamic Island).
- Shared element transition: one element travels and reshapes between two positions, as a thumbnail opening into a card.
- Layout animation: when size or position changes, the element glides to the new place and does not jump.
- Accordion / collapse: a section opens and closes by animating its height.
- Direction-aware transition: forward navigation moves content one way and backward the other, giving navigation a direction.

## Scroll

- Scroll reveal: items fade or slide into place when they come into view.
- Scroll-driven animation: progress tied directly to the scroll offset.
- Parallax: layers scroll at different rates to suggest depth.
- Page transition: motion running as the route or page changes.
- View transition: the browser itself animates between two states or pages, matching shared elements.

## Feedback and interaction

- Hover effect: a visual response to the cursor resting on an element.
- Press / tap feedback: a small scale-down on press that makes a control feel physical.
- Hold to confirm: a bar or ring that fills as long as the person keeps pressing.
- Drag: grabbing and moving an element, often with momentum after release.
- Drag to reorder: moving list items to new positions while neighbors shift to open a slot.
- Swipe to dismiss: flinging an element off-screen to close it (drawer, toast).
- Rubber-banding: pushback and elastic return when pulled past a limit, as in iOS overscroll.
- Shake / wiggle: a fast side-to-side tremble that flags an error or refused input.
- Ripple: a circle spreading from the touch point to confirm a press.

## Easing

- Easing: the way speed varies over the course of an animation.
- Ease-out: quick start, gentle finish; the default for most UI and for anything that answers the user.
- Ease-in: gentle start, quick finish; avoided on UI because it feels slow where the person is looking.
- Ease-in-out: slow, quick, slow; for an element already on screen traveling between two spots.
- Linear: unchanging speed; wrong for most UI, right only for constant motion (spinner, marquee).
- Cubic-bezier: a hand-defined curve from control points, for exact shaping.
- Asymmetric easing: speeding up and slowing down at unequal rates; feels livelier than a mirror-image curve.

## Spring animations

- Spring: motion produced by a physical model (tension, mass, damping) without a fixed duration.
- Stiffness / tension: how forcefully the spring is drawn to its target; more is snappier.
- Damping: how quickly oscillation dies out; lower damping oscillates more.
- Mass: apparent weight; heavier means slower and more lethargic.
- Bounce: overshoot followed by settling, which adds playfulness.
- Perceptual duration: when a spring looks done, even while tiny residual motion continues.
- Momentum: carried velocity, notably after a drag or an interruption.
- Velocity: speed with direction; on interruption a spring inherits it, so a flicked element keeps its pace.
- Interruptible animation: can be redirected partway instead of having to finish.

## Looping and ambient motion

- Marquee: content that scrolls endlessly in a loop.
- Loop: repetition, finite or infinite.
- Alternate (yoyo): a loop that runs forward then back each cycle, with no snap to the start.
- Orbit: circling another element on a continuous path.
- Pulse: a soft repeated change of scale or opacity to attract the eye.
- Float: slow endless vertical drifting that gives a still element a weightless feel.
- Idle animation: low-key motion while an element waits to be used.

## Polish and effects

- Blur: a blur filter that softens or hides small flaws.
- Clip-path: cropping an element to a shape, handy for reveals, masks and comparison sliders.
- Mask: showing or hiding regions through a shape or gradient; unlike clip-path, edges can be soft and fade.
- Before / after slider: a movable divider that wipes across two stacked images.
- Line drawing: an SVG stroke that traces itself in, like an unseen pen.
- Text morph: characters animate individually as text changes, spotlighting the new value.
- Skeleton / shimmer: a loading placeholder carrying a traveling highlight.
- Number ticker: digits that roll or count up to a value.
- Tabular numbers: equal-width digits, so figures hold still as they update; a must for timers, tickers and counters.
- Typewriter: text arriving one character after another.

## Performance

- Frame rate (FPS): how many frames appear each second; 60 is the baseline, 120 on newer screens.
- Jank: visible stutter from frames that could not be produced in time.
- Dropped frame: a single frame that missed its deadline, causing a hitch.
- Compositing: the GPU shifting or fading an element on its own layer, with no layout or paint.
- will-change: a CSS signal that animation is coming, so the browser gives the element its own layer early.
- Layout thrashing: animating width, height, top or left, which forces layout to be recomputed every frame.

## Principles

- Purposeful animation: motion has a job (orient, give feedback, show relationships), never mere decoration.
- Anticipation: a slight backward wind-up before the main move signals what comes next.
- Follow-through: parts keep moving and settle after the main motion ends, which lends weight.
- Squash and stretch: bending the shape during movement to express weight, speed and flexibility.
- Perceived performance: good motion can make an interface seem quicker than it is.
- Frequency of use: the more often people see an animation, the shorter and quieter it should be.
- Spatial consistency: an element keeps its identity and place across states, so people never lose track of it.
- Hardware acceleration: stick to transform and opacity and the GPU keeps motion smooth.
- Reduced motion: respecting prefers-reduced-motion by softening or dropping movement.
