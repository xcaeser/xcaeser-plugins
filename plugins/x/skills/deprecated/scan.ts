// Finds every deprecated API use in a repo, with the finders the PostToolUse hooks run on single
// files (hooks/*-deprecated.ts): one TypeScript API per resolved TypeScript, one `cargo check` per
// Cargo workspace, one gopls run per Go module, the Zig hook per candidate line. Needs a git repo
// (its file list decides what is source). Prints findings as
// `path:line:column message`, then one summary line per language. Exits 0 unless it breaks itself;
// what a language could not check is in its summary line.
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { findGo, isGoSource } from '../../hooks/go-deprecated.ts'
import { findRust, isRustSource, rustWorkspace, type Workspace } from '../../hooks/rust-deprecated.ts'
import { findTs, isTsSource, resolveTypeScript } from '../../hooks/ts-deprecated.ts'
import { canonical, type Finding, nearest, resolveTool } from '../../hooks/written.ts'

const ZIG_HOOK = join(import.meta.dir, '../../hooks/zig-deprecated.sh')

/** Files checked together by one toolchain run. */
interface Project {
  files: string[]
  run: () => Finding[] | Promise<Finding[]>
}

interface Plan {
  projects: Project[]
  /** Why files could not be checked, with how many. */
  skipped: Map<string, number>
}

function skip(skipped: Map<string, number>, reason: string, count: number): void {
  skipped.set(reason, (skipped.get(reason) ?? 0) + count)
}

function required<T>(value: T | undefined, what: string): T {
  if (value === undefined) throw new Error(`${what} not installed`)
  return value
}

/** The tracked and unignored files under `root`, absolute, or undefined outside a git repo. */
function listFiles(root: string): string[] | undefined {
  const git = Bun.spawnSync(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], { cwd: root, stderr: 'ignore' })
  if (git.exitCode !== 0) return undefined
  return git.stdout.toString().split('\0').filter(name => name && existsSync(join(root, name))).map(name => join(root, name))
}

function planTs(files: string[]): Plan {
  const skipped = new Map<string, number>()
  const projects: Project[] = []
  for (const [entry, group] of Map.groupBy(files, file => resolveTypeScript(dirname(file)))) {
    if (entry) projects.push({ files: group, run: () => findTs(entry, group) })
    else for (const file of group) skip(skipped, withoutTypeScript7(dirname(file)), 1)
  }
  return { projects, skipped }
}

function withoutTypeScript7(dir: string): string {
  try {
    const { version } = JSON.parse(readFileSync(Bun.resolveSync('typescript/package.json', dir), 'utf8'))
    return `TypeScript ${version} is older than 7`
  } catch {
    return 'TypeScript not installed'
  }
}

function planRust(files: string[]): Plan {
  const skipped = new Map<string, number>()
  const located: { workspace: Workspace; files: string[] }[] = []
  for (const [manifestDir, group] of Map.groupBy(files, file => nearest(dirname(file), 'Cargo.toml'))) {
    const workspace = manifestDir && rustWorkspace(manifestDir)
    if (workspace) located.push({ workspace, files: group })
    else skip(skipped, manifestDir ? 'cargo not installed or Cargo.toml unusable' : 'outside any Cargo workspace', group.length)
  }
  // Members of one workspace are checked by a single `cargo check --workspace`.
  const projects = [...Map.groupBy(located, ({ workspace }) => workspace.root).values()].map(group => ({
    files: group.flatMap(member => member.files),
    run: () => findRust(group[0]!.workspace, group[0]!.workspace.root, true),
  }))
  return { projects, skipped }
}

function planGo(files: string[]): Plan {
  const skipped = new Map<string, number>()
  const projects: Project[] = []
  for (const [dir, group] of Map.groupBy(files, file => nearest(dirname(file), 'go.mod'))) {
    if (dir) projects.push({ files: group, run: () => required(findGo(dir, group.map(file => relative(dir, file))), 'gopls') })
    else skip(skipped, 'outside any Go module', group.length)
  }
  return { projects, skipped }
}

