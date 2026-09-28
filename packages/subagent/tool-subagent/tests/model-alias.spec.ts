import { describe, expect, it } from 'vitest'
import { assertAllowedModelSelection, normalizeDelegationModelRequest } from '../src/model-selection.ts'

const policy = {
  routes: [
    { provider: 'qwen-8458', model: 'qwen3.8-flash-next' },
    { provider: 'qwen-8fe0', model: 'qwen3.8-flash-next' },
    { provider: 'multi', model: 'a' },
    { provider: 'multi', model: 'b' },
  ],
}

describe('route alias written as model', () => {
  it('rewrites a provider id used as the model to that provider\'s only route', () => {
    expect(normalizeDelegationModelRequest(policy, { provider: 'qwen-8458', model: 'qwen-8458' }))
      .toEqual({ provider: 'qwen-8458', model: 'qwen3.8-flash-next' })
    expect(normalizeDelegationModelRequest(policy, { provider: 'qwen-8458', model: 'qwen-8fe0' }))
      .toEqual({ provider: 'qwen-8fe0', model: 'qwen3.8-flash-next' })
    expect(normalizeDelegationModelRequest(policy, { model: 'qwen-8458', reasoning_effort: 'low' }))
      .toEqual({ provider: 'qwen-8458', model: 'qwen3.8-flash-next', reasoning_effort: 'low' })
  })

  it('leaves exact, ambiguous, unknown and policy-less requests unchanged', () => {
    const exact = { provider: 'qwen-8458', model: 'qwen3.8-flash-next' }
    expect(normalizeDelegationModelRequest(policy, exact)).toBe(exact)
    const ambiguous = { provider: 'qwen-8458', model: 'multi' }
    expect(normalizeDelegationModelRequest(policy, ambiguous)).toBe(ambiguous)
    const wrongProvider = { provider: 'local-dgx', model: 'qwen3.8-flash-next' }
    expect(normalizeDelegationModelRequest(policy, wrongProvider)).toBe(wrongProvider)
    const any = { provider: 'x', model: 'qwen-8458' }
    expect(normalizeDelegationModelRequest(undefined, any)).toBe(any)
  })

  it('lists the allowed routes when it still refuses', () => {
    const req = { provider: 'local-dgx', model: 'qwen3.8-flash-next' }
    expect(() => assertAllowedModelSelection(policy, {}, req, req))
      .toThrow('Allowed: provider "qwen-8458" + model "qwen3.8-flash-next"')
  })
})
