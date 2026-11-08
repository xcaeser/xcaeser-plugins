// PostToolUse guard for Edit|Write. rustc does warn about deprecated APIs, but a warning scrolls
// past in the build output and the worker moves on; this makes it block at write time. It runs
// `cargo check --all-targets` (so tests, benches and examples are checked too) in the crate of the
// file Claude just wrote and reports the `deprecated` diagnostics inside the new text, with the
// rustc message, which already carries the #[deprecated] note that names the replacement.
// Cost: the first check of a crate compiles its dependencies and may outlast the hook timeout,
// which does not block; after that cargo checks incrementally and replays cached warnings, so
// a check takes tens of milliseconds to a few hundred. Files outside a Cargo workspace and
// machines without cargo are skipped silently. A compile error elsewhere is normal while Claude
// is mid-edit: cargo still reports the diagnostics it reached. Any failure of cargo itself exits
// 1, which Claude Code shows without blocking.
import { dirname, resolve } from 'node:path'
import { type Finding, report, resolveTool, runHook } from './written.ts'

interface Span {
  file_name: string
  line_start: number
  line_end: number
  column_start: number
  column_end: number
  is_primary: boolean
  text: { text: string }[]
}

interface CargoMessage {
  reason: string
  message?: { code: { code: string } | null; message: string; spans: Span[] }
}

/** Whether a path is Rust source. */
export function isRustSource(file: string): boolean {
  return file.endsWith('.rs')
}

export interface Workspace {
  cargo: string
  root: string
}

/** The Cargo workspace holding `dir`, or undefined without cargo or outside any Cargo.toml. */
export function rustWorkspace(dir: string): Workspace | undefined {
  const cargo = resolveTool('cargo', dir)
  if (!cargo) return undefined
  const located = Bun.spawnSync([cargo, 'locate-project', '--workspace', '--message-format', 'plain'], { cwd: dir, stderr: 'ignore' })
  return located.exitCode === 0 ? { cargo, root: dirname(located.stdout.toString().trim()) } : undefined
}

/** The source text of the span, which rustc counts in chars from 1. */
function spanText({ text, column_start, column_end, line_start, line_end }: Span): string {
  const line = [...(text[0]?.text ?? '')]
  return line.slice(column_start - 1, line_start === line_end ? column_end - 1 : undefined).join('')
}

/** The deprecated uses cargo reports for the package in `cwd`, or for every member of the
 * workspace with `all`. */
export function findRust({ cargo, root }: Workspace, cwd: string, all = false): Finding[] {
  const args = ['check', '--all-targets', '--message-format=json', '-q', ...(all ? ['--workspace'] : [])]
  const checked = Bun.spawnSync([cargo, ...args], { cwd, stdin: 'ignore' })
  const messages = checked.stdout.toString().split('\n').filter(Boolean).map(line => JSON.parse(line) as CargoMessage)
  // Compile errors still finish the build; no such message means cargo itself failed.
  if (!messages.some(m => m.reason === 'build-finished')) throw new Error(checked.stderr.toString().trim() || 'cargo check did not finish')

  // A file in both a lib and its test target is checked twice and warns twice. rustc reports
  // spans relative to the workspace root.
  const found = new Map<string, Finding>()
  for (const { message } of messages) {
    if (message?.code?.code !== 'deprecated') continue
    const span = message.spans.find(s => s.is_primary)
    if (!span) continue
    const finding = { file: resolve(root, span.file_name), line: span.line_start, column: span.column_start, name: spanText(span), message: message.message }
    found.set(`${finding.file}:${finding.line}:${finding.column}:${finding.message}`, finding)
  }
  return [...found.values()]
}

if (import.meta.main) {
  await runHook('rust-deprecated', input => {
    if (!isRustSource(input.file)) return
    const dir = dirname(input.file)
    const workspace = rustWorkspace(dir)
    if (workspace) report(findRust(workspace, dir), input)
  })
}
