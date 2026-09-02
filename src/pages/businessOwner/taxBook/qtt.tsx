import { useEffect, useMemo, useState } from 'react'
import { Check, Download, Plus, RefreshCw, Save, Send, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { useSearchParams } from 'react-router-dom'
import {
  calculateQtt,
  confirmQttDeclaration,
  createQttDeclaration,
  exportQttDeclaration,
  getQttCalculationPreview,
  getQttOffsetObligations,
  getQttPreview,
  updateQttAllocation
} from '../../../apis/taxBook.api'
import { submitTaxDeclaration } from '../../../apis/taxDeclaration.api'
import {
  applyTknQttNextStep,
  getTknQttNextStep
} from '../../../apis/tknTaxPeriod.api'
import { getPaymentAccounts } from '../../../apis/paymentAccount.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type {
  QttCalculationPreview,
  QttDeclaration,
  QttIndicators,
  QttOffsetAllocationItemRequest,
  QttOffsetObligationOption,
  QttPreview
} from '../../../types/taxBook.type'
import type { TknQttNextStep } from '../../../types/tknTaxPeriod.type'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

type OffsetDraft = {
  id: string
  mode: 'internal' | 'external'
  obligationId: string
  taxCode: string
  taxpayerName: string
  obligationIdentifier: string
  budgetContent: string
  chapterCode: string
  subsectionCode: string
  collectingAuthority: string
  administrativeAreaCode: string
  dueDate: string
  outstandingAmount: number
  offsetAmount: number
}

const emptyOffset = (): OffsetDraft => ({
  id: crypto.randomUUID(),
  mode: 'internal',
  obligationId: '',
  taxCode: '',
  taxpayerName: '',
  obligationIdentifier: '',
  budgetContent: '',
  chapterCode: '',
  subsectionCode: '',
  collectingAuthority: '',
  administrativeAreaCode: '',
  dueDate: '',
  outstandingAmount: 0,
  offsetAmount: 0
})

const indicatorRows: Array<[keyof QttIndicators, string]> = [
  ['indicator09', '[09] Tổng doanh thu'],
  ['indicator10', '[10] Chi phí dự kiến được trừ'],
  ['indicator11', '[11] Thu nhập tính thuế'],
  ['indicator12Rate', '[12] Thuế suất (%)'],
  ['indicator13', '[13] Thuế TNCN phát sinh'],
  ['indicator14', '[14] Thuế đã khấu trừ'],
  ['indicator15', '[15] Thuế đã tạm nộp'],
  ['indicator16', '[16] Thuế được giảm'],
  ['indicator19', '[19] Còn phải nộp'],
  ['indicator20', '[20] Nộp thừa'],
  ['indicator22', '[22] Đề nghị hoàn'],
  ['indicator23', '[23] Đề nghị bù trừ'],
  ['indicator24', '[24] Chuyển kỳ sau']
]

