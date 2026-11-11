# Libraries

Which library fits which UI task, how to choose, and a full guide to Sonner.

## Judge

- L1 Pick by task: identify what the code is doing, not the library named. "Show a dropdown" is a UI-primitives task even if the request names something else.
- L2 Installed wins: read `package.json` first. A listed library already installed is used. An installed competitor (for example react-window where Virtuoso is listed) is flagged but not replaced unless asked.
- L3 One pick: name one library and say in one sentence what it is for. No menu when the list has an answer.
- L4 Off-list: when the task is not covered, say so and recommend from general knowledge, marking that it left the list.
- L5 Unstyled accessible primitives (dialogs, popovers, menus, selects) are base-ui. A `<div>` dropdown or dialog with hand-rolled focus handling is a mismatch: base-ui covers accessibility, focus trapping and dismissal.
- L6 Command palettes (cmdk), toasts (Sonner), one-time-code inputs (input-otp), control panels and tweak GUIs (Leva, alt dialkit): use these. A toast hand-built, or faked with a modal library, is a mismatch.
- L7 Motion vs CSS: motion for springs, layout animations, exit animations and gesture-driven values. A plain hover or fade does not justify it; CSS transitions fit there.
- L8 Number animation: NumberFlow. Animating a number by re-rendering its text is a mismatch.
- L9 Animated text: torph. 3D globes: Cobe. Dynamic OG images from HTML and CSS to SVG or PNG: Satori. Syntax highlighting: shiki.
- L10 Charts: Liveline when live data points stream in and the chart scrolls along with the clock; recharts for everything else, static or interactive dashboards.
- L11 Drag and drop: dnd kit. Long lists and large tables: Virtuoso. Rendering a 1,000-plus row list directly is a mismatch; virtualize before pagination hacks.
- L12 State: zustand. A web of per-component `useState` and prop passing for shared state is a mismatch.
- L13 Class strings: clsx joins ad-hoc conditional classes; cva suits a component with real variants (size, intent, state) worth a typed API. The two work together. Template-literal ternaries three conditions deep are a mismatch (clsx, or cva if variant-shaped).
- L14 Theme switching and dark mode with no flash on load: next-themes.
- L15 Sonner mounting: one `Toaster` near the root, never per page or conditional; a second mounted Toaster duplicates every toast.
- L16 Sonner is client-only: `toast()` does nothing on the server. A server action returns its result and the client code that receives it calls `toast()`.
- L17 Sonner styling climbs the ladder only as far as needed; more than a few `!important` classes means going headless.
- L18 Sonner theme does not follow the OS by default; a toast that ignores dark mode is a missing `theme` prop.

## Build

### The list

| Task | Library |
| --- | --- |
| Unstyled accessible components (dialogs, popovers, menus, selects) | base-ui |
| Command menus (cmd-K palettes) | cmdk |
| Toasts and notifications | Sonner |
| One-time password and verification code inputs | input-otp |
| Customizable GUIs and control panels | Leva (alt dialkit) |
| General animation (springs, layout, enter/exit) | motion (Framer Motion) |
| Animated numbers (counters, prices, stats) | NumberFlow |
| Animated text components | torph |
| 3D globes | Cobe |
| Dynamic OG images (HTML and CSS to SVG or PNG) | Satori |
| Syntax highlighting | shiki |
| Real-time and streaming charts | Liveline |
| General charts | recharts |
| Drag and drop | dnd kit |
| Virtualization (long lists, large tables) | Virtuoso |
| State management | zustand |
| Conditional `className` strings | clsx |
| Type-safe variant styling for Tailwind | cva |
| Theme switching and dark mode without flash | next-themes |

### Mismatch tells

- Hand-built toasts or a modal used as one: Sonner.
- `<div>` dropdown or dialog with manual focus code: base-ui.
- Number animated by re-rendering text: NumberFlow.
- 1,000-plus rows rendered directly: Virtuoso.
- Props and `useState` threaded for shared state: zustand.
- Deep template-literal class ternaries: clsx, or cva.

### Sonner: setup

Two pieces. One `<Toaster />` mounted once, as near the root as possible (Next.js: `layout.tsx`, which works inside server components). `toast()` imported from `sonner` and called from client code (handlers, effects, callbacks); it is a plain function, no provider or hook.

```jsx
import { Toaster, toast } from 'sonner';
```

### Sonner: calls

| Goal | Call |
| --- | --- |
| Plain message | `toast('Title')`, second line via `{ description }` |
| Typed with icon | `toast.success`, `.error`, `.info`, `.warning` |
| Spinner you manage | `toast.loading('...')`, then update by id |
| Loading, then result, tied to a promise | `toast.promise(promise, { loading, success, error })`; success and error take strings, JSX, functions of the result, or option objects |
| Action button | `{ action: { label, onClick } }`; closes unless `onClick` calls `event.preventDefault()`; `cancel` is the secondary form and always closes |
| Custom JSX in the default shell | `toast(<jsx />)` |
| Custom JSX, no styles | `toast.custom((t) => <jsx />)`; headless, `t` carries the id for dismissing |

- Update: call `toast()` again with the same `id`; only passed props change; `toast.success(msg, { id })` also changes the type. This is a loading-to-result flow without `toast.promise`:

```jsx
const id = toast.loading('Saving...');
toast.success('Saved', { id });
```

- Persist with `{ duration: Infinity }`. Close one with `toast.dismiss(id)`, all with `toast.dismiss()`. List what is showing via `useSonner()` in React or `toast.getActiveToasts()` outside it.
- Title and description may be functions returning JSX, for links or components: `toast(() => <a href="/x">View</a>)`.
- Multiple toasters: give each an `id`, target with `toast('...', { toasterId: 'canvas' })`. A call lacking `toasterId` appears in every toaster.
- Close callbacks: `onDismiss` fires on the close button or a swipe; `onAutoClose` fires on timeout. There is no single "closed" callback.

