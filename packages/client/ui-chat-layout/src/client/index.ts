/**
 * Chat layout plugin, browser half: a left timestamp gutter beside each
 * message (the `conversation.chat.node.gutter` list), and a transcript width
 * mode that drives the same stored width the conversation's drag handles use.
 * Both are General settings rows backed by the `ui-chat-layout` Host section.
 * @module @deepseek-ai/dsh-client-ui-chat-layout/client
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'
// Type-only: the ctx.settingsScope Context merge.
import type {} from '@deepseek-ai/dsh-client-ui-settings/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the SlotRegistry service merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ui-chat SlotMap merge (the gutter entry).
import type {} from '@deepseek-ai/dsh-client-ui-chat/client'
import { CHAT_LAYOUT_SETTINGS_NAMESPACE, type ChatLayoutSettings, type TimestampMode } from '../chat-layout-contract.ts'
import { ChatGutter, type ChatGutterInjected } from './ChatGutter.tsx'
import { ChatLayoutPolicy, GUTTER_ATTRIBUTE } from './policy.ts'
import { ChatWidthRow, TimestampsRow, type ChatLayoutRowInjected } from './SettingsRows.tsx'
import { en, zh, type ChatLayoutKey } from './locales.ts'
import './gutter.css'

export type { ChatGutterInjected, ChatGutterProps } from './ChatGutter.tsx'
export type { ChatLayoutRowInjected, ChatLayoutRowProps } from './SettingsRows.tsx'
export type { ChatLayoutKey } from './locales.ts'

/** Dictionary namespace owned by this plugin. */
const NS = 'chat-layout'

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** The chat width and timestamp settings rows' copy. */
    'chat-layout': ChatLayoutKey
  }
}

/** Required services: slots and locale for the rows and gutter, settings transport for the section. */
export const inject = ['slots', 'locale', 'remote', 'settingsScope']

/**
 * Client plugin body.
 * @param ctx - client root context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-chat-layout: dictionaries')
  const policy = new ChatLayoutPolicy(ctx.settingsScope.bind<ChatLayoutSettings>({ namespace: CHAT_LAYOUT_SETTINGS_NAMESPACE }))
  ctx.effect(() => () => { document.documentElement.removeAttribute(GUTTER_ATTRIBUTE) }, 'ui-chat-layout: gutter attribute')

  // The gutter reads only the timestamp mode, so a width change does not re-render every row.
  const timestamps = createSnapshotStore<TimestampMode>(policy.settings.getSnapshot().timestamps)
  ctx.effect(() => policy.settings.subscribe(() => {
    timestamps.set(policy.settings.getSnapshot().timestamps)
  }), 'ui-chat-layout: timestamp mirror')

  ctx.slots.inject('conversation.chat.node.gutter', () => ctx.slots.register({
    name: 'conversation.chat.node.gutter',
    id: 'timestamp',
    order: 0,
    locale: NS,
    inject: (): ChatGutterInjected => ({ hooks: { timestamps } }),
  }, ChatGutter))

  const rowFace = (): ChatLayoutRowInjected => ({
    hooks: { layout: policy.settings },
    setLayout: (field, value) => { policy.set(field, value) },
  })
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'chat-width',
    order: 13,
    locale: NS,
    inject: rowFace,
  }, ChatWidthRow))
  ctx.slots.inject('settings.general.item', () => ctx.slots.register({
    name: 'settings.general.item',
    id: 'chat-timestamps',
    order: 14,
    locale: NS,
    inject: rowFace,
  }, TimestampsRow))
}
