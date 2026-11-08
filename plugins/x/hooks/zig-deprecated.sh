#!/bin/sh
# PostToolUse guard for Edit|Write. The Zig compiler never warns about deprecated std
# declarations, they only carry a `/// Deprecated...` doc comment that names the replacement, so
# `zig build` passes and old APIs creep in. The index of deprecated names is built from the std
# source of the zig that mise resolves for the edited file's directory (so a project's mise.toml
# version wins; `cd` in sh never re-runs mise's hook-env, so PATH alone is not enough), else the
# zig on PATH, and cached per zig path and version. A backstop, not a type checker: any `.name`
# access that matches an indexed name is flagged, so names that std also declares without a
# deprecation are dropped from the index, names the edited file itself uses bare (its own enum
# tags, fields, declarations) are skipped unless spelled `std.`, and chains already present in an
# Edit's old_string are left alone.
input=$(cat)

# File path, old text and new text, separated by the ASCII unit separator.
sep=$(printf '\037')
out=$(printf '%s' "$input" | /usr/bin/jq -r '.tool_input | [.file_path // "", .old_string // "", .new_string // .content // ""] | join("\u001f")') || exit 0
file=${out%%"$sep"*}
rest=${out#*"$sep"}
old=${rest%%"$sep"*}
text=${rest#*"$sep"}
case $file in *.zig) ;; *) exit 0 ;; esac

zig=$(cd "${file%/*}" 2>/dev/null && mise which zig 2>/dev/null)
[ -x "$zig" ] || zig=$(command -v zig)
[ -x "$zig" ] || exit 0
# The version is part of the key: a zig replaced at the same path (mise `master`) must reindex.
ver=$("$zig" version 2>/dev/null)
[ -n "$ver" ] || exit 0
index=${TMPDIR:-/tmp}/x-zig-deprecated-$(printf '%s %s' "$zig" "$ver" | cksum | tr ' ' -).tsv

if [ ! -f "$index" ]; then
  lib=$("$zig" env 2>/dev/null | sed -n 's/^[[:space:]]*\.lib_dir = "\(.*\)",$/\1/p')
  [ -d "$lib/std" ] || exit 0
  tmp=$(mktemp "$index.XXXXXX") || exit 0
  # Each `///` block holding "Deprecated" (or "This function is deprecated", as mem.zig words it;
  # matching any case would catch hash maps documenting current APIs) marks the next pub
  # const|fn|var, or field or enum/union tag. Output: name, qualifier, absolute std location of the
  # comment, comment block text. A name std also declares undeprecated, as a decl, field or tag (a
  # move such as fs.max_path_bytes to Io.Dir.max_path_bytes), only matches behind its file's name,
  # `fs.`. An index with no deprecated names is still a valid cache.
  if find "$lib/std" -name '*.zig' -print0 | xargs -0 awk '
    FNR == 1 { dep = 0; stem = FILENAME; sub(/.*\//, "", stem); sub(/\.zig$/, "", stem) }
    /^[[:space:]]*\/\/\// {
      line = $0; sub(/^[[:space:]]*\/\/\/[[:space:]]*/, "", line)
      if (dep) note = note " " line
      else if (/Deprecated|This function is deprecated/) { dep = 1; where = FILENAME ":" FNR; note = line }
      next
    }
    match($0, /^[[:space:]]*pub[[:space:]]+(inline[[:space:]]+)?(const|fn|var)[[:space:]]+[A-Za-z_][A-Za-z0-9_]*/) ||
    match($0, /^[[:space:]]*[A-Za-z_][A-Za-z0-9_]*[[:space:]]*[:,=]/) {
      name = substr($0, RSTART, RLENGTH); sub(/[[:space:]]*[:,=]$/, "", name); sub(/.*[[:space:]]/, "", name)
      if (!dep) live[name] = 1
      else if (!((name, stem) in site)) { site[name, stem] = where; why[name, stem] = note; order[++n] = name SUBSEP stem }
    }
    { dep = 0 }
    END {
      for (i = 1; i <= n; i++) {
        split(order[i], k, SUBSEP)
        if (k[1] in live) printf "%s\t%s\t%s\t%s\n", k[1], k[2], site[k[1], k[2]], why[k[1], k[2]]
        else if (!(k[1] in done)) { done[k[1]] = 1; printf "%s\t\t%s\t%s\n", k[1], site[k[1], k[2]], why[k[1], k[2]] }
      }
    }
  ' >"$tmp" 2>/dev/null; then mv "$tmp" "$index"; else rm -f "$tmp"; exit 0; fi
fi

# Member access chains, minus `//` comments and range dots, tagged o (old_string) or n (new text).
chains() { sed -e 's,//.*,,' -e 's/\.\.\.*/ /g' | grep -oE '[A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)+' | sed "s/^/$1 /"; }

# Flag each new chain's indexed names, unless the chain came with the old text or the file uses
# the name bare (its own, not std's).
hits=$({ printf '%s\n' "$old" | chains o; printf '%s\n' "$text" | chains n; } | awk -v idx="$index" -v file="$file" '
  function bare(name,   re, found, line) {
    re = "(^|[^.A-Za-z0-9_@])" name "([^A-Za-z0-9_]|$)"
    while (!found && (getline line < file) > 0) { sub(/\/\/.*/, "", line); found = line ~ re }
    close(file)
    return found
  }
  FILENAME == idx {
    split($0, f, "\t")
    if (f[2] == "") plain[f[1]] = f[3] ": " f[4]; else qual[f[1], f[2]] = f[3] ": " f[4]
    next
  }
  $1 == "o" { old[$2] = 1; next }
  $2 in old { next }
  {
    parts = split($2, p, ".")
    for (i = 2; i <= parts; i++) {
      name = p[i]
      if (name in plain) why = plain[name]
      else if ((name, p[i - 1]) in qual) why = qual[name, p[i - 1]]
      else continue
      if (p[1] != "std" && bare(name)) continue
      if (!(name in seen)) { seen[name] = 1; print "." name " (" why ")" }
    }
  }
' "$index" -)
[ -n "$hits" ] || exit 0

printf '%s\n' "$hits" | sed "s/^/Deprecated in Zig $ver: /" >&2
echo "Read the cited std source and switch to the current API." >&2
exit 2
