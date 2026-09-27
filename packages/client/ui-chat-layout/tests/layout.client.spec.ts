import { describe, expect, it } from 'vitest'
import type { ChatNode } from '@deepseek-ai/dsh-client-ui-chat/client'
import { FILL_WIDTH, formatGutter, gutterTime, widthPreference } from '../src/client/layout.ts'

const node = (kind: string, data: object) => ({ kind, data }) as unknown as ChatNode

describe('gutterTime', () => {
  it('times user and steering messages', () => {
    expect(gutterTime(node('user', { time: 1000 }), false)).toBe(1000)
    expect(gutterTime(node('steering', { time: 2000 }), false)).toBe(2000)
  })

  it('times only the first step of a reply, or a folded answer', () => {
    expect(gutterTime(node('assistant-step', { step: 1, time: 3000 }), false)).toBe(3000)
    expect(gutterTime(node('assistant-step', { step: 4, time: 4000 }), false)).toBeUndefined()
    expect(gutterTime(node('assistant-step', { step: 4, time: 4000 }), true)).toBe(4000)
  })

  it('leaves untimed kinds empty', () => {
    expect(gutterTime(node('turn-tail', { time: 5000 }), false)).toBeUndefined()
    expect(gutterTime(node('command', {}), false)).toBeUndefined()
  })
})

describe('formatGutter', () => {
  const at = (iso: string) => new Date(iso).getTime()

  it('shows only the clock on the same local day', () => {
    const label = formatGutter(at('2026-09-27T14:05:00'), '24h', at('2026-09-27T23:00:00'), 'en-US')
    expect(label).toMatchObject({ clock: '14:05' })
    expect(label.day).toBeUndefined()
  })

  it('uses a 12-hour clock on request', () => {
    expect(formatGutter(at('2026-09-27T14:05:00'), '12h', at('2026-09-27T15:00:00'), 'en-US').clock).toBe('2:05 PM')
  })

  it('adds the day for an earlier date, and the year for an earlier year', () => {
    expect(formatGutter(at('2026-09-26T09:30:00'), '24h', at('2026-09-27T09:00:00'), 'en-US').day).toBe('Sep 26')
    expect(formatGutter(at('2025-12-31T09:30:00'), '24h', at('2026-01-01T09:00:00'), 'en-US').day).toBe('Dec 31, 2025')
  })
})

describe('widthPreference', () => {
  it('maps each mode to the stored width', () => {
    expect(widthPreference({ widthMode: 'fixed', fixedWidth: 1400 })).toBe(1400)
    expect(widthPreference({ widthMode: 'fill', fixedWidth: 1400 })).toBe(FILL_WIDTH)
    expect(widthPreference({ widthMode: 'manual', fixedWidth: 1400 })).toBeUndefined()
  })
})
