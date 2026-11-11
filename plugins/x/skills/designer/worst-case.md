# Worst-case data

Realistic worst-case values for every rendered field, how they enter, which states, widths and environments to check, each common break with its fix, truncation rules, and severity.

## Judge

- D1 Values are ones a real person could produce, or the schema's own limit; never random filler like a run of `a` or a 5,000-character name. A field with no limit anywhere is a finding ("unbounded"); still test something long and believable.
- D2 The worst case enters through the data boundary (fixture, mock, props, API stub), never by editing markup or CSS; a hand-made break tests the edit, not the component.
- D3 One dataset spreads different failures across the first rows (long name in row 1, long email in row 2, one-letter name in row 3), because the first rows are what is on screen.
- D4 Every rendered value is mapped with source, type, limit and optional flag, including the forgotten ones: header counts, relative timestamps, badge and status text, data-driven button labels, tooltips, avatar images, and list length.
- D5 Limits come from Zod, Yup or Valibot schemas, migrations, API types and `maxLength` attributes. Frontend and backend disagreeing (a 50-character input saving into a 255-character column) is a finding, since imports and the API will eventually deliver the longer value.
- D6 Separate states are checked: Empty (zero items), No-results (a search with no match, distinct from empty), One (a lone item, plus every count sitting at 1), Huge (the realistic upper bound, 1,000 or more rows when unpaginated).
- D7 Check at the component's real container width, then 320px, a 280px sidebar placement, and the widest supported layout (2560px).
- D8 Check at 200% browser zoom or a raised root font size (text grows, boxes do not), in dark mode, and under `dir="rtl"` on a wrapper when the product supports them.
- D9 Names: wrap identifying names and titles; two lines is fine, four means the column is too narrow.
- D10 Secondary metadata (role, description, last-message preview) truncates at the end, and offer a route to the whole value.
- D11 Strings that differ at their end (file names, emails sharing a domain, paths, hashes) truncate in the middle; end-truncation makes them identical.
- D12 Multi-line previews in cards use `line-clamp: 2` so card heights stay predictable.
- D13 Numbers, amounts, dates and any value users compare are given room and never cut.
- D14 Avatars and icons do not shrink: `flex-shrink: 0`; an avatar squeezed into an oval or pill is Ugly.
- D15 A flex or grid child that overflows instead of wrapping has `min-width: auto`; the text column needs `min-width: 0` (`minmax(0, 1fr)` in grid).
- D16 Unbreakable strings (emails, URLs, file names) use `overflow-wrap: anywhere`; `word-break: break-all` breaks mid-word when it does not have to.
- D17 A trailing action (menu, button) never gets pushed off or clipped: the middle takes `min-width: 0`, the action takes `flex-shrink: 0`.
- D18 Badges are `white-space: nowrap` with `flex-shrink: 0`, and the design names what yields instead.
- D19 Rows whose text can wrap top-align the avatar (`align-items: flex-start`); center alignment against a three-line name leaves it adrift.
- D20 A fixed-height container never cuts the last row mid-glyph: give a visible scrollbar or fade mask, and confirm `overflow` is intended.
- D21 Initials come from grapheme clusters (`Intl.Segmenter`), first plus last word, with a fallback icon. Index-based code gives `J` for "Jo", `CI` for a name ending in "III", a broken surrogate for an emoji-first name, and nothing for repeated spaces.
- D22 An absent optional field either drops its line or holds the height on purpose; a leftover placeholder dash or blank line is a defect.
- D23 Plurals use `Intl.PluralRules` or separate strings per count; "1 members" and "0 member" are defects.
- D24 Changing or aligned numbers use `font-variant-numeric: tabular-nums` so widths do not jitter.
- D25 Numbers render through `Intl.NumberFormat` in the user's locale with null guards; raw output (`1284`, `0.30000000000000004`, `NaN`, `undefined`) is a defect, and separators are never hardcoded.
- D26 Translated labels use `min-width`, never a fixed `width`; copy grows about 30% in translation and German compounds do not break.
- D27 Text boxes holding diacritic-heavy or tall scripts (Vietnamese, Thai) do not clip: loosen `line-height` or drop `overflow: hidden`.
- D28 Images have an `onError` fallback (initials) and `object-fit: cover` for any aspect ratio; slow images reserve space with fixed dimensions or `aspect-ratio`.
- D29 Ellipsis is never alone: pair it with a `title` or tooltip, and show the entire value somewhere else such as a detail view.
- D30 A list of 1,000 rows is virtualized or paginated; say which. Rendering every row is a performance break.
- D31 User text is escaped once, at render; it never appears as raw `<b>`, `&amp;` or `**text**`, and `dangerouslySetInnerHTML` is never used on user data.
- D32 Times use `Intl.RelativeTimeFormat` and `Intl.DateTimeFormat`, not hand-built strings; relative text rolls to an absolute date after about a week.
- D33 Severity: Broken is unreadable content, an unreachable action, or wrong data shown. Ugly is legible yet plainly off (an oval avatar, a two-line badge). Fragile is sound today but a single plausible input away from failing (no cap, no fallback). Report worst first.
- D34 The worst-case fixture stays next to the demo data, same shape, as a regression fixture; it is dev-only and never ships. After any fix, re-check every state, including Demo, which must not regress.

