#!/bin/sh
# PreToolUse guard for Bash. x:work runs split sessions in one shared checkout, so git stash and
# git reset take or discard other sessions' work. Matches the command text instead of using `if`
# rules: Claude Code runs `if` hooks for every command it can't parse (heredocs), and `if` misses
# `git -C <path>`.
#
# shared-checkout-lex.awk splits the command into one segment per line and masks quoted text,
# comments and heredoc bodies, so a rule matches only git at a command position. If the lexer
# loses the thread (an unterminated quote or heredoc) it falls back to splitting at every quote
# and separator, which blocks more, never less. A missed block costs more than a false one.
#
# Out of scope, because the text names no git call: wrappers (`bash -c`, `eval`, `ssh`, `sudo`)
# and indirection (`$g stash`, aliases).
input=$(cat)

# The command alone, still JSON-escaped, so other fields (description) never match. If the input
# ever changes shape, the whole input is matched rather than nothing.
cmd=$(printf '%s' "$input" | sed -nE 's/.*"command": *"(([^"\\]|\\.)*)".*/\1/p')
[ -n "$cmd" ] || cmd=$input

lines=$(printf '%s' "$cmd" | awk -f "$(dirname "$0")/shared-checkout-lex.awk") || {
  echo 'Blocked: the shared-checkout guard could not read this command.' >&2
  exit 2
}

# git at a command position, past control words, VAR=value prefixes, a path, and global options
# such as -C <path> and --no-pager.
git_call='^[[:space:]]*((if|then|elif|else|do|while|until|time|exec|command|env|nice|nohup|xargs|!)[[:space:]]+)*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*([^[:space:]]*/)?git([[:space:]]+((-[Cc]|--(git-dir|work-tree|namespace|super-prefix|config-env))[[:space:]]+[^[:space:]]+|-[^[:space:]]+))*[[:space:]]+'

# rule <verb> <safe> <message>: blocks a line that calls git <verb> unless it matches <safe>.
rule() {
  hits=$(printf '%s\n' "$lines" | grep -E "$git_call($1)([[:space:]]|\$)") || return 0
  [ -z "$2" ] || hits=$(printf '%s\n' "$hits" | grep -vE "$git_call$2")
  [ -n "$hits" ] || return 0
  echo "$3" >&2
  exit 2
}

rule stash 'stash[[:space:]]+(list|show)([[:space:]]|$)' 'Blocked: other sessions share this checkout, and git stash takes their uncommitted work. Commit your own files with git commit -- <files>.'
rule reset '' 'Blocked: other sessions share this checkout, and git reset rewrites their index or discards their work. Leave the tree as it is and commit your own files with git commit -- <files>.'
