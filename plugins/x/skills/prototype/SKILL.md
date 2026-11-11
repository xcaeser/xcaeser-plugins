---
name: prototype
description: Build several genuinely different versions of one UI piece behind a live picker, flip through them at full size, and keep the one that feels right.
disable-model-invocation: true
argument-hint: "[the UI piece to explore, optionally xN for N variants]"
---

Exploration is not `x:work`: nothing in production changes until the user keeps a variant.

Spawn the `x:Fable-prototyper` agent on: $ARGUMENTS.

Tell it the picker files are in `${CLAUDE_SKILL_DIR}` and the designer standards in `${CLAUDE_SKILL_DIR}/../designer/`.

When it returns, open the picker in the browser pane at the URL it names, serving a standalone harness directory on 127.0.0.1 first, relay its table and its pick, give the keys to flip, and stop: the choice is the user's.

- **Another round** ("riff on Editorial", "more like 2"): send it to the same agent with SendMessage, so it keeps the harness and its recon.
- **Keep a variant**: build it through the `x:work` skill. The brief names the variant's files and the surface to delete in the same change, and says the direction is the user's pick from `/x:prototype`, so the designer's review polishes it and never reopens it. With no project to integrate into, keep is the file path.
- **Drop them all**: delete the surface.
