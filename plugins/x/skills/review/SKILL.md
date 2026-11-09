---
name: review
description: Review the whole codebase through every specialist at once (architecture, bugs, security, performance, state machines, UI, your CLAUDE.md rules) and get one ranked list of findings. Read-only.
disable-model-invocation: true
argument-hint: "[area to focus on]"
---

Spawn these agents, each on: $ARGUMENTS (the whole repo when empty). At most five run at once; start the next as one returns.

- `x:Fable-architect`
- `x:Fable-bug-hunter`
- `x:Fable-security`
- `x:Fable-optimizer`
- `x:Opus-state-machine`
- `x:Fable-designer`, only when the repo renders a UI
- `x:Opus-auditor`, on the code as it stands instead of a diff, for its quality pass alone: every rule in the user's and project's CLAUDE.md, and whether the tests test observable behavior

Tell each one this is a report-only run beside other reviewers: it changes nothing in the repo and sends no fix to a worker, still proves each finding by running it and marks it run or read, and runs the app on its own port against its own copy of any local database.

When all have returned, check the highest-ranked findings against the code, then report:

1. **Verdicts**: the architect's (restructure or refine) and the designer's (revamp or polish), one line each.
2. **Findings**: one list across all agents, ranked by what each costs the person using the app. Per finding: `file:line`, what is wrong, the agent that found it, run or read, and the fix's size. A finding two agents reported is one entry.
3. **Not covered**: what each agent could not read, build or run, and any agent skipped.
4. **Calls**: the trade-offs the agents left to the user, each with its pick.

Fix nothing. What the user picks is built through the `x:work` skill, one commit per finding; an agent's full report is relayed when the user asks for it.
