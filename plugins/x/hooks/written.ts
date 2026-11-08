// What every PostToolUse language hook (Edit|Write) needs to judge only what Claude just wrote,
// not the deprecated code already in the file. Positions are compared by 1-based line: the
// compilers report them in different units (UTF-16 offsets, bytes, columns), lines are shared.
import { existsSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** One deprecated use, as the language's own tooling reports it. `file` is absolute; `message`
 * is what follows the position and already names the replacement. */
export interface Finding {
  file: string
  line: number
  column: number
  name: string
  message: string
}

export interface Input {
  file: string
  /** An Edit's text before and after; both undefined for a Write. */
  old?: string
  new?: string
  /** Whether a 1-based line of the file holds text Claude just wrote. */
  isWritten: (line: number) => boolean
}

interface Hunk {
  newStart: number
  /** Unified-diff lines: ` ` context, `+` added, `-` removed, `\` "no newline" marker. */
  lines: string[]
}

/** The lines of the new file the hunks add. */
function addedLines(hunks: Hunk[]): Set<number> {
  const added = new Set<number>()
  for (const { newStart, lines } of hunks) {
    let line = newStart
    for (const text of lines) {
      if (text.startsWith('+')) added.add(line)
      if (!text.startsWith('-') && !text.startsWith('\\')) line++
    }
  }
  return added
}

/** The tool input from stdin, or undefined when the tool wrote no text to check. A Write is new
 * in whole; an Edit is exactly the lines its `structuredPatch` adds, and nothing without one. */
export async function readInput(): Promise<Input | undefined> {
  const { tool_input, tool_response } = await Bun.stdin.json()
  const { file_path, old_string, new_string, content } = tool_input ?? {}
  if (!file_path) return undefined
  if (typeof content === 'string') return content ? { file: file_path, isWritten: () => true } : undefined
  const added = addedLines(tool_response?.structuredPatch ?? [])
  return added.size > 0 ? { file: file_path, old: old_string, new: new_string, isWritten: line => added.has(line) } : undefined
}

/** Runs a hook. A failure of the hook itself exits 1, which Claude Code shows without blocking;
 * only `report` exits 2, which blocks. */
export async function runHook(name: string, check: (input: Input) => void | Promise<void>): Promise<void> {
  try {
    const input = await readInput()
    if (input) await check(input)
  } catch (error) {
    console.error(`${name}: ${error instanceof Error ? error.message : error}`)
    process.exitCode = 1
  }
}

export function canonical(path: string): string {
  try {
    return realpathSync(path)
  } catch {
    return path
  }
}

/** Whether `text` holds `name` as a whole word. */
function hasWord(text: string, name: string): boolean {
  return new RegExp(`(?<![\\w$])${RegExp.escape(name)}(?![\\w$])`).test(text)
}

/** The nearest directory at or above `dir` holding `manifest` (go.mod, Cargo.toml). */
export function nearest(dir: string, manifest: string): string | undefined {
  if (existsSync(join(dir, manifest))) return dir
  const parent = dirname(dir)
  return parent === dir ? undefined : nearest(parent, manifest)
}

/** The executable `name` for files in `dir`: the one mise resolves there (so a project's mise.toml
 * pin wins; a hook never gets mise's hook-env), else the one on PATH. */
export function resolveTool(name: string, dir: string): string | undefined {
  const mise = Bun.which('mise')
  if (mise) {
    const run = Bun.spawnSync([mise, 'which', name], { cwd: dir, stderr: 'ignore' })
    const path = run.stdout.toString().trim()
    if (run.exitCode === 0 && path) return path
  }
  return Bun.which(name) ?? undefined
}

/** Blocks with the findings inside the text Claude just wrote (one per line) and the advice, or
 * does nothing without any. An Edit that touches part of a line leaves the old calls elsewhere on
 * it alone: the name must be in the new text, and not already in the old. */
export function report(findings: Finding[], input: Input): void {
  const edited = canonical(input.file)
  const lines = findings
    .filter(
      f =>
        canonical(f.file) === edited &&
        input.isWritten(f.line) &&
        (input.new === undefined || hasWord(input.new, f.name)) &&
        !(input.old && hasWord(input.old, f.name)),
    )
    .map(f => `${input.file}:${f.line}:${f.column} ${f.message}`)
  if (lines.length === 0) return
  console.error(`${lines.join('\n')}\nSwitch to the current API the note names, or the one the library documents.`)
  process.exitCode = 2
}
