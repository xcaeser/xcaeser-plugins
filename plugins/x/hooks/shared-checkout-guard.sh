#!/bin/sh
# PreToolUse guard for Bash. Other sessions may share one checkout, so git calls that take,
# discard or sweep in the whole tree touch other sessions' work. A backstop for habits, not a
# parser: segments are split at separators and newlines and quotes are not parsed, so quoted text
# that reads like a hazard is blocked too and Claude rewords. Claude Code's `if` rules are not
# used because they fire on every heredoc.
#
# Two things are not the shared tree, and pass. Paths named one by one: git add -A <files>,
# git reset -- <files>. And a scratch copy: git calls joined by && to a cd into a temp directory
# that is spelled out and lies outside the session's. Only && keeps that link, because after any
# other separator the git call still runs when the cd failed, in the shared checkout; a variable
# is not enough either, since an empty one leaves the cd where it was.
input=$(cat)

# The command alone, still JSON-escaped, so other fields (description) never match. If the input
# ever changes shape, the whole input is matched rather than nothing.
cmd=$(printf '%s' "$input" | sed -nE 's/.*"command": *"(([^"\\]|\\.)*)".*/\1/p')
[ -n "$cmd" ] || cmd=$input
cwd=$(printf '%s' "$input" | sed -nE 's/.*"cwd": *"(([^"\\]|\\.)*)".*/\1/p')

# git at the start of a segment, past control words, VAR=value prefixes, a path, and global options
# such as -C <path> (quoted paths may hold spaces) and --no-pager.
git_call='^[[:space:]]*((if|then|elif|else|do|while|until|!)[[:space:]]+)*([A-Za-z_][A-Za-z0-9_]*=[^[:space:]]*[[:space:]]+)*([^[:space:]]*/)?git([[:space:]]+((-[Cc]|--(git-dir|work-tree))[[:space:]]+(\\"[^"]*\\"|[^[:space:]]+)|-[^[:space:]]+))*[[:space:]]+'