export default function QttPage() {
  const { currentBusiness } = useBusiness()
  const [searchParams] = useSearchParams()
  const requestedYear = Number(
    searchParams.get('year')
  )
  const fromTkn =
    searchParams.get('fromTkn')
  const [year, setYear] = useState(
    Number.isInteger(requestedYear) &&
      requestedYear >= 2000 &&
      requestedYear <= 2100
      ? requestedYear
      : new Date().getFullYear()
  )
  const [preview, setPreview] = useState<QttPreview | null>(null)
  const [calculation, setCalculation] = useState<QttCalculationPreview | null>(null)
  const [declaration, setDeclaration] = useState<QttDeclaration | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [obligations, setObligations] = useState<QttOffsetObligationOption[]>([])
  const [tknBridge, setTknBridge] = useState<TknQttNextStep | null>(null)
  const [refundAmount, setRefundAmount] = useState(0)
  const [refundAccountId, setRefundAccountId] = useState('')
  const [offsets, setOffsets] = useState<OffsetDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [working, setWorking] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    setPreview(null)
    setCalculation(null)
    setDeclaration(null)
    setRefundAmount(0)
    setRefundAccountId('')
    setOffsets([])
    setTknBridge(null)
  }, [currentBusiness?.id, year, fromTkn])

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const [nextPreview, accountResponse, nextObligations, nextTknBridge] = await Promise.all([
        getQttPreview(currentBusiness.id, year),
        getPaymentAccounts(currentBusiness.id),
        getQttOffsetObligations(currentBusiness.id),
        fromTkn ? getTknQttNextStep(fromTkn) : Promise.resolve(null)
      ])
      if (nextTknBridge && nextTknBridge.taxYear !== year) {
        throw new Error('TKN_YEAR_MISMATCH')
      }
      setPreview(nextPreview)
      setTknBridge(nextTknBridge)
      setAccounts((accountResponse.data ?? []).filter((x) => x.accountType === 'Bank' && x.isActive))
      setObligations(nextObligations)
      if (nextPreview.canClose) {
        setCalculation(await getQttCalculationPreview(currentBusiness.id, year))
      } else {
        setCalculation(null)
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu quyết toán')
    } finally {
      setLoading(false)
    }
  }

  const prepareDeclaration = async () => {
    if (!currentBusiness || !preview?.canClose) return
    try {
      setWorking(true)
      const calculated = await calculateQtt(currentBusiness.id, year)
      setCalculation(calculated.calculation)
      const next = await createQttDeclaration(currentBusiness.id, year)
      setDeclaration(next)
      setRefundAmount(next.indicators.indicator22)
      setRefundAccountId(next.refundAccount?.paymentAccountId ?? '')
      setOffsets(next.offsetItems.map((item) => ({
        id: crypto.randomUUID(),
        mode: item.sourceObligationId ? 'internal' : 'external',
        obligationId: item.sourceObligationId ?? '',
        taxCode: item.taxCode,
        taxpayerName: item.taxpayerName,
        obligationIdentifier: item.obligationIdentifier,
        budgetContent: item.budgetContent,
        chapterCode: item.chapterCode ?? '',
        subsectionCode: item.subsectionCode ?? '',
        collectingAuthority: item.collectingAuthority ?? '',
        administrativeAreaCode: item.administrativeAreaCode ?? '',
        dueDate: item.dueDate?.slice(0, 10) ?? '',
        outstandingAmount: item.outstandingAmount,
        offsetAmount: item.offsetAmount
      })))
      toast.success(next.status === 'Draft' ? 'Đã mở hồ sơ QTT nháp' : 'Đã tải hồ sơ QTT')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo hồ sơ QTT')
    } finally {
      setWorking(false)
    }
  }

  const offsetAmount = useMemo(
    () => offsets.reduce((sum, item) => sum + (Number(item.offsetAmount) || 0), 0),
    [offsets]
  )
  const overpaid = declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0

  const changeOffset = (id: string, patch: Partial<OffsetDraft>) => {
    setOffsets((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const selectObligation = (id: string, obligationId: string) => {
    const option = obligations.find((item) => item.obligationId === obligationId)
    changeOffset(id, {
      obligationId,
      outstandingAmount: option?.outstandingAmount ?? 0,
      offsetAmount: 0
    })
  }

  const saveAllocation = async () => {
    if (!currentBusiness || !declaration || declaration.status !== 'Draft') return
    if (refundAmount + offsetAmount > overpaid) {
      toast.error('Tổng tiền hoàn và bù trừ vượt số đã nộp thừa')
      return
    }
    if (refundAmount > 0 && !refundAccountId) {
      toast.error('Hãy chọn tài khoản ngân hàng nhận hoàn')
      return
    }

    if (fromTkn) {
      if (!tknBridge || tknBridge.taxYear !== year) {
        toast.error('Hãy tải lại dữ liệu TKN trước khi bù trừ')
        return
      }
      if (!tknBridge.choices.includes('Offset') || !tknBridge.canCreateQttDraft) {
        toast.error('TKN này hiện không đủ điều kiện thực hiện bù trừ')
        return
      }
      if (refundAmount !== 0) {
        toast.error('Luồng bù trừ từ TKN không đồng thời đề nghị hoàn')
        return
      }
      if (
        overpaid <= 0 ||
        offsetAmount !== overpaid ||
        offsetAmount !== tknBridge.incomeBasedPitPaid
      ) {
        toast.error('Hãy phân bổ đủ toàn bộ số PIT nộp thừa từ TKN')
        return
      }
    }

    const items: QttOffsetAllocationItemRequest[] = offsets.map((item) => item.mode === 'internal'
      ? {
          taxDeclarationObligationId: item.obligationId,
          outstandingAmount: item.outstandingAmount,
          offsetAmount: Number(item.offsetAmount) || 0
        }
      : {
          taxCode: item.taxCode,
          taxpayerName: item.taxpayerName,
          obligationIdentifier: item.obligationIdentifier,
          budgetContent: item.budgetContent,
          chapterCode: item.chapterCode || undefined,
          subsectionCode: item.subsectionCode || undefined,
          collectingAuthority: item.collectingAuthority || undefined,
          administrativeAreaCode: item.administrativeAreaCode || undefined,
          dueDate: item.dueDate || undefined,
          outstandingAmount: Number(item.outstandingAmount) || 0,
          offsetAmount: Number(item.offsetAmount) || 0
        })

    try {
      setWorking(true)
      const next = fromTkn
        ? await (async () => {
            const bridge = await applyTknQttNextStep(fromTkn, {
              choice: 'Offset',
              refundPaymentAccountId: null,
              offsetItems: items
            })
            setTknBridge(bridge)
            return createQttDeclaration(currentBusiness.id, year)
          })()
        : await updateQttAllocation(currentBusiness.id, declaration.declarationId, {
            refundAmount: Number(refundAmount) || 0,
            offsetAmount,
            refundPaymentAccountId: refundAccountId || undefined,
            offsetItems: items,
            expectedRevision: declaration.draftRevision
          })
      setDeclaration(next)
      toast.success(fromTkn
        ? 'Đã lưu bù trừ toàn bộ số PIT nộp thừa từ TKN'
        : 'Đã lưu cách xử lý tiền nộp thừa')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể lưu cách xử lý tiền nộp thừa')
    } finally {
      setWorking(false)
    }
  }

  const confirm = async () => {
    if (!currentBusiness || !declaration || declaration.status !== 'Draft') return
    try {
      setWorking(true)
      const next = await confirmQttDeclaration(
        currentBusiness.id,
        declaration.declarationId,
        declaration.draftRevision
      )
      setDeclaration(next)
      toast.success('Đã xác nhận và khóa hồ sơ QTT')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận hồ sơ QTT')
    } finally {
      setWorking(false)
    }
  }

  const download = async () => {
    if (!currentBusiness || !declaration || declaration.status === 'Draft') return
    try {
      setExporting(true)
      const blob = await exportQttDeclaration(currentBusiness.id, declaration.declarationId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `02-CNKD-TNCN-QTT_${declaration.taxCode}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xuất tờ khai QTT')
    } finally {
      setExporting(false)
    }
  }

  const submitDeclaration = async () => {
    if (!currentBusiness || !declaration || declaration.status !== 'Generated') return
    if (!window.confirm('Bạn có chắc chắn muốn đánh dấu tờ khai QTT đã nộp bên ngoài không?')) return
    try {
      setWorking(true)
      await submitTaxDeclaration(declaration.declarationId)
      setDeclaration((prev) => (prev ? { ...prev, status: 'Submitted' } : prev))
      toast.success('Đã đánh dấu tờ khai QTT nộp thành công!')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể đánh dấu nộp tờ khai')
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl space-y-5 p-6'>
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Quyết toán thuế TNCN</h1>
          <p className='mt-1 text-sm text-gray-500'>Mẫu 02/CNKD-TNCN-QTT · {currentBusiness?.businessName ?? 'Chưa chọn cửa hàng'}</p>
        </div>
        <div className='flex items-end gap-3'>
          <label className='text-sm text-gray-600'>Năm
            <input className='mt-1 block w-28 rounded-lg border px-3 py-2' type='number' value={year}
              onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <button onClick={load} disabled={!currentBusiness || loading}
            className='inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Xem dữ liệu
          </button>
        </div>
      </div>

      {fromTkn && (
        <div className='rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-800'>
          Bạn đang tiếp tục từ hồ sơ 01/TKN-CNKD. Hãy bấm <strong>Xem dữ liệu</strong>, tạo hồ sơ QTT rồi phân bổ toàn bộ số PIT nộp thừa vào các nghĩa vụ cần bù trừ.
          {tknBridge?.selectedChoice === 'Offset' && (
            <p className='mt-2 font-semibold text-emerald-700'>Lựa chọn bù trừ từ TKN đã được lưu.</p>
          )}
        </div>
      )}

      {!preview ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>Chọn năm rồi bấm “Xem dữ liệu”.</div>
      ) : (
        <>
          {(preview.hardBlockers.length > 0 || preview.warnings.length > 0) && (
            <div className='space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900'>
              {[...preview.hardBlockers, ...preview.warnings].map((item, index) => (
                <p key={`${item.code}-${index}`}>• {item.message}</p>
              ))}
            </div>
          )}

          {calculation && (
            <div className='space-y-4'>
              {/* QTT-FE-01: 4 Thẻ kiểm tra dữ liệu nguồn */}
              <div className='rounded-xl border border-gray-200 bg-white p-4'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500 mb-3'>
                  Kiểm tra số liệu nguồn (Cross-Book Verification)
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500'>Doanh thu kinh doanh [09a] (S2b)</span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator09a)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500'>Chi phí NVL xuất dùng [10a] (S2d)</span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator10a)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500'>Thuế TNCN đã tạm nộp [15]</span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator15)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500'>Tồn kho cuối năm [34] (S2d)</span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.inventoryTotals.indicator34)} đ</p>
                    <span className='text-[11px] text-gray-400 block mt-0.5'>Đầu: {money.format(calculation.inventoryTotals.indicator31)} | Nhập: {money.format(calculation.inventoryTotals.indicator32)}</span>
                  </div>
                </div>
              </div>

              {/* Summary kết quả */}
              <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                <Summary label='Tổng doanh thu [09]' value={calculation.indicators.indicator09} />
                <Summary label='Chi phí dự kiến được trừ [10]' value={calculation.indicators.indicator10} />
                <Summary label='Còn phải nộp [19]' value={calculation.indicators.indicator19} accent='red' />
                <Summary label='Nộp thừa [20]' value={calculation.indicators.indicator20} accent='green' />
              </div>

              {/* QTT-FE-02: Panel diễn giải công thức tính */}
              <div className='rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm text-blue-950'>
                <div className='flex flex-wrap items-center justify-between gap-2 font-semibold text-blue-900'>
                  <span>Diễn giải công thức tính thuế TNCN năm {year}</span>
                  <span className='rounded-md bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200'>
                    Thuế suất áp dụng: {calculation.indicators.indicator12Rate}%
                  </span>
                </div>
                <div className='mt-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-4 text-xs'>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500'>1. Thu nhập tính thuế [11]</span>
                    <p className='font-bold text-gray-900 mt-1'>[09] - [10] = {money.format(calculation.indicators.indicator11)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500'>2. Thuế phát sinh [13]</span>
                    <p className='font-bold text-gray-900 mt-1'>max([11], 0) × {calculation.indicators.indicator12Rate}% = {money.format(calculation.indicators.indicator13)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500'>3. Đã tạm nộp [15]</span>
                    <p className='font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator15)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500'>4. Miễn giảm nhỏ [18]</span>
                    <p className='font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator18)} đ {calculation.indicators.indicator18 > 0 ? '(≤ 50.000đ)' : ''}</p>
                  </div>
                </div>
                {calculation.applicableRateReason && (
                  <p className='mt-2.5 text-xs text-blue-700 italic'>* {calculation.applicableRateReason}</p>
                )}
              </div>

              {/* QTT-FE-05: Banner kết quả = 0 */}
              {(calculation.outcome === 'Zero' || (calculation.indicators.indicator19 === 0 && calculation.indicators.indicator20 === 0)) && (
                <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 flex items-center gap-3'>
                  <div className='h-3 w-3 rounded-full bg-emerald-500 shrink-0' />
                  <div>
                    <span className='font-bold'>Không phát sinh nghĩa vụ thuế: </span>
                    <span>Hộ kinh doanh không phải nộp thêm thuế TNCN ([19] = 0 đ) và không có số thuế nộp thừa trong năm ([20] = 0 đ).</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='flex flex-wrap gap-3'>
            <button onClick={prepareDeclaration} disabled={!preview.canClose || working}
              className='rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
              {declaration ? 'Tải lại hồ sơ' : 'Tính và tạo hồ sơ'}
            </button>
            {declaration?.status === 'Draft' && (
              <button onClick={confirm} disabled={working}
                className='inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
                <Check size={16} /> Xác nhận và khóa
              </button>
            )}
            {declaration && declaration.status !== 'Draft' && (
              <button onClick={download} disabled={exporting}
                className='inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>
                <Download size={16} /> Tải Word
              </button>
            )}
            {declaration?.status === 'Generated' && (
              <button onClick={submitDeclaration} disabled={working}
                className='inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-700 transition-colors'>
                <Send size={16} /> Đánh dấu đã nộp bên ngoài
              </button>
            )}
          </div>

          {declaration && (
            <div className='space-y-5'>
              <div className='rounded-xl border bg-white p-4'>
                <div className='flex flex-wrap justify-between gap-2'>
                  <div><span className='text-sm text-gray-500'>Mã hồ sơ</span><p className='font-semibold'>{declaration.declarationCode}</p></div>
                  <div><span className='text-sm text-gray-500'>Trạng thái</span><p className='font-semibold'>{statusLabel(declaration.status)}</p></div>
                  <div><span className='text-sm text-gray-500'>Người nộp thuế</span><p className='font-semibold'>{declaration.taxpayerName}</p></div>
                  <div><span className='text-sm text-gray-500'>Mã số thuế</span><p className='font-semibold'>{declaration.taxCode}</p></div>
                </div>
              </div>

              <div className='overflow-x-auto rounded-xl border bg-white'>
                <table className='min-w-full text-sm'>
                  <thead className='bg-gray-50'><tr><th className='px-4 py-3 text-left'>Chỉ tiêu</th><th className='px-4 py-3 text-right'>Giá trị</th></tr></thead>
                  <tbody>{indicatorRows.map(([key, label]) => (
                    <tr key={key} className='border-t'><td className='px-4 py-2'>{label}</td><td className='px-4 py-2 text-right font-medium'>{key === 'indicator12Rate' ? `${declaration.indicators[key]}%` : `${money.format(declaration.indicators[key])} đ`}</td></tr>
                  ))}</tbody>
                </table>
              </div>

              {declaration.indicators.indicator20 > 0 && (
                <div className='space-y-4 rounded-xl border bg-white p-5'>
                  <div><h2 className='font-semibold text-gray-900'>Xử lý tiền nộp thừa</h2><p className='text-sm text-gray-500'>Tổng có thể phân bổ: {money.format(overpaid)} đ</p></div>
                  <div className='grid gap-4 md:grid-cols-2'>
                    <label className='text-sm text-gray-600'>Số đề nghị hoàn
                      <input disabled={declaration.status !== 'Draft'} className='mt-1 block w-full rounded-lg border px-3 py-2' type='number' min={0} value={refundAmount}
                        onChange={(event) => setRefundAmount(Number(event.target.value))} />
                    </label>
                    <label className='text-sm text-gray-600'>Tài khoản nhận hoàn
                      <select disabled={declaration.status !== 'Draft'} className='mt-1 block w-full rounded-lg border px-3 py-2' value={refundAccountId}
                        onChange={(event) => setRefundAccountId(event.target.value)}>
                        <option value=''>Chọn tài khoản</option>
                        {accounts.map((account) => <option key={account.paymentAccountId} value={account.paymentAccountId}>{account.bankShortName || account.bankName} · {account.accountNumber}</option>)}
                      </select>
                    </label>
                  </div>

                  <div className='flex items-center justify-between'><div><h3 className='font-semibold'>Khoản đề nghị bù trừ</h3><p className='text-sm text-gray-500'>Tổng: {money.format(offsetAmount)} đ</p></div>
                    {declaration.status === 'Draft' && <button onClick={() => setOffsets((current) => [...current, emptyOffset()])} className='inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm'><Plus size={15} /> Thêm khoản</button>}
                  </div>
                  {offsets.map((item) => (
                    <OffsetEditor key={item.id} item={item} obligations={obligations} disabled={declaration.status !== 'Draft'}
                      onChange={(patch) => changeOffset(item.id, patch)} onSelect={(value) => selectObligation(item.id, value)}
                      onRemove={() => setOffsets((current) => current.filter((x) => x.id !== item.id))} />
                  ))}
                  {declaration.status === 'Draft' && (
                    <button onClick={saveAllocation} disabled={working}
                      className='inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'><Save size={16} /> {fromTkn ? 'Hoàn tất bù trừ từ TKN' : 'Lưu phân bổ'}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function Summary({ label, value, accent }: { label: string; value: number; accent?: 'red' | 'green' }) {
  const color = accent === 'red' ? 'text-red-700' : accent === 'green' ? 'text-emerald-700' : 'text-gray-900'
  return <div className='rounded-xl border bg-white p-4'><p className='text-sm text-gray-500'>{label}</p><p className={`mt-1 text-xl font-bold ${color}`}>{money.format(value)} đ</p></div>
}

function OffsetEditor({ item, obligations, disabled, onChange, onSelect, onRemove }: {
  item: OffsetDraft
  obligations: QttOffsetObligationOption[]
  disabled: boolean
  onChange: (patch: Partial<OffsetDraft>) => void
  onSelect: (value: string) => void
  onRemove: () => void
}) {
  return (
    <div className='space-y-3 rounded-lg border bg-gray-50 p-4'>
      <div className='flex items-center justify-between gap-3'>
        <select disabled={disabled} className='rounded-lg border bg-white px-3 py-2 text-sm' value={item.mode}
          onChange={(event) => onChange({ mode: event.target.value as OffsetDraft['mode'], obligationId: '' })}>
          <option value='internal'>Chọn nghĩa vụ trong TaxMate</option><option value='external'>Nhập nghĩa vụ ngoài</option>
        </select>
        {!disabled && <button onClick={onRemove} className='text-red-600'><Trash2 size={17} /></button>}
      </div>
      {item.mode === 'internal' ? (
        <div className='grid gap-3 md:grid-cols-[1fr_180px]'>
          <label className='text-sm text-gray-600'>Nghĩa vụ
            <select disabled={disabled} className='mt-1 block w-full rounded-lg border bg-white px-3 py-2' value={item.obligationId} onChange={(event) => onSelect(event.target.value)}>
              <option value=''>Chọn nghĩa vụ</option>
              {obligations.map((option) => <option key={option.obligationId} value={option.obligationId}>{option.declarationCode} · {option.budgetContent} · {money.format(option.outstandingAmount)} đ</option>)}
            </select>
          </label>
          <MoneyInput label='Số tiền bù trừ' value={item.offsetAmount} disabled={disabled} onChange={(value) => onChange({ offsetAmount: value })} />
        </div>
      ) : (
        <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
          <TextInput label='Mã số thuế' value={item.taxCode} disabled={disabled} onChange={(value) => onChange({ taxCode: value })} />
          <TextInput label='Tên người nộp thuế' value={item.taxpayerName} disabled={disabled} onChange={(value) => onChange({ taxpayerName: value })} />
          <TextInput label='Mã hồ sơ/nghĩa vụ' value={item.obligationIdentifier} disabled={disabled} onChange={(value) => onChange({ obligationIdentifier: value })} />
          <TextInput label='Nội dung khoản nộp' value={item.budgetContent} disabled={disabled} onChange={(value) => onChange({ budgetContent: value })} />
          <TextInput label='Chương' value={item.chapterCode} disabled={disabled} onChange={(value) => onChange({ chapterCode: value })} />
          <TextInput label='Tiểu mục' value={item.subsectionCode} disabled={disabled} onChange={(value) => onChange({ subsectionCode: value })} />
          <TextInput label='Cơ quan thu' value={item.collectingAuthority} disabled={disabled} onChange={(value) => onChange({ collectingAuthority: value })} />
          <TextInput label='Địa bàn hành chính' value={item.administrativeAreaCode} disabled={disabled} onChange={(value) => onChange({ administrativeAreaCode: value })} />
          <label className='text-sm text-gray-600'>Hạn nộp<input disabled={disabled} className='mt-1 block w-full rounded-lg border bg-white px-3 py-2' type='date' value={item.dueDate} onChange={(event) => onChange({ dueDate: event.target.value })} /></label>
          <MoneyInput label='Số còn phải nộp' value={item.outstandingAmount} disabled={disabled} onChange={(value) => onChange({ outstandingAmount: value })} />
          <MoneyInput label='Số tiền bù trừ' value={item.offsetAmount} disabled={disabled} onChange={(value) => onChange({ offsetAmount: value })} />
        </div>
      )}
    </div>
  )
}

function TextInput({ label, value, disabled, onChange }: { label: string; value: string; disabled: boolean; onChange: (value: string) => void }) {
  return <label className='text-sm text-gray-600'>{label}<input disabled={disabled} className='mt-1 block w-full rounded-lg border bg-white px-3 py-2' value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function MoneyInput({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return <label className='text-sm text-gray-600'>{label}<input disabled={disabled} className='mt-1 block w-full rounded-lg border bg-white px-3 py-2' type='number' min={0} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label>
}

function statusLabel(status: QttDeclaration['status']) {
  if (status === 'Draft') return 'Nháp'
  if (status === 'Generated') return 'Đã xác nhận'
  return 'Đã nộp'
}
