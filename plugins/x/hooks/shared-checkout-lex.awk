# Lexes the JSON-escaped text of a shell command for shared-checkout-guard.sh. Prints one command
# segment per line, with everything that is data instead of code masked as "_": single-quoted
# spans, double-quoted literal runs, comments and heredoc bodies. Code inside $(...) and backticks
# is kept, also within double quotes and unquoted heredoc bodies.
#
# Modes: N normal, S single quote, D double quote, P ${...}, C comment, H heredoc body. A stack
# remembers the mode to return to after $(...) and backticks, and tracks plain parentheses.
#
# If the lexer ends inside a quote, heredoc or substitution, it has lost the thread. It then prints
# the text with every quote and separator as a line break, so any git call in it is still seen.

function emit(s) { out = out s }

function push(kind, back) {
  fk[++sp] = kind
  fr[sp] = back
}

# Leaves $(...) or backticks. The substitution's output is one word of the surrounding command.
function pop() {
  m = fr[sp--]
  emit("\n_")
  word = 0
}

function unescape(s,   o, k, len, c, d) {
  len = length(s)
  for (k = 1; k <= len; k++) {
    c = substr(s, k, 1)
    if (c != "\\") { o = o c; continue }
    d = substr(s, ++k, 1)
    if (d == "n") o = o "\n"
    else if (d == "t") o = o "\t"
    else if (d == "r") o = o "\r"
    else if (d == "b" || d == "f") o = o " "
    else if (d == "u") { o = o "?"; k += 4 }
    else if (d == "\"" || d == "\\" || d == "/") o = o d
    else o = o c d
  }
  return o
}

# At "<<": queues the heredoc whose delimiter word follows. Its body starts after the next newline.
function queue_heredoc(   j, c, q, delim, quoted, strip) {
  j = i + 2
  if (substr(t, j, 1) == "-") { strip = 1; j++ }
  while (substr(t, j, 1) ~ /[ \t]/) j++
  while (j <= n) {
    c = substr(t, j, 1)
    if (q) {
      if (c == q) q = ""
      else delim = delim c
    } else if (c == "'" || c == "\"") {
      q = c
      quoted = 1
    } else if (c == "\\") {
      quoted = 1
      delim = delim substr(t, ++j, 1)
    } else if (c ~ /[ \t\n;&|()<>]/) {
      break
    } else {
      delim = delim c
    }
    j++
  }
  i = j
  word = 0
  if (delim == "") return
  hdN++
  hdDelim[hdN] = delim
  hdStrip[hdN] = strip
  hdQuoted[hdN] = quoted
}

function lex(   c, c2, d, rest, k, line, chk) {
  m = "N"; i = 1; word = 1
  while (i <= n) {
    c = substr(t, i, 1)
    c2 = substr(t, i, 2)

    if (m == "S") {
      if (ansi && c == "\\") i += 2
      else { if (c == "'") { m = "N"; word = 0 }; i++ }
    } else if (m == "C") {
      if (c == "\n") m = "N"
      else i++
    } else if (m == "H") {
      if (bol) {
        rest = substr(t, i)
        k = index(rest, "\n")
        line = k ? substr(rest, 1, k - 1) : rest
        chk = line
        if (hdStrip[hdI]) sub(/^\t+/, "", chk)
        if (chk == hdDelim[hdI]) {
          i += length(line) + 1
          emit("\n")
          if (hdI < hdN) { hdI++; emit("_") }
          else { m = "N"; hdN = hdI = 0 }
          continue
        }
        if (hdQuoted[hdI]) { i += length(line) + 1; continue }
        bol = 0
      }
      if (c == "\n") { bol = 1; i++ }
      else if (c == "\\") i += 2
      else if (c2 == "$(") { push("$", "H"); emit("\n"); m = "N"; i += 2; word = 1 }
      else if (c == "`") { push("`", "H"); emit("\n"); m = "N"; i++; word = 1 }
      else i++
    } else if (m == "D" || m == "P") {
      if (c == "\\") i += 2
      else if (c2 == "$(") { push("$", m); emit("\n"); m = "N"; i += 2; word = 1 }
      else if (c == "`") { push("`", m); emit("\n"); m = "N"; i++; word = 1 }
      else {
        if ((m == "D" && c == "\"") || (m == "P" && c == "}")) { m = "N"; word = 0 }
        i++
      }
    } else if (c == "\\") {
      d = substr(t, i + 1, 1)
      if (d != "\n") emit(d ~ /[A-Za-z0-9_]/ ? d : c d)
      i += 2
      word = d == "\n" ? word : 0
    } else if (c == "'") {
      emit("_"); m = "S"; ansi = substr(t, i - 1, 1) == "$"; i++
    } else if (c == "\"") {
      emit("_"); m = "D"; i++
    } else if (c == "#" && word) {
      emit("_"); m = "C"; i++
    } else if (c2 == "<<") {
      if (substr(t, i, 3) == "<<<") { emit("<<<"); i += 3 }
      else { emit("<<_"); queue_heredoc() }
    } else if (c2 == "$(") {
      push("$", "N"); emit("\n"); i += 2; word = 1
    } else if (c2 == "${") {
      emit("_"); m = "P"; i += 2
    } else if (c == "`") {
      if (sp > 0 && fk[sp] == "`") pop()
      else { push("`", "N"); emit("\n"); word = 1 }
      i++
    } else if (c == ")") {
      if (sp > 0 && fk[sp] == "$") pop()
      else { if (sp > 0 && fk[sp] == "(") sp--; emit("\n"); word = 1 }
      i++
    } else if (c == "(") {
      push("(", "N"); emit("\n"); i++; word = 1
    } else if (c == "\n") {
      emit("\n"); i++; word = 1
      if (hdI < hdN) { hdI++; m = "H"; bol = 1; emit("_") }
    } else if (c ~ /[;&|{}]/) {
      emit("\n"); i++; word = 1
    } else {
      emit(c); i++
      word = c ~ /[ \t]/
    }
  }
}

{ raw = NR == 1 ? $0 : raw "\n" $0 }

END {
  t = unescape(raw)
  n = length(t)
  lex()
  if (sp == 0 && (m == "N" || m == "C")) {
    printf "%s\n", out
  } else {
    gsub(/[;&|(){}`'"]/, "\n", t)
    printf "%s\n", t
  }
}
