/** Host-backed chat layout policy: mirrors the settings section and applies the width preference. */

import { createSnapshotStore, type SnapshotStore } from '@deepseek-ai/dsh-client-store'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { ChatLayoutSettings } from '../chat-layout-contract.ts'
import { WIDTH_PREF_EVENT, WIDTH_PREF_KEY, widthPreference } from './layout.ts'

/** Defaults shown before the Host section arrives. */
const DEFAULTS: ChatLayoutSettings = { widthMode: 'manual', fixedWidth: 1200, timestamps: '24h' }

/**
 * Write (or clear) the stored transcript width and ask the open column to
 * republish it. localStorage is a durable-storage boundary that may throw.
 * @param width - px to store, or null to clear back to the adaptive default.
 */
function storeWidth(width: number | null): void {
  try {
    if (width === null) localStorage.removeItem(WIDTH_PREF_KEY)
    else localStorage.setItem(WIDTH_PREF_KEY, `${width}`)
  } catch {
    return
  }
  window.dispatchEvent(new Event(WIDTH_PREF_EVENT))
}

/** Live chat layout preference consumed by the gutter and the settings rows. */
export class ChatLayoutPolicy {
  /** Reactive current section; defaults until Host settings arrive. */
  readonly settings: SnapshotStore<ChatLayoutSettings> = createSnapshotStore(DEFAULTS)
  /** The section last applied to the page, or undefined before the Host's first. */
  private applied: ChatLayoutSettings | undefined

  /**
   * @param host - durable chat layout settings scope.
   */
  constructor(private readonly host: SettingsScope<ChatLayoutSettings>) {
    host.subscribe(() => { this.adopt() })
    this.adopt()
  }

  /**
   * Publish and persist one explicit user choice.
   * @param field - the section field.
   * @param value - its new value.
   */
  set<Field extends keyof ChatLayoutSettings>(field: Field, value: ChatLayoutSettings[Field]): void {
    const current = this.settings.getSnapshot()
    if (current[field] === value) return
    this.apply({ ...current, [field]: value })
    void this.host.set(field, value)
  }

  /** Adopt the latest accepted Host section without writing it back. */
  private adopt(): void {
    const section = this.host.getSnapshot().value
    if (section !== undefined) this.apply(section)
  }

  /**
   * Mirror a section and apply what changed. The first section only applies a
   * non-manual width, so opening the page never discards a dragged width;
   * switching back to manual clears to the adaptive default.
   */
  private apply(next: ChatLayoutSettings): void {
    const previous = this.applied
    this.applied = next
    this.settings.set(next)
    if (previous !== undefined
      && previous.widthMode === next.widthMode
      && previous.fixedWidth === next.fixedWidth) return
    const width = widthPreference(next)
    if (width !== undefined) storeWidth(width)
    else if (previous !== undefined && previous.widthMode !== 'manual') storeWidth(null)
  }
}
