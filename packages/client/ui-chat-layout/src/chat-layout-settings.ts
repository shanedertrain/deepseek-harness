/** Chat layout preferences stored in the Host user-settings document. */

import z from '@deepseek-ai/schemastery'
import {
  FIXED_WIDTH_MAX, FIXED_WIDTH_MIN, TIMESTAMP_MODES, WIDTH_MODES, type ChatLayoutSettings,
} from './chat-layout-contract.ts'

/** Durable schema; also the wire envelope the browser scope validates against. */
export const ChatLayoutSettingsSchema: z<ChatLayoutSettings> = z.object({
  widthMode: z.union([...WIDTH_MODES]).default('manual'),
  fixedWidth: z.number().step(1).min(FIXED_WIDTH_MIN).max(FIXED_WIDTH_MAX).default(1200),
  timestamps: z.union([...TIMESTAMP_MODES]).default('24h'),
})
