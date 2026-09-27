/** Chat layout preference contract: namespace, modes and bounds (schema-free, so the client bundle stays lean). */

/** Settings namespace owned by the chat layout plugin. */
export const CHAT_LAYOUT_SETTINGS_NAMESPACE = 'ui-chat-layout'

/**
 * How the transcript width is chosen: `manual` leaves the drag handles in
 * charge, `fixed` pins a px width, `fill` takes all the column allows.
 */
export const WIDTH_MODES = ['manual', 'fixed', 'fill'] as const

/** Transcript width mode. */
export type WidthMode = typeof WIDTH_MODES[number]

/** Timestamp gutter presentation: hidden, or a 24- / 12-hour clock. */
export const TIMESTAMP_MODES = ['off', '24h', '12h'] as const

/** Timestamp gutter mode. */
export type TimestampMode = typeof TIMESTAMP_MODES[number]

/** Smallest fixed width (px); matches the drag handles' floor. */
export const FIXED_WIDTH_MIN = 640

/** Largest fixed width (px); the column still clamps it to what fits. */
export const FIXED_WIDTH_MAX = 3840

/** Durable chat layout section shared by the Host schema and browser scope. */
export interface ChatLayoutSettings {
  widthMode: WidthMode
  /** Fixed transcript width in px, used when `widthMode` is `fixed`. */
  fixedWidth: number
  timestamps: TimestampMode
}
