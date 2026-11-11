# Terminal

The interface of a command-line tool: what it prints, to which stream, with which exit code, and how it behaves on a terminal, in a pipe, in a script and under Ctrl-C.

Judge by running it twice: in a real terminal, and with both streams piped (`tool args 2>&1 | cat -v`, then `tool args 2>/dev/null | cat -v`). Cite rules as `terminal.md X<n>`. Feedback, agency, wayfinding and copy rules in `flow.md` (S3, S4, S11, S14, S17, S18, S21) apply here unchanged; worst-case inputs follow `worst-case.md` (D1, D6, D11, D13, D25). This file adds only what a terminal changes.

## Judge

### What it does and prints

- X1 The command does what its name says and prints the result, not a narration of the steps. `tool size big.iso` prints the size, not "Opening file... Reading... Done!". Narration the person did not ask for is a finding.
- X2 Quiet success: a command whose job is an effect (copy, delete, install) prints nothing, or one result line, and exits 0. A command that returns data prints only the data. A scripting command that chatters on success is a finding.
- X3 First output (a header, a status line or the first result) appears within ~100ms of launch. A silent start longer than that, with no later sign of life, reads as a hang.
- X4 `tool` alone (no arguments) lists the commands, one line each, and exits 0. A bare command that only groups subcommands prints its help and exits nonzero; it never silently does nothing and never runs a default that changes something.

### Streams and pipes

- X5 stdout carries data and only data; stderr carries messages, progress, warnings and errors. Judge with `tool args 2>/dev/null`: what remains is exactly what a script wants. A message, a spinner frame or an error on stdout is a finding. Parse errors and `--help` for a wrong command belong on stderr.
- X6 With stdout piped (`| cat -v`), the output holds no escape sequences, no glyph a plain parser would trip on, no carriage returns and no progress. Any `^[[` in the pipe is a finding, help text included.
- X7 A closed pipe (`tool | head -1`) ends the tool quietly with no error message and no trace.
- X8 Machine output is a stable format: `--json` (one document, or one object per line for streams), or a plain one-record-per-line format with fixed fields. Fields never change meaning between versions; human output is free to change and says so.

### Exit codes

- X9 Exit 0 means success and nonzero means failure; the code is never 0 after an error message. Judge by `tool bad-input; echo $?`.
- X10 Distinct nonzero codes exist only where a script needs to branch on them (1 failed, 2 usage, 130 interrupted by Ctrl-C), are listed in `--help`, and mean the same on every command. A different code per error message is a finding.
- X11 A check or dry-run command says through its exit code what it found: `tool setup --check` exits nonzero when a required item is missing and 0 when only optional ones are.

### Errors

- X12 An error says what failed, why, and the exact next command, in one short block: `error: cannot reach api.example.com: no answer. Is the network up? Run: tool status`. Missing any of the three is a finding.
- X13 No stack trace, error-set name or source path by default (`error: FileNotFound` is a finding). The detail sits behind `--verbose` or an env var named in the error.
- X14 The same mistake prints the same words everywhere: one unknown-flag message, one missing-argument message, one not-found message, each ending in `Run: tool <command> --help`.
- X15 A destructive failure says what state the work was left in: "nothing was changed", or the list of what was.

### Help and discovery

- X16 `--help` and `-h` work on every command and subcommand, print to stdout, and exit 0, even when other arguments are present.
- X17 Help order: one-line purpose, usage line, examples (two or three real, copy-pasteable, with the common case first), commands or flags, then the precedence and exit-code notes. Examples after the flag table, or none, is a finding.
- X18 Help lines wrap at the terminal width (80 when unknown or piped), with descriptions aligned in one column. Judge at 40, 80 and 200 columns; a line that runs past the edge or a column that collapses is a finding.
- X19 Every flag and command has a one-line description that states its effect in plain words, defaults shown. "Enable verbose mode" fails; "Print each file as it is copied" passes.
- X20 Unknown command or flag suggests the nearest real one when one is within a typo (`did you mean: setup?`), then points to `--help`. It never guesses and runs it.

### Flags and arguments

- X21 Every option has a long name (`--output`); a short one (`-o`) exists only for a flag used many times a day, and is the same letter on every command. `-h` is help, never anything else.
- X22 `--` ends flag parsing so any text after it, including `-rf` or `--yes`, is an argument. Judge with `tool -- --weird-name`.
- X23 No positional ambiguity: at most one kind of positional argument per command; two of the same type (`copy a b`) are named by position in the usage line (`copy <from> <to>`) and the order is the one people say aloud. Three or more become flags.
- X24 Flags accept `--name value` and `--name=value`; boolean flags take no value and can be turned off (`--no-color`). Order of flags and arguments never matters.
- X25 Paths given on the command line resolve from where the tool was run, not from where it is installed, and `~` is left to the shell. `-` means stdin or stdout where a file is expected.
- X26 Precedence is flag, then environment variable, then config file, then default, and help states it in one line next to the option (`--host  Server to deploy to (env DEPLOY_HOST, then config file)`). Judge by setting each and seeing the higher one win.

