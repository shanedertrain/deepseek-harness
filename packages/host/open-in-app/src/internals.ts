/** Test seams for host facts and process adapters; production keeps the empty defaults. */

import type { OpenInAppInternals } from './resolver.ts'
import type { RevealInternals } from './reveal.ts'

/** Injectable catalog facts used by source-level tests before plugin activation. */
export const internals: { catalog: OpenInAppInternals; reveal: Partial<RevealInternals> } = { catalog: {}, reveal: {} }