# The git segments that reach the shared checkout, in order. Line continuations (\ then newline)
# join first, so a git call split over lines stays one segment, and redirections go, so a segment
# ends at its last argument. `at` is where the commands run: 1 in a scratch copy, 0 anywhere
# else. Every separator but && and | sends it back to 0, and brackets save and restore it, since
# a cd inside them ends with them.
lines=$(printf '%s' "$cmd" | GIT_CALL=$git_call awk -v cwd="$cwd" -v tmp="$TMPDIR" '
  function plain(dir) { sub(/^\/private\//, "/", dir); sub(/\/+$/, "", dir); return dir }
  # Where a cd or -C to `dir` lands, coming from `at`.
  function land(dir, at) {
    gsub(/\\"|\047|^ +/, "", dir)
    if (dir ~ /^\$TMPDIR(\/|$)/) dir = tmp substr(dir, 8)
    # Home, the previous directory, a variable or a parent could be anywhere.
    if (dir == "" || dir ~ /^[~$-]/ || dir ~ /\.\./) return 0
    if (dir !~ /^\//) return at                                # relative: still in the same tree
    dir = plain(dir)
    if (dir !~ /^\/(tmp|var\/tmp|var\/folders)(\/|$)/ && (tmp == "" || index(dir "/", tmp "/") != 1)) return 0
    # A temp directory that holds the session directory, or sits in it, is the shared checkout.
    return cwd == "" || (index(dir "/", cwd "/") != 1 && index(cwd "/", dir "/") != 1)
  }
  BEGIN { git = ENVIRON["GIT_CALL"]; cwd = plain(cwd); tmp = plain(tmp); at = 0 }
  {
    gsub(/\\\\\\n/, " "); gsub(/\\t/, " "); gsub(/\\n/, "\n")
    # Exported anywhere, GIT_DIR and GIT_WORK_TREE aim every git call.
    env = $0 ~ /GIT_DIR=|GIT_WORK_TREE=/
    gsub(/\( *\) *\{/, ";")   # a function body runs wherever it is called
    gsub(/&?[0-9]*[<>]+(&[0-9-]+| *[^ \n;&|(){}`]*)/, "")
    gsub(/&&/, "\001"); gsub(/\|\||[;&`\n]/, "\n;\n"); gsub(/[()]/, "\n&\n"); gsub(/[\001{}]/, "\n"); gsub(/\|/, "\n|\n")
    n = split($0, segment, "\n")
    for (i = 1; i <= n; i++) {
      s = segment[i]
      if (s == ";") at = 0
      else if (s == "(") saved[++depth] = at
      else if (s == ")") at = depth > 0 ? saved[depth--] : 0
      else if (s ~ /^ *(cd|pushd|popd)( |$)/) {
        # In a pipeline the cd runs in a subshell of its own and leaves the directory as it was.
        if (segment[i - 1] != "|" && segment[i + 1] != "|") { sub(/^ *[a-z]+/, "", s); sub(/ +$/, "", s); at = land(s, at) }
      }
      else if (s ~ git) {
        here = at
        if (env || s ~ /--git-dir|--work-tree|GIT_DIR=|GIT_WORK_TREE=/) here = 0
        else {
          # Each -C of the global options moves on from the one before it.
          match(s, git); pre = substr(s, 1, RLENGTH)
          while (match(pre, / -C +[^ ]+/)) { here = land(substr(pre, RSTART + 4, RLENGTH - 4), here); pre = substr(pre, RSTART + RLENGTH) }
        }
        if (!here) {
          # The session directory and its parents are the whole tree: name them like it.
          n_words = split(s, word, " "); s = ""
          for (j = 1; j <= n_words; j++) s = s (j > 1 ? " " : "") (word[j] ~ /^\// && index(cwd "/", plain(word[j]) "/") == 1 ? "." : word[j])
          print s
        }
      }
    }
  }')

args='([[:space:]]+[^[:space:]]+)*[[:space:]]+'
whole='(\.|\./|:/)'
# One path named in full: not an option, a quoted word, a glob, a home path, or anything that
# starts with a dot or holds .. ; and not a variable, which sweeps in everything when it is empty.
c='[^.*?[[:space:]]'
path="[^-.:*?[~\\\\\"'\$[:space:]]($c|\\.$c)*\\.?"

# rule <call> <safe> <message>: blocks a segment that calls git <call> unless it matches <safe>.
rule() {
  hits=$(printf '%s\n' "$lines" | grep -E "$git_call($1)([[:space:]]|\$)") || return 0
  [ -z "$2" ] || hits=$(printf '%s\n' "$hits" | grep -vE "$git_call$2")
  [ -n "$hits" ] || return 0
  echo "$3" >&2
  echo 'A scratch copy is not guarded when the same command enters it: cd <temp directory> && git ...' >&2
  exit 2
}

rule stash 'stash[[:space:]]+(list|show)([[:space:]]|$)' 'Blocked: other sessions share this checkout, and git stash takes their uncommitted work. Commit your own files with git commit -- <files>.'
rule reset "reset([[:space:]]+(-q|--quiet))?([[:space:]]+[^-[:space:]][^[:space:]]*)?[[:space:]]+--([[:space:]]+$path)+[[:space:]]*\$" 'Blocked: other sessions share this checkout, and git reset rewrites their index or discards their work. Leave the tree as it is: unstage your own files with git reset -- <files> and commit them with git commit -- <files>.'
rule clean "clean$args(-[A-Za-z]*n[A-Za-z]*|--dry-run)([[:space:]]|\$)" 'Blocked: other sessions share this checkout, and git clean deletes their untracked files. Remove your own files by name.'
rule "(checkout|restore)$args$whole" '' 'Blocked: other sessions share this checkout, and restoring the whole tree discards their uncommitted edits. Restore only your own files by name.'
rule "add$args(-[A-Za-z]*[Au][A-Za-z]*|--all|--update|$whole)" "add([[:space:]]+-[^[:space:]]*)*([[:space:]]+$path)+[[:space:]]*\$" 'Blocked: other sessions share this checkout, and adding everything stages their changes too. Add your own files by name: git add <files>.'
rule "commit$args(-[A-Za-z]*a[A-Za-z]*|--all|$whole)" '' 'Blocked: other sessions share this checkout, and committing everything takes in their changes. Commit your own files with git commit -- <files>.'