### Color and glyphs

- X27 Color and glyphs appear only when the stream they go to is a terminal. stdout is judged separately from stderr: `tool 2>&1 | cat -v` and `tool >/dev/null` each print no escapes on the piped side.
- X28 `NO_COLOR` set and non-empty turns color off, `--no-color` does too, and both win over `CLICOLOR_FORCE`. With color off the status glyphs stay readable (X30) and nothing changes but the escapes.
- X29 Color never carries meaning alone. With color stripped every line still says ok, error or warning in words or a glyph; red text with no marker is a finding.
- X30 One status legend for the whole tool: `✓` done or fine, `✗` failed or blocking, `!` worth knowing, optional or a warning. Where the terminal or pipe cannot show the glyphs, the plain fallback is `ok:` `error:` `warning:` in that order and the same position. A second set of symbols (`✔ ✖ ⚠`) or a glyph used for two meanings is a finding.
- X31 Color is at most three hues (green done, red failed, yellow caution) plus dim for secondary text, in the 16 base colors so the person's theme decides the shade; no 24-bit color, no background fills, no blinking.
- X32 Emoji and box-drawing are decoration, not content; a tool that is unreadable without them, or whose columns misalign because their width is two cells, is a finding.

### Progress and waiting

- X33 Progress shows only on a terminal, on stderr, as one live line redrawn in place. In a pipe, a log or CI it never appears: no spinner frames, no `\r` redraws, no repeated percent lines.
- X34 Work shorter than ~300ms shows nothing. Between ~300ms and a few seconds a changing line is enough; past that it says what it is doing now and, when known, how far along.
- X35 Known size gets a bar or `[3/5]` counter; unknown size gets a spinner with the current item's name. A spinner on work of known size is a finding, and so is a bar that sits at 0% or jumps backwards.
- X36 The finished line replaces the live line and states the outcome (`✓ copied 214 files`), so the scrollback keeps a record and the live line leaves nothing behind. Judge by scrolling up after a run.
- X37 Output produced while progress is live (a warning, a result) prints above it without tearing the live line.

### Control and safety

- X38 A destructive or outward action (delete, overwrite, deploy, send, spend) names its consequence and asks on a terminal, with the safe answer as the default (`Delete 14 files? [y/N]`); `--yes` skips the question. Routine actions never ask (S4).
- X39 When stdin is not a terminal the tool never prompts and never waits: with `--yes` it proceeds, without it fails at once with the exact flag to pass (`not confirmed: nothing deleted. Pass --yes to skip the question.`). A tool that hangs in `tool < /dev/null` is a finding.
- X40 Setup and repair commands are idempotent (running twice changes nothing the second time), and `--check` reports what would change without changing it (S3).
- X41 Ctrl-C stops the tool within a second, restores the terminal (cursor visible, no raw mode left, the cursor on a fresh line), leaves no half-written file or state, exits 130, and prints one line saying what was left as it was. Judge by pressing Ctrl-C mid-progress and then running `tool` again.
- X42 A second Ctrl-C while cleaning up exits at once; cleanup never takes more than a few seconds.

### Trust

- X43 Secrets (tokens, passwords, keys) are never echoed, never logged, never in `--verbose` or an error message, never in the process arguments; they arrive through an env var, a file or a hidden prompt.
- X44 No network call, update check, telemetry or file write outside what the command's name says. A tool that phones home, even to check a version, without a flag the person passed is a finding (S5).

### Words and worst cases

- X45 Messages use plain words: "cannot reach", not "ECONNREFUSED"; "file is not there", not "ENOENT"; no "invalid state", "failed to" followed by an internal noun, or exclamation marks. Name things as the person does (S17).
- X46 Long paths, spaceless names, Unicode (CJK, combining marks, emoji, right-to-left), spaces and quotes in names, empty input, empty stdin and a million-line input all produce a sensible result. Path-like values that differ at their end truncate in the middle, never at the end (D11); data in a pipe is never truncated at all; a table cut to the terminal width says it did.
- X47 Counts use plural-correct words (`1 file`, `0 files`), numbers in help and tables right-align, durations read like "3 min 12 s", and sizes carry their unit.
- X48 Output with columns measures display width, not bytes, so CJK and emoji do not shear the table; lines wider than the terminal wrap or are cut with `…`, only when stdout is a terminal.

