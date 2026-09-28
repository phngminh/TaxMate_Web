// Focused regression checks without a browser or a live tax API.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
const root = path.resolve(__dirname, '..')

function load(file, mocks) {
  const output = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: false }
  }).outputText
  const exports = {}
  vm.runInNewContext(output, {
    exports,
    require(name) {
      if (!(name in mocks)) throw new Error(`Unexpected dependency: ${name}`)
      return mocks[name]
    }
  })
  return exports
}

async function main() {
  const updates = load('src/utils/taxProfileUpdates.ts', {})
  let bannerUpdates = 0
  let dashboardUpdates = 0
  const stopBanner = updates.subscribeTaxProfileChanges(() => bannerUpdates++)
  updates.subscribeTaxProfileChanges(() => dashboardUpdates++)
  let fail = false
  const api = load('src/apis/taxProfile.api.ts', {
    '../utils/taxProfileUpdates': updates,
    '../utils/http': { default: { post: async () => {
      if (fail) throw new Error('API rejected')
      return { data: { data: {} } }
    } } }
  })
  await api.confirmThresholdReview('business', 'alert')
  await api.dismissThresholdReview('business', 'alert')
  assert.equal(bannerUpdates, 2)
  assert.equal(dashboardUpdates, 2)
  fail = true
  await assert.rejects(api.confirmThresholdReview('business', 'alert'))
  await assert.rejects(api.dismissThresholdReview('business', 'alert'))
  assert.equal(updates.getTaxProfileRevision(), 2, 'Failures must not publish success')
  stopBanner()
  updates.notifyTaxProfileChanged()
  assert.equal(bannerUpdates, 2, 'Unmounted subscriber must not be notified')
  assert.equal(dashboardUpdates, 3)

  let states = [], cursor = 0, effects = [], reviews = []
  const jsx = (type, props) => ({ type, props })
  const Banner = load('src/components/owner/tax/ThresholdAlertBanner.tsx', {
    react: {
      useState(initial) {
        const index = cursor++
        if (!(index in states)) states[index] = initial
        return [states[index], (value) => { states[index] = typeof value === 'function' ? value(states[index]) : value }]
      },
      useMemo: (fn) => fn(),
      useEffect: (fn) => effects.push(fn)
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-router-dom': { useLocation: () => ({ pathname: '/tax' }), useNavigate: () => () => {} },
    'lucide-react': {},
    'react-toastify': { toast: {} },
    '../../../apis/taxProfile.api': { getOwnerTaxProfile: async () => ({ thresholdReviews: reviews }) },
    '../../../constants/path': { default: { BUSINESS_OWNER_TAX: '/tax' } },
    '../../../hooks/useTaxProfileRevision': { useTaxProfileRevision: () => 0 }
  }).default
  const base = { alertId: 'a', status: 'PendingReview', thresholdCode: 'Crossed1B', thresholdAmount: 1e9,
    canConfirm: true, canDismiss: false, isOutsideSupportedScope: false, message: 'Thông điệp từ BE' }
  async function render(review) {
    states = []; cursor = 0; effects = []; reviews = [review]
    Banner({ businessId: 'b' })
    effects.forEach((effect) => effect())
    await new Promise((resolve) => setImmediate(resolve))
    cursor = 0
    return Banner({ businessId: 'b' })
  }
  assert.ok(await render(base))
  assert.ok(await render({ ...base, status: 'Acknowledged' }))
  assert.equal(await render({ ...base, status: 'Acknowledged', canConfirm: false }), null)
  assert.equal(await render({ ...base, status: 'Resolved' }), null)
  const recovered = JSON.stringify(await render({ ...base, thresholdCode: 'Crossed50B', thresholdAmount: 50e9,
    canConfirm: false, canDismiss: true }))
  assert.ok(recovered.includes('không còn vượt mốc'))
  assert.ok(recovered.includes('Đóng thông báo'))
  assert.ok(!recovered.includes('Ngoài phạm vi hỗ trợ'))
  assert.ok(!recovered.includes('vượt mốc 1 tỷ'))
  const exceeded = JSON.stringify(await render({ ...base, thresholdCode: 'Crossed50B', isOutsideSupportedScope: true }))
  assert.ok(exceeded.includes('Ngoài phạm vi hỗ trợ'))
  assert.ok(!exceeded.includes('Đóng thông báo'))
  const deferred = JSON.stringify(await render({ ...base, thresholdCode: 'Crossed3B', status: 'Acknowledged' }))
  assert.ok(deferred.includes(base.message), 'Use current BE guidance for deferred transitions')
  console.log('PASS: API success/failure notifications, two subscribers, cleanup, banner status filtering, 50B recovery, deferred guidance.')
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
