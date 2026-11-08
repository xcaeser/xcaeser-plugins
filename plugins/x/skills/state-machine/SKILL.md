---
name: state-machine
description: Map every implicit state machine in the app (states, transitions, writers, reachable impossible states) and fix its proven defects.
disable-model-invocation: true
argument-hint: "[area to focus on]"
---

Spawn the `x:Opus-state-machine` agent on: $ARGUMENTS

Relay its report in full. Re-run each fix's proof and check with `git diff --stat` that it stayed in its owned files, then commit each on its own, with no attribution trailer. What it left waits until the user picks it.
