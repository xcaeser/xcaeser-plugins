---
name: bug-hunter
description: Hunt the deepest, most annoying bug in the app and prove it by reproducing it. Read-only.
disable-model-invocation: true
argument-hint: "[area or symptom to focus on]"
---

Spawn the `x:Fable-bug-hunter` agent on: $ARGUMENTS

Relay its report in full. Each confirmed bug is fixed as its own code change, in its own commit.