## Build

### Surface map

Before writing fixtures, inventory each value the screen renders.

| Value | Origin | Kind | Cap | Nullable |
|:--|:--|:--|:--|:--|
| `name` | `member.name` | string | 255 (schema file:line) | no |
| `email` | `member.email` | string | none found, unbounded | no |
| `role` | `member.title` | string | 120 | yes |
| `status` | enum | `active`, `invited`, `expired` | n/a | no |
| `count` | `workspace.memberCount` | int | n/a | no |

Done when every value has a source and a limit or "unbounded".

### Fixture rules

Build it in the same file conventions and type as the demo data. Keep fixture emails and URLs on `example.com`, `example.org` or a `.test` domain. Add Empty, No-results, One and Huge as extra fixtures or extra switch positions. Select the fixture where data is chosen (a dev-only query param or prototype route), so a reload keeps it; the switch is chrome, not part of the design.

### Catalog: people and names

| Value | Failure |
|:--|:--|
| `Aleksandra Wiśniewska-Kowalczyk` | Long, hyphenated, accented; wraps to two lines at the hyphen |
| `Christopher Alexander Montgomery III` | Long with a suffix; first-plus-last initials give `CI` |
| `Konstantin Oberhauser-Wettstein` | Long compound; overflows single-line rows |
| `Jo` | Two letters; name column looks empty, naive initials give `J` |
| `J` | One letter; single-glyph initials, tiny tap target when the name is the link |
| `Ólafur Darri Ólafsson` | Accented capital first; case and sort logic, initials `ÓÓ` |
| `Đặng Thị Ngọc Hân` | Stacked Vietnamese marks; clipped by tight `line-height` with `overflow: hidden` |
| `王秀英` | CJK, no spaces; word-based initials find one word, text can break anywhere |
| `نور الهدى عبد الرحمن` | Right-to-left; icons and punctuation end up on the wrong side unless `dir="auto"` is set |
| `Seán O'Brien-Ó Súilleabháin` | Apostrophe plus accents; escaping, initials, search |
| `María José de la Cruz y Fernández` | Lowercase particles; initials come out `Md` or `MF`, last-name sorting wrong |
| `dana` | Lowercase throughout; initials still need capitals |
| `🦊 Fox` | Starts with an emoji; `charAt(0)` yields only half of a surrogate pair |
| `👩🏽‍💻 Priya` | Joined emoji sequence; length is 7 or more, slicing splits it |
| `  Sam   Lee ` | Leading, trailing and repeated spaces; empty words, odd gaps |
| (missing) | No name, only an email; the UI needs a fallback |

### Catalog: emails, URLs, identifiers

Spaceless strings, so line breaking has no opening.

