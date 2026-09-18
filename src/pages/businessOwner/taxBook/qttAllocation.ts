import type { QttDeclaration, QttIndicators, QttOffsetAllocationItemRequest, UpdateQttAllocationRequest } from '../../../types/taxBook.type'

export type AllocationChoice = 'carry' | 'refund' | 'offset' | 'mixed'
export type OffsetDraft = QttOffsetAllocationItemRequest & { key: string }
export type Allocation = {
  choice: AllocationChoice | null
  refundAmount: number
  accountId: string
  offsets: OffsetDraft[]
}
export const emptyAllocation = (): Allocation => ({ choice: null, refundAmount: 0, accountId: '', offsets: [] })

export function allocationFromDeclaration(d: QttDeclaration): Allocation {
  const i = d.indicators
  return {
    // A freshly-created draft's automatic carry-forward is not an explicit choice.
    choice: d.draftRevision === 1 && d.status === 'Draft' ? null
      : i.indicator22 === i.indicator20 ? 'refund'
        : i.indicator23 > 0 && i.indicator22 === 0 ? 'offset'
          : i.indicator22 === 0 && i.indicator23 === 0 ? 'carry' : 'mixed',
    refundAmount: i.indicator22,
    accountId: d.refundAccount?.paymentAccountId ?? '',
    offsets: d.offsetItems.map((x, index) => ({
      key: `${index}-${x.obligationIdentifier}`,
      taxDeclarationObligationId: x.sourceObligationId ?? undefined,
      taxCode: x.taxCode, taxpayerName: x.taxpayerName,
      obligationIdentifier: x.obligationIdentifier, budgetContent: x.budgetContent,
      chapterCode: x.chapterCode ?? undefined, subsectionCode: x.subsectionCode ?? undefined,
      collectingAuthority: x.collectingAuthority ?? undefined,
      administrativeAreaCode: x.administrativeAreaCode ?? undefined,
      dueDate: x.dueDate?.slice(0, 10),
      outstandingAmount: x.outstandingAmount, offsetAmount: x.offsetAmount
    }))
  }
}

export function allocationRequest(a: Allocation, overpaid: number, revision: number): UpdateQttAllocationRequest {
  const refundAmount = a.choice === 'refund' ? overpaid : a.choice === 'mixed' ? a.refundAmount : 0
  const offsetItems = a.choice === 'offset' || a.choice === 'mixed'
    ? a.offsets.map(({ key, ...item }) => { void key; return item }) : []
  return {
    refundAmount, offsetAmount: offsetItems.reduce((sum, x) => sum + x.offsetAmount, 0),
    refundPaymentAccountId: refundAmount > 0 ? a.accountId : undefined,
    offsetItems, expectedRevision: revision
  }
}

export function allocationError(a: Allocation, i: QttIndicators, fromTkn: boolean): string | null {
  if (i.indicator20 <= 0) return null
  if (!a.choice) return 'Chọn cách xử lý tiền nộp thừa trước khi xác nhận.'
  const r = allocationRequest(a, i.indicator20, 0)
  if (![r.refundAmount, r.offsetAmount, ...r.offsetItems.flatMap(x => [x.offsetAmount, x.outstandingAmount])]
    .every(x => Number.isSafeInteger(x) && x >= 0)) return 'Nhập số tiền nguyên đồng, không âm.'
  if (r.refundAmount + r.offsetAmount > i.indicator20) return 'Tổng tiền hoàn và bù trừ vượt số tiền nộp thừa.'
  if (r.refundAmount > 0 && !a.accountId) return 'Chọn tài khoản ngân hàng nhận tiền.'
  if (a.choice === 'offset' && r.offsetAmount === 0) return 'Chọn ít nhất một khoản thuế còn nợ để bù trừ.'
  const ids = r.offsetItems.map(x => x.taxDeclarationObligationId ?? `${x.taxCode}:${x.obligationIdentifier}`)
  if (new Set(ids).size !== ids.length) return 'Một khoản thuế chỉ được chọn bù trừ một lần.'
  for (const x of r.offsetItems) {
    if (x.offsetAmount <= 0 || x.offsetAmount > x.outstandingAmount) return 'Tiền bù trừ phải lớn hơn 0 và không vượt số còn nợ.'
    if (!x.taxDeclarationObligationId && (!x.taxCode?.trim() || !x.taxpayerName?.trim() ||
      !x.obligationIdentifier?.trim() || !x.budgetContent?.trim())) return 'Điền đủ thông tin khoản thuế chưa có trong danh sách.'
  }
  if (fromTkn && (a.choice !== 'offset' || r.offsetAmount !== i.indicator20)) {
    return 'Luồng từ thông báo doanh thu cần bù trừ toàn bộ tiền nộp thừa vào các khoản thuế đã chọn.'
  }
  return null
}
