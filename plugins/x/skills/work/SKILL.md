---
name: work
description: Entry point for all coding work (features, fixes, refactors, any change to code). Thinks when a design is open, builds through workers, then audits. Invoke it before writing or changing any code, however small, whether or not the user asked for it.
argument-hint: "[change to make]"
---

## Think (any time)

Consult `x:Fable-thinker` at the start of a feature, when two shapes are plausible and reading the code does not settle which, before choosing a design that ripples across files or a public API, when a finding breaks the direction, or after two failed attempts. Skip it when reading code or running something answers the question; say in one line which you did. Its judge becomes the proof.

## Build

`x:Sonnet-worker` writes every edit, audit fixes included, except two kinds you write yourself: an edit of one file under about 20 lines, and text you already hold word for word (prose, config values, a rename), however many files it spans.

1. Read every file the change affects and design as if its requirement had been there from the start. Before any logic, name the data shape and every place the change must reach: callers, types, tests, fixtures, config, exports, docs and examples. That list is the owned files. If the change adds or moves a module, a boundary or a core data shape, first have `x:Fable-architect` audit the modules it lands in, and design on its findings; a Restructure verdict goes to the user before you build.
2. One worker per independent piece; files that import each other or share a shape are one piece. Each brief adds the data shape, and a piece users see names as its bar the files in `${CLAUDE_SKILL_DIR}/../designer/` that its `LENSES.md` says apply.
3. Run the proof on the real flow. Inconclusive is a fail.
4. If speed is the goal or the diff sits on a hot path (the primary action, a loop over user data, queries, I/O, rendering, startup), run the optimizer on it as `${CLAUDE_SKILL_DIR}/../optimizer/SKILL.md` says, its frame-time rules in `${CLAUDE_SKILL_DIR}/../designer/performance.md`; apply its wins through workers and re-run the proof.
5. If the diff adds or reshapes a screen, flow or component users see (more than copy or a value), have `x:Fable-designer` review the screens it touches, its standards in `${CLAUDE_SKILL_DIR}/../designer/`; apply its findings through workers and re-run the proof. A Revamp verdict and its taste calls go to the user.
6. Audit your diff as `${CLAUDE_SKILL_DIR}/../audit/SKILL.md` says, except in two cases, where you re-read it, run the proof and report `audit skipped: <reason>`: the diff changes nothing but docs, comments, formatting, copy or config values; or it is an edit you wrote yourself that adds no branch, loop, state or I/O and touches no auth, secrets, money, persisted data, async lifecycle, public API or code with several callers.
7. Commit the owned files, with no attribution trailer, and report: what changed, the proof and its output, the architect's, optimizer's and designer's results if they ran, the audit result.

Need to edit a file you do not own: stop editing and report.

A bug you find outside the change: reproduce it, fix it through a worker and commit it alone before yours.