const ZIG_HIT = /^Deprecated in Zig (\S+): \.(\w+) \(.*?:\d+: (.*)\)$/

/** What the Zig hook flags in `content`, as if Claude had written it to `file`. */
function zigHook(file: string, content: string): { version: string; name: string; note: string }[] {
  const hook = Bun.spawnSync(['sh', ZIG_HOOK], { stdin: new TextEncoder().encode(JSON.stringify({ tool_input: { file_path: file, content } })) })
  if (hook.exitCode !== 2) return []
  return hook.stderr.toString().split('\n').flatMap(text => {
    const [, version = '', name = '', note = ''] = ZIG_HIT.exec(text) ?? []
    return name ? [{ version, name, note }] : []
  })
}

/** The hook names a member but not where: the `.name` lines are only candidates, and the hook,
 * the single judge, confirms each on its own. */
function zigFindings(file: string): Finding[] {
  const lines = readFileSync(file, 'utf8').split('\n')
  const found: Finding[] = []
  for (const { version, name, note } of zigHook(file, lines.join('\n'))) {
    const use = new RegExp(`\\.${name}(?!\\w)`)
    lines.forEach((text, index) => {
      const at = text.replace(/\/\/.*/, '').search(use)
      if (at >= 0 && zigHook(file, text).some(hit => hit.name === name)) {
        found.push({ file, line: index + 1, column: at + 2, name, message: `.${name} is deprecated in Zig ${version}: ${note}` })
      }
    })
  }
  return found
}

function planZig(files: string[]): Plan {
  return { projects: [{ files, run: () => (required(resolveTool('zig', dirname(files[0]!)), 'zig'), files.flatMap(zigFindings)) }], skipped: new Map() }
}

const LANGUAGES: { name: string; matches: (file: string) => boolean; plan: (files: string[]) => Plan }[] = [
  { name: 'typescript', matches: isTsSource, plan: planTs },
  { name: 'rust', matches: isRustSource, plan: planRust },
  { name: 'go', matches: isGoSource, plan: planGo },
  { name: 'zig', matches: file => file.endsWith('.zig'), plan: planZig },
]

const count = (n: number, noun: string) => `${n} ${noun}${n === 1 ? '' : 's'}`

const root = canonical(resolve(process.argv[2] ?? '.'))
const all = listFiles(root)
if (!all) {
  console.log('skipped: not a git repository')
  process.exit(0)
}
const findings: (Finding & { path: string })[] = []
const summaries: string[] = []

for (const { name, matches, plan } of LANGUAGES) {
  const files = all.filter(matches)
  if (files.length === 0) continue
  const start = performance.now()
  const { projects, skipped } = plan(files)
  const known = new Set(files.map(canonical))
  let checked = 0
  let hits = 0
  for (const project of projects) {
    try {
      for (const finding of await project.run()) {
        const file = canonical(finding.file)
        if (!known.has(file)) continue
        findings.push({ ...finding, path: relative(root, file) })
        hits++
      }
      checked++
    } catch (error) {
      skip(skipped, (error instanceof Error ? error.message : String(error)).split('\n')[0]!, project.files.length)
    }
  }
  const why = [...skipped].map(([reason, n]) => `${reason} (${count(n, 'file')})`).join('; ')
  const ms = `${Math.round(performance.now() - start)} ms`
  summaries.push(
    checked === 0
      ? `${name}: skipped: ${why}`
      : `${name}: ${count(files.length, 'file')}, ${count(checked, 'project')}, ${count(hits, 'finding')}, ${ms}${why ? `; skipped: ${why}` : ''}`,
  )
}

findings.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.column - b.column)
for (const { path, line, column, message } of findings) console.log(`${path}:${line}:${column} ${message}`)
console.log(summaries.length > 0 ? summaries.join('\n') : 'no TypeScript, Rust, Go or Zig files')