| Value | Failure |
|:--|:--|
| `bartholomew.fitzgerald@northwind-industries-holdings.example.com` | Shoves siblings out of the row unless `overflow-wrap: anywhere` is set |
| `a@b.co` | Shortest plausible; a layout tuned for long ones looks hollow |
| `first.last+billing-notifications@example.com` | Plus-addressing; validation rejecting `+`, display cutting the meaningful part |
| `ops@sub.department.region.example.co.uk` | Many subdomains and a two-part TLD; domain-extraction logic |
| `https://example.com/workspaces/acme/projects/q3-launch/docs/9f8e7d6c5b4a?tab=comments&filter=unresolved` | Long URL; overflows, and end-truncation cuts off exactly the segment that varies |
| `9f8e7d6c-5b4a-4c3d-8e2f-1a0b9c8d7e6f` | UUID; wide in monospace, suits middle-truncation |
| `Q3 Board Deck — FINAL (revised) v12 [approved by legal].pdf` | File name; end-truncation hides version and extension; brackets and dashes |
| `IMG_20250914_183022_HDR_portrait_edited_edited.HEIC` | Camera file name; unbreakable, uppercase extension |
| `@a` and `@thisisaverylongusernamethatisallowed` | Handle extremes |

### Catalog: labels, titles, copy from data

| Value | Failure |
|:--|:--|
| `Senior Product Design Engineer, Platform Infrastructure` | Lengthy job title; fills three lines in a minor slot |
| `Invitation expired 12 days ago` | Wordy status badge; it wraps, or crowds out the name column |
| `Benachrichtigungseinstellungen` | German compound, 30 characters, no break points |
| `Paramètres de confidentialité et de sécurité` | French expansion of "Privacy & security"; translated UI copy runs about 30% longer |
| Twelve tags on one item (`design`, `frontend`, `q3`, `urgent`, `needs-review`, and so on) | Tag row becomes a wall; needs a `+8` overflow |
| One tag named `customer-feedback-from-enterprise-onboarding` | A single tag wider than its container |
| `Untitled`, empty string, `   ` | Absent title; heading collapses to a zero-height row |
| `<script>alert(1)</script>`, `&amp;`, `**bold**` | Escaping; each must display as plain literal text |
| `Line one` then a newline then `Line two` | Newline in a single-line field; doubles height or is dropped |
| A 2,000-character pasted description | Clamping, "show more", textarea growth |

### Catalog: numbers and money

| Value | Failure |
|:--|:--|
| `0` | Zero cases: "0 members", a blank progress bar, percentages dividing by zero |
| `1` | Plural forms: "1 members", "1 days ago" |
| `1284` | Wants a grouping separator: `1,284` |
| `1000000` | Count badge width; compact `1M` where precision is unneeded |
| `12345678.9` as currency | `$12,345,678.90`; overflows totals columns |
| `-42.5` | Negative sign, red-color logic, accounting parentheses |
| `0.1 + 0.2` | Renders `0.30000000000000004` |
| `142%` and `-3%` | Progress bars and meters pushed past their range |
| `null`, `undefined`, `NaN` | Printed as the literal word |
| `1.284` in `de-DE` versus `1,284` in `en-US` | Hardcoded separators wrong for half the world |
| A live value going `99` to `100` | Width jump and jitter without `tabular-nums` |

### Catalog: collections

| Value | Failure |
|:--|:--|
| 0 items | The empty state, or the lack of one |
| 1 item | A grid that looks broken with a single card; "1 of 1" copy |
| Exactly page size, and page size plus 1 | Off-by-one in "Showing 40 of 40"; a blank second page |
| 1,000 or more, unpaginated | Scroll speed, render time and memory, plus "Showing 40 of 1,284" wording |
| A single item ten times larger than its neighbors | Masonry and grid rows stretch to the tallest |
| Items with identical names | Lists in which the name is the sole distinguishing field |

### Catalog: time

| Value | Failure |
|:--|:--|
| Now | "0 seconds ago" where "just now" belongs |
| 12 days, 11 months, 3 years ago | Relative-time thresholds; absolute date after about a week |
| A future date | "in 3 days" versus "-3 days ago" |
| `1970-01-01` | An empty timestamp displayed as a genuine date |
| `2025-12-31T23:30:00-08:00` | A different day in UTC than in the user's timezone |
| `1,284 hours` as a duration | Duration text that never converts to days |

### Catalog: images and media