### Sonner: styling ladder

1. Defaults, plus `richColors` on the Toaster for colored success and error, `invert` to reverse light and dark.
2. Inline: `toastOptions={{ style }}` on the Toaster for all, or `style` on a call.
3. Classes on parts: `toastOptions={{ classNames: { toast, title, description, actionButton, cancelButton, closeButton } }}`. Sonner's own styles win the cascade, so each class needs `!important` (Tailwind: `!text-red-900`). Beyond a handful, switch to headless.
4. Headless: `toast.custom()` renders your JSX while Sonner still handles position, stacking and swipe. Starting here is fine and it is the end state for a design system. Wrap it in your own `toast()` function. `unstyled: true` is a halfway house; headless gives more control for similar effort.

Icons: replace defaults per type with the Toaster's `icons` prop, per toast with `icon`, remove with `null`.

Theme: `theme` defaults to `'light'` and ignores the OS. Use `theme="system"`, or pass a provider's value: `<Toaster theme={resolvedTheme} />` with next-themes.

### Sonner: symptoms

| Symptom | Cause and fix |
| --- | --- |
| Toast never appears | No Toaster mounted, or it unmounted (conditional, per-page). Mount one at the root. Server action: `toast()` only runs in the browser, so return the result and toast on the client |
| Same toast twice | Two Toasters (layout and page), keep one. Or `toast()` inside an effect that StrictMode runs twice in dev: fire from the handler, or pass a fixed `id` so the repeat call updates |
| Tailwind or CSS classes ignored | Default styles win. Add `!important`, or use `unstyled` or headless |
| Fully unstyled (Astro, view transitions) | Injected stylesheet lost. Import `sonner/dist/styles.css` in a layout |
| Unstyled in Shadow DOM | Styles land in `document.head`. Copy the style tag containing `[data-sonner-toaster]` into the shadow root |
| Behind a modal, or clipped | A parent forms a stacking context (`transform`, `filter`, `overflow`), or the overlay's z-index beats the toaster's. Move the Toaster to the document root, outside dialog and portal containers |
| Dark mode ignored | `theme` defaults to light. Set `"system"` or the resolved theme |
| Success and error gray | Default look. Add `richColors` |
| Never closes | `duration: Infinity`, `dismissible: false`, or a `toast.promise` on a promise that never settles |
| `toast.promise` stuck loading | First argument must be a promise (or a function returning one) that resolves or rejects |
| Swipe wrong direction or dead | Directions derive from `position`; override with `swipeDirections` |
| Toast shows in every toaster | Give each Toaster an `id` and pass `toasterId` |
| Too close to the edge on mobile | `offset` (default 32px) and `mobileOffset` (below 600px, default 16px); each takes numbers, CSS strings or per-side objects |

### Sonner: `<Toaster />` props

| Prop | Type | Default |
| --- | --- | --- |
| `theme` | `'light' \| 'dark' \| 'system'` | `'light'` |
| `richColors` | boolean | `false` |
| `expand` | boolean; expanded always, else on hover | `false` |
| `visibleToasts` | number | `3` |
| `id` | string; target for `toasterId` | none |
| `position` | `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right` | `'bottom-right'` |
| `closeButton` | boolean | `false` |
| `offset` | string, number or object (`{ bottom: '24px', right: '16px' }`) | `'32px'` |
| `mobileOffset` | same, under 600px | `'16px'` |
| `swipeDirections` | array of allowed directions | from `position` |
| `dir` | text direction | `'ltr'` |
| `hotkey` | shortcut focusing the toaster area | alt + T |
| `invert` | boolean | `false` |
| `toastOptions` | defaults for every toast (any option below) | none |
| `gap` | number, px between expanded toasts | `14` |
| `icons` | `{ success, info, warning, error, loading }`; `null` removes one | none |

### Sonner: `toast()` options

`toast(message, options)` takes a string, JSX or a JSX-returning function as the message and returns the id. Call options override the Toaster's `toastOptions`.

| Option | Type | Default |
| --- | --- | --- |
| `description` | ReactNode or function returning JSX | none |
| `closeButton` | boolean | `false` |
| `invert` | boolean | `false` |
| `duration` | ms before auto-close; `Infinity` persists | `4000` |
| `position` | as the Toaster | `'bottom-right'` |
| `dismissible` | boolean; `false` blocks user dismissal | `true` |
| `icon` | ReactNode; `null` drops the default | none |
| `action` | ReactNode or `{ label, onClick }` | none |
| `cancel` | ReactNode or `{ label, onClick }`; always closes | none |
| `actionButtonStyle`, `cancelButtonStyle` | style objects | `{}` |
| `id` | string; reuse to update | none |
| `testId` | string, rendered as `data-testid` | none |
| `toasterId` | string, which Toaster renders it | none |
| `style` | inline style object | none |
| `classNames` | `{ toast, title, description, actionButton, cancelButton, closeButton }`; needs `!important` unless `unstyled` | none |
| `unstyled` | boolean | `false` |
| `onDismiss` | `(toast) => void`, close button or swipe | none |
| `onAutoClose` | `(toast) => void`, timeout | none |
| `containerAriaLabel` | string | `'Notifications'` |

Functions: `toast`, `toast.success/.error/.info/.warning`, `toast.loading`, `toast.promise`, `toast.custom`, `toast.dismiss(id?)`, `toast.getActiveToasts()`, hook `useSonner()` returning `{ toasts }`.
