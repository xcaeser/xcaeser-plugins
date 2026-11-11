# The Picker

The picker is harness chrome, not a design decision: a floating dark-glass pill, bottom-center, identical in every project so it never reads as part of the work being judged. Dark glass sits on any page, light or dark, so it is not theme-aware.

Its look is [picker.css](picker.css), copied byte for byte: no project fonts, colors, tokens or theme switching. Its standalone wiring is [picker.js](picker.js), copied byte for byte. `cmp` against both files is the harness's proof. Only the variant names and count change per run.

## Markup

The highlight first, one button per variant in picker order, then the divider and replay button only when at least one variant has an entrance or state animation to re-trigger:

```html
<nav class="proto-picker" aria-label="Prototype variants">
  <span class="proto-picker-highlight" aria-hidden="true"></span>
  <button class="proto-picker-item" data-active aria-current="true">Quiet</button>
  <button class="proto-picker-item">Editorial</button>
  <button class="proto-picker-item">Playful</button>
  <span class="proto-picker-divider" aria-hidden="true"></span>
  <button class="proto-picker-item proto-picker-replay" aria-label="Replay animation (R)">↻</button>
</nav>
```

In a framework, keep the class names and structure; only the rendering syntax changes.

One allowed modification: when a variant occupies bottom-center (a toast stack, a bottom sheet, a dock), set `data-position="top"` on the nav so the picker never covers the work.

## Behavior

The same in every harness:

- Number keys `1–N` and `←`/`→` switch variants; `R` replays. Keys are ignored while focus is in an input, textarea, select or contenteditable, or while Cmd, Ctrl or Alt is held.
- Clicking an item switches to it. Exactly one item carries `data-active` and `aria-current="true"`, and the highlight slides to it.
- The selection survives a reload through `?v=2`, falling back to variant 1. The highlight takes its first position without animating: `data-ready` is set after first paint.
- Switching re-mounts the variant so entrance animations re-run; replay re-mounts without switching. The variant swap itself is instant, never animated: flipping is a hundred-times-a-session action. Only the highlight slides, as feedback on the picker.

## Standalone harness

A directory, so each variant is its own file and its own worker:

```
index.html                 context page, <main id="stage">, the nav markup
picker.css, picker.js      copies of this skill's files
variants/<n>-<name>.js     one per variant
```

`index.html` links `picker.css`, declares `const variants = [];` in an inline script, loads each variant script in picker order, then `picker.js`, all as classic scripts at the end of `<body>` so the page opens straight from disk. Each variant file assigns its slot and renders into the stage it is given, its styles in a `<style>` inside its own markup, scoped under its own class. Classic scripts share one global scope, so a variant declares nothing outside its function. A variant that starts timers or listens beyond its own nodes returns the function that stops them; the picker calls it before the next mount:

```js
variants[0] = (stage) => {
  stage.innerHTML = `<style>.v-quiet { … }</style><div class="v-quiet">…</div>`;
  // wire this variant's interactions on the nodes just rendered
  const tick = setInterval(update, 1000);
  return () => clearInterval(tick);
};
```

## Framework harness

A route only the harness reaches, `/prototypes/<slug>` or the framework's equivalent, that imports `picker.css` unchanged and renders one component file per variant. The wiring is `picker.js`'s behavior expressed idiomatically: state for the current index, a keyed re-mount instead of `requestAnimationFrame`, a ref and a layout effect for the highlight measurement. Nothing in production imports from it.
