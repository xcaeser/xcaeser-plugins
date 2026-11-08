---
name: state-machine
description: Find every implicit state machine in the app and report its states, transitions, writers and reachable impossible states. Read-only.
disable-model-invocation: true
context: fork
agent: general-purpose
model: opus
effort: high
argument-hint: "[area to focus on]"
---

# Implicit state machines

Read-only: change nothing in the repo; scratch scripts go in a temp directory. Fixes go through the `x:work` skill after the user picks them.

## Find

Sweep schema, server, jobs, client state and UI; `Explore` agents in parallel when the app spans layers. A machine hides wherever a lifecycle is encoded without being named: a `status`-like field compared against literals, booleans read together, nullable timestamps whose presence means a stage, counters that gate behavior, an effect or job that writes one field when another changes, the same literal checked across files.

## Model each one from the code

- **States**: every value or field combination the code means, with its source.
- **Transitions**: one row per write site: `file:line`, event (user action, job, webhook), guard, from-state, to-state.
- **Impossible states**: combinations the types or schema allow and the code never means. Prove each reachable or not: trace a write path, and where there is a local or seed database, `GROUP BY` the fields and read which combinations already exist.
- **Defects**: two fields that can disagree, unguarded writes, skipped or re-entered terminal states, concurrent writers without a conditional update, readers that miss a state.

## Report

One entry per machine, ranked by user impact of its worst reachable defect: name, where it lives, the transition table, each defect with `file:line`, the input sequence that reaches it, and whether that was run or read. Then the smallest fix: a discriminated union, one transition function owning every write, a check constraint or `UPDATE ... WHERE status = ...`, or deleting the redundant field.

End with the few machines to make explicit first and the ones to leave alone because they are simple and correct.
