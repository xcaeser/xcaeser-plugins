---
name: work
description: Entry point for all coding work (features, fixes, refactors, any change to code). Thinks when a design is open, builds directly or splits into sessions, then audits. Invoke it before writing or changing any code, however small, whether or not the user asked for it.
argument-hint: "[change to make]"
---

## Think (any time)

Consult `x:Fable-thinker` at the start of a feature (its seams feed Split), when two shapes are plausible and reading the code does not settle which, before choosing a design that ripples across files or a public API, when a finding breaks the direction, or after two failed attempts. Skip it when reading code or running something answers the question; say in one line which you did. Its judge becomes the proof.

## Split (whole change only)

Split when all hold, otherwise build directly: `mcp__ccd_session__start_session` exists (Claude desktop app); two or more units; disjoint owned files; each unit's proof runs without the others or Integrate; each is a feature in itself, with its own design and audit, not a piece a worker could take. Files several units need (lockfiles, route indexes, barrels) belong to Integrate.

1. Units inherit your model and effort and cannot exceed them. If you are not on Opus at high effort, ask the user to switch in the model menu and stop.
2. Show the units once: goal, owned files, proof each. The user's yes covers the whole run.
3. In one message, one `start_session` per unit: `initiation: user_asked`, `context: fresh`, `use_worktree: false`, `title`, `name`, `background` (the whole change, the design, how this unit fits; at least 80 characters), `prompt`: "invoke the `x:work` skill as a split unit (Build only)", the goal, the design excerpt, owned files, files it must not touch, the proof.

End your turn; the app continues you when the units finish. Then Integrate.

## Build

`x:Sonnet-worker` writes every edit, audit fixes included, except an edit of one file under about 20 lines, which you write yourself.

1. Read every file the change affects and design as if its requirement had been there from the start. Before any logic, name the data shape and every place the change must reach: callers, types, tests, fixtures, config, exports, docs and examples. That list is the owned files.
2. One worker per independent piece, all in one message; files that import each other or share a shape are one piece. Brief: goal, owned files, files it must not touch, data shape, proof.
3. Read the diffs, not the summaries; send back anything outside the brief.
4. Run the proof on the real flow. Inconclusive is a fail.
5. If speed is the goal or the diff sits on a hot path (the primary action, a loop over user data, queries, I/O, rendering, startup), run the `x:optimizer` skill on it; apply its wins through workers and re-run the proof. Its questions go to the user.
6. Run the `x:audit` skill on your diff.
7. Commit the owned files and report: what changed, the proof and its output, the optimizer's wins if it ran, the audit result. A split unit ends its turn here.

Need to edit a file you do not own: stop editing and report.

## New work mid-change (whole change only)

A user message that asks for unrelated work (it builds on nothing in your change) gets offered its own session so neither waits: `start_session` with `initiation: offer` and a `title`, alone in its message. If they choose New session, send the brief with `proposal_id`: `context: fresh`, `use_worktree: false`, `background`, and a `prompt` of "invoke the `x:work` skill", the goal, its owned files, your owned files it must not touch, the proof. If they choose Do it here, or `start_session` is absent, finish and commit your change first, then take it. A correction or follow-up to your change stays in your change.

## Integrate (lead, after a split)

Read each unit's diff and run its proof. Then make the shared-file and glue edits through Build, with the whole change's proof, and an audit scoped to the seams: the integration diff and where the units' diffs meet.
