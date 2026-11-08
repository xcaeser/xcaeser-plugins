---
name: optimizer
description: Hunt optimizations, each proven by a measurement, pushing toward the floor. Read-only.
disable-model-invocation: true
argument-hint: "[area, path, diff or metric to optimize]"
---

Spawn the `x:Fable-optimizer` agent on: $ARGUMENTS

Relay its report in full. Its wins are applied through the `x:work` skill, or through workers when `x:work` ran it; its trade-offs go to the user.
