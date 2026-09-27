/** Pure chat layout rules: which Nodes carry a gutter time, how it reads, and the width preference a mode writes. */

import type { ChatNode } from '@deepseek-ai/dsh-client-ui-chat/client'
import type { ChatLayoutSettings, TimestampMode } from '../chat-layout-contract.ts'

/** localStorage key ConversationRoot reads for the transcript width (px). */
export const WIDTH_PREF_KEY = 'dsh.conversation.contentWidth'

/** Window event that makes ConversationRoot republish the stored width. */
export const WIDTH_PREF_EVENT = 'dsh:conversation-content-width'

/** A width larger than any column: ConversationRoot clamps it to the widest the column allows. */
export const FILL_WIDTH = 100_000

/**
 * The stored width a mode asks for.
 * @param settings - the chat layout section.
 * @returns px to store, `null` to clear back to the adaptive default, or `undefined` to leave the drag handles' value alone.
 */
export function widthPreference(settings: Pick<ChatLayoutSettings, 'widthMode' | 'fixedWidth'>): number | null | undefined {
  switch (settings.widthMode) {
    case 'fixed': return settings.fixedWidth
    case 'fill': return FILL_WIDTH
    case 'manual': return undefined
  }
}

/**
 * The time shown in a Node's gutter: user and steering messages, and the
 * start of each reply (its first step, or the visible answer of a folded
 * Turn process). Other Nodes carry no gutter time.
 * @param node - the routed Chat Node.
 * @param processAnswer - whether the Node is a folded Turn process's answer.
 * @returns Unix epoch ms, or undefined for no gutter entry.
 */
export function gutterTime(node: ChatNode, processAnswer: boolean): number | undefined {
  switch (node.kind) {
    case 'user':
    case 'steering':
      return (node as ChatNode<'user' | 'steering'>).data.time
    case 'assistant-step': {
      const data = (node as ChatNode<'assistant-step'>).data
      return data.step === 1 || processAnswer ? data.time : undefined
    }
    default:
      return undefined
  }
}

/** One rendered gutter label. */
export interface GutterLabel {
  /** Short date, present only when the time is not on `now`'s calendar day. */
  day?: string
  clock: string
  /** Full date and time for the hover title. */
  title: string
}

/**
 * Format a gutter time.
 * @param time - Unix epoch ms.
 * @param mode - 24- or 12-hour clock.
 * @param now - reference instant for the "same day" test.
 * @param locale - BCP 47 locale for the labels.
 * @returns the label parts.
 */
export function formatGutter(time: number, mode: Exclude<TimestampMode, 'off'>, now: number, locale?: string): GutterLabel {
  const date = new Date(time)
  const clock = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit', hour12: mode === '12h' }).format(date)
  const title = new Intl.DateTimeFormat(locale, { dateStyle: 'full', timeStyle: 'medium', hour12: mode === '12h' }).format(date)
  const today = new Date(now)
  const sameDay = date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate()
  if (sameDay) return { clock, title }
  const day = new Intl.DateTimeFormat(locale, {
    month: 'short', day: 'numeric', ...(date.getFullYear() === today.getFullYear() ? {} : { year: 'numeric' }),
  }).format(date)
  return { day, clock, title }
}
