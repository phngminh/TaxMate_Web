import type { QttCalculationPreview, QttDeclaration, QttIndicators } from '../../../types/taxBook.type'

export type QttStep = 'idle' | 'check' | 'calculate' | 'create' | 'allocate' | 'confirm' | 'download' | 'reconcile' | 'review' | 'submit'
export const isQttLocked = (d: QttDeclaration | null): d is QttDeclaration & { status: 'Generated' | 'Submitted' } =>
  d?.status === 'Generated' || d?.status === 'Submitted'

export function sameTaxFigures(a: QttIndicators, b: QttIndicators) {
  // Allocation is user input, not a change to the calculated tax.
  return (Object.keys(a) as (keyof QttIndicators)[])
    .filter(key => !['indicator21', 'indicator22', 'indicator23', 'indicator24'].includes(key))
    .every(key => a[key] === b[key])
}

export class QttReviewRequired extends Error {}

type Workflow = {
  shown: QttIndicators
  previous: QttDeclaration | null
  getDeclaration: () => Promise<QttDeclaration | null>
  checkReady: () => Promise<boolean>
  calculate: () => Promise<QttCalculationPreview>
  create: () => Promise<QttDeclaration>
  validate: (indicators: QttIndicators) => void
  saveAllocation: (draft: QttDeclaration) => Promise<QttDeclaration>
  confirm: (draft: QttDeclaration) => Promise<QttDeclaration>
  download: (declaration: QttDeclaration) => Promise<void>
  onDeclaration: (declaration: QttDeclaration) => void
  onCalculation: (calculation: QttCalculationPreview) => void
  onStep: (step: QttStep) => void
}

// Each durable response is published before the next request. A download retry
// deliberately bypasses this workflow; unknown mutation outcomes must be read back.
export async function confirmAndDownloadQtt(w: Workflow) {
  w.onStep('check')
  let d = await w.getDeclaration()
  if (isQttLocked(d)) {
    w.onDeclaration(d)
  } else {
    if (!await w.checkReady()) throw new QttReviewRequired('Còn việc cần xử lý trước khi tạo tờ khai.')
    w.validate(w.shown)
    if (!d) {
      if (w.previous) throw new QttReviewRequired('Hồ sơ đã thay đổi. Hãy tải lại dữ liệu trước khi xác nhận.')
      w.onStep('calculate')
      const calculated = await w.calculate()
      w.onCalculation(calculated)
      if (!sameTaxFigures(w.shown, calculated.indicators)) {
        throw new QttReviewRequired('Số liệu đã thay đổi. Hãy kiểm tra bảng tính mới trước khi xác nhận.')
      }
      w.onStep('create')
      d = await w.create()
    } else if (!w.previous || d.declarationId !== w.previous.declarationId ||
      d.draftRevision !== w.previous.draftRevision) {
      w.onDeclaration(d)
      throw new QttReviewRequired('Hồ sơ đã được cập nhật ở nơi khác. Hãy kiểm tra lại trước khi xác nhận.')
    }
    w.onDeclaration(d)
    if (!isQttLocked(d)) {
      if (!sameTaxFigures(w.shown, d.indicators)) {
        throw new QttReviewRequired('Số liệu hồ sơ đã thay đổi. Hãy kiểm tra lại bảng tính.')
      }
      w.validate(d.indicators)
      if (d.indicators.indicator20 > 0) {
        w.onStep('allocate')
        d = await w.saveAllocation(d)
        w.onDeclaration(d)
      }
      w.onStep('confirm')
      d = await w.confirm(d)
      w.onDeclaration(d)
    }
  }
  w.onStep('download')
  await w.download(d)
}
