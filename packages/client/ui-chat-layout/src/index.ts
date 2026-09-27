/** Host registration for the chat layout preferences (transcript width, timestamp gutter). */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-settings'
import { CHAT_LAYOUT_SETTINGS_NAMESPACE } from './chat-layout-contract.ts'
import { ChatLayoutSettingsSchema } from './chat-layout-settings.ts'

export {
  CHAT_LAYOUT_SETTINGS_NAMESPACE, FIXED_WIDTH_MAX, FIXED_WIDTH_MIN, TIMESTAMP_MODES, WIDTH_MODES,
  type ChatLayoutSettings, type TimestampMode, type WidthMode,
} from './chat-layout-contract.ts'

/** Register the durable chat layout section when a settings provider exists. */
export function apply(ctx: Context): void {
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.register(CHAT_LAYOUT_SETTINGS_NAMESPACE, ChatLayoutSettingsSchema)
  })
}
