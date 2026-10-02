import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const helperUrl = new URL('../src/utils/taxPeriodDate.ts', import.meta.url).href
const fixtures = [
  ['formatTaxPeriodDate', '2025-12-31T17:00:00', '1/1/2026'],
  ['formatTaxPeriodDate', '2025-12-31T17:00:00Z', '1/1/2026'],
  ['formatTaxPeriodDate', '2026-01-01T00:00:00+07:00', '1/1/2026'],
  ['formatTaxPeriodDate', '2026-01-01', '1/1/2026'],
  ['formatTaxPeriodEndExclusive', '2026-12-31T17:00:00', '31/12/2026'],
  ['formatTaxPeriodEndExclusive', '2026-12-31T17:00:00Z', '31/12/2026'],
  ['formatTaxPeriodEndExclusive', '2027-01-01T00:00:00+07:00', '31/12/2026'],
  ['formatTaxPeriodEndExclusive', '2027-01-01', '31/12/2026'],
  ['formatTaxPeriodDate', '2027-01-30T17:00:00', '31/1/2027'],
  ['formatTaxPeriodDate', '2027-01-30T17:00:00Z', '31/1/2027'],
  ['formatTaxPeriodDate', '2027-01-31T00:00:00+07:00', '31/1/2027'],
  ['formatTaxPeriodEndExclusive', '2026-06-30T17:00:00', '30/6/2026'],
  ['formatTaxPeriodDate', '2026-06-30T17:00:00', '1/7/2026'],
  ['formatTaxPeriodEndExclusive', '2024-02-29T17:00:00', '29/2/2024'],
  ['formatTaxPeriodEndExclusive', '2024-03-01', '29/2/2024'],
  ['formatTaxPeriodDate', null, 'Chưa xác định'],
  ['formatTaxPeriodDate', 'invalid date', 'invalid date'],
  ['formatTaxPeriodEndExclusive', 'invalid date', 'invalid date']
]

for (const timezone of ['UTC', 'Asia/Bangkok', 'America/Los_Angeles']) {
  test(`TKN dates use Bangkok business dates when the browser timezone is ${timezone}`, () => {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e', `
      import assert from 'node:assert/strict'
      const helpers = await import(${JSON.stringify(helperUrl)})
      for (const [name, value, expected] of ${JSON.stringify(fixtures)}) {
        assert.equal(helpers[name](value), expected, name + ': ' + value)
      }
      assert.equal(helpers.formatTaxPeriodDate(), 'Chưa xác định')
    `], {
      env: { ...process.env, TZ: timezone },
      encoding: 'utf8'
    })
    assert.equal(result.status, 0, result.stderr || result.error?.message)
  })
}
