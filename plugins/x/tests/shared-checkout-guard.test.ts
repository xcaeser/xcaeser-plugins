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
  'git stash -u',
  'cd . && git stash push -m x',
  'git stash list && git stash pop',
  'git -C /a/b stash pop',
  'git -C "/a b" stash',
  'git -c core.pager=cat stash',
  'git --no-pager reset',
  'ls | git stash',
  'ls\ngit stash pop',
  'FOO=1 git reset --hard',
  'git -C . reset HEAD f',
  'echo "$(git reset --soft HEAD)"',
  'echo `git reset`',
  'if true; then git stash; fi',
  'for f in a; do git reset "$f"; done',
  '{ git stash; }',
  '! git reset --hard',
  'cd "$DIR" && git reset --hard && echo "done"',
  'echo "$HOME" ; git stash ; echo "x"',
  `echo "it's $HOME"; git reset --hard; echo 'x'`,
  `# don't touch\ngit stash\necho 'ok'`,
  `cat <<EOF\nit's done\nEOF\ngit reset --hard\necho 'ok'`,
  'echo "a\\"b"; git reset --hard; echo "c"',
  'git stash list; git stash pop',
  'git stash show;git stash drop',
  'git stash list\ngit stash pop',
  'if git stash pop; then echo ok; fi',
  'while git reset; do :; done',
  'time git reset --hard',
  'git --git-dir .git reset --hard',
  'git --work-tree x stash',
  'git -P stash',
  'git -C "$HOME/my dir" stash',
  '/usr/bin/git reset --hard',
  'ls &&\tgit reset',
  'echo "$(git stash)"',
  'x=$(git reset)',
  `git commit -m "$(printf 'a\\nb')" && git stash`,
]

const allows = [
  'git status --short',
  'git stash list',
  'git stash list -p',
  'git -C . stash show -p',
  'git log --grep stash',
  'git stash-helper',
  'git commit -m "reset the timer"',
  'git commit -m "fix; git reset bug"',
  'git commit -m "Guard against (git stash) misuse"',
  'git commit -m "Title\n\ngit stash is blocked"',
  "printf 'a\\ngit reset'",
  'grep -rn "| git stash" README.md',
  "git commit -m \"$(cat <<'EOF'\nRemove reset button\nEOF\n)\"",
  "cat <<'X' | wc -l\nhi\nX",
  'git commit -m "$msg; git reset"',
  'git --no-pager log --grep stash',
  'git commit -F - <<EOF\nGuard\ngit reset is now blocked\nEOF',
  "echo 'git stash'",
  '# git reset\nls',
]

test.each(blocks)('blocks %p with a reason', command => {
  const { exitCode, reason } = guard(command)
  expect(exitCode).toBe(2)
  expect(reason).toContain('other sessions share this checkout')
})

test.each(allows)('allows %p', command => {
  expect(guard(command).exitCode).toBe(0)
})

// A quote the lexer cannot close must not hide a git call.
test('blocks an unterminated quote', () => {
  expect(guard('echo "git stash').exitCode).toBe(2)
  expect(guard("echo 'x; git reset").exitCode).toBe(2)
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

const takesValue = new Set(['-C', '-c', '--git-dir', '--work-tree', '--namespace'])

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

function isHazard(args: string[]) {
  let i = 0
  while (i < args.length && args[i].startsWith('-')) i += takesValue.has(args[i]) ? 2 : 1
  const [verb, sub] = args.slice(i)
  return verb === 'reset' || (verb === 'stash' && sub !== 'list' && sub !== 'show')
}

test.each([...blocks, ...allows].filter(command => !command.includes('/usr/bin/git')))(
  'guard agrees with what a shell runs for %p',
  command => {
    const cwd = mkdtempSync(join(sandbox, 'cwd-'))
    const log = join(cwd, 'git.log')
    const env = { PATH: `${join(sandbox, 'bin')}:${process.env.PATH}`, HOME: cwd, DIR: cwd, GIT_LOG: log }
    Bun.spawnSync(['sh', '-c', command], { cwd, env, stdin: 'ignore' })
    const ran = loggedCalls(log).some(isHazard)
    expect(guard(command).exitCode).toBe(ran ? 2 : 0)
  },
)

test('reads only the command, not its description', () => {
  expect(guard('git status', 'Show status; git stash is off-limits here').exitCode).toBe(0)
})
