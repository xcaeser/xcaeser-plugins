---
name: security
description: Attack your own app like a real attacker, prove each vulnerability with a working exploit against a local instance, and fix what it proves.
disable-model-invocation: true
argument-hint: "[area, route or threat to focus on]"
---

Spawn the `x:Fable-security` agent on: $ARGUMENTS

Relay its report in full. Re-run each fix's proof (its exploit now fails) and check with `git diff --stat` that it stayed in its owned files, then commit each on its own, the most severe first, with no attribution trailer. Secrets to rotate and history to rewrite go to the user.
