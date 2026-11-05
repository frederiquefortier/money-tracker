import { describe, expect, it, vi } from 'vitest'
import { failureFor } from './result'

const failure = failureFor('test', {
  '23505': 'nameTaken',
  category_not_found: 'notFound',
})

describe('failureFor', () => {
  it('maps a SQLSTATE or a raised message to its id', () => {
    expect(failure('save', { code: '23505' })).toEqual({
      ok: false,
      error: 'nameTaken',
    })
    expect(
      failure('save', { code: 'P0001', message: 'category_not_found' }),
    ).toEqual({ ok: false, error: 'notFound' })
  })

  it('logs anything else by its code and returns failed', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(
      failure('save', { code: '42501', message: 'secret detail' }),
    ).toEqual({
      ok: false,
      error: 'failed',
    })
    expect(log).toHaveBeenCalledWith('[test] save:', '42501')
    log.mockRestore()
  })
})
