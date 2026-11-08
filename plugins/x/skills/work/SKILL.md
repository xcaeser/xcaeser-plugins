---
name: work
description: Entry point for all coding work (features, fixes, refactors, any change to code). Thinks when a design is open, builds directly or splits into sessions, then audits. Invoke it before writing or changing any code, however small, whether or not the user asked for it.
argument-hint: "[change to make]"
---

# x:work

Your scope is the whole change. If your prompt says "you are a split unit", your scope is that unit: skip Split and Integrate, never start sessions, and end with your report, which reaches the lead.

## Think (any scope, any time)

Call `x:Fable-thinker` when two or more shapes are plausible and the code does not settle which, when a finding breaks the direction, before choosing a design that ripples across files or a public API, before drawing split seams, or when two attempts have failed. Skip it when reading code or running something answers the question; say in one line which you did. Each consult carries one question, the files that matter and what you have learned. Its answer is input, not orders.

## Split (whole change only)

Split when all hold, otherwise build directly: `mcp__ccd_session__start_session` is available (Claude desktop app), two or more units, each owning disjoint files, needing nothing from each other or from Integrate (its proof included), and big enough to carry its own audit. Files several units need (lockfiles, route indexes, barrels) belong to Integrate.

1. Confirm you run on Opus 5.5 at high effort; if not, ask the user to switch in the model menu and stop, because `start_session` caps units at your model.
2. Show the units once: goal, owned files, proof each. The user's yes covers the whole run.
3. In one message, `mcp__ccd_session__start_session` per unit: `initiation: user_asked`, `context: fresh`, an Opus 5.5 `model`, `effort: high`, `use_worktree: false`, a `name`. Prompt: "invoke the `x:work` skill; you are a split unit", the goal, the design excerpt, owned files, files it must not touch, the proof.
4. `get_session` each; if its model or effort is lower, set it with `set_session_model` and `set_session_effort`.

Then wait for the reports and Integrate.

## Build (your scope)

`x:Sonnet-worker` writes every edit, audit fixes included, except an edit of one file under about 20 lines, which you write yourself.

1. Read the code; before any logic, name the data shape and every place the change must reach: callers, tests, fixtures, config, exports. That list is the owned files.
2. One worker per independent piece, all in one message; files that import each other or share a shape are one piece. Brief: goal, owned files, files it must not touch, data shape, proof.
3. Read the diffs, not the summaries; send back anything outside the brief.
4. Run the proof on the real flow. Inconclusive is a fail.
5. Run the `x:audit` skill on your diff.
6. Commit your scope's files and report: what changed, the proof and its output, the audit result.

Need to edit a file outside your scope: stop editing and report.

## Integrate (lead, after a split)

Read each unit's diff and run its proof. Then make the shared-file and glue edits through Build, with the whole change's proof, and an audit scoped to the seams: the integration diff and where the units' diffs meet.
