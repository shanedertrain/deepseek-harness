/** Timestamp gutter entry beside one Chat Node. */

import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { InjectFace, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { TimestampMode } from '../chat-layout-contract.ts'
import { formatGutter, gutterTime } from './layout.ts'

/** Registration-side gutter face. */
export interface ChatGutterInjected {
  hooks: {
    /** Persisted timestamp mode bound as useTimestamps. */
    timestamps: SnapshotStore<TimestampMode>
  }
}

/** Full gutter entry props. */
export type ChatGutterProps = PropsRuntime<'conversation.chat.node.gutter'> & InjectFace<ChatGutterInjected>

/**
 * Render the Node's send time in the left gutter, or nothing.
 * @param props - composed gutter slot props.
 * @returns the gutter label, or null.
 */
export function ChatGutter({ node, processAnswer, useTimestamps }: ChatGutterProps) {
  const mode = useTimestamps(value => value)
  const time = gutterTime(node, processAnswer)
  if (mode === 'off' || time === undefined) return null
  const label = formatGutter(time, mode, Date.now())
  return (
    <time className="dsh-chat-gutter" dateTime={new Date(time).toISOString()} title={label.title}>
      {label.day === undefined ? null : <span className="dsh-chat-gutter-day">{label.day}</span>}
      <span>{label.clock}</span>
    </time>
  )
}
