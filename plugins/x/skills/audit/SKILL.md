---
name: audit
description: Independent audit of a finished diff for bugs, quality and a more elegant solution, fixing what it proves. x:work runs it on every change.
disable-model-invocation: true
argument-hint: "[diff range or files]"
---

# Audit

## Gate

Read the diff and pick the first that applies:
1. **Audit**: it touches auth, secrets or security, money, persisted data, migrations or deletes, concurrency or async lifecycle, a public API or exported contract, or code with several callers. Size does not matter.
2. **Skip**: it only changes docs, comments, formatting, copy or config values, or renames the compiler or tests check; or it is one file, under about 20 lines, adding no branch, loop, state or I/O. Re-read the diff yourself, run the proof, and report `audit skipped: <reason>`.
3. **Audit**: everything else.

## Run

Spawn the `x:Opus-auditor` agent. Give it only:
- the spec: the user's goal and what done means;
- the scope: the diff (`git diff` range or file list) and the proof command.

Do not give it your reasoning or conclusions; that anchors it.

The auditor fixes what it proves through workers. When it returns:
- **Fixed**: read the fix diff and re-run the proof yourself; send back any fix that changes the spec.
- **Unconfirmed**: reproduce it yourself; fix it through a `x:Sonnet-worker` if it reproduces, drop it if not.
- **Left, with a reason**: accept the reason or fix it through a worker; say which in one line.

Re-audit only the fix diff, and only if the Gate picks Audit for it; at most two rounds in total. The audit result goes in the final report: findings fixed, findings left with the reason, what the auditor did not cover.
