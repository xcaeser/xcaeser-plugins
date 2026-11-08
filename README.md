# xcaeser plugins

Plugins for Claude Code.

```
/plugin install x --marketplace xcaeser/xcaeser-plugins
```

New versions arrive with `claude plugin update x@xcaeser`, or automatically once you enable auto-update for xcaeser in `/plugin` → Marketplaces.

## x

An engineering workflow that runs on every code change. There is no command to type: a hook routes any coding request through `x:work`, which:

1. **Thinks** when two designs are plausible and the code doesn't settle it, by asking a Fable agent for the most elegant shape.
2. **Builds** through Sonnet workers, one per independent piece, each proving its piece by running it. Large changes with disjoint parts split into parallel sessions (Claude desktop app only; elsewhere x builds directly).
3. **Audits** the finished diff with an independent Opus agent when its risk calls for it (logic, security, data, APIs; not docs or tiny edits), fixes what it confirms, then commits.

It also spends fewer tokens, because workers and auditors read the files and only their conclusions reach the main thread. Comparing 40 sessions the day before installing x with 12 sessions the day after, the median request took 52% less fresh input and 61% less output, and context re-read from cache halved. Averages held level, so the saving is in typical requests, not the largest.

| Skill | Does |
|---|---|
| `x:work` | The workflow above. Runs automatically. |
| `/x:think` | Ask for a design judgment now. |
| `/x:audit` | Audit a diff for bugs, quality and a simpler solution, then fix what's confirmed. |
| `/x:bug-hunter` | Find the deepest, most annoying bug and reproduce it. Read-only. |
| `/x:state-machine` | Map every implicit state machine: states, transitions, writers, reachable impossible states. Read-only. |

Agents: `x:Fable-thinker`, `x:Opus-auditor`, `x:Sonnet-worker`. They need access to the Fable, Opus and Sonnet models.

The auditor checks the work against your `CLAUDE.md`, so the rules you write there are the bar.

Split sessions share one checkout, so a hook blocks git commands that would take, discard or sweep in another session's work: `stash`, `reset`, `clean`, restoring the whole tree, and adding or committing everything.

Zig's compiler never warns about deprecated std declarations, so a hook checks every `.zig` file Claude writes against the `Deprecated` doc comments in the installed std and flags the old API, naming the replacement.

## usage-mod

A band above the prompt: rings for your weekly and Fable usage limits, plus folder, branch, context and cost.

```
/plugin install usage-mod --marketplace xcaeser/xcaeser-plugins
```

## License

[MIT](LICENSE)
