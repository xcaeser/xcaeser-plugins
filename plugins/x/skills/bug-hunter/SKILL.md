---
name: bug-hunter
description: Hunt the deepest, most annoying bug in the app, prove it by reproducing it, and fix it.
disable-model-invocation: true
argument-hint: "[area or symptom to focus on]"
---

Spawn the `x:Fable-bug-hunter` agent on: $ARGUMENTS

Relay its report in full. Re-run each fix's proof and check with `git diff --stat` that it stayed in its owned files, then commit each on its own, the winner first, with no attribution trailer.
