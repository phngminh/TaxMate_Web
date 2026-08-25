import { useEffect, useMemo, useState } from 'react'
import { Check, Download, Plus, RefreshCw, Save, Trash2 } from 'lucide-react'
import { toast } from 'react-toastify'
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
  const [year, setYear] = useState(new Date().getFullYear())
  const [preview, setPreview] = useState<QttPreview | null>(null)
  const [calculation, setCalculation] = useState<QttCalculationPreview | null>(null)
  const [declaration, setDeclaration] = useState<QttDeclaration | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [obligations, setObligations] = useState<QttOffsetObligationOption[]>([])
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
  }, [currentBusiness?.id, year])

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const [nextPreview, accountResponse, nextObligations] = await Promise.all([
        getQttPreview(currentBusiness.id, year),
        getPaymentAccounts(currentBusiness.id),
        getQttOffsetObligations(currentBusiness.id)
      ])
      setPreview(nextPreview)
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
      const next = await updateQttAllocation(currentBusiness.id, declaration.declarationId, {
        refundAmount: Number(refundAmount) || 0,
        offsetAmount,
        refundPaymentAccountId: refundAccountId || undefined,
        offsetItems: items,
        expectedRevision: declaration.draftRevision
      })
      setDeclaration(next)
      toast.success('Đã lưu cách xử lý tiền nộp thừa')
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
            <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
              <Summary label='Tổng doanh thu [09]' value={calculation.indicators.indicator09} />
              <Summary label='Chi phí dự kiến được trừ [10]' value={calculation.indicators.indicator10} />
              <Summary label='Còn phải nộp [19]' value={calculation.indicators.indicator19} accent='red' />
              <Summary label='Nộp thừa [20]' value={calculation.indicators.indicator20} accent='green' />
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
                      className='inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'><Save size={16} /> Lưu phân bổ</button>
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
