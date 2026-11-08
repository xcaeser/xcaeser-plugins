---
name: bug-hunter
description: Hunt the deepest, most annoying bug in the app, prove it by reproducing it, and fix it.
disable-model-invocation: true
argument-hint: "[area or symptom to focus on]"
---

Spawn the `x:Fable-bug-hunter` agent on: $ARGUMENTS

Relay its report in full. Read each fix diff and re-run its proof, then commit each fix on its own, the winner first.
