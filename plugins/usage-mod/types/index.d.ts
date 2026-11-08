export type Ring = { label: string; percent: number; resetsAt?: string }
export type Snapshot = { rings: Ring[]; now: number; contextPercent?: number; usd?: number; folder?: string; branch?: string }

declare module 'claude-code' {
  interface PluginState {
    'usage_mod': { snapshot: Snapshot | null }
  }
}
