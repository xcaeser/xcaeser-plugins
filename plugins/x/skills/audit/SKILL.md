---
name: audit
description: Mandatory independent audit of a finished diff for bugs, quality and a more elegant solution, then fix what is confirmed. Run before any feature or split unit is called done.
argument-hint: "[diff range or files]"
---

# Audit

Spawn the `x:Opus-auditor` agent. Give it only:
- the spec: the user's goal and what done means;
- the scope: the diff (`git diff` range or file list) and the proof command.

Do not give it your reasoning or conclusions; that anchors it.

Triage what comes back:
- **Proven bug or quality defect**: fix it (a `x:Sonnet-worker`, or yourself for a small one), then re-run the proof.
- **Unconfirmed**: reproduce it yourself; drop it if it does not reproduce.
- **Elegance finding**: adopt it if it deletes code or removes a layer without changing the spec; otherwise name why not in one line.

Re-audit only the fix diff, at most two rounds in total. The audit result goes in the final report: findings fixed, findings rejected with the reason, what the auditor did not cover.
