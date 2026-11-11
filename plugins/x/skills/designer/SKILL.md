---
name: designer
description: Get an opinionated UI review from the rendered screens: revamp or polish, then an in-depth report of what to change. Read-only.
disable-model-invocation: true
argument-hint: "[screens, flow or area to review]"
---

Spawn the `x:Fable-designer` agent on: $ARGUMENTS. Tell it its standards are in `${CLAUDE_SKILL_DIR}`.

Relay its report in full and show the user the screenshots and mockups it returns. Its changes are built through the `x:work` skill once the user says which; its taste calls go to the user.
