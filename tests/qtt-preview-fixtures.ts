const scenario = new URLSearchParams(location.search).get('scenario') ?? 'overpaid'
const blocked = ['blocked', 'many-expenses'].includes(scenario)
const business = { id: 'shop-a', businessName: 'Tạp hóa An Bình', address: '12 Nguyễn Trãi, Hà Nội', ownerId: 'owner', isActive: true }
const shops = scenario === 'many-expenses' ? [business, { ...business, id: 'shop-b', businessName: 'Tạp hóa An Bình · Cơ sở 2' }] : [business]
export const useBusiness = () => ({ currentBusiness: business, businesses: shops, setCurrentBusiness: () => {} })
const indicators = {
  indicator09: 1200000000, indicator09a: 1200000000, indicator09b: 0, indicator09c: 0,
  indicator10: 1000000000, indicator10a: 900000000, indicator10b: 0, indicator10c: 0,
  indicator10d: 100000000, indicator10LoanInterest: 0, indicator10e: 0, indicator11: 200000000,
  indicator12Rate: 15, indicator13: 30000000, indicator14: 0,
  indicator15: scenario === 'payable' ? 27000000 : scenario === 'zero' ? 30000000 : 33000000,
  indicator16: 0, indicator17: scenario === 'payable' ? 3000000 : 0, indicator18: 0,
  indicator19: scenario === 'payable' ? 3000000 : 0,
  indicator20: ['payable', 'zero'].includes(scenario) ? 0 : 3000000,
  indicator21: 0, indicator22: 0, indicator23: 0, indicator24: ['payable', 'zero'].includes(scenario) ? 0 : 3000000
}
const taxpayer = { taxpayerName: 'Nguyễn Văn An', taxCode: '0123456789', taxpayerAddress: business.address }
let reviewed = false
let fileAttempts = 0
let declaration: any = ['locked', 'submitted'].includes(scenario) ? makeDraft() : null
if (declaration) declaration.status = scenario === 'submitted' ? 'Submitted' : 'Generated'
function makeDraft() { return { ...taxpayer, declarationId: 'fixture', declarationCode: 'QTT-2026-MAU', taxPeriodId: 'annual', calculationId: 'calc', version: 1, draftRevision: 1, status: 'Draft', indicators: { ...indicators }, inventoryTotals: {}, refundAccount: null, offsetItems: [] } }
const copy = <T,>(value: T): T => structuredClone(value)
export async function getQttDeclaration() { return copy(declaration) }
export async function getQttPreview() {
  return {
    ...taxpayer, taxYear: 2026, eligibility: 'NormalIncomeBased',
    businesses: shops.map(s => ({ businessId: s.id, businessName: s.businessName })),
    quarters: [1, 2, 3, 4].map(quarter => ({ quarter, taxPeriodId: `q${quarter}`, businessId: business.id, closed: !blocked || quarter !== 4 })),
    canClose: !blocked,
    hardBlockers: blocked ? [{ code: 'Quarter4NotClosed', businessId: business.id, sourceId: 'q4', message: '' }] : [],
    warnings: scenario === 'blocked' && !reviewed ? [{ code: 'EvidenceReviewRequired', businessId: business.id, message: '', sourceId: null }] : [],
    evidenceReviewPeriods: scenario === 'many-expenses' ? shops.flatMap(s => [1, 2, 3, 4].map(quarter => ({ businessId: s.id, quarter, required: true, reviewed: true })))
      : scenario === 'blocked' ? [{ businessId: business.id, quarter: 3, required: true, reviewed }] : [],
    expenseReviewRows: scenario === 'many-expenses' ? shops.flatMap(s => [1, 2, 3, 4].flatMap(quarter => Array.from({ length: 24 }, (_, n) => ({
      businessId: s.id, quarter, sourceType: n % 3 === 0 ? 'inventoryPurchase' : 'expense', sourceId: `${s.id}-${quarter}-${n}`,
      documentDate: `2026-${String(quarter * 3).padStart(2, '0')}-${String(n + 1).padStart(2, '0')}T03:00:00`,
      documentNumber: `${n % 3 === 0 ? 'PNK' : 'PC'}-${quarter}-${String(n + 1).padStart(3, '0')}`,
      description: `${n % 3 === 0 ? 'Nhập hàng định kỳ' : n % 3 === 1 ? 'Tiền thuê mặt bằng' : 'Điện nước'} · Khoản ${n + 1}`,
      amount: (n + 1) * 1400000, includedAmount: n % 3 === 0 ? null : (n + 1) * 1400000,
      issueCodes: n % 4 === 0 ? [] : [n % 3 === 0 ? 'MissingInventoryPurchaseEvidence' : 'MissingExpenseEvidence']
    })))) : scenario === 'blocked' ? [
      { businessId: business.id, quarter: 3, sourceType: 'expense', sourceId: 'e1', documentDate: '2026-08-01T03:00:00', documentNumber: 'PC-001', description: 'Tiền điện cửa hàng tháng 7', amount: 2400000, includedAmount: 2400000, issueCodes: ['MissingExpenseEvidence'] },
      { businessId: business.id, quarter: 3, sourceType: 'expense', sourceId: 'e2', documentDate: '2026-08-02T03:00:00', documentNumber: 'PC-002', description: 'Sửa tủ đông · trả tiền mặt', amount: 6000000, includedAmount: 0, issueCodes: ['CashExpenseExcluded'] }
    ] : []
  }
}
export async function getQttCalculationPreview() { return { taxYear: 2026, indicators, inventoryTotals: {}, applicableRateReason: 'Doanh thu năm trên 1 tỷ đến 3 tỷ đồng nên áp dụng thuế suất 15%.', outcome: indicators.indicator19 ? 'Payable' : indicators.indicator20 ? 'Overpaid' : 'Zero', dueDate: '2027-03-31', warnings: [] } }
export async function calculateQtt() { return { calculation: await getQttCalculationPreview() } }
export async function createQttDeclaration() { declaration ??= makeDraft(); return copy(declaration) }
export async function updateQttAllocation(_business: string, _id: string, request: any) {
  if (request.expectedRevision !== declaration.draftRevision) throw new Error('Revision changed')
  declaration.draftRevision++
  declaration.indicators = { ...declaration.indicators, indicator21: request.refundAmount + request.offsetAmount, indicator22: request.refundAmount, indicator23: request.offsetAmount, indicator24: indicators.indicator20 - request.refundAmount - request.offsetAmount }
  declaration.refundAccount = request.refundAmount > 0 ? { ...bank, paymentAccountId: bank.paymentAccountId } : null
  declaration.offsetItems = request.offsetItems.map((x: any) => ({ ...x, sourceObligationId: x.taxDeclarationObligationId, obligationIdentifier: 'THUE-MAU', budgetContent: 'Thuế giá trị gia tăng' }))
  return copy(declaration)
}
export async function confirmQttDeclaration(_b: string, _d: string, revision: number) {
  if (revision !== declaration.draftRevision) throw new Error('Revision changed')
  declaration.status = 'Generated'
  if (scenario === 'confirm-timeout') throw new Error('Simulated lost response after commit')
  return copy(declaration)
}
export async function exportQttDeclaration() {
  if (scenario === 'download-error' && fileAttempts++ === 0) throw new Error('Simulated download failure')
  return new Blob(['UI TEST FIXTURE — NOT A TAX DECLARATION'], { type: 'application/octet-stream' })
}
export async function confirmS2cEvidenceReview() { reviewed = true; return {} }
export async function submitTaxDeclaration() { declaration.status = 'Submitted' }
const bank = { paymentAccountId: 'bank1', businessId: business.id, accountType: 'Bank', isActive: true, bankName: 'Ngân hàng mẫu', bankShortName: 'MAU', accountName: 'NGUYEN VAN AN', accountNumber: '000012345678' }
export async function getPaymentAccounts() { return { success: true, data: [bank] } }
export async function createPaymentAccount() { throw new Error('Creating accounts is disabled in this fixture') }
export async function getQttOffsetObligations() { return [{ obligationId: 'debt1', declarationCode: 'Q3-2026', taxCode: taxpayer.taxCode, taxpayerName: taxpayer.taxpayerName, budgetContent: 'Thuế giá trị gia tăng', outstandingAmount: 2000000, dueDate: '2026-10-31' }] }
export async function getTknQttNextStep() { return { taxYear: 2026, canCreateQttDraft: true, choices: ['Offset'], incomeBasedPitPaid: 3000000, qttDraftRevision: declaration?.draftRevision ?? null } }
export async function applyTknQttNextStep(_id: string, request: any) { await updateQttAllocation(business.id, declaration.declarationId, { ...request, refundAmount: 0, offsetAmount: 3000000, expectedRevision: declaration.draftRevision }) }
