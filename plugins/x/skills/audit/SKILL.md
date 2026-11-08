---
name: audit
description: Audit a finished diff for bugs, quality and a more elegant solution, and fix what is proven.
disable-model-invocation: true
argument-hint: "[diff range or files]"
---

Spawn the `x:Opus-auditor` agent with only the spec (the user's goal and what done means), the diff ($ARGUMENTS, else the uncommitted changes) and the proof command. Leave out your reasoning; it anchors the auditor.

When it returns, read its fix diff and re-run the proof. Reproduce what it marked unconfirmed: fix what reproduces through an `x:Sonnet-worker`, drop the rest. Report the findings fixed, those left with why, and what it did not cover.
