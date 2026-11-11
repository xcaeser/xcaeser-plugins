---
name: audit
description: Audit a finished diff for bugs, quality and a more elegant solution, and fix what is proven.
disable-model-invocation: true
argument-hint: "[diff range or files]"
---

Spawn the `x:Opus-auditor` agent with only the spec (the user's goal and what done means), the diff ($ARGUMENTS, else the uncommitted changes) and the proof command. Leave out your reasoning; it anchors the auditor.

Pick its effort from the diff. Keep its own `xhigh` when the diff touches auth, secrets, money, persisted data or migrations, concurrency or async lifecycle, a public API, a trust boundary, or code with several callers, or spans more than one module. Otherwise spawn it with `effort: high`: logic local to one module, UI, scripts, tests. When unsure, keep `xhigh`.

When it returns, re-run the proof and check with `git diff --stat` that its fixes stayed in the owned files. Reproduce what it marked unconfirmed: fix what reproduces through an `x:Sonnet-worker`, drop the rest. Report the findings fixed, those left with why, and what it did not cover.
