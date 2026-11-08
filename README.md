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

| Skill | Does |
|---|---|
| `x:work` | The workflow above. Runs automatically. |
| `/x:think` | Ask for a design judgment now. |
| `/x:audit` | Audit a diff for bugs, quality and a simpler solution, then fix what's confirmed. |
| `/x:bug-hunter` | Find the deepest, most annoying bug and reproduce it. Read-only. |
| `/x:state-machine` | Map every implicit state machine: states, transitions, writers, reachable impossible states. Read-only. |

Agents: `x:Fable-thinker`, `x:Opus-auditor`, `x:Sonnet-worker`. They need access to the Fable, Opus and Sonnet models.

The auditor checks the work against your `CLAUDE.md`, so the rules you write there are the bar.

## License

[MIT](LICENSE)