| Value | Failure |
|:--|:--|
| Avatar URL that 404s | A broken-image glyph where initials should be |
| No avatar | The fallback itself: its initials, color and size must match real avatars |
| 4000x200 panorama as avatar or cover | Distortion without `object-fit: cover` |
| 200x4000 tall image | Same distortion on the other axis; may also balloon the card |
| A transparent PNG logo; a dark logo under dark mode | Vanishes against the background |
| Slow-loading image | Layout jumps unless dimensions or `aspect-ratio` are fixed |

### Catalog: states

| Value | Failure |
|:--|:--|
| Loading | Skeletons that differ from the final layout; spinners that shift content |
| API error | No error state, or a raw message such as `TypeError: Cannot read properties of undefined` |
| Partial data | Optional fields present in some rows and absent in others; rows misalign |
| Every status at once | Each enum value in one list (`active`, `invited`, `expired`, `suspended`); badge widths differ |
| No permission | Disabled actions; check the row still keeps its layout |
| The signed-in user appearing among the rows | "You" labels, plus actions that make no sense on yourself |

### Catalog: environment

| Condition | Failure |
|:--|:--|
| 320px container | Every overflow above at once |
| 280px sidebar placement | Components designed full-width, reused narrow |
| 2560px wide | Line lengths beyond comfortable reading; content marooned to one side |
| 200% zoom or large text setting | Fixed heights cut off text as it grows |
| Dark mode | Hardcoded colors, borders and logos that disappear |
| `dir="rtl"` | Icons, chevrons, padding and the sequence of trailing actions |
| Touch device | Hover-only actions cannot be reached |

### Break signatures and fixes

| Symptom | Cause | Fix |
|:--|:--|:--|
| Avatar or icon squeezed into an oval | Flex child shrinks | `flex-shrink: 0` on avatar, icon, fixed boxes |
| Text spills past its box rather than wrapping | Flex or grid child defaults to `min-width: auto` | `min-width: 0` for the text column, or `minmax(0, 1fr)` as a grid track |
| Email or URL crosses the edge of the box | Nowhere to break the string | `overflow-wrap: anywhere` |
| Trailing action shoved out or clipped | Middle column claimed all the room | `min-width: 0` middle, `flex-shrink: 0` action |
| Badge on two lines | Badge allowed to shrink | `white-space: nowrap; flex-shrink: 0`; decide what yields |
| Avatar adrift beside a multi-line name | `align-items: center` on rows of varying height | `align-items: flex-start` |
| Last row cut mid-glyph | Fixed-height container, no scroll or fade cue | Scrollbar or fade mask; intended `overflow` |
| Mid-word break in a heading | `word-break: break-all` | `overflow-wrap: anywhere` |
| Wrong initials | Index-based string code | `Intl.Segmenter`, first plus last word, fallback icon |
| Lone dash or blank line | Placeholder drawn for an absent field | Drop the line, or hold its height on purpose |
| "1 members" | Hardcoded plural | `Intl.PluralRules` |
| Jittering numbers, misaligned columns | Proportional figures | `tabular-nums` |
| `1284`, `NaN`, `undefined` | Raw number | `Intl.NumberFormat`, null guard |
| Translated label overflows | Fixed-width button | `min-width` from content |
| Clipped diacritics | Tight `line-height` with `overflow: hidden` | Looser line-height or no clipping |
| Broken-image icon | No `onError` | Initials fallback, `object-fit: cover` |
| Ellipsis with no way to read it | Truncation only | `title` or tooltip, full value in detail view |
| 1,000 rows stutter | Every row rendered | Virtualize or paginate |
| Literal `<b>`, `&amp;`, `**` | Wrong escaping layer | Escape once at render |

### Locale and time APIs

Use `Intl.NumberFormat(locale, ...)` for counts and currency, `Intl.PluralRules` for plural forms, `Intl.RelativeTimeFormat` for "3 days ago" and "in 3 days", `Intl.DateTimeFormat` for absolute dates in the user's timezone, and `Intl.Segmenter` with `granularity: "grapheme"` for initials.

### Verification

Screenshot each state at each width when a browser is available; otherwise reason from the CSS and mark which findings were seen and which inferred. Close by listing what held up, which shows the test was real and what not to touch.
