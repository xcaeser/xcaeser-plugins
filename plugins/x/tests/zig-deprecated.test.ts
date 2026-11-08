import { afterAll, expect, test } from 'bun:test'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const HOOK = `${import.meta.dir}/../hooks/zig-deprecated.sh`
const FIXTURES = `${import.meta.dir}/fixtures`

// A fresh TMPDIR keeps the hook's index cache out of the user's real one.
const sandbox = mkdtempSync(join(tmpdir(), 'zig-deprecated-'))
afterAll(() => rmSync(sandbox, { recursive: true, force: true }))

let count = 0
const unique = (prefix: string) => `${prefix}${count++}`

// A stub `zig` that answers version and env in the real ZON shape from the `version` and `lib`
// files beside it and logs each subcommand, so the tests do not depend on the installed zig.
// `use` repoints it at another fixture std and version, like a toolchain replaced in place.
function stubZig(std: string, version: string) {
  const dir = join(sandbox, unique('zig'))
  const log = join(dir, 'calls.log')
  mkdirSync(dir)
  writeFileSync(
    join(dir, 'zig'),
    `#!/bin/sh
echo "$1" >> "${log}"
case $1 in
  version) cat "$0.version" ;;
  env) lib=$(cat "$0.lib"); printf '.{\\n    .zig_exe = "%s",\\n    .lib_dir = "%s",\\n    .std_dir = "%s/std",\\n    .version = "%s",\\n}\\n' "$0" "$lib" "$lib" "$(cat "$0.version")" ;;
esac
`,
  )
  chmodSync(join(dir, 'zig'), 0o755)
  const use = (std: string, version: string) => {
    writeFileSync(join(dir, 'zig.version'), `${version}\n`)
    writeFileSync(join(dir, 'zig.lib'), join(FIXTURES, std, 'lib'))
  }
  use(std, version)
  return { dir, bin: join(dir, 'zig'), lib: join(FIXTURES, std, 'lib'), use, calls: () => (existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n') : []) }
}

// A stub `mise` whose `which zig` prints what the project directory's .zig-bin says, like a mise.toml pin.
function stubMise() {
  const dir = join(sandbox, unique('mise'))
  mkdirSync(dir)
  writeFileSync(join(dir, 'mise'), '#!/bin/sh\n[ "$1 $2" = "which zig" ] && cat "$PWD/.zig-bin"\n')
  chmodSync(join(dir, 'mise'), 0o755)
  return dir
}

const defaultZig = stubZig('std-a', '0.99.0')

// A real .zig file on disk, as it is when PostToolUse fires.
function zigFile(source: string, name = `${unique('f')}.zig`, dir = sandbox) {
  const path = join(dir, name)
  writeFileSync(path, source)
  return path
}

// The PostToolUse input Claude Code sends for Edit (old_string, new_string) or Write (content).
function hook(toolInput: Record<string, string>, pathDirs = [defaultZig.dir]) {
  const input = JSON.stringify({ session_id: 's', cwd: sandbox, hook_event_name: 'PostToolUse', tool_input: toolInput })
  const run = Bun.spawnSync(['sh', HOOK], {
    stdin: new TextEncoder().encode(input),
    env: { ...process.env, PATH: [...pathDirs, '/usr/bin', '/bin'].join(':'), TMPDIR: sandbox },
  })
  return { exitCode: run.exitCode, reason: run.stderr.toString() }
}

const edit = (newString: string, file = zigFile(newString)) => hook({ file_path: file, new_string: newString })
const reported = (reason: string) => reason.split('\n').filter(line => line.startsWith('Deprecated in Zig'))

test('flags a deprecated std API on Edit and names the replacement', () => {
  const { exitCode, reason } = edit('var buf: [std.fs.max_path_bytes]u8 = undefined;')
  expect(exitCode).toBe(2)
  expect(reason).toContain('Deprecated in Zig 0.99.0: .max_path_bytes')
  expect(reason).toContain('std.Io.Dir.max_path_bytes')
})

test('flags a deprecated std API on Write', () => {
  const content = 'const std = @import("std");\nconst enc = std.fs.base64_encoder;\n'
  const { exitCode, reason } = hook({ file_path: zigFile(content), content })
  expect(exitCode).toBe(2)
  expect(reason).toContain('.base64_encoder')
})

test('reports each deprecated name once', () => {
  const { reason } = edit('std.fs.max_path_bytes + std.fs.max_path_bytes + std.fs.max_name_bytes')
  expect(reported(reason)).toHaveLength(2)
  expect(reported(reason).filter(line => line.includes(' .max_path_bytes '))).toHaveLength(1)
})

test('cites the std source by absolute path so it can be opened', () => {
  const { reason } = edit('std.fs.max_path_bytes')
  expect(reason).toContain(`(${defaultZig.lib}/std/fs.zig:1:`)
})

test('keeps the rest of a multi-line deprecation comment', () => {
  const { reason } = edit('std.mem.indexOf')
  expect(reason).toContain('Deprecated in favor of `find`, which takes a needle of any length and returns null when absent.')
})

test('passes the current API for the same declaration', () => {
  expect(edit('var buf: [std.Io.Dir.max_path_bytes]u8 = undefined;').exitCode).toBe(0)
})

test('passes a deprecated name that only appears in a comment', () => {
  expect(edit('const n = 1; // was std.fs.max_path_bytes').exitCode).toBe(0)
})

test('passes a file that is not .zig', () => {
  const text = 'std.fs.max_path_bytes'
  expect(edit(text, zigFile(text, 'notes.md')).exitCode).toBe(0)
})

test('passes a deprecated name the file declares itself', () => {
  const source = 'const base64_encoder = 1;\nconst x = cfg.base64_encoder;\n'
  expect(edit(source).exitCode).toBe(0)
})

test("passes the file's own enum tags", () => {
  const source = 'const Level = enum { Debug, Info };\nvar level: Level = .Debug;\n'
  expect(edit(source).exitCode).toBe(0)
})

test('passes a name std also declares without deprecating', () => {
  expect(edit('const last = list.pop();').exitCode).toBe(0)
})

test('still flags a fully qualified use when the file declares the same name', () => {
  const source = 'const builtin = @import("builtin");\nconst T = std.builtin.Type;\nconst os = builtin.os;\n'
  const { exitCode, reason } = edit(source)
  expect(exitCode).toBe(2)
  expect(reason).toContain('.builtin')
})

test('passes deprecated code an Edit carries along from old_string', () => {
  const file = zigFile('x')
  const oldString = 'const n = std.fs.max_path_bytes;'
  const kept = hook({ file_path: file, old_string: oldString, new_string: `${oldString}\nconst m = 2;` })
  expect(kept.exitCode).toBe(0)

  const added = hook({ file_path: file, old_string: oldString, new_string: `${oldString}\nconst m = std.fs.max_name_bytes;` })
  expect(added.exitCode).toBe(2)
  expect(reported(added.reason)).toHaveLength(1)
  expect(added.reason).toContain('.max_name_bytes')
})

test('passes when zig is not on PATH', () => {
  expect(hook({ file_path: zigFile('x'), new_string: 'std.fs.max_path_bytes' }, []).exitCode).toBe(0)
})

test('asks zig for its std once and caches even an empty index', () => {
  const zig = stubZig('std-clean', '0.1.0')
  expect(hook({ file_path: zigFile('x'), new_string: 'std.mem.find' }, [zig.dir]).exitCode).toBe(0)
  expect(hook({ file_path: zigFile('x'), new_string: 'std.mem.find' }, [zig.dir]).exitCode).toBe(0)
  expect(zig.calls().filter(call => call === 'env')).toHaveLength(1)
})

test('reindexes when the zig at the same path is replaced by another version', () => {
  const zig = stubZig('std-b', '1.0.0')
  const use = 'std.fs.legacy_open'
  expect(hook({ file_path: zigFile('x'), new_string: use }, [zig.dir]).exitCode).toBe(2)

  zig.use('std-a', '2.0.0')
  expect(hook({ file_path: zigFile('x'), new_string: use }, [zig.dir]).exitCode).toBe(0)
  const { exitCode, reason } = hook({ file_path: zigFile('x'), new_string: 'std.fs.max_path_bytes' }, [zig.dir])
  expect(exitCode).toBe(2)
  expect(reason).toContain('Deprecated in Zig 2.0.0')
})

test('passes a current field sharing a deprecated declaration name, and still flags the qualified use', () => {
  expect(edit('const p: std.Build.LazyPath = .{ .relative = "src" };').exitCode).toBe(0)
  const { exitCode, reason } = edit('const r = std.fs.path.relative(a, b);')
  expect(exitCode).toBe(2)
  expect(reason).toContain('.relative')
})

test('flags a deprecated field', () => {
  const { exitCode, reason } = edit('const p: std.Build.LazyPath = .{ .cwd_relative = "x" };')
  expect(exitCode).toBe(2)
  expect(reason).toContain('.cwd_relative')
  expect(reason).not.toContain('.relative')
})

test('flags a function documented as "This function is deprecated"', () => {
  const { exitCode, reason } = edit('std.mem.copyBackwards(u8, a, b);')
  expect(exitCode).toBe(2)
  expect(reason).toContain('.copyBackwards')
})

test('does not read other deprecation wording as a marker', () => {
  expect(edit('std.mem.currentApi();').exitCode).toBe(0)
})

test('flags a deprecated name the file only mentions in a comment', () => {
  const { exitCode, reason } = edit('const i = mem.indexOf(a, b); // indexOf is what we replace\n')
  expect(exitCode).toBe(2)
  expect(reason).toContain('.indexOf')
})

test("uses the zig that mise resolves for the edited file's directory over the one on PATH", () => {
  const pinned = stubZig('std-b', '1.0.0')
  const project = join(sandbox, unique('project'))
  mkdirSync(project)
  writeFileSync(join(project, '.zig-bin'), pinned.bin)
  const source = 'const a = std.fs.legacy_open;\nconst b = std.fs.max_path_bytes;\n'
  const file = zigFile(source, 'main.zig', project)
  const pathDirs = [stubMise(), defaultZig.dir]

  const { exitCode, reason } = hook({ file_path: file, content: source }, pathDirs)
  expect(exitCode).toBe(2)
  expect(reported(reason)).toHaveLength(1)
  expect(reason).toContain('Deprecated in Zig 1.0.0: .legacy_open')

  // Outside the pinned project mise has no zig, so the one on PATH is used.
  const fallback = hook({ file_path: zigFile(source), content: source }, pathDirs)
  expect(fallback.exitCode).toBe(2)
  expect(fallback.reason).toContain('Deprecated in Zig 0.99.0: .max_path_bytes')
})
