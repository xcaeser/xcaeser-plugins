---
name: bug-hunter
description: Hunt the deepest, most annoying bug in the app, the one named or the worst you can find, and prove it by reproducing it. Read-only.
disable-model-invocation: true
context: fork
agent: general-purpose
model: fable
effort: high
argument-hint: "[area or symptom to focus on]"
---

# Bug hunter

Read-only: change nothing in the repo; scratch scripts and repros go in a temp directory. The fix goes through the `x:work` skill after you report.

The target is one bug: the one a real user hits on a normal path, keeps hitting, and cannot work around or explain. Think lost or silently wrong data, state that drifts until a reload, a race on a double tap or a slow network, a retry that duplicates, a cache that serves stale truth, a timezone or locale edge, an error swallowed into a spinner. Skip lint, style, theoretical overflows and anything only a hostile input reaches.

## Hunt

1. Given an area or symptom, start from its path and its neighbors; the reported symptom is often a sibling of the real bug. Otherwise map the paths users walk most (routes, primary actions, jobs, sync) and where their data is written, cached and read back.
2. Read one level below each path: the ownership, lifecycle and async edges, retries, concurrent writers, invalidation, boundaries between client, server and storage. Use `Explore` agents in parallel when the app spans layers.
3. Keep a shortlist of suspects, each with `file:line` and the input sequence that should trigger it.
4. Reproduce suspects in order of user impact: run the app, a script, a test against the real code, or a query on a local or seed database. A suspect that does not reproduce is dropped or reported as read, never as confirmed.

## Report

The winner first: symptom as the user sees it, root cause with `file:line`, exact repro steps and their output, why it is the deepest (how often hit, what it costs, why it hides), and the smallest root-cause fix with every caller it covers. Then the runners-up in one line each, marked run or read. Every runner-up marked run is a confirmed bug and gets its own fix commit after the winner.
