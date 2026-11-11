import { describe, expect, it } from 'vitest'
import { isCrossSiteWrite } from '#/lib/server/security-headers'

function request(method: string, site?: string) {
  return new Request('https://app.test/_serverFn/x', {
    method,
    headers: site ? { 'sec-fetch-site': site } : {},
  })
}

describe('isCrossSiteWrite', () => {
  it('refuses a write from another site or another subdomain', () => {
    expect(isCrossSiteWrite(request('POST', 'cross-site'))).toBe(true)
    expect(isCrossSiteWrite(request('POST', 'same-site'))).toBe(true)
    expect(isCrossSiteWrite(request('DELETE', 'cross-site'))).toBe(true)
  })

  it('lets same-origin writes and direct navigations through', () => {
    expect(isCrossSiteWrite(request('POST', 'same-origin'))).toBe(false)
    expect(isCrossSiteWrite(request('POST', 'none'))).toBe(false)
  })

  it('never blocks reads, whatever the site', () => {
    expect(isCrossSiteWrite(request('GET', 'cross-site'))).toBe(false)
    expect(isCrossSiteWrite(request('HEAD', 'cross-site'))).toBe(false)
  })
})
