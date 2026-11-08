// PostToolUse guard for Edit|Write. `go build` and `go vet` accept deprecated APIs without a word;
// only gopls's `deprecated` analyzer knows them, and it reports them at hint severity, so old
// calls creep in. This asks the project's own gopls (`gopls check -severity=hint`, which has no
// machine-readable output, so the text is parsed) about the file Claude just wrote and reports the
// deprecations inside the new text, with the note that names the replacement. gopls runs the `go`
// it finds on PATH, so the directory of the `go` mise resolves for the file goes first: a
// project's mise.toml pin wins. One process per edit, no warm server: 0.1-1s on a warm module
// cache. Without gopls the hook is silent. A gopls that fails itself, or cannot load the module
// (it exits 0 and reports nothing, which would read as clean), exits 1, which Claude Code shows
// without blocking.
import { basename, delimiter, dirname, join, relative, resolve } from 'node:path'
import { type Finding, nearest, report, resolveTool, runHook } from './written.ts'

/** Whether a path is Go source worth checking: not a vendored dependency. */
export function isGoSource(file: string): boolean {
  return file.endsWith('.go') && !file.includes('/vendor/')
}

// A diagnostic starts at `path:line:col`, `col-col` or `line:col-line:col`; a long message
// continues on the lines after it, which never look like that.
const DIAGNOSTIC = /^(.+?):(\d+):(\d+)(?:-(?:\d+:)?\d+)?: (.*)$/
// Passing go.mod makes gopls report a module it cannot load. It also warns about harmless things
// (an unused require), so only these two mean no package was checked.
const BROKEN_MODULE = /^.*go\.mod:[\d:-]+ (?:packages\.Load error|syntax error).*$/m
const DEPRECATED = /^(.+?) is deprecated(?:: (?:Deprecated: )?(.*))?$/

interface Diagnostic {
  file: string
  line: number
  column: number
  message: string
}

function diagnostics(output: string): Diagnostic[] {
  const found: Diagnostic[] = []
  for (const text of output.split('\n')) {
    const start = DIAGNOSTIC.exec(text)
    if (start) found.push({ file: start[1]!, line: Number(start[2]), column: Number(start[3]), message: start[4] ?? '' })
    else if (text && found.length > 0) found[found.length - 1]!.message += ` ${text}`
  }
  return found
}

/** The deprecated uses in `files` (names relative to `dir`, inside one Go module), or undefined
 * without gopls. The files are named relative to cwd: gopls reports nothing for an absolute path
 * that reaches the file through a symlink (macOS's /var), which a relative one resolves. gopls
 * exits 0 on type and syntax errors, and without a go.mod; non-zero is its own failure. */
export function findGo(dir: string, files: string[]): Finding[] | undefined {
  const gopls = resolveTool('gopls', dir)
  if (!gopls) return undefined
  const go = resolveTool('go', dir)
  const path = go ? `${dirname(go)}${delimiter}${process.env.PATH ?? ''}` : process.env.PATH
  const root = nearest(dir, 'go.mod')
  const manifest = root ? [relative(dir, join(root, 'go.mod'))] : []
  const run = Bun.spawnSync([gopls, 'check', '-severity=hint', ...files, ...manifest], { cwd: dir, env: { ...process.env, PATH: path }, stdin: 'ignore' })
  const stdout = run.stdout.toString()
  const stderr = run.stderr.toString()
  if (run.exitCode !== 0) throw new Error(stderr.trim() || `gopls exited ${run.exitCode}`)
  const broken = BROKEN_MODULE.exec(stdout)?.[0] ?? (stderr.includes('initial workspace load failed') ? stderr.trim() : undefined)
  if (broken) throw new Error(`gopls could not load the module: ${broken}`)

  const found: Finding[] = []
  for (const { file, line, column, message } of diagnostics(stdout)) {
    const [, name = '', note] = DEPRECATED.exec(message) ?? []
    // gopls separates a build-tag suffix such as `[windows,amd64]` by two spaces.
    if (name) found.push({ file: resolve(dir, file), line, column, name, message: `${name} is deprecated${note ? `: ${note}` : '.'}`.replace(/ {2,}(?=\[)/, ' ') })
  }
  return found
}

if (import.meta.main) {
  await runHook('go-deprecated', input => {
    if (!isGoSource(input.file)) return
    const found = findGo(dirname(input.file), [basename(input.file)])
    if (found) report(found, input)
  })
}
