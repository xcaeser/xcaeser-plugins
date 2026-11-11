# x

**A workflow for serious engineers, and for better results.**

x makes Claude Code work like a careful senior engineer. It thinks when the design is open, builds in small pieces that each prove they work, then has a different model try to break the result. It runs on every code change, with nothing to type.

```
/plugin install x --marketplace xcaeser/xcaeser-plugins
```

## Every change

1. **Think.** When two designs are plausible, Fable picks the simplest shape and names the outside judge that will show it is right.
2. **Build.** Sonnet workers write one independent piece each and prove it by running it.
3. **Review.** A UI change is judged from its rendered screens, a boundary change from the architecture, a hot path from measurements.
4. **Audit.** An independent Opus agent hunts bugs in any diff that carries risk (logic, data, security, APIs), fixes what it proves, and holds the code to your `CLAUDE.md`.
5. **Commit.** One verified unit, with the proof in the report.

## Results

- **The audit earns its place.** In 44 audits of real work, 33 found something the build had missed and fixed it.
- **It costs less, not more.** Workers and auditors read the files, so only conclusions reach the main thread. The median request took 52% less fresh input and 61% less output (40 sessions before x, 12 after; averages held level).
- **Proof, not claims.** A finding counts only when it is reproduced; the rest is marked unconfirmed. A UI fix arrives with a before and after screenshot.

## Commands

`x:work` runs by itself. The rest run when you type them.

| Command | Does |
|---|---|
| `/x:think` | A judgment from Fable on a question you name. |
| `/x:audit` | Audits a diff for bugs, quality and a simpler solution, then fixes what it proves. |
| `/x:review` | Every specialist on the whole codebase at once, merged into one ranked list. You pick what gets fixed. |
| `/x:bug-hunter` | Finds the deepest bug a real user hits, reproduces it and fixes it. |
| `/x:security` | Attacks your app locally, proves each hole with a working exploit and fixes it at the root. |
| `/x:state-machine` | Maps every implicit state machine and fixes the defects it reproduces. |
| `/x:optimizer` | Measured speedups pushed toward the floor, each with its numbers. Read-only. |
| `/x:architecture` | Restructure or refine: a verdict from the code, the dependency graph and git history. Read-only. |
| `/x:designer` | Revamp or polish: a verdict from the rendered screens, with worst-case data, at several widths, with touch and on a slow connection. Read-only. |
| `/x:prototype` | Three to five different versions of one UI piece behind a live picker. You keep one. |
| `/x:deprecated` | Finds and fixes every deprecated API use in the repo. |

Twelve agents do the work. Fable judges (thinker, architect, designer, optimizer, bug hunter, security, prototyper), Opus audits (auditor, state machine), Sonnet builds and reads, Haiku runs commands. They need access to all four models. The designer's standards ship with the plugin, one file per lens, drawn from Apple's design talks and Emil Kowalski's design engineering and ranked below your `CLAUDE.md`.

## Guards

- **Shared checkout.** Other sessions may share your checkout, so a hook blocks git commands that would take, discard or sweep in their work: `stash`, `reset`, `clean`, restoring the whole tree, adding or committing everything. Files you name pass, and so does a scratch copy the same command enters (`cd /tmp/copy && git ...`).
- **Deprecated APIs.** Models write old APIs from memory and builds let them through. Hooks check what Claude just wrote in Zig, TypeScript 7, Rust and Go with the project's own toolchain and name the replacement, typically in 50 to 300 ms per edit. Each stays silent where its toolchain is missing; the TypeScript, Rust and Go checks run on [bun](https://bun.sh).

## usage-mod

A band above the prompt: rings for your weekly and Fable usage limits, plus folder, branch, context and cost.

<img src="assets/usage-mod.png" alt="usage-mod: rings at 44% Week and 48% Fable, each resetting in 4d 23h, with the folder, branch and cost on the right, above the prompt" width="803">

```
/plugin install usage-mod --marketplace xcaeser/xcaeser-plugins
```

Update with `claude plugin update x@xcaeser` (or `usage-mod@xcaeser`), or enable auto-update for xcaeser in `/plugin` → Marketplaces.

## License

[MIT](LICENSE)
