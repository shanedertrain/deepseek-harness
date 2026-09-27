/** General Settings rows for the chat width mode and the timestamp gutter. */

import { useEffect, useState } from 'react'
import type { SnapshotStore } from '@deepseek-ai/dsh-client-store'
import { IconChevronDownOutline14, Menu } from '@deepseek-ai/dsh-client-ui-primitives'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import {
  FIXED_WIDTH_MAX, FIXED_WIDTH_MIN, TIMESTAMP_MODES, WIDTH_MODES,
  type ChatLayoutSettings, type TimestampMode, type WidthMode,
} from '../chat-layout-contract.ts'
import css from './SettingsRow.module.css'

/** Registration-side face shared by both rows. */
export interface ChatLayoutRowInjected {
  hooks: {
    /** Persisted chat layout section bound as useLayout. */
    layout: SnapshotStore<ChatLayoutSettings>
  }
  /** Persist one field of the section. */
  setLayout: <Field extends keyof ChatLayoutSettings>(field: Field, value: ChatLayoutSettings[Field]) => void
}

/** Full Settings-row props. */
export type ChatLayoutRowProps =
  PropsRuntime<'settings.general.item'>
  & PropsLocale<'chat-layout'>
  & InjectFace<ChatLayoutRowInjected>

/**
 * A selector pill opening a Menu of options.
 * @returns the anchored menu.
 */
function Selector<Id extends string>({ value, options, label, onSelect }: {
  value: Id
  options: readonly Id[]
  label: (id: Id) => string
  onSelect: (id: Id) => void
}) {
  const [open, setOpen] = useState(false)
  const selector = (
    <button
      type="button"
      className={css.selector}
      aria-haspopup="menu"
      aria-expanded={open}
      onClick={() => { setOpen(current => !current) }}
    >
      {label(value)}
      <IconChevronDownOutline14 className={css.chevron} />
    </button>
  )
  return (
    <Menu
      open={open}
      onClose={() => { setOpen(false) }}
      items={options.map(id => ({ id, label: label(id) }))}
      selectedId={value}
      onSelect={(id: string) => {
        setOpen(false)
        onSelect(id as Id)
      }}
      align="end"
      portal
      anchor={selector}
    />
  )
}

/**
 * Px input committing on blur or Enter; an out-of-range entry is clamped.
 * @returns the input.
 */
function WidthInput({ value, label, onCommit }: { value: number; label: string; onCommit: (px: number) => void }) {
  const [draft, setDraft] = useState(`${value}`)
  useEffect(() => { setDraft(`${value}`) }, [value])
  const commit = () => {
    const px = Math.round(Number(draft))
    if (!Number.isFinite(px)) {
      setDraft(`${value}`)
      return
    }
    const clamped = Math.min(Math.max(px, FIXED_WIDTH_MIN), FIXED_WIDTH_MAX)
    setDraft(`${clamped}`)
    onCommit(clamped)
  }
  return (
    <input
      className={css.width}
      type="number"
      inputMode="numeric"
      min={FIXED_WIDTH_MIN}
      max={FIXED_WIDTH_MAX}
      step={20}
      aria-label={label}
      title={label}
      value={draft}
      onChange={(event) => { setDraft(event.target.value) }}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === 'Enter') commit() }}
    />
  )
}

/**
 * Render the chat width row: mode selector, plus the px input in fixed mode.
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function ChatWidthRow({ useLayout, setLayout, t }: ChatLayoutRowProps) {
  const mode = useLayout(value => value.widthMode)
  const fixedWidth = useLayout(value => value.fixedWidth)
  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('width.title')}</div>
        <div className={css.desc}>{t('width.description')}</div>
      </div>
      <div className={css.controls}>
        {mode === 'fixed'
          ? <WidthInput value={fixedWidth} label={t('width.px')} onCommit={(px) => { setLayout('fixedWidth', px) }} />
          : null}
        <Selector<WidthMode>
          value={mode}
          options={WIDTH_MODES}
          label={id => t(`width.${id}`)}
          onSelect={(id) => { setLayout('widthMode', id) }}
        />
      </div>
    </div>
  )
}

/**
 * Render the timestamp gutter row.
 * @param props - composed Settings slot props.
 * @returns the preference row.
 */
export function TimestampsRow({ useLayout, setLayout, t }: ChatLayoutRowProps) {
  const mode = useLayout(value => value.timestamps)
  return (
    <div className={css.row}>
      <div className={css.rowText}>
        <div className={css.title}>{t('timestamps.title')}</div>
        <div className={css.desc}>{t('timestamps.description')}</div>
      </div>
      <Selector<TimestampMode>
        value={mode}
        options={TIMESTAMP_MODES}
        label={id => t(`timestamps.${id}`)}
        onSelect={(id) => { setLayout('timestamps', id) }}
      />
    </div>
  )
}
