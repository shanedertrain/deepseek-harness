/**
 * WSL reveal: show one Linux path in Windows Explorer.
 *
 * A Host running inside WSL serves a browser running on Windows, so a Linux
 * path the agent writes into its prose names nothing the browser can open —
 * and a browser will not navigate an http page to `file://` anyway. The
 * reveal route closes that gap on the only side that can: the Host converts
 * the path with `wslpath -w` and launches `explorer.exe` through WSL interop,
 * selecting a file or opening a directory.
 *
 * Off WSL there is no Explorer to reach, so the route answers 501 and the
 * browser leaves the link inert.
 */

import { spawn } from 'node:child_process'
import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { isAbsolute, join } from 'node:path'

/** Environment and process seams, replaceable in tests. */
export interface RevealInternals {
  /** The Host process environment (WSL_DISTRO_NAME, WSL_INTEROP). */
  readonly env: NodeJS.ProcessEnv
  /** The Host platform. */
  readonly platform: NodeJS.Platform
  /** Read the kernel version string (WSL kernels carry `microsoft`). */
  readonly kernelVersion: () => Promise<string>
  /** Whether `path` exists, and whether it is a directory. */
  readonly kind: (path: string) => Promise<'file' | 'directory' | undefined>
  /** Run one program with an argv array; resolves with its stdout, rejects on nonzero exit. */
  readonly run: (command: string, args: readonly string[]) => Promise<string>
  /** Start one program detached, never waiting on it. */
  readonly launch: (command: string, args: readonly string[]) => void
  /** The Host user's home directory, for `~/` paths. */
  readonly home: string
}

/** Outcome of one reveal request. */
export type RevealOutcome =
  | { readonly kind: 'revealed' }
  | { readonly kind: 'unsupported' }
  | { readonly kind: 'bad-path' }
  | { readonly kind: 'not-found' }
  | { readonly kind: 'failed'; readonly message: string }

/** Whether this Host runs inside WSL. */
export async function isWsl(internals: RevealInternals): Promise<boolean> {
  if (internals.platform !== 'linux') return false
  if (internals.env.WSL_DISTRO_NAME !== undefined && internals.env.WSL_DISTRO_NAME !== '') return true
  try {
    return /microsoft/i.test(await internals.kernelVersion())
  } catch {
    // Swallows an unreadable /proc/version: without it this is not provably WSL.
    return false
  }
}

/**
 * Normalize an authored path: `~/` expands against the Host home; anything
 * else must already be absolute POSIX.
 * @returns the absolute path, or undefined for a relative or empty one.
 */
export function absoluteRevealPath(path: string, home: string): string | undefined {
  const expanded = path === '~' ? home : path.startsWith('~/') ? join(home, path.slice(2)) : path
  if (expanded === '' || !isAbsolute(expanded)) return undefined
  return expanded
}

/**
 * Reveal one path in Explorer: a file is selected in its folder, a directory
 * is opened. `explorer.exe` exits 1 even on success, so the launch is
 * detached and its exit status never read.
 */
export async function revealInExplorer(path: string, internals: RevealInternals): Promise<RevealOutcome> {
  if (!(await isWsl(internals))) return { kind: 'unsupported' }
  const absolute = absoluteRevealPath(path, internals.home)
  if (absolute === undefined) return { kind: 'bad-path' }
  const kind = await internals.kind(absolute)
  if (kind === undefined) return { kind: 'not-found' }
  let windowsPath: string
  try {
    windowsPath = (await internals.run('wslpath', ['-w', absolute])).trim()
  } catch (error) {
    return { kind: 'failed', message: `wslpath failed: ${String(error)}` }
  }
  if (windowsPath === '') return { kind: 'failed', message: 'wslpath returned nothing' }
  try {
    internals.launch('explorer.exe', kind === 'file' ? [`/select,${windowsPath}`] : [windowsPath])
  } catch (error) {
    return { kind: 'failed', message: `explorer.exe failed: ${String(error)}` }
  }
  return { kind: 'revealed' }
}

/** The real process seams. */
export const defaultRevealInternals: RevealInternals = {
  env: process.env,
  platform: process.platform,
  kernelVersion: () => readFile('/proc/version', 'utf8'),
  kind: async (path) => {
    try {
      return (await stat(path)).isDirectory() ? 'directory' : 'file'
    } catch {
      // Swallows ENOENT/EACCES: both mean there is nothing to reveal.
      return undefined
    }
  },
  run: (command, args) => new Promise((resolve, reject) => {
    const child = spawn(command, [...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    child.stdout.setEncoding('utf8')
    child.stdout.on('data', (chunk: string) => { out += chunk })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) resolve(out)
      else reject(new Error(`${command} exited ${String(code)}`))
    })
  }),
  launch: (command, args) => {
    // Inherits the Host env on purpose: WSL interop needs WSL_INTEROP.
    const child = spawn(command, [...args], { detached: true, stdio: 'ignore' })
    child.on('error', () => {})
    child.unref()
  },
  home: homedir(),
}
