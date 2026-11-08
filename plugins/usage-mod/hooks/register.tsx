import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, SessionRateLimit } from 'claude-code'

import type { Ring } from '../types'

const snapshot = atom({ plugin: 'usage-mod', key: 'snapshot' } as const, null)

// The endpoint /usage reads: the week and the per-model weekly windows (Fable).
const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const FETCH_EVERY_MS = 60_000

type Window = { utilization?: number | null; resets_at?: string | null } | null | undefined
type ScopedLimit = {
  kind?: string
  percent?: number
  resets_at?: string | null
  scope?: { model?: { display_name?: string } }
}

const windowRing = (label: string, w: Window): Ring[] =>
  typeof w?.utilization === 'number' ? [{ label, percent: w.utilization, resetsAt: w.resets_at ?? undefined }] : []

async function fetchRings($: EngineInterface): Promise<Ring[] | null> {
  try {
    const auth = await $.session.authorize()
    if (!auth) return null
    const res = await $.http.fetch(USAGE_URL, {
      auth: auth.handle,
      headers: { 'anthropic-beta': 'oauth-2025-04-20' },
    })
    if (!res.ok) return null
    const body = JSON.parse(res.text)
    const scoped: ScopedLimit[] = Array.isArray(body.limits) ? body.limits : []
    return [
      ...windowRing('Week', body.seven_day),
      ...scoped.flatMap(l =>
        l?.kind === 'weekly_scoped' && typeof l.scope?.model?.display_name === 'string' && typeof l.percent === 'number'
          ? [{ label: l.scope.model.display_name, percent: l.percent, resetsAt: l.resets_at ?? undefined }]
          : [],
      ),
    ]
  } catch {
    return null
  }
}

// Without the endpoint (API key, offline, 429): the week window the last response's headers carried.
const headerRings = (rateLimits: SessionRateLimit[]): Ring[] =>
  rateLimits.flatMap(r => (r.kind === 'seven_day' ? [{ label: 'Week', percent: r.percentUsed, resetsAt: r.resetsAt }] : []))

// Where the session works: the folder's name (the app's "No folder" for its scratch space) and git branch.
async function whereAmI($: EngineInterface): Promise<{ folder: string; branch?: string }> {
  const cwd = await $.session.cwd()
  const folder = cwd.includes('/scratch-workspaces/') ? 'No folder' : (cwd.split('/').filter(Boolean).pop() ?? cwd)
  try {
    const git = await $.process.run(['git', 'branch', '--show-current'], { cwd, timeoutMs: 5_000 })
    return { folder, branch: (git.exitCode === 0 && git.stdout.trim()) || undefined }
  } catch {
    return { folder }
  }
}

let fetchedAt = -Infinity

async function refresh($: EngineInterface, minGapMs: number) {
  const now = await $.clock.now()
  const usage = await $.session.usage()
  const where = await whereAmI($)
  let rings = (await read($, snapshot))?.rings ?? []
  if (now - fetchedAt >= minGapMs) {
    fetchedAt = now
    const fetched = await fetchRings($)
    if (fetched) {
      rings = fetched
    } else {
      // Keep the last Fable ring rather than flicker it away on one failed fetch.
      const header = headerRings(usage.rateLimits)
      rings = [...header, ...rings.filter(r => !header.some(h => h.label === r.label))]
    }
  }
  await update($, snapshot, () => ({ rings, now, contextPercent: usage.context.percent, usd: usage.cost?.usd, ...where }))
}

// As in the menu bar: ink while there is room, color only once a limit needs attention. The app gives
// an Svg the band's text color, so currentColor follows the theme.
const tone = (p: number) => (p >= 90 ? '#E5484D' : p >= 75 ? '#E0A030' : 'currentColor')
const themeTone = (p: number) => (p >= 90 ? 'error' : p >= 75 ? 'warning' : 'claude')

const ICON = 14

function ringSvg(percent: number): string {
  const p = Math.min(Math.max(percent, 0), 100)
  const arc = p > 0 ? `<circle cx="7" cy="7" r="5.5" pathLength="100" stroke-dasharray="${p} 100" stroke-linecap="round" transform="rotate(-90 7 7)"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" fill="none" stroke="${tone(p)}" stroke-width="2"><circle cx="7" cy="7" r="5.5" stroke-opacity="0.2"/>${arc}</svg>`
}

const PIE = ['○', '◔', '◑', '◕', '●']

// What the one line holds, widest first: the branch and Fable's countdown go first, then the Week
// countdown; the rings, folder, context and cost always stay (past that the right end truncates).
// `resets` is how many rings, from the left (Week, Fable), keep their countdown.
type Show = { resets: number; branch: boolean }
const LEVELS: Show[] = [
  { resets: Infinity, branch: true },
  { resets: 1, branch: false },
  { resets: 0, branch: false },
]

