import { afterAll, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const GUARD = `${import.meta.dir}/../hooks/shared-checkout-guard.sh`

// The PreToolUse input Claude Code sends for a Bash call.
function guard(command: string, description = 'Run a command') {
  const input = JSON.stringify({
    session_id: 's',
    cwd: '/repo',
    hook_event_name: 'PreToolUse',
    tool_name: 'Bash',
    tool_input: { command, description },
  })
  const run = Bun.spawnSync(['sh', GUARD], { stdin: new TextEncoder().encode(input) })
  return { exitCode: run.exitCode, reason: run.stderr.toString() }
}

const blocks = [
  'git stash',
  'git stash pop',
  'git stash -u',
  'cd . && git stash',
  'git -C /a/b stash pop',
  'FOO=1 git reset --hard',
  'git reset --soft HEAD~1',
  'git reset HEAD f',
  'x=$(git reset)',
  'if git stash pop; then echo ok; fi',
  'git --no-pager reset',
  'git status\ngit stash',
  'ls | git stash',
  'echo `git reset`',
  '{ git stash; }',
  '! git reset --hard',
  'while git reset; do :; done',
  '/usr/bin/git reset --hard',
  'ls &&\tgit reset',
  'git -c core.pager=cat stash',
  'git --git-dir .git reset --hard',
  'git -P stash',
  'git -C "/a b" stash',
  'git -C "$HOME/my dir" add -A',
  'git add \\\n  -A',
  'git -C /very/long/path \\\n  stash',
  'git commit \\\n  -am "x"',
  'cd "$DIR" && git reset --hard && echo "done"',
  'git clean -fd',
  'git clean -fdx',
  'git checkout .',
  'git checkout -- .',
  'git restore .',
  'git restore --staged .',
  'git add -A',
  'git add .',
  'git add -u',
  'git add --all',
  'git add -A && git commit -m "x"',
  'git commit -am "x"',
  'git commit -a -m "x"',
]

const allows = [
  'git status --short',
  'git stash list',
  'git log --grep stash',
  'git log --all --oneline',
  'git diff --stat . && git status',
  'git commit -m "reset the timer"',
  'git add src/a.ts',
  'git add ./src/a.ts',
  'git add -p src/a.ts',
  'git commit -m "x" -- a.ts',
  'git commit --amend --no-edit',
  'git checkout main',
  'git checkout -b feat',
  'git checkout -- src/a.ts',
  'git restore src/a.ts',
  'git clean -n',
  'git clean -nd',
  "git commit -F - <<'EOF'\nRemove reset button\nEOF",
  "git commit -m \"$(cat <<'EOF'\nGuard against stash\nEOF\n)\" -- a.ts",
  "cat <<'X' | wc -l\nhi\nX",
]

test.each(blocks)('blocks %p with a reason', command => {
  const { exitCode, reason } = guard(command)
  expect(exitCode).toBe(2)
  expect(reason).toContain('other sessions share this checkout')
})

test.each(allows)('allows %p', command => {
  expect(guard(command).exitCode).toBe(0)
})

// A fake git records its argv, so a real shell tells what the command ran. The guard must block
// exactly the commands that ran a hazardous git.
const sandbox = mkdtempSync(join(tmpdir(), 'guard-oracle-'))
const fakeGit = join(sandbox, 'bin', 'git')
mkdirSync(join(sandbox, 'bin'))
writeFileSync(
  fakeGit,
  [
    '#!/bin/sh',
    // Each call is its argc, then its args, all NUL-terminated.
    `printf '%s\\0' "$#" "$@" >> "$GIT_LOG"`,
    // Succeeds 20 times so that "while git ..." loops end.
    `echo >> "$GIT_LOG.n"`,
    `[ "$(wc -l < "$GIT_LOG.n")" -le 20 ]`,
  ].join('\n'),
  { mode: 0o755 },
)
afterAll(() => rmSync(sandbox, { recursive: true, force: true }))

const takesValue = new Set(['-C', '-c', '--git-dir', '--work-tree'])

function loggedCalls(log: string): string[][] {
  if (!existsSync(log)) return []
  const fields = readFileSync(log, 'utf8').split('\0')
  fields.pop()
  const calls: string[][] = []
  for (let i = 0; i < fields.length; ) {
    const argc = Number(fields[i])
    calls.push(fields.slice(i + 1, i + 1 + argc))
    i += 1 + argc
  }
  return calls
}

const isWholeTree = (a: string) => ['.', './', ':/'].includes(a)
const hasCluster = (args: string[], letters: string) => args.some(a => new RegExp(`^-[A-Za-z]*[${letters}]`).test(a))

function isHazard(args: string[]) {
  let i = 0
  while (i < args.length && args[i].startsWith('-')) i += takesValue.has(args[i]) ? 2 : 1
  const [verb, ...rest] = args.slice(i)
  switch (verb) {
    case 'reset':
      return true
    case 'stash':
      return rest[0] !== 'list' && rest[0] !== 'show'
    case 'clean':
      return !rest.some(a => a === '--dry-run' || /^-[A-Za-z]*n/.test(a))
    case 'checkout':
    case 'restore':
      return rest.some(isWholeTree)
    case 'add':
      return rest.includes('--all') || rest.includes('--update') || hasCluster(rest, 'Au') || rest.some(isWholeTree)
    case 'commit':
      return rest.includes('--all') || hasCluster(rest, 'a') || rest.some(isWholeTree)
    default:
      return false
  }
}

// An absolute git path bypasses the fake git on PATH, so the oracle can't see it.
const viaPath = [...blocks, ...allows].filter(command => !command.includes('/usr/bin/git'))

test.each(viaPath)('guard agrees with what a shell runs for %p', command => {
  const cwd = mkdtempSync(join(sandbox, 'cwd-'))
  // Outside cwd, so that the command cannot touch its own log.
  const log = `${cwd}.log`
  const env = { PATH: `${join(sandbox, 'bin')}:${process.env.PATH}`, HOME: cwd, DIR: cwd, GIT_LOG: log }
  Bun.spawnSync(['sh', '-c', command], { cwd, env, stdin: 'ignore' })
  const ran = loggedCalls(log).some(isHazard)
  expect(guard(command).exitCode).toBe(ran ? 2 : 0)
})

test('reads only the command, not its description', () => {
  expect(guard('git status', 'Show status; git stash is off-limits here').exitCode).toBe(0)
})
