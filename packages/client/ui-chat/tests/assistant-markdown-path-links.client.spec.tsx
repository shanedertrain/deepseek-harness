// @vitest-environment jsdom
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AssistantMarkdown, inlineCodePathTarget, localPathTarget } from '../src/client/chat/AssistantMarkdown.tsx'
import type { ChatNodeOwnerProps, ChatViewSlotProps } from '../src/client/contract/slots.ts'
import type { AssistantBlock } from '../src/client/contract/snapshot.ts'

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const t = ((_key: string) => 'label') as unknown as ChatViewSlotProps['t']
const renderMessageImages = (() => null) as unknown as ChatNodeOwnerProps['renderMessageImages']

function textBlock(text: string): AssistantBlock {
  return { kind: 'text', text }
}

describe('localPathTarget', () => {
  it('names absolute, home-relative, and file:// paths', () => {
    expect(localPathTarget('/home/u/repo/a.py')).toBe('/home/u/repo/a.py')
    expect(localPathTarget('~/repo/a.py')).toBe('~/repo/a.py')
    expect(localPathTarget('file:///home/u/my%20dir/a.py')).toBe('/home/u/my dir/a.py')
    expect(localPathTarget('file://localhost/tmp/x')).toBe('/tmp/x')
  })

  it('drops line/column and #L location suffixes', () => {
    expect(localPathTarget('/home/u/a.py:42')).toBe('/home/u/a.py')
    expect(localPathTarget('/home/u/a.py:42:7')).toBe('/home/u/a.py')
    expect(localPathTarget('/home/u/a.py#L10-L20')).toBe('/home/u/a.py')
  })

  it('leaves everything else inert', () => {
    expect(localPathTarget('https://example.com/a')).toBeUndefined()
    expect(localPathTarget('relative/a.py')).toBeUndefined()
    expect(localPathTarget('//server/share')).toBeUndefined()
    expect(localPathTarget('/usr/bin/foo --flag')).toBeUndefined()
    expect(localPathTarget('file://otherhost/tmp/x')).toBeUndefined()
    expect(localPathTarget('file:///bad%zz')).toBeUndefined()
    expect(localPathTarget('/')).toBeUndefined()
  })
})

describe('inlineCodePathTarget', () => {
  it('accepts filesystem-rooted, home-relative, and file:// tokens', () => {
    expect(inlineCodePathTarget('/home/u/a.py:3')).toBe('/home/u/a.py')
    expect(inlineCodePathTarget('/mnt/c/Users/u/x.txt')).toBe('/mnt/c/Users/u/x.txt')
    expect(inlineCodePathTarget('~/repo')).toBe('~/repo')
    expect(inlineCodePathTarget('file:///srv/x')).toBe('/srv/x')
  })

  it('leaves slash commands and HTTP routes inert', () => {
    expect(inlineCodePathTarget('/goal')).toBeUndefined()
    expect(inlineCodePathTarget('/compact')).toBeUndefined()
    expect(inlineCodePathTarget('/v1/models')).toBeUndefined()
    expect(inlineCodePathTarget('/open-in-app/reveal')).toBeUndefined()
  })
})

describe('AssistantMarkdown local-path links', () => {
  function renderText(text: string): HTMLElement {
    return render(
      <AssistantMarkdown blocks={[textBlock(text)]} streaming={false} renderMessageImages={renderMessageImages} t={t} />,
    ).container
  }

  it('turns a path link and a path code token into reveal buttons that POST the path', async () => {
    const fetchMock = vi.fn((_input: string, _init?: RequestInit) => Promise.resolve(new Response('{"ok":true}')))
    vi.stubGlobal('fetch', fetchMock)
    const container = renderText('Wrote [the report](/home/u/out/report.md) and `/home/u/out/data.csv:3`.')
    const buttons = [...container.querySelectorAll('button')]
    expect(buttons.map(button => button.textContent)).toEqual(['the report', '/home/u/out/data.csv:3'])
    expect(container.querySelector('a')).toBeNull()
    for (const button of buttons) fireEvent.click(button)
    await Promise.resolve()
    expect(fetchMock.mock.calls.map(([url, init]) => [new URL(url).pathname, init?.body])).toEqual([
      ['/open-in-app/reveal', JSON.stringify({ path: '/home/u/out/report.md' })],
      ['/open-in-app/reveal', JSON.stringify({ path: '/home/u/out/data.csv' })],
    ])
  })

  it('keeps web links as anchors and ordinary code inert', () => {
    const container = renderText('See [docs](https://example.com/d) and run `make test` or `/goal`.')
    expect(container.querySelector('a')?.getAttribute('href')).toBe('https://example.com/d')
    expect(container.querySelector('button')).toBeNull()
  })
})
