---
name: deprecated
description: Finds and fixes every deprecated API use in the repo (TypeScript, Rust, Go, Zig), not only in code just written. Run it when asked to clear deprecations.
disable-model-invocation: true
argument-hint: "[path]"
---

# Deprecated APIs

The PostToolUse hooks catch deprecations in what you write. This clears the ones already in the repo.

1. Run `bun --no-install ${CLAUDE_SKILL_DIR}/scan.ts $ARGUMENTS` (the working directory without an argument; the path must be in a git repo). It prints `path:line:column message` per use, each message naming the replacement, then one summary line per language: files, projects, findings, time, and `skipped: <reason>` for what it could not check.
2. No findings: say so, with the summary lines, and stop.
3. Otherwise fix all of them as one change through the `x:work` skill. Switch each call to the replacement its message names, as the installed version declares it: read the cited source or declaration instead of recalling an API.
4. Rerun the scan until only findings without a replacement remain.
5. Report what was fixed and what remains with why, for example no replacement in the installed version, or a language skipped (no toolchain, TypeScript older than 7).
