#!/bin/sh
# PreToolUse guard for Bash. x:work split sessions share one checkout, so git calls that take,
# discard or sweep in the whole tree touch other sessions' work. A backstop for habits, not a
# parser: segments are split at separators and newlines and quotes are not parsed, so quoted text
# that reads like a hazard is blocked too and Claude rewords. Claude Code's `if` rules are not
# used because they fire on every heredoc.
input=$(cat)

# The command alone, still JSON-escaped, so other fields (description) never match. If the input
# ever changes shape, the whole input is matched rather than nothing.
cmd=$(printf '%s' "$input" | sed -nE 's/.*"command": *"(([^"\\]|\\.)*)".*/\1/p')
[ -n "$cmd" ] || cmd=$input

# Line continuations (\ then newline) join first, so a git call split over lines stays one segment.
lines=$(printf '%s' "$cmd" | awk '{ gsub(/\\\\\\n/, " "); gsub(/\\t/, " "); gsub(/\\n/, "\n"); gsub(/[;&|(){}`]/, "\n"); print }')

# git at the start of a segment, past control words, VAR=value prefixes, a path, and global options
# such as -C <path> (quoted paths may hold spaces) and --no-pager.
git_call='^[[:space:]]*((if|then|elif|else|do|while|until|!)[[:space:]]+)*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*([^[:space:]]*/)?git([[:space:]]+((-[Cc]|--(git-dir|work-tree))[[:space:]]+(\\"[^"]*\\"|[^[:space:]]+)|-[^[:space:]]+))*[[:space:]]+'
args='([[:space:]]+[^[:space:]]+)*[[:space:]]+'
whole='(\.|\./|:/)'

# rule <call> <safe> <message>: blocks a segment that calls git <call> unless it matches <safe>.
rule() {
  hits=$(printf '%s\n' "$lines" | grep -E "$git_call($1)([[:space:]]|\$)") || return 0
  [ -z "$2" ] || hits=$(printf '%s\n' "$hits" | grep -vE "$git_call$2")
  [ -n "$hits" ] || return 0
  echo "$3" >&2
  exit 2
}

rule stash 'stash[[:space:]]+(list|show)([[:space:]]|$)' 'Blocked: other sessions share this checkout, and git stash takes their uncommitted work. Commit your own files with git commit -- <files>.'
rule reset '' 'Blocked: other sessions share this checkout, and git reset rewrites their index or discards their work. Leave the tree as it is and commit your own files with git commit -- <files>.'
rule clean "clean$args(-[A-Za-z]*n[A-Za-z]*|--dry-run)([[:space:]]|\$)" 'Blocked: other sessions share this checkout, and git clean deletes their untracked files. Remove your own files by name.'
rule "(checkout|restore)$args$whole" '' 'Blocked: other sessions share this checkout, and restoring the whole tree discards their uncommitted edits. Restore only your own files by name.'
rule "add$args(-[A-Za-z]*[Au][A-Za-z]*|--all|--update|$whole)" '' 'Blocked: other sessions share this checkout, and adding everything stages their changes too. Add your own files by name: git add <files>.'
rule "commit$args(-[A-Za-z]*a[A-Za-z]*|--all|$whole)" '' 'Blocked: other sessions share this checkout, and committing everything takes in their changes. Commit your own files with git commit -- <files>.'
