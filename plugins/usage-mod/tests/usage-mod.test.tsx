import { expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { On, SessionRateLimit } from 'claude-code'

const NOW = Date.parse('2026-10-15T12:00:00Z')
const BAND = {
  component: 'AbovePrompt',
  props: { hasSurvey: false, isWorking: false, maxRows: 10, bodyColumns: 140, scroll: { offset: 0, bodyRows: 10 }, view: {} },
} as const
const USAGE = {
  seven_day: { utilization: 81, resets_at: '2026-10-18T16:00:00Z' },
  limits: [{ kind: 'weekly_scoped', scope: { model: { display_name: 'Fable' } }, percent: 95, resets_at: '2026-10-18T16:00:00Z' }],
}

// What the engine answers beneath the plugin.
function engine(on: On, fetch: { ok: boolean; text: string }, rateLimits: SessionRateLimit[] = [], contextPercent = 42) {
  mock.clock(on, { now: NOW })
  on('session.measure', (_$, e) => ({ changed: e.changed }))
  on('session.authorize', () => ({ value: { handle: 'h', kind: 'bearer' as const } }))
  on('http.fetch', () => ({ value: { status: fetch.ok ? 200 : 429, headers: {}, ...fetch } }))
  on('session.usage', () => ({ value: { startedAt: 0, context: { window: 200_000, percent: contextPercent }, rateLimits, cost: { usd: 1.84 } } }))
  on('session.cwd', () => ({ value: '/Users/me/code/nextdeal' }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'main\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }))
  on('ui.render', ($, e) => {
    const { Text } = $.ui.resolve(e)
    return <Text>engine band</Text>
  })
}

const measure = ($: Engine) =>
  $.session.measure({ context: { window: 200_000 }, rateLimits: [], changed: ['context'] })

const textOf = async (ui: { findAll: (q: { type: string; key: string }) => Promise<{ text: string }[]> }, key: string) =>
  (await ui.findAll({ type: 'Box', key }))[0]?.text

test('a ring each for week and Fable, with countdowns', async ($, on) => {
  engine(on, { ok: true, text: JSON.stringify(USAGE) })
  await measure($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ plugin: 'usage-mod', surface, ...BAND })
    expect(await textOf(ui, 'Week')).toContain('81%')
    expect(await textOf(ui, 'Week')).toContain('3d 4h')
    expect(await textOf(ui, 'Fable')).toContain('95%')
    expect(await textOf(ui, 'info')).toContain('nextdeal ⎇ main')
    expect(await textOf(ui, 'info')).toContain('context 42% · $1.84')
    if (surface === 'desktop') expect(await ui.findAll({ type: 'Svg' })).toHaveLength(2)
    await ui.unmount()
  }
})

test('falls back to the week header when the endpoint fails', async ($, on) => {
  engine(on, { ok: false, text: '' }, [
    { kind: 'five_hour', percentUsed: 12 },
    { kind: 'seven_day', percentUsed: 40 },
  ])
  await measure($)

  const ui = await $.ui.mount({ plugin: 'usage-mod', surface: 'desktop', ...BAND })
  expect(await ui.findAll({ type: 'Svg' })).toHaveLength(1)
  expect(await textOf(ui, 'Week')).toContain('40%')
})

test('a nearly full context colors its number, not the words and cost around it', async ($, on) => {
  engine(on, { ok: true, text: JSON.stringify(USAGE) }, [], 86)
  await measure($)

  const ui = await $.ui.mount({ plugin: 'usage-mod', surface: 'desktop', ...BAND })
  const warned = (await ui.findAll({ type: 'Text' })).filter(text => text.props.color === 'warning')
  expect(warned.map(text => text.text)).toEqual(['86%'])
  expect(await textOf(ui, 'info')).toContain('context 86% · $1.84')
})

test('leaves the band to the engine with no data yet', async ($, on) => {
  engine(on, { ok: true, text: '{}' })
  const ui = await $.ui.mount({ plugin: 'usage-mod', surface: 'desktop', ...BAND })
  expect(await ui.find({ text: 'engine band' })).toBeDefined()
})

test('as the band narrows, the branch and Fable countdown go first, then the Week countdown', async ($, on) => {
  engine(on, { ok: true, text: JSON.stringify(USAGE) })
  await measure($)

  for (const surface of ['terminal', 'desktop'] as const) {
    const at = (bodyColumns: number) => $.ui.mount({ plugin: 'usage-mod', surface, ...BAND, props: { ...BAND.props, bodyColumns } })

    const middle = await at(70)
    expect(await textOf(middle, 'Week')).toContain('3d 4h')
    expect(await textOf(middle, 'Fable')).not.toContain('3d 4h')
    expect(await textOf(middle, 'info')).not.toContain('⎇')
    await middle.unmount()

    const narrow = await at(40)
    expect(await textOf(narrow, 'Week')).not.toContain('3d 4h')
    expect(await textOf(narrow, 'info')).toContain('nextdeal')
    expect(await textOf(narrow, 'info')).toContain('context 42% · $1.84')
    await narrow.unmount()
  }
})
