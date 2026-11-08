---
name: state-machine
description: Map every implicit state machine in the app (states, transitions, writers, reachable impossible states) and fix its proven defects.
disable-model-invocation: true
argument-hint: "[area to focus on]"
---

Spawn the `x:Opus-state-machine` agent on: $ARGUMENTS

Relay its report in full. Read each fix diff and re-run its proof, then commit each fix on its own. What it left waits until the user picks it.