## Build

Each technique is a mechanism every language and runtime exposes; use the standard library first. Libraries that solve a piece: Python `argparse`, `rich`; Go `cobra`, `x/term`; Rust `clap`, `indicatif`; Node `commander`, `ora`; Ruby `thor`; Swift `swift-argument-parser`.

### Streams and buffered writing

Write data to file descriptor 1 and everything else to 2 (X5). Buffer stdout, flush it before exit and before anything goes to stderr so the two never interleave out of order. When a write fails because the reader closed the pipe (EPIPE, or SIGPIPE under the default action), stop quietly with no message (X7). Return the exit code from the entry point so cleanup and flushes run; a hard exit skips them, so flush first.

### TTY, color and NO_COLOR

Ask isatty of each stream separately, once at startup, and keep the answers in one place: stdout decides color and glyphs for data, stderr decides them for messages and progress (X27). Color is on only when that stream is a terminal, `NO_COLOR` is unset or empty, and `--no-color` was not passed; `NO_COLOR` and `--no-color` win over `CLICOLOR_FORCE` (X28). Count an environment variable only when it is non-empty. Emit status through one function that maps ok, failed and warning to the glyph (`✓ ✗ !`) or the plain fallback (`ok:` `error:` `warning:`) in the same position (X29, X30). Use the 16 base colors (X31).

```sh
tool status | cat -v          # no ^[[ in the pipe
NO_COLOR=1 tool status        # same words, no escapes
```

### Width

Take the width from the terminal itself (the TTY size query on the stream), else the `COLUMNS` environment variable, else 80. Re-read it per run, not per build. Measure display width in terminal cells, not bytes or code points, so CJK and emoji count as two and combining marks as zero (X18, X48). Wrap or cut with `…` only when stdout is a terminal; in a pipe emit full lines (X46).

### Progress

Draw progress only when stderr is a terminal. Redraw one line in place: a carriage return, the new text, then clear to end of line; hide the cursor while it runs and show it again on every exit path. Wait ~300ms before the first frame (X34) and redraw at most about 12 times a second. Known total gets a counter or bar, unknown gets a spinner with the current item (X35). When finished, overwrite the live line with the outcome line and end it with a newline (X36). Output printed during progress clears the live line, prints, then redraws it (X37). With `--json`, `--quiet` or a non-terminal stderr, draw nothing.

### Exit codes

Define them once: 0 success, 1 failure, 2 usage error (unknown flag, missing argument), 130 interrupted by SIGINT (X9, X10). Catch every expected failure at the command's edge, print one message, and map it to a code; nothing escapes as an uncaught exception, panic or trace (X13). Verify with:

```sh
tool bad-input; echo $?
```

### Confirmation

Ask only when stdin is a terminal (isatty on descriptor 0). Print the consequence and `[y/N]`, flush, read one line, and treat anything but `y` or `yes` as no. When stdin is not a terminal never read it: proceed with `--yes`, otherwise fail at once with the flag to pass (X38, X39).

```sh
tool delete old < /dev/null; echo $?     # returns at once, names --yes
```

### Ctrl-C

Install a SIGINT handler once, before work starts. The handler only sets a flag (no allocation, no printing, no locks); the work loop checks the flag between steps, ends progress, restores the cursor and terminal mode, prints one line saying what was left as it was, and exits 130 (X41). The handler also restores the default action, so a second Ctrl-C kills at once (X42). Write real files under a temporary name in the same directory and rename them into place at the end, so an interrupt leaves nothing half-written. Remove temporary files on every exit path.

### Environment, arguments and precedence

Parse arguments in one place: stop at `--` (X22), accept `--name value` and `--name=value`, and accept `--no-name` for booleans (X24). Resolve each option once with flag, then environment variable, then config file, then default (X26), and print that order in the option's help line. Never print or log the value of a secret key (X43).

### Messages

- Write each error as `what failed: why. next command` from one function, so X12 and X14 hold by construction. Put the exact command in plain text, copy-pasteable, with no quotes to strip.
- Name the state left behind in destructive failures (X15).
- Keep help text and messages in plain words (X45): map each system error a command can hit to a sentence at the command's edge, and let no error code name or internal identifier reach the person.
- Print counts through one plural helper, and measure display width for any column output (X47, X48).

### Check before done

Run the tool three ways and look at the bytes: in a terminal, `2>&1 | cat -v`, and `2>/dev/null | cat -v`; then `NO_COLOR=1`, `< /dev/null`, a Ctrl-C mid-run with `echo $?`, `--help` at 40 and 200 columns, and one worst-case input from `worst-case.md` D1 and D6. Report which rule ids held and which broke.
