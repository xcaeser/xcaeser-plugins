// PostToolUse guard for Edit|Write. `tsc` accepts deprecated APIs without a word: they only show
// as strikethroughs in an editor, so old calls creep in. This asks the project's own TypeScript 7
// (the native compiler, through its async API) for the deprecation suggestions of the file Claude
// just wrote and reports the ones inside the new text, with the @deprecated note that names the
// replacement. One process per edit, no warm server: a cold run costs 70-300ms. Projects on
// TypeScript < 7 (no `unstable/async`) are skipped silently. Any failure of the
// compiler itself exits 1, which Claude Code shows without blocking.
import { dirname } from 'node:path'
import { type Finding, report, runHook } from './written.ts'

const TS_SOURCE = /\.(?:ts|tsx|mts|cts)$/
const DECLARATION = /\.d\.[cm]?ts$/

/** Whether a path is TypeScript source worth checking: not a declaration file, not a dependency. */
export function isTsSource(file: string): boolean {
  return TS_SOURCE.test(file) && !DECLARATION.test(file) && !file.includes('/node_modules/')
}

// With `bun --no-install` (how hooks.json runs this) a typescript missing from node_modules is
// not resolved at all; TypeScript < 7 has no `unstable/async` export and fails the same way.
export function resolveTypeScript(from: string): string | undefined {
  try {
    return Bun.resolveSync('typescript/unstable/async', from)
  } catch {
    return undefined
  }
}

// Offsets are UTF-16 code units, like JavaScript string indexes.
function lineAndColumn(source: string, offset: number): { line: number; column: number } {
  const before = source.slice(0, offset)
  return { line: before.split('\n').length, column: offset - before.lastIndexOf('\n') }
}

/** The deprecated uses in `files`, which all resolve the TypeScript at `entry`. */
export async function findTs(entry: string, files: string[]): Promise<Finding[]> {
  const first = files[0]
  if (!first) return []
  const { API, SymbolFlags } = (await import(entry)) as typeof import('typescript/unstable/async')
  const api = new API({ cwd: dirname(first) })
  const found: Finding[] = []
  try {
    // Opening the files loads the tsconfigs that list them, found through the `references` of a
    // solution-style tsconfig.json too; files outside every tsconfig get an inferred project.
    const snapshot = await api.updateSnapshot({ openFiles: files })
    for (const file of files) {
      const project = await snapshot.getDefaultProjectForFile(file)
      if (!project) continue
      const source = await Bun.file(file).text()
      for (const d of await project.program.getSuggestionDiagnostics(file)) {
        if (!d.reportsDeprecated) continue
        const name = source.slice(d.pos, d.end)
        // The symbol carries the @deprecated tag for both the 6385 and the 6387 (signature) codes.
        // The name stands in for d.text, which for 6387 spells out the whole signature. A named
        // import is an alias, whose tags are the target's.
        let symbol = await project.checker.getSymbolAtPosition(file, d.pos)
        if (symbol && symbol.flags & SymbolFlags.Alias) symbol = await project.checker.getAliasedSymbol(symbol)
        const tags = symbol ? await project.checker.getJsDocTagsOfSymbol(symbol) : []
        // Overloads each have their own tag: with several, which one applies is unknown.
        const deprecated = tags.filter(tag => tag.name === 'deprecated')
        const note = deprecated.length === 1 ? deprecated[0]?.text?.replace(/\{@link(?:code|plain)?\s+([^}|\s]+)[^}]*\}/g, '$1') : undefined
        found.push({ file, ...lineAndColumn(source, d.pos), name, message: `'${name}' is deprecated.${note ? ` ${note}` : ''}` })
      }
    }
  } finally {
    await api.close()
  }
  return found
}

if (import.meta.main) {
  await runHook('ts-deprecated', async input => {
    if (!isTsSource(input.file)) return
    const entry = resolveTypeScript(dirname(input.file))
    if (entry) report(await findTs(entry, [input.file]), input)
  })
}
