import test from 'node:test'
import assert from 'node:assert/strict'
import { confirmAndDownloadQtt, QttReviewRequired, sameTaxFigures } from '../src/pages/businessOwner/taxBook/qttWorkflow.ts'
import { allocationError, allocationRequest, allocationFromDeclaration, emptyAllocation } from '../src/pages/businessOwner/taxBook/qttAllocation.ts'

const indicators = { indicator09: 1200000000, indicator10: 1000000000, indicator19: 0, indicator20: 3000000, indicator21: 0, indicator22: 0, indicator23: 0, indicator24: 3000000 }
const draft = { declarationId: 'd1', draftRevision: 1, status: 'Draft', indicators, offsetItems: [], refundAccount: null }
function scenario(options = {}) {
  const calls = []
  const revisions = []
  let saved = options.saved ?? null
  let published = null
  const w = {
    shown: indicators, previous: options.previous ?? null,
    getDeclaration: async () => { calls.push('get'); return saved },
    checkReady: async () => { calls.push('ready'); return true },
    calculate: async () => { calls.push('calculate'); return { indicators } },
    create: async () => { calls.push('create'); saved = { ...draft }; return saved },
    validate: () => {},
    saveAllocation: async d => { calls.push('allocate'); saved = { ...d, draftRevision: d.draftRevision + 1 }; return saved },
    confirm: async d => { calls.push('confirm'); revisions.push(d.draftRevision); saved = { ...d, status: 'Generated' }; return saved },
    download: async () => { calls.push('download') },
    onDeclaration: d => { published = d }, onCalculation: () => {}, onStep: () => {},
    ...options.overrides
  }
  return { w, calls, revisions, published: () => published }
}

test('new draft: calculate, create, allocate, confirm latest revision, download', async () => {
  const s = scenario()
  await confirmAndDownloadQtt(s.w)
  assert.deepEqual(s.calls, ['get', 'ready', 'calculate', 'create', 'allocate', 'confirm', 'download'])
  assert.deepEqual(s.revisions, [2])
  assert.equal(s.published().status, 'Generated')
})
test('existing draft skips calculate and create', async () => {
  const s = scenario({ saved: draft, previous: draft })
  await confirmAndDownloadQtt(s.w)
  assert.deepEqual(s.calls, ['get', 'ready', 'allocate', 'confirm', 'download'])
})
test('download failure preserves locked snapshot; retry does not mutate', async () => {
  const s = scenario({ overrides: { download: async () => { throw new Error('offline') } } })
  await assert.rejects(confirmAndDownloadQtt(s.w), /offline/)
  assert.equal(s.published().status, 'Generated')
  s.calls.length = 0
  s.w.download = async () => { s.calls.push('download') }
  await confirmAndDownloadQtt(s.w)
  assert.deepEqual(s.calls, ['get', 'download'])
})
test('server confirms but response is lost: next read sees locked without confirming again', async () => {
  const s = scenario()
  const confirm = s.w.confirm
  s.w.confirm = async d => { await confirm(d); throw new Error('timeout') }
  await assert.rejects(confirmAndDownloadQtt(s.w), /timeout/)
  s.calls.length = 0
  await confirmAndDownloadQtt(s.w)
  assert.deepEqual(s.calls, ['get', 'download'])
})
test('allocation failure never confirms or downloads', async () => {
  const s = scenario({ overrides: { saveAllocation: async () => { throw new Error('allocation rejected') } } })
  await assert.rejects(confirmAndDownloadQtt(s.w), /allocation rejected/)
  assert.equal(s.calls.includes('confirm'), false)
  assert.equal(s.calls.includes('download'), false)
})
test('changed calculation stops before draft creation', async () => {
  const s = scenario({ overrides: { calculate: async () => ({ indicators: { ...indicators, indicator20: 4000000 } }) } })
  await assert.rejects(confirmAndDownloadQtt(s.w), QttReviewRequired)
  assert.equal(s.calls.includes('create'), false)
})
test('stale revision displays server draft without overwriting it', async () => {
  const s = scenario({ saved: { ...draft, draftRevision: 3 }, previous: draft })
  await assert.rejects(confirmAndDownloadQtt(s.w), QttReviewRequired)
  assert.equal(s.published().draftRevision, 3)
  assert.equal(s.calls.includes('allocate'), false)
})
test('readiness failure prevents all mutations', async () => {
  const s = scenario({ overrides: { checkReady: async () => false } })
  await assert.rejects(confirmAndDownloadQtt(s.w), QttReviewRequired)
  assert.deepEqual(s.calls, ['get'])
})
test('no overpayment skips allocation', async () => {
  const zero = { ...indicators, indicator20: 0, indicator24: 0 }
  const d = { ...draft, indicators: zero }
  const s = scenario({ saved: d, previous: d, overrides: { shown: zero } })
  await confirmAndDownloadQtt(s.w)
  assert.deepEqual(s.calls, ['get', 'ready', 'confirm', 'download'])
})
test('fresh draft default carry-forward is not treated as a user choice', () => {
  assert.equal(allocationFromDeclaration(draft).choice, null)
  assert.match(allocationError(emptyAllocation(), indicators, false), /Chọn/)
})
test('refund uses entire overpayment and requires account', () => {
  const a = { ...emptyAllocation(), choice: 'refund' }
  assert.equal(allocationRequest(a, 3000000, 7).refundAmount, 3000000)
  assert.match(allocationError(a, indicators, false), /tài khoản/)
  assert.equal(allocationError({ ...a, accountId: 'bank' }, indicators, false), null)
})
test('offset validation rejects excess, duplicates, fractional amounts and incomplete external debt', () => {
  const offset = { key: '1', taxDeclarationObligationId: 'tax1', outstandingAmount: 4000000, offsetAmount: 4000000 }
  const a = { ...emptyAllocation(), choice: 'offset', offsets: [offset] }
  assert.match(allocationError(a, indicators, false), /vượt/)
  assert.match(allocationError({ ...a, offsets: [{ ...offset, offsetAmount: 1.5 }] }, indicators, false), /nguyên đồng/)
  assert.match(allocationError({ ...a, offsets: [1, 2].map(() => ({ ...offset, offsetAmount: 100 })) }, indicators, false), /một lần/)
  assert.match(allocationError({ ...a, offsets: [{ key: 'e', outstandingAmount: 100, offsetAmount: 100 }] }, indicators, false), /Điền đủ/)
})
test('TKN requires full offset; normal workflow can carry remainder', () => {
  const a = { ...emptyAllocation(), choice: 'offset', offsets: [{ key: '1', taxDeclarationObligationId: 'tax1', outstandingAmount: 2000000, offsetAmount: 2000000 }] }
  assert.equal(allocationError(a, indicators, false), null)
  assert.match(allocationError(a, indicators, true), /toàn bộ/)
})
test('allocation change does not count as changed calculated tax', () => {
  assert.equal(sameTaxFigures(indicators, { ...indicators, indicator22: 3000000, indicator24: 0 }), true)
  assert.equal(sameTaxFigures(indicators, { ...indicators, indicator10: 900000000 }), false)
})

test('calculation preview simulation can provide indicators when not canClose', () => {
  const preview = {
    canClose: false,
    hardBlockers: [{ code: 'Quarter4NotClosed', message: 'Quý 4 chưa đóng' }]
  }
  assert.equal(preview.canClose, false)
  assert.equal(preview.hardBlockers.length, 1)
})