function untilReset(resetsAt: string | undefined, now: number): string {
  const ms = resetsAt ? Date.parse(resetsAt) - now : NaN
  if (!(ms > 0)) return ''
  const m = Math.ceil(ms / 60_000)
  const h = Math.floor(m / 60)
  const d = Math.floor(h / 24)
  return d > 0 ? `${d}d ${h % 24}h` : h > 0 ? `${h}h ${m % 60}m` : `${m}m`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    $.clock.after(1, () => void refresh($, 0))
    // Every minute keeps the countdowns honest and the rings fresh.
    $.clock.every(FETCH_EVERY_MS, () => void refresh($, FETCH_EVERY_MS))
    return result
  })

  // After each turn, so the rings move as you work.
  on('session.measure', async ($, e, next) => {
    const result = await next(e)
    await refresh($, FETCH_EVERY_MS)
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const snap = await read($, snapshot)
    if (e.props.hasSurvey || !snap?.rings.length) return next(e)

    // Right end: where the session works, how full the context window is, and what it has cost.
    const ctx = snap.contextPercent
    const infoColor = ctx !== undefined && ctx >= 80 ? 'warning' : undefined
    const contextPercent = ctx !== undefined ? `${Math.round(ctx)}%` : undefined
    const cost = snap.usd !== undefined ? `$${snap.usd.toFixed(2)}` : undefined
    const resetOf = (ring: Ring) => untilReset(ring.resetsAt, snap.now)
    const textOf = (s: Show) => ({
      env: snap.folder ? `${snap.folder}${s.branch && snap.branch ? ` ⎇ ${snap.branch}` : ''}` : '',
      info: [contextPercent && `context ${contextPercent}`, cost].filter(Boolean).join(' · '),
    })
    // Always one line: the widest level whose text fits the band's columns.
    const widthOf = (s: Show) => {
      const rings = snap.rings.map((r, i) => `◔ ${Math.round(r.percent)}% ${r.label}${i < s.resets && resetOf(r) ? ` · ${resetOf(r)}` : ''}`)
      const { env, info } = textOf(s)
      return [...rings, env, info].filter(Boolean).join('   ').length
    }
    const show = LEVELS.find(s => widthOf(s) <= e.props.bodyColumns) ?? LEVELS[LEVELS.length - 1]!
    const { env, info } = textOf(show)

    // Below whatever another mod draws beneath (plugin_mod's row), so that row stays on top.
    const beneath = await next(e)
    const stack = (row: RenderElement) => {
      if (beneath.type === 'engine') return row
      const { Box } = $.ui.resolve(e)
      return (
        <Box flexDirection="column" rowGap={e.surface === 'terminal' ? 0 : 'xs'}>
          {beneath}
          {row}
        </Box>
      )
    }

    if (e.surface === 'terminal') {
      const { Box, Text } = $.ui.resolve(e)
      return stack(
        <Box flexDirection="row" justifyContent="space-between" columnGap={3}>
          <Box flexDirection="row" flexShrink={0} columnGap={3}>
            {snap.rings.map((ring, i) => (
              <Box key={ring.label} flexShrink={0}>
                <Text wrap="truncate">
                  <Text color={themeTone(ring.percent)}>{PIE[Math.min(4, Math.round(ring.percent / 25))]}</Text>{' '}
                  <Text bold>{ring.label}</Text> {Math.round(ring.percent)}%
                  {i < show.resets && resetOf(ring) ? <Text dimColor> {resetOf(ring)}</Text> : null}
                </Text>
              </Box>
            ))}
          </Box>
          <Box key="info" flexDirection="row" flexShrink={1} minWidth={0} columnGap={2}>
            {env ? (
              <Text dimColor wrap="truncate-end">
                {env}
              </Text>
            ) : null}
            <Text dimColor={!infoColor} color={infoColor} wrap="truncate-end">
              {info}
            </Text>
          </Box>
        </Box>,
      )
    }

    const { Box, Text, Svg } = $.ui.resolve(e)
    // Separators sit a level below the labels (dimmed `inactive` is the band's faintest ink), so they
    // part the words without being read.
    const dot = (
      <Text dimColor color="inactive">
        {' · '}
      </Text>
    )
    return stack(
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" columnGap="lg">
        <Box flexDirection="row" flexGrow={0} flexShrink={0} alignItems="center" columnGap="lg">
          {snap.rings.map((ring, i) => {
            const reset = i < show.resets ? resetOf(ring) : ''
            return (
              <Box key={ring.label} flexDirection="row" flexShrink={0} alignItems="center" columnGap="xs">
                <Svg
                  source={ringSvg(ring.percent)}
                  alt={`${ring.label}: ${Math.round(ring.percent)}% used`}
                  width={ICON}
                  height={ICON}
                />
                <Text size="caption" tabular wrap="truncate">
                  <Text weight="medium">{Math.round(ring.percent)}%</Text>
                  <Text dimColor>
                    {' '}
                    {ring.label}
                    {reset ? dot : null}
                    {reset}
                  </Text>
                </Text>
              </Box>
            )
          })}
        </Box>
        <Box key="info" flexDirection="row" flexShrink={1} minWidth={0} justifyContent="flex-end" alignItems="center" columnGap="md">
          {env ? (
            <Text size="caption" dimColor wrap="truncate-end">
              {env}
            </Text>
          ) : null}
          {info ? (
            <Text size="caption" tabular dimColor wrap="truncate-end">
              {contextPercent ? 'context ' : null}
              {contextPercent ? (
                <Text color={infoColor} weight={infoColor ? 'medium' : undefined}>
                  {contextPercent}
                </Text>
              ) : null}
              {contextPercent && cost ? dot : null}
              {cost}
            </Text>
          ) : null}
        </Box>
      </Box>,
    )
  })
}
