---
name: audit
description: Independent audit of a finished diff for bugs, quality and a more elegant solution, then fix what is confirmed. Run before any feature or split unit is called done; it decides from the diff's risk whether the auditor runs.
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

Triage what comes back:
- **Proven bug or quality defect**: fix it (a `x:Sonnet-worker`, or yourself for a small one), then re-run the proof.
- **Unconfirmed**: reproduce it yourself; drop it if it does not reproduce.
- **Elegance finding**: adopt it if it deletes code or removes a layer without changing the spec; otherwise name why not in one line.

Re-audit only the fix diff, and only if the Gate picks Audit for it; at most two rounds in total. The audit result goes in the final report: findings fixed, findings rejected with the reason, what the auditor did not cover.
