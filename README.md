# xcaeser plugins

Plugins for Claude Code.

## x

An engineering workflow that runs on every code change, with no command to type: it weighs the design when it is open, builds through scoped workers, and audits the diff before calling it done. Also `/x:bug-hunter` (find and reproduce the deepest bug) and `/x:state-machine` (map every implicit state machine).

```
/plugin install x --marketplace xcaeser/xcaeser-plugins
```

Splitting a change into parallel sessions needs the Claude desktop app; elsewhere x builds directly.
