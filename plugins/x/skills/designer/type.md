# Type

Tracking, leading, hierarchy, text size, font choice, optical sizing, fluid display sizes, figures, tall-mark scripts and clipping.

## Judge

- T1 Tracking per size: letter-spacing is set for each size, never one value everywhere. Display text takes negative tracking (about -0.02em) because large letters look loosely spaced, body stays near 0, and small text takes slightly positive tracking for legibility. A single global `letter-spacing` is wrong at some size.
- T2 Leading inverse to size: line-height shrinks as size grows. About 1.05 to 1.2 on headings, about 1.5 on body, tighter in dense, information-heavy UI such as tables and lists.
- T3 Tall-mark scripts: scripts with tall ascenders and descenders (Thai, Arabic, Devanagari, Tibetan and similar) get looser leading than Latin at the same size, and their headings do not use the Latin 1.05.
- T4 Clipping: a tight line-height must not cut ascenders, descenders or diacritics. Text in a box with `overflow: hidden`, a clamped line count or a fixed height is checked with accented capitals and descender letters (g, y, j, Å, Ế) and with a tall-mark script. Any clipped mark is a finding.
- T5 Hierarchy as a set: levels differ by size, weight and leading together, not size alone. Emphasis comes from weight, which adds presence without taking space. Two adjacent levels that differ only by size are weak.
- T6 Dynamic text size: type follows the user's text size setting. Spacing is in rem or em and the layout holds at 200% text without clipped, overlapping or horizontally scrolling content. A px font size on body copy that ignores the user's setting is a finding.
- T7 System font: use the platform's system font unless there is a reason not to. It comes with optical sizing, tracking tables and tuned legibility. A custom face needs a stated reason and the same tracking and leading discipline.
- T8 Optical sizing: a font that has an optical-size axis uses `font-optical-sizing: auto`, so letterforms change shape with size. Switching it off, or loading a static cut where a variable one exists, is a finding.
- T9 Fluid display: display sizes scale with the viewport through `clamp()` with a floor and a ceiling (for example `clamp(2rem, 5vw, 4rem)`), never a bare `vw` value that can fall below readable or grow without bound.
- T10 Tabular figures: numbers that change live (counters, timers, prices updating) or align in columns use tabular figures, so digits keep one width and neither jitter nor misalign.

## Build

### Body and display tokens

```css
:root { font: 100%/1.5 system-ui, sans-serif; }

.display {
  font-size: clamp(2rem, 5vw, 4rem);
  line-height: 1.05;
  letter-spacing: -0.02em;
  font-optical-sizing: auto;
}
```

- Define tracking and leading as tokens per step of the type scale, not per component. Each step carries its own size, weight, line-height and letter-spacing as one set.
- Typical sets: display (-0.02em, 1.05 to 1.2), heading (-0.01em, about 1.2), body (0, about 1.5), small and caption (slightly positive, such as 0.01em, 1.4 to 1.5), dense data (0, 1.3 or tighter).
- Use `em` for letter-spacing so it scales with the font size.

### Hierarchy

- Raise the level with weight first, then size. A semibold label at body size can outrank a regular line at a larger size.
- Keep the number of levels per screen small, and make adjacent levels clearly different in at least two of size, weight and leading.

### Text size

- Set `font-size` in rem. Let the root follow the browser default (`100%`), never lock it in px.
- Spacing, padding, gaps and icon boxes that sit beside text use rem or em, so they grow with it.
- Test at 200% browser text size and at the narrowest supported width. Fix anything that clips, overlaps or forces sideways scrolling by allowing wrap and letting containers grow in height.

### Tall-mark scripts and clipping

- Set a looser line-height under the script's language, for example with `:lang(th)`, `:lang(ar)` and `:lang(hi)` selectors, instead of one value for all text.
- Prefer `min-height` plus padding to a fixed `height` on text containers. When a line clamp is needed, give the box a little block padding so marks have room.
- Verify with real strings in that script and with stacked-accent Latin.

### Figures

```css
.counter, td.number { font-variant-numeric: tabular-nums; }
```

- Apply it to every live-updating number and every numeric table column. Right-align numeric columns.
