import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Info,
  Package,
  Plus,
  RefreshCw,
  Save,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-toastify'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { taxPeriodPreviewPath } from '../../../utils/taxPeriodRoute'
import {
  calculateQtt,
  confirmS2cEvidenceReview,
  getQttDeclaration,
  confirmQttDeclaration,
  createQttDeclaration,
  exportQttDeclaration,
  exportQttPreview,
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
import LegalBadge from '../../../components/owner/tax/LegalBadge'
import Tip from '../../../components/owner/tax/Tip'
import type { TknQttNextStep } from '../../../types/tknTaxPeriod.type'

import { sameTaxFigures } from './qttWorkflow'

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
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  const hydrateDeclaration = useCallback((next: QttDeclaration) => {
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
  }, [])

  const load = useCallback(async (isManual = false) => {
    if (!currentBusiness) return
    const currentBusinessId = currentBusiness.id
    const currentYear = year
    try {
      setLoading(true)
      const [nextPreview, accountResponse, nextObligations, nextTknBridge, saved] = await Promise.all([
        getQttPreview(currentBusinessId, currentYear),
        getPaymentAccounts(currentBusinessId),
        getQttOffsetObligations(currentBusinessId),
        fromTkn ? getTknQttNextStep(fromTkn) : Promise.resolve(null),
        getQttDeclaration(currentBusinessId, currentYear)
      ])
      if (currentBusiness.id !== currentBusinessId || year !== currentYear) return
      if (nextTknBridge && nextTknBridge.taxYear !== currentYear) {
        toast.error(`Kỳ thông báo doanh thu thuộc năm ${nextTknBridge.taxYear}, không khớp với năm quyết toán ${currentYear}`)
        return
      }
      setDeclaration(null)
      if (saved) hydrateDeclaration(saved)
      setPreview(nextPreview)
      setTknBridge(nextTknBridge)
      setAccounts((accountResponse.data ?? []).filter((x) => x.accountType === 'Bank' && x.isActive))
      setObligations(nextObligations)
      if (!saved) {
        try {
          setCalculation(await getQttCalculationPreview(currentBusinessId, currentYear))
        } catch {
          setCalculation(null)
        }
      } else {
        setCalculation(null)
      }
      if (isManual) {
        toast.success(`Đã cập nhật dữ liệu quyết toán năm ${year}!`)
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tải dữ liệu quyết toán')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, fromTkn, hydrateDeclaration])

  useEffect(() => {
    setPreview(null)
    setCalculation(null)
    setDeclaration(null)
    setIsPreviewMode(false)
    setRefundAmount(0)
    setRefundAccountId('')
    setOffsets([])
    setTknBridge(null)
    void load()
  }, [load])

  const handlePreviewDeclaration = () => {
    if (!calculation) return
    const previewDecl: QttDeclaration = {
      declarationId: 'preview-qtt-declaration',
      taxPeriodId: preview?.quarters?.[0]?.taxPeriodId || 'preview-annual-id',
      calculationId: 'preview-calc-id',
      declarationCode: 'PREVIEW-02QTT-DEMO',
      version: 1,
      draftRevision: 1,
      status: 'Draft',
      taxpayerName: preview?.taxpayerName || currentBusiness?.businessName || 'Hộ kinh doanh mẫu',
      taxCode: preview?.taxCode || '0123456789',
      taxpayerAddress: preview?.taxpayerAddress || currentBusiness?.address || 'Địa chỉ kinh doanh',
      indicators: calculation.indicators,
      inventoryTotals: calculation.inventoryTotals,
      refundAccount: null,
      offsetItems: []
    }
    setDeclaration(previewDecl)
    setIsPreviewMode(true)
    toast.info('Đã mở chế độ xem trước hồ sơ quyết toán Mẫu 02/QTT.')
  }

  const prepareDeclaration = async () => {
    if (!currentBusiness) return
    try {
      setWorking(true)
      const calculated = await calculateQtt(currentBusiness.id, year)
      if (calculation && !sameTaxFigures(calculation.indicators, calculated.calculation.indicators)) {
        setCalculation(calculated.calculation)
        toast.warn('Số liệu tính thuế vừa thay đổi so với bản xem trước. Hãy kiểm tra lại trước khi tạo hồ sơ.')
        return
      }
      setCalculation(calculated.calculation)
      const next = await createQttDeclaration(currentBusiness.id, year)
      hydrateDeclaration(next)
      toast.success(next.status === 'Draft' ? 'Đã mở hồ sơ quyết toán nháp' : 'Đã tải hồ sơ quyết toán')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể tạo hồ sơ quyết toán')
    } finally {
      setWorking(false)
    }
  }

  const offsetAmount = useMemo(
    () => offsets.reduce((sum, item) => sum + (Number(item.offsetAmount) || 0), 0),
    [offsets]
  )
  const overpaid = declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0
  const carryForward = useMemo(() => {
    const parsedRefund = Number(refundAmount) || 0
    return overpaid - parsedRefund - offsetAmount
  }, [overpaid, refundAmount, offsetAmount])

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
    const parsedRefund = Number(refundAmount) || 0
    if (!Number.isSafeInteger(parsedRefund) || parsedRefund < 0) {
      toast.error('Số tiền đề nghị hoàn phải là số nguyên không âm')
      return
    }
    if (parsedRefund + offsetAmount > overpaid) {
      toast.error(`Tổng tiền hoàn và bù trừ vượt quá số nộp thừa (${money.format(overpaid)} đ)`)
      return
    }
    if (parsedRefund > 0 && !refundAccountId) {
      toast.error('Hãy chọn tài khoản ngân hàng nhận hoàn')
      return
    }
    for (const item of offsets) {
      const amt = Number(item.offsetAmount) || 0
      const outstanding = Number(item.outstandingAmount) || 0
      if (!Number.isSafeInteger(amt) || amt <= 0) {
        toast.error('Số tiền bù trừ phải là số nguyên dương')
        return
      }
      if (amt > outstanding) {
        toast.error('Số tiền bù trừ không được vượt quá số còn nợ')
        return
      }
      if (item.mode === 'internal' && !item.obligationId) {
        toast.error('Vui lòng chọn nghĩa vụ thuế trong danh sách bù trừ')
        return
      }
      if (item.mode === 'external') {
        if (!item.taxCode?.trim() || !item.taxpayerName?.trim() || !item.obligationIdentifier?.trim() || !item.budgetContent?.trim()) {
          toast.error('Vui lòng điền đủ thông tin khoản thuế ngoài danh sách')
          return
        }
      }
    }
    const internalIds = offsets.filter((x) => x.mode === 'internal' && x.obligationId).map((x) => x.obligationId)
    if (new Set(internalIds).size !== internalIds.length) {
      toast.error('Một khoản thuế chỉ được chọn bù trừ một lần')
      return
    }

    if (fromTkn) {
      if (!tknBridge || tknBridge.taxYear !== year) {
        toast.error('Hãy tải lại dữ liệu thông báo doanh thu trước khi xử lý')
        return
      }
      const canRefund = tknBridge.choices.includes('Refund')
      const canOffset = tknBridge.choices.includes('Offset')
      if (!tknBridge.canCreateQttDraft) {
        toast.error('Kỳ thông báo này hiện không đủ điều kiện thực hiện quyết toán')
        return
      }
      if (refundAmount > 0 && !canRefund) {
        toast.error('Kỳ thông báo này không hỗ trợ lựa chọn hoàn tiền')
        return
      }
      if (offsetAmount > 0 && !canOffset) {
        toast.error('Kỳ thông báo này không hỗ trợ lựa chọn bù trừ')
        return
      }
      if (
        overpaid <= 0 ||
        refundAmount + offsetAmount !== overpaid
      ) {
        toast.error('Hãy phân bổ đủ toàn bộ số thuế TNCN nộp thừa')
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

    if (isPreviewMode) {
      toast.success(fromTkn
        ? 'Đã lưu bù trừ toàn bộ số thuế TNCN nộp thừa'
        : 'Đã lưu cách xử lý tiền nộp thừa')
      return declaration
    }

    try {
      setWorking(true)
      const next = fromTkn
        ? await (async () => {
            const bridgeChoice = refundAmount > 0 && offsetAmount === 0 ? 'Refund' : 'Offset'
            const bridge = await applyTknQttNextStep(fromTkn, {
              choice: bridgeChoice,
              refundPaymentAccountId: refundAccountId || null,
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
        ? 'Đã lưu bù trừ toàn bộ số thuế TNCN nộp thừa'
        : 'Đã lưu cách xử lý tiền nộp thừa')
      return next
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể lưu cách xử lý tiền nộp thừa')
      return null
    } finally {
      setWorking(false)
    }
  }

  const confirm = async () => {
    if (!currentBusiness || !declaration || declaration.status !== 'Draft') return

    if (isPreviewMode) {
      setWorking(true)
      setTimeout(() => {
        setWorking(false)
        setDeclaration((prev) => (prev ? { ...prev, status: 'Generated' } : prev))
        toast.success('Đã hoàn tất trải nghiệm xác nhận và khóa hồ sơ quyết toán.')
      }, 500)
      return
    }

    // Tự động kiểm tra và lưu phân bổ tiền nộp thừa nếu có trước khi khóa
    let currentDecl = declaration
    if (overpaid > 0) {
      if (refundAmount + offsetAmount > overpaid) {
        toast.error('Tổng tiền hoàn và bù trừ vượt số đã nộp thừa')
        return
      }
      if (refundAmount > 0 && !refundAccountId) {
        toast.error('Hãy chọn tài khoản ngân hàng nhận hoàn tiền')
        return
      }
      const saved = await saveAllocation()
      if (!saved) return
      currentDecl = saved
    }

    try {
      setWorking(true)
      const next = await confirmQttDeclaration(
        currentBusiness.id,
        currentDecl.declarationId,
        currentDecl.draftRevision
      )
      setDeclaration(next)
      toast.success('Đã xác nhận và khóa hồ sơ quyết toán')
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận hồ sơ quyết toán')
    } finally {
      setWorking(false)
    }
  }

  const download = async () => {
    if (!currentBusiness || !declaration || declaration.status === 'Draft') return
    try {
      setExporting(true)
      const blob = isPreviewMode
        ? await exportQttPreview(currentBusiness.id, year)
        : await exportQttDeclaration(currentBusiness.id, declaration.declarationId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = isPreviewMode
        ? `02-CNKD-TNCN-QTT_XEM-TRUOC_${year}.docx`
        : `02-CNKD-TNCN-QTT_${declaration.taxCode}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      toast.success(isPreviewMode
        ? 'Đã tải tệp hồ sơ quyết toán xem trước (.docx).'
        : 'Đã tải tệp tờ khai về máy. Lưu ý: Tải tờ khai không đồng nghĩa với việc đã hoàn thành nộp hồ sơ hoặc nộp tiền thuế cho cơ quan thuế.', { autoClose: 7000 })
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xuất tờ khai quyết toán')
    } finally {
      setExporting(false)
    }
  }

  const submitDeclaration = () => {
    if (!currentBusiness || !declaration || declaration.status !== 'Generated') return
    setShowSubmitModal(true)
  }

  const executeSubmitDeclaration = async () => {
    if (!declaration || declaration.status !== 'Generated') return
    if (isPreviewMode) {
      setWorking(true)
      setTimeout(() => {
        setWorking(false)
        setDeclaration((prev) => (prev ? { ...prev, status: 'Submitted' } : prev))
        toast.success('Đã hoàn tất trải nghiệm nộp hồ sơ quyết toán.')
      }, 500)
      return
    }
    try {
      setWorking(true)
      await submitTaxDeclaration(declaration.declarationId)
      setDeclaration((prev) => (prev ? { ...prev, status: 'Submitted' } : prev))
      toast.success('Đã ghi nhận tờ khai quyết toán đã nộp cơ quan thuế thành công!')
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
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Quyết toán thuế TNCN</h1>
            <LegalBadge
              formCode='Mẫu 02/CNKD-TNCN-QTT'
              circular='Luật QLT 38/2019/QH14'
              title='Hồ sơ quyết toán thuế TNCN năm theo Luật Quản lý thuế số 38/2019/QH14'
              article='Khoản 2 Điều 44 Luật Quản lý thuế & Nghị định 126/2020/NĐ-CP'
              description={'Hồ sơ quyết toán thuế TNCN năm cho cá nhân kinh doanh nộp thuế theo phương pháp Thu nhập tính thuế.\n\n• Thời hạn nộp hồ sơ: Chậm nhất là ngày 31/03 năm tiếp theo.\n• Miễn thuế nhỏ: Số thuế còn phải nộp từ 50.000đ trở xuống được miễn nộp toàn bộ (Điều 79 Luật QLT).\n• Xử lý nộp thừa: Được hoàn về ngân hàng, bù trừ nghĩa vụ thuế khác hoặc chuyển tiếp sang kỳ sau (Điều 60 Luật QLT).'}
            />
          </div>
          <p className='mt-1 text-sm text-gray-500'>Hồ sơ quyết toán năm {year} · {currentBusiness?.businessName ?? 'Chưa chọn cửa hàng'}</p>
        </div>
        <div className='flex items-end gap-3'>
          <label className='text-sm text-gray-600'>Năm
            <input className='mt-1 block w-28 rounded-lg border px-3 py-2' type='number' value={year}
              onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <button
            type='button'
            onClick={() => load(true)}
            disabled={!currentBusiness || loading}
            className='inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer'
            title='Làm mới dữ liệu từ máy chủ'
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Đang tải lại...' : 'Tải lại'}</span>
          </button>
        </div>
      </div>

      {fromTkn && (
        <div className='rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm leading-6 text-violet-800'>
          Bạn đang tiếp tục từ hồ sơ 01/TKN-CNKD. Hãy tạo hồ sơ quyết toán rồi phân bổ toàn bộ số thuế TNCN nộp thừa vào các nghĩa vụ cần bù trừ.
          {tknBridge?.selectedChoice === 'Offset' && (
            <p className='mt-2 font-semibold text-emerald-700'>Lựa chọn bù trừ từ thông báo doanh thu đã được lưu.</p>
          )}
        </div>
      )}

      {loading && !preview ? (
        <div className='flex items-center justify-center rounded-xl border border-dashed bg-white p-12 text-gray-500'>
          <RefreshCw size={18} className='mr-2 animate-spin text-violet-600' />
          Đang tải dữ liệu quyết toán năm {year}...
        </div>
      ) : !preview ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>Không có dữ liệu quyết toán năm {year}. Hãy bấm “Tải lại”.</div>
      ) : (
        <>
          <QttReadinessPanel
            businessId={currentBusiness?.id ?? ''}
            hardBlockers={preview.hardBlockers}
            warnings={preview.warnings}
            evidenceReviewPeriods={preview.evidenceReviewPeriods}
            year={year}
            onReload={load}
          />

          {/* HAI TRẠNG THÁI TÁCH BIỆT: NGHĨA VỤ TIỀN THUẾ VS TIẾN ĐỘ HỒ SƠ */}
          {(declaration || calculation) && (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs'>
              {/* Cột 1: Nghĩa vụ tiền thuế TNCN */}
              <div className='flex items-start gap-3.5 border-b md:border-b-0 md:border-r border-slate-100 pb-4 md:pb-0 md:pr-4'>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  (declaration?.indicators.indicator19 ?? calculation?.indicators.indicator19 ?? 0) > 0
                    ? 'bg-amber-100 text-amber-700'
                    : (declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0) > 0
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <DollarSign className='h-5 w-5' />
                </div>
                <div className='space-y-1 min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold uppercase tracking-wider text-slate-500'>Nghĩa vụ tiền thuế TNCN</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      (declaration?.indicators.indicator19 ?? calculation?.indicators.indicator19 ?? 0) > 0
                        ? 'bg-amber-100 text-amber-800'
                        : (declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0) > 0
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {(declaration?.indicators.indicator19 ?? calculation?.indicators.indicator19 ?? 0) > 0
                        ? 'Cần nộp thêm'
                        : (declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0) > 0
                          ? 'Nộp thừa'
                          : 'Không cần nộp thêm'}
                    </span>
                  </div>
                  <p className='text-lg font-black text-slate-900'>
                    {(declaration?.indicators.indicator19 ?? calculation?.indicators.indicator19 ?? 0) > 0
                      ? `${money.format(declaration?.indicators.indicator19 ?? calculation!.indicators.indicator19)} đ`
                      : (declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0) > 0
                        ? `${money.format(declaration?.indicators.indicator20 ?? calculation!.indicators.indicator20)} đ`
                        : '0 đ'}
                  </p>
                  <p className='text-xs text-slate-500 leading-relaxed'>
                    {(declaration?.indicators.indicator19 ?? calculation?.indicators.indicator19 ?? 0) > 0
                      ? 'Cần nộp vào Kho bạc Nhà nước trước hạn 31/03 năm tiếp theo.'
                      : (declaration?.indicators.indicator20 ?? calculation?.indicators.indicator20 ?? 0) > 0
                        ? 'Có thể đề nghị hoàn về ngân hàng, bù trừ nợ thuế, hoặc chuyển trừ kỳ sau.'
                        : 'Hộ kinh doanh không phải nộp thêm thuế TNCN và không có số thuế nộp thừa.'}
                  </p>
                </div>
              </div>

              {/* Cột 2: Tình trạng nộp hồ sơ cơ quan thuế */}
              <div className='flex items-start gap-3.5'>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                  declaration?.status === 'Submitted'
                    ? 'bg-emerald-100 text-emerald-700'
                    : declaration?.status === 'Generated'
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                }`}>
                  <FileCheck2 className='h-5 w-5' />
                </div>
                <div className='space-y-1 min-w-0 flex-1'>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-bold uppercase tracking-wider text-slate-500'>Hồ sơ với Cơ quan thuế</span>
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      declaration?.status === 'Submitted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : declaration?.status === 'Generated'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {declaration?.status === 'Submitted'
                        ? 'Đã nộp cơ quan thuế'
                        : declaration?.status === 'Generated'
                          ? 'Đã khóa · Chưa gửi nộp'
                          : declaration
                            ? 'Hồ sơ nháp'
                            : 'Chưa tạo hồ sơ'}
                    </span>
                  </div>
                  <p className='text-sm font-bold text-slate-900'>
                    {declaration?.status === 'Submitted'
                      ? 'Đã hoàn thành nộp tờ khai'
                      : declaration?.status === 'Generated'
                        ? 'Cần nộp tờ khai Word (.docx) đến Cơ quan thuế'
                        : 'Chưa nộp tờ khai quyết toán năm'}
                  </p>
                  <p className='text-xs text-slate-500 leading-relaxed'>
                    {declaration?.status === 'Submitted'
                      ? 'Hồ sơ đã được ghi nhận nộp thành công.'
                      : 'Lưu ý: Tải file Word về máy không đồng nghĩa đã hoàn tất nghĩa vụ nộp hồ sơ hay tiền thuế.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {calculation && (
            <div className='space-y-4'>
              {!preview?.canClose && (
                <div className='rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-amber-900 flex items-start gap-3 shadow-2xs'>
                  <AlertTriangle className='h-5 w-5 text-amber-600 shrink-0 mt-0.5' />
                  <div>
                    <p className='font-bold text-sm'>Bảng tính thuế tạm tính theo doanh thu thực tế lũy kế (Chế độ xem trước)</p>
                    <p className='text-xs text-amber-700 mt-1 leading-relaxed'>
                      Bạn đang xem trước bảng tính thuế TNCN năm {year}. Để chốt sổ và nộp hồ sơ quyết toán chính thức, vui lòng hoàn tất đóng kỳ và rà soát chứng từ của 4 quý theo danh sách kiểm tra bên trên.
                    </p>
                  </div>
                </div>
              )}
              {/* QTT-FE-01: 4 Thẻ kiểm tra dữ liệu nguồn */}
              <div className='rounded-xl border border-gray-200 bg-white p-4'>
                <h3 className='text-xs font-bold uppercase tracking-wider text-gray-500 mb-3'>
                  Đối chiếu số liệu giữa các sổ kế toán
                </h3>
                <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500 flex items-center justify-between'>
                      <span>Doanh thu KD [09a] (S2b)</span>
                      <Tip content='Tổng doanh thu bán hàng cả năm từ Sổ S2b. Căn cứ gốc để tính thu nhập chịu thuế.' side='top' align='end'>
                        <span className='text-[10px] text-gray-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator09a)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500 flex items-center justify-between'>
                      <span>Chi phí nguyên vật liệu xuất dùng [10a] (S2d)</span>
                      <Tip content='Tổng tiền nguyên vật liệu xuất dùng cả năm (từ Sổ kho S2d), tự động loại trừ phiếu chi tiền mặt từ 5 triệu trở lên.' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-gray-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator10a)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500 flex items-center justify-between'>
                      <span>Thuế TNCN đã tạm nộp [15]</span>
                      <Tip content='Tổng số tiền thuế TNCN thực tế đã nộp vào Kho bạc trong năm (có chứng từ xác nhận).' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-gray-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='text-base font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator15)} đ</p>
                  </div>
                  <div className='rounded-lg bg-gray-50 p-3 border border-gray-100'>
                    <span className='text-xs text-gray-500 flex items-center justify-between'>
                      <span>Tồn kho cuối năm [34] (S2d)</span>
                      <Tip content='Tổng giá trị tồn kho cuối năm tính từ Sổ kho S2d, dùng để đối chiếu giá vốn khi quyết toán.' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-gray-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
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
                    <span className='text-gray-500 flex items-center justify-between'>
                      <span>1. Thu nhập tính thuế [11]</span>
                      <Tip content='Doanh thu trừ Chi phí. Nếu kinh doanh bị lỗ, số tiền này sẽ mang giá trị âm.' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-blue-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='font-bold text-gray-900 mt-1'>[09] - [10] = {money.format(calculation.indicators.indicator11)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500 flex items-center justify-between'>
                      <span>2. Thuế phát sinh [13]</span>
                      <Tip content='Lấy Thu nhập tính thuế × Thuế suất. Nếu kinh doanh bị lỗ (thu nhập âm), số thuế tự động = 0đ.' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-blue-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='font-bold text-gray-900 mt-1'>max([11], 0) × {calculation.indicators.indicator12Rate}% = {money.format(calculation.indicators.indicator13)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500 flex items-center justify-between'>
                      <span>3. Đã tạm nộp [15]</span>
                      <Tip content='Tiền thuế TNCN đã tạm nộp theo các quý trong năm để trừ vào số thuế cả năm.' side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-blue-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator15)} đ</p>
                  </div>
                  <div className='rounded-lg bg-white p-2.5 border border-blue-100 shadow-2xs'>
                    <span className='text-gray-500 flex items-center justify-between'>
                      <span>4. Miễn giảm nhỏ [18]</span>
                      <Tip content={'Điều 79 Luật Quản lý thuế:\nSố thuế còn phải nộp từ 50.000đ trở xuống được Nhà nước miễn nộp toàn bộ.'} side='top' align='end' maxWidth='max-w-xs'>
                        <span className='text-[10px] text-blue-400 cursor-help'>ⓘ</span>
                      </Tip>
                    </span>
                    <p className='font-bold text-gray-900 mt-1'>{money.format(calculation.indicators.indicator18)} đ {calculation.indicators.indicator18 > 0 ? '(≤ 50.000đ - Miễn nộp)' : ''}</p>
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
                    <span className='font-bold'>Không phát sinh nghĩa vụ nộp thêm thuế: </span>
                    <span>Hộ kinh doanh không phải nộp thêm thuế TNCN ([19] = 0 đ) và không có số thuế nộp thừa trong năm ([20] = 0 đ). Lưu ý: Bạn vẫn cần hoàn tất và nộp hồ sơ quyết toán năm đến cơ quan thuế.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='flex flex-wrap items-center gap-3'>
            {!isPreviewMode && (
              <button
                type='button'
                onClick={declaration ? () => void load(true) : prepareDeclaration}
                disabled={working || (!declaration && !preview?.canClose)}
                className='rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-bold text-white shadow-md disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed transition-all'
              >
                {declaration
                  ? 'Tải lại hồ sơ'
                  : !preview?.canClose
                    ? 'Chưa đủ điều kiện tính quyết toán'
                    : 'Tính và tạo hồ sơ quyết toán'}
              </button>
            )}

            {!declaration && !preview?.canClose && calculation && (
              <button
                type='button'
                onClick={handlePreviewDeclaration}
                className='inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-violet-700 transition-all cursor-pointer'
              >
                <FileText size={16} /> Xem trước hồ sơ quyết toán 02/QTT →
              </button>
            )}

            {!declaration && !preview?.canClose && (
              <span className='text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg'>
                {preview?.hardBlockers && preview.hardBlockers.length > 0
                  ? '⚠️ Cần hoàn tất đóng đủ 4 Quý trong năm trên trang Thuế trước khi tính quyết toán.'
                  : preview?.warnings.some((w) => w.code === 'EvidenceReviewRequired')
                    ? '⚠️ Cần vào Sổ S2c và bấm "Xác nhận đã rà soát" chi phí cho các Quý trước khi tính quyết toán.'
                    : '⚠️ Cần hoàn tất các điều kiện bắt buộc trước khi tính quyết toán.'}
              </span>
            )}
            {declaration?.status === 'Draft' && (
              <button onClick={confirm} disabled={working || (overpaid > 0 && carryForward < 0)}
                className='inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer'>
                <Check size={16} /> Xác nhận và khóa
              </button>
            )}
            {declaration && (declaration.status !== 'Draft' || isPreviewMode) && (
              <button onClick={download} disabled={exporting}
                className='inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-violet-700 disabled:opacity-50 transition-all cursor-pointer'>
                <Download size={16} /> {isPreviewMode ? 'Tải Word xem trước (.docx)' : 'Tải Word (.docx)'}
              </button>
            )}
            {declaration?.status === 'Generated' && (
              <button onClick={submitDeclaration} disabled={working}
                className='inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-all'>
                <Send size={16} /> Đánh dấu đã nộp bên ngoài
              </button>
            )}
            {declaration?.status === 'Submitted' && (
              <span className='inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-700'>
                <CheckCircle2 size={16} className='text-emerald-600' /> Đã nộp cho cơ quan thuế
              </span>
            )}

            {isPreviewMode && (
              <button
                type='button'
                onClick={() => {
                  setDeclaration(null)
                  setIsPreviewMode(false)
                }}
                className='inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer'
              >
                Thoát xem trước
              </button>
            )}
          </div>

          {declaration && (
            <div className='space-y-5'>
              {isPreviewMode && (
                <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-violet-400 bg-gradient-to-r from-violet-100/90 via-purple-50 to-indigo-50 p-4.5 shadow-sm'>
                  <div className='flex items-start gap-3.5'>
                    <div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm mt-0.5'>
                      <Sparkles className='size-5' />
                    </div>
                    <div>
                      <div className='flex items-center gap-2'>
                        <span className='rounded-md bg-violet-700 px-2 py-0.5 text-[11px] font-black uppercase tracking-wider text-white'>
                          Chế độ xem thử nghiệm
                        </span>
                        <span className='text-xs font-bold text-violet-900'>Mẫu 02/CNKD-TNCN-QTT</span>
                      </div>
                      <p className='mt-1 text-xs sm:text-sm font-medium text-violet-800 leading-relaxed'>
                        Biểu mẫu hồ sơ quyết toán được tạo để bạn xem trước cách bố trí các chỉ tiêu và phân bổ nghĩa vụ thuế. Mọi thao tác đều an toàn và không ảnh hưởng số liệu thật.
                      </p>
                    </div>
                  </div>
                  <div className='shrink-0'>
                    <span className='inline-flex items-center gap-1.5 rounded-full bg-white/80 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-800 shadow-2xs'>
                      <span className='size-2 rounded-full bg-violet-500 animate-pulse' />
                      Môi trường an toàn
                    </span>
                  </div>
                </div>
              )}
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
                  <div className='flex flex-wrap items-center justify-between gap-2 border-b pb-3'>
                    <div>
                      <div className='flex items-center gap-2'>
                        <h2 className='font-semibold text-gray-900'>Xử lý tiền nộp thừa [20]</h2>
                        <span
                          className='rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800 cursor-help'
                          title='Điều 60 Luật Quản lý thuế: Tiền nộp thừa có thể hoàn về ngân hàng [22], bù trừ thuế khác [23], hoặc chuyển trừ vào năm sau [24].'
                        >
                          Điều 60 Luật Quản lý thuế ⓘ
                        </span>
                      </div>
                      <p className='text-sm text-gray-500 mt-0.5'>Tổng có thể phân bổ: <strong>{money.format(overpaid)} đ</strong> (Phần còn lại sẽ tự động chuyển sang trừ vào kỳ sau [24])</p>
                    </div>
                  </div>
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
                  {/* BẢNG TÓM TẮT PHÂN BỔ TIỀN NỘP THỪA THEO THỜI GIAN THỰC [20] = [22] + [23] + [24] */}
                  <div className='rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3'>
                    <div className='flex items-center justify-between border-b border-slate-200 pb-2'>
                      <span className='text-xs font-bold uppercase tracking-wider text-slate-700'>
                        Tóm tắt phân bổ số thuế nộp thừa [20]:
                      </span>
                      <span className='text-sm font-black text-slate-900'>{money.format(overpaid)} đ</span>
                    </div>

                    <div className='grid gap-2.5 sm:grid-cols-3 text-xs'>
                      <div className='rounded-lg bg-white p-3 border border-slate-200 shadow-2xs'>
                        <div className='text-slate-500 flex items-center justify-between'>
                          <span>1. Đề nghị hoàn [22]</span>
                          <Tip content='Số tiền đề nghị Kho bạc/Cơ quan thuế hoàn trực tiếp về tài khoản ngân hàng.' side='top'>
                            <span className='text-[10px] text-slate-400 cursor-help'>ⓘ</span>
                          </Tip>
                        </div>
                        <p className='text-base font-bold text-slate-900 mt-1'>{money.format(Number(refundAmount) || 0)} đ</p>
                        {Number(refundAmount) > 0 && (
                          <p className='text-[11px] text-slate-500 mt-1 truncate'>
                            TK: {accounts.find((a) => a.paymentAccountId === refundAccountId)?.accountNumber || 'Chưa chọn tài khoản'}
                          </p>
                        )}
                      </div>

                      <div className='rounded-lg bg-white p-3 border border-slate-200 shadow-2xs'>
                        <div className='text-slate-500 flex items-center justify-between'>
                          <span>2. Đề nghị bù trừ [23]</span>
                          <Tip content='Số tiền đề nghị trừ vào các khoản nợ thuế TNCN, GTGT, Lệ phí môn bài khác.' side='top'>
                            <span className='text-[10px] text-slate-400 cursor-help'>ⓘ</span>
                          </Tip>
                        </div>
                        <p className='text-base font-bold text-slate-900 mt-1'>{money.format(offsetAmount)} đ</p>
                        <p className='text-[11px] text-slate-500 mt-1'>
                          {offsets.length} khoản nợ thuế được chọn
                        </p>
                      </div>

                      <div className={`rounded-lg p-3 border shadow-2xs ${
                        carryForward < 0
                          ? 'bg-red-50 border-red-200'
                          : 'bg-white border-slate-200'
                      }`}>
                        <div className='text-slate-500 flex items-center justify-between'>
                          <span>3. Chuyển kỳ sau [24]</span>
                          <Tip content='Số tiền còn lại sau khi trừ hoàn và bù trừ: [24] = [20] - [22] - [23]. Sẽ tự động giảm trừ vào số thuế phải nộp của năm tiếp theo.' side='top'>
                            <span className='text-[10px] text-slate-400 cursor-help'>ⓘ</span>
                          </Tip>
                        </div>
                        <p className={`text-base font-bold mt-1 ${carryForward < 0 ? 'text-red-600' : 'text-slate-900'}`}>
                          {money.format(carryForward)} đ
                        </p>
                        <p className={`text-[11px] mt-1 ${carryForward < 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}`}>
                          {carryForward < 0 ? 'Vượt quá số nộp thừa!' : '[20] - [22] - [23]'}
                        </p>
                      </div>
                    </div>

                    {carryForward < 0 ? (
                      <div className='flex items-center gap-2 rounded-lg bg-red-100 border border-red-200 p-2.5 text-xs text-red-800'>
                        <AlertTriangle size={16} className='shrink-0 text-red-600' />
                        <span>
                          <strong>Cảnh báo:</strong> Tổng tiền hoàn ({money.format(Number(refundAmount) || 0)} đ) và bù trừ ({money.format(offsetAmount)} đ) đang vượt quá số nộp thừa ({money.format(overpaid)} đ) là <strong>{money.format(Math.abs(carryForward))} đ</strong>. Vui lòng giảm bớt tiền hoàn hoặc tiền bù trừ.
                        </span>
                      </div>
                    ) : carryForward > 0 ? (
                      <div className='flex items-center gap-2 rounded-lg bg-blue-50 border border-blue-100 p-2 text-xs text-blue-800'>
                        <Info size={15} className='text-blue-600 shrink-0' />
                        <span>
                          Số tiền còn lại <strong>{money.format(carryForward)} đ</strong> sẽ tự động được ghi nhận chuyển sang giảm trừ nghĩa vụ thuế TNCN năm sau [24].
                        </span>
                      </div>
                    ) : (
                      <div className='flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 p-2 text-xs text-emerald-800'>
                        <CheckCircle2 size={15} className='shrink-0 text-emerald-600' />
                        <span>Bạn đã phân bổ trọn vẹn 100% số thuế nộp thừa [20].</span>
                      </div>
                    )}
                  </div>

                  {declaration.status === 'Draft' && (
                    <button onClick={saveAllocation} disabled={working || carryForward < 0}
                      className='inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer'><Save size={16} /> {fromTkn ? 'Hoàn tất bù trừ' : 'Lưu phân bổ'}</button>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* MODAL XÁC NHẬN ĐÁNH DẤU ĐÃ NỘP TỜ KHAI */}
      {showSubmitModal && (
        <div className='fixed inset-0 bg-black/50 backdrop-blur-xs z-60 flex items-center justify-center p-4 animate-in fade-in duration-150'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden p-6 text-center select-none'>
            <div className={`size-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              isPreviewMode ? 'bg-violet-100 text-violet-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isPreviewMode ? <Sparkles size={26} /> : <Send size={26} />}
            </div>
            <h3 className='text-slate-900 font-extrabold text-base mb-1.5'>
              {isPreviewMode
                ? 'Xác nhận gửi thử nghiệm hồ sơ quyết toán?'
                : 'Xác nhận đã nộp tờ khai quyết toán?'}
            </h3>
            <div className='text-slate-600 text-xs leading-relaxed mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left'>
              {isPreviewMode ? (
                <>
                  <p>Đây là thao tác gửi thử nghiệm để bạn làm quen với quy trình quyết toán năm (Mẫu 02/CNKD-TNCN-QTT).</p>
                  <p className='mt-2 text-violet-900 font-medium'>
                    <strong className='text-violet-950 font-bold'>Môi trường an toàn:</strong> Dữ liệu thực tế và kỳ thuế của bạn hoàn toàn an toàn, thao tác này chỉ mô phỏng trạng thái Đã nộp trên màn hình.
                  </p>
                </>
              ) : (
                <>
                  <p>Bạn xác nhận đã nộp tờ khai này đến cơ quan thuế (qua Cổng thông tin điện tử Tổng cục Thuế hoặc trực tiếp tại Chi cục Thuế)?</p>
                  <p className='mt-2'>
                    <strong className='text-slate-800'>Lưu ý quan trọng:</strong> Thao tác này chỉ ghi nhận trạng thái nộp hồ sơ trên TaxMate, không thay thế việc nộp tiền thuế nếu bạn còn số thuế phải nộp.
                  </p>
                </>
              )}
            </div>
            <div className='flex gap-3'>
              <button
                type='button'
                onClick={() => setShowSubmitModal(false)}
                disabled={working}
                className='flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer'
              >
                Quay lại
              </button>
              <button
                type='button'
                onClick={() => {
                  setShowSubmitModal(false)
                  void executeSubmitDeclaration()
                }}
                disabled={working}
                className={`flex-1 py-2.5 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer ${
                  isPreviewMode
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {working
                  ? isPreviewMode
                    ? 'Đang gửi thử...'
                    : 'Đang ghi nhận...'
                  : isPreviewMode
                    ? 'Xác nhận gửi thử'
                    : 'Xác nhận đã nộp'}
              </button>
            </div>
          </div>
        </div>
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

function formatIssueMessage(raw: string) {
  return raw.replace(/(PC|PNK)-([a-f0-9]{4})[a-f0-9]{12}([a-f0-9]{4})/gi, '$1-$2...$3')
}

function QttReadinessPanel({
  businessId,
  hardBlockers,
  warnings,
  evidenceReviewPeriods = [],
  year,
  onReload
}: {
  businessId: string
  hardBlockers: QttPreview['hardBlockers']
  warnings: QttPreview['warnings']
  evidenceReviewPeriods?: QttPreview['evidenceReviewPeriods']
  year: number
  onReload: (isManual?: boolean) => Promise<void>
}) {
  const { businesses, setCurrentBusiness } = useBusiness()
  const navigate = useNavigate()
  const [reviewingAll, setReviewingAll] = useState(false)
  const [reviewingQuarter, setReviewingQuarter] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'expenses' | 'inventory' | null>(null)
  const [searchFilter, setSearchFilter] = useState('')

  // 1. Phân loại Hard Blockers
  const quarterBlockers = useMemo(
    () => hardBlockers.filter((x) => x.code.startsWith('Quarter')),
    [hardBlockers]
  )

  const quarterMap = useMemo(() => {
    const map: Record<number, typeof quarterBlockers> = { 1: [], 2: [], 3: [], 4: [] }
    for (const issue of quarterBlockers) {
      const match = issue.code.match(/Quarter(\d)NotClosed/)
      if (match) {
        const q = Number(match[1])
        if (map[q]) map[q].push(issue)
      } else {
        for (let q = 1; q <= 4; q++) {
          if (issue.message.includes(`Quý ${q}`)) {
            map[q].push(issue)
            break
          }
        }
      }
    }
    return map
  }, [quarterBlockers])

  const otherBlockers = useMemo(
    () => hardBlockers.filter((x) => !x.code.startsWith('Quarter')),
    [hardBlockers]
  )

  // 2. Phân loại Warnings (Cảnh báo mềm)
  const evidenceIssues = useMemo(
    () => warnings.filter((x) => x.code === 'EvidenceReviewRequired'),
    [warnings]
  )

  const expenseIssues = useMemo(
    () => warnings.filter((x) => x.code === 'MissingExpenseEvidence' || x.code === 'ExpenseNotMappedToS2c'),
    [warnings]
  )

  const inventoryIssues = useMemo(
    () =>
      warnings.filter(
        (x) =>
          x.code === 'MissingInventoryPurchaseEvidence' ||
          x.code.startsWith('S2d') ||
          x.code.toLowerCase().includes('inventory')
      ),
    [warnings]
  )

  const otherWarnings = useMemo(
    () =>
      warnings.filter(
        (x) =>
          x.code !== 'EvidenceReviewRequired' &&
          x.code !== 'MissingExpenseEvidence' &&
          x.code !== 'ExpenseNotMappedToS2c' &&
          x.code !== 'MissingInventoryPurchaseEvidence' &&
          !x.code.startsWith('S2d') &&
          !x.code.toLowerCase().includes('inventory')
      ),
    [warnings]
  )

  const allQuartersClosed = quarterBlockers.length === 0
  const canClose = hardBlockers.length === 0
  const totalRiskIssues = expenseIssues.length + inventoryIssues.length + otherWarnings.length
  const allClear = hardBlockers.length === 0 && warnings.length === 0

  const unclosedQuarterCount = useMemo(
    () => Object.values(quarterMap).filter((v) => v.length > 0).length,
    [quarterMap]
  )

  const unreviewedQuarters = useMemo(() => {
    const set = new Set<number>()
    evidenceIssues.forEach((issue) => {
      if (issue.message.includes('01/01/')) set.add(1)
      else if (issue.message.includes('01/04/')) set.add(2)
      else if (issue.message.includes('01/07/')) set.add(3)
      else if (issue.message.includes('01/10/')) set.add(4)
      else {
        const match = issue.message.match(/Quý\s*(\d)/i)
        if (match) set.add(Number(match[1]))
      }
    })
    if (set.size === 0 && evidenceIssues.length > 0) return [1, 2, 3, 4]
    return Array.from(set).sort((a, b) => a - b)
  }, [evidenceIssues])

  const goToQuarter = (taxPeriodId: string | null, targetBusinessId: string | null) => {
    if (targetBusinessId) {
      const target = businesses.find((b) => b.id === targetBusinessId)
      if (target) setCurrentBusiness(target)
    }
    const path = taxPeriodId
      ? `${taxPeriodPreviewPath(taxPeriodId)}?returnTo=qtt&year=${year}`
      : `/business-owner/tax?year=${year}`
    navigate(path)
  }

  const handleReviewAll = async () => {
    try {
      setReviewingAll(true)
      const pending = (evidenceReviewPeriods || []).filter((p) => p.required && !p.reviewed)
      if (pending.length > 0) {
        await Promise.all(pending.map((p) => confirmS2cEvidenceReview(p.businessId, year, p.quarter)))
      } else if (businessId) {
        const quarters = unreviewedQuarters.length > 0 ? unreviewedQuarters : [1, 2, 3, 4]
        await Promise.all(quarters.map((q) => confirmS2cEvidenceReview(businessId, year, q)))
      }
      toast.success(`Đã xác nhận rà soát chi phí cả năm ${year} thành công!`)
      await onReload()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể xác nhận rà soát')
    } finally {
      setReviewingAll(false)
    }
  }

  const handleReviewQuarter = async (q: number) => {
    try {
      setReviewingQuarter(q)
      const targetPeriods = (evidenceReviewPeriods || []).filter((p) => p.quarter === q && p.required && !p.reviewed)
      if (targetPeriods.length > 0) {
        await Promise.all(targetPeriods.map((p) => confirmS2cEvidenceReview(p.businessId, year, p.quarter)))
      } else if (businessId) {
        await confirmS2cEvidenceReview(businessId, year, q)
      }
      toast.success(`Đã xác nhận rà soát chi phí Quý ${q}/${year}!`)
      await onReload()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || `Không thể xác nhận rà soát Quý ${q}`)
    } finally {
      setReviewingQuarter(null)
    }
  }

  // Filter list for drawer
  const drawerIssues = useMemo(() => {
    const list: Array<{
      issue: QttPreview['warnings'][number]
      type: 'expense' | 'inventory' | 'other'
      typeLabel: string
      badgeColor: string
      bookLink: string
    }> = []

    if (activeTab === 'all' || activeTab === 'expenses') {
      list.push(
        ...expenseIssues.map((issue) => ({
          issue,
          type: 'expense' as const,
          typeLabel: 'Chi phí S2c',
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
          bookLink: `/business-owner/tax-books/s2c?year=${year}`
        }))
      )
    }

    if (activeTab === 'all' || activeTab === 'inventory') {
      list.push(
        ...inventoryIssues.map((issue) => ({
          issue,
          type: 'inventory' as const,
          typeLabel: 'Nhập mua S2d',
          badgeColor: 'bg-orange-100 text-orange-800 border-orange-200',
          bookLink: `/business-owner/tax-books/s2c?year=${year}`
        }))
      )
    }

    if (activeTab === 'all') {
      list.push(
        ...otherWarnings.map((issue) => ({
          issue,
          type: 'other' as const,
          typeLabel: 'Cảnh báo khác',
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-200',
          bookLink: `/business-owner/tax?year=${year}`
        }))
      )
    }

    if (!searchFilter.trim()) return list
    const q = searchFilter.toLowerCase()
    return list.filter(
      (item) =>
        item.issue.message.toLowerCase().includes(q) ||
        item.issue.code.toLowerCase().includes(q)
    )
  }, [activeTab, expenseIssues, inventoryIssues, otherWarnings, searchFilter, year])

  return (
    <div className='space-y-4'>
      {/* ── BENTO 1: HERO STATUS BANNER ── */}
      {allClear ? (
        <div className='flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 via-white to-emerald-50/50 p-5 shadow-xs backdrop-blur-md'>
          <div className='flex items-center gap-3.5'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100'>
              <CheckCircle2 className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-sm font-bold text-emerald-950'>Hồ sơ đầy đủ điều kiện quyết toán năm {year}</h2>
                <span className='rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800'>
                  Hoàn tất 4 Quý & Đầy đủ chứng từ
                </span>
              </div>
              <p className='text-xs text-emerald-800/80 mt-0.5'>
                Tất cả kỳ khai thuế đã chốt, chi phí và giá vốn đều đầy đủ hóa đơn/chứng từ hợp lệ theo Thông tư 88.
              </p>
            </div>
          </div>
          <Link
            to={`/business-owner/tax?year=${year}`}
            className='inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-900 bg-white/80 border border-emerald-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-white transition-all'
          >
            <span>Trang Thuế</span>
            <ExternalLink className='h-3 w-3' />
          </Link>
        </div>
      ) : canClose ? (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-5 shadow-xs backdrop-blur-md'>
          <div className='flex items-center gap-3.5'>
            <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-100'>
              <CheckCircle2 className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h2 className='text-sm font-bold text-emerald-950'>Đã đủ điều kiện tính quyết toán năm {year}</h2>
                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800'>
                  <Check className='h-3 w-3 stroke-[3]' /> 4/4 Quý đã đóng
                </span>
              </div>
              <p className='text-xs text-emerald-800/80 mt-0.5'>
                Hồ sơ đã thỏa mãn điều kiện pháp lý để tính toán số thuế. Bạn có thể bấm <strong>"Tính và tạo hồ sơ quyết toán"</strong> bên dưới.
              </p>
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <Link
              to={`/business-owner/tax-books/s2c?year=${year}`}
              className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all'
            >
              <FileText className='h-3.5 w-3.5 text-slate-500' />
              <span>Sổ chi phí S2c</span>
              <ExternalLink className='h-3 w-3 text-slate-400' />
            </Link>
            <Link
              to={`/business-owner/tax?year=${year}`}
              className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all'
            >
              <Calendar className='h-3.5 w-3.5 text-slate-500' />
              <span>Trang Thuế</span>
              <ExternalLink className='h-3 w-3 text-slate-400' />
            </Link>
          </div>
        </div>
      ) : (
        /* BLOCK HARD BLOCKERS: Quý chưa đóng kỳ */
        <div className='rounded-3xl border border-red-200/90 bg-gradient-to-br from-red-50/80 via-white to-red-50/40 p-5 shadow-xs backdrop-blur-md'>
          <div className='flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-red-100'>
            <div className='flex items-center gap-3'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-600 text-white shadow-xs ring-4 ring-red-100'>
                <AlertTriangle className='h-5 w-5' />
              </div>
              <div>
                <div className='flex items-center gap-2'>
                  <h2 className='text-sm font-bold text-slate-900'>Kê khai thuế năm {year}</h2>
                  <span className='rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-900'>
                    Còn {unclosedQuarterCount} Quý chưa hoàn tất
                  </span>
                </div>
                <p className='text-xs text-slate-600 mt-0.5'>
                  Luật Quản lý thuế yêu cầu đóng kỳ đầy đủ 4 Quý của tất cả cơ sở kinh doanh trước khi lập hồ sơ quyết toán năm.
                </p>
              </div>
            </div>
            <Link
              to={`/business-owner/tax?year=${year}`}
              className='inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 bg-white border border-red-200 px-3 py-1.5 rounded-xl shadow-2xs hover:bg-red-50 transition-all'
            >
              <span>Tổng quan Thuế</span>
              <ExternalLink className='h-3 w-3' />
            </Link>
          </div>

          {/* 4 Quarter Rows */}
          <div className='mt-3 space-y-2'>
            {[1, 2, 3, 4].map((q) => {
              const issues = quarterMap[q]
              const isClosed = issues.length === 0

              if (isClosed) {
                return (
                  <div key={q} className='flex items-center gap-3 rounded-2xl bg-emerald-50/60 border border-emerald-100 px-4 py-2.5'>
                    <Check className='h-4 w-4 text-emerald-600 shrink-0 stroke-[2.5]' />
                    <span className='text-sm font-semibold text-emerald-950'>Quý {q}</span>
                    <span className='ml-auto text-xs font-semibold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full'>
                      Đã đóng kỳ
                    </span>
                  </div>
                )
              }

              return (
                <div key={q} className='rounded-2xl border border-red-200 bg-white p-3 shadow-2xs'>
                  <div className='flex items-center justify-between mb-2'>
                    <div className='flex items-center gap-2'>
                      <span className='h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0' />
                      <span className='text-sm font-bold text-slate-900'>Quý {q}</span>
                    </div>
                    <span className='text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full'>
                      Chưa đóng kỳ
                    </span>
                  </div>
                  <div className='space-y-1.5 pl-4 border-l-2 border-red-100 ml-1'>
                    {issues.map((issue, idx) => {
                      const bizName = issue.message.replace(`Quý ${q} — `, '')
                      return (
                        <div
                          key={issue.sourceId ?? issue.businessId ?? idx}
                          className='flex items-center justify-between gap-3'
                        >
                          <span className='text-xs text-slate-700 truncate flex-1'>{bizName}</span>
                          <button
                            type='button'
                            onClick={() => goToQuarter(issue.sourceId ?? null, issue.businessId ?? null)}
                            className='shrink-0 inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 active:scale-95 transition-all shadow-2xs cursor-pointer'
                          >
                            <span>Chốt Quý {q}</span>
                            <ExternalLink className='h-3 w-3' />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── BENTO 2: S2C EVIDENCE REVIEW (Inline 1-click action) ── */}
      {evidenceIssues.length > 0 && (
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-200 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/40 p-5 shadow-xs'>
          <div className='flex items-center gap-3'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-xs'>
              <Sparkles className='h-5 w-5' />
            </div>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-bold text-amber-950'>Xác nhận rà soát chi phí S2c</h3>
                <span className='rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-900'>
                  Bắt buộc (TT 88)
                </span>
              </div>
              <p className='text-xs text-amber-800 mt-0.5'>
                {evidenceIssues.length} kỳ chi phí chưa xác nhận rà soát. Bạn có thể xác nhận ngay tại đây mà không cần rời trang.
              </p>
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Link
              to={`/business-owner/tax-books/s2c?year=${year}`}
              className='inline-flex items-center gap-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-50 transition-all'
            >
              <span>Mở S2c</span>
              <ExternalLink className='h-3 w-3 text-amber-700' />
            </Link>
            <button
              type='button'
              disabled={reviewingAll}
              onClick={handleReviewAll}
              className='inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shadow-sm active:scale-95 disabled:opacity-50 transition-all cursor-pointer'
            >
              <Sparkles className={`h-3.5 w-3.5 ${reviewingAll ? 'animate-spin' : ''}`} />
              <span>{reviewingAll ? 'Đang xác nhận...' : '✨ Xác nhận cả 4 Quý'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ── BENTO 3: LỖI DỮ LIỆU CHẶN CỨNG (Cross-book errors) ── */}
      {otherBlockers.length > 0 && (
        <div className='rounded-3xl border border-red-200 bg-red-50/50 p-5 space-y-2'>
          <p className='text-xs font-bold uppercase tracking-wider text-red-800'>Lỗi dữ liệu cần xử lý</p>
          <div className='space-y-1.5'>
            {otherBlockers.map((b, i) => (
              <div key={i} className='flex items-start gap-2 text-xs text-red-800'>
                <span className='mt-1 h-1.5 w-1.5 rounded-full bg-red-500 shrink-0' />
                <span>{formatIssueMessage(b.message)}</span>
              </div>
            ))}
          </div>
          <div className='pt-2 flex items-center gap-2'>
            <Link
              to={`/business-owner/tax-books/s2c?year=${year}`}
              className='inline-flex items-center gap-1 text-xs font-bold text-red-700 hover:text-red-900 underline underline-offset-2'
            >
              Mở Sổ chi phí S2c <ExternalLink className='h-3 w-3' />
            </Link>
          </div>
        </div>
      )}

      {/* ── BENTO 4: RÀ SOÁT CHỨNG TỪ & RỦI RO THANH KIỂM TRA (APPLE BENTO CARDS + DRAWER) ── */}
      {totalRiskIssues > 0 && (
        <div className='rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/70 via-white to-slate-50/30 p-5 shadow-xs'>
          {/* Header */}
          <div className='flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-slate-100'>
            <div>
              <div className='flex items-center gap-2'>
                <h3 className='text-sm font-bold text-slate-900'>Rà soát chứng từ & Rủi ro thanh kiểm tra</h3>
                <span className='rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700'>
                  {totalRiskIssues} mục cần lưu ý
                </span>
              </div>
              <p className='text-xs text-slate-500 mt-0.5'>
                Các khoản chi hoặc phiếu nhập thiếu hóa đơn/ảnh chứng từ <strong>vẫn được tạm tính thuế</strong>, nhưng có rủi ro bị cơ quan thuế loại trừ khi thanh tra.
              </p>
            </div>
            <Link
              to={`/business-owner/tax-books/s2c?year=${year}`}
              className='inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition-all'
            >
              <FileText className='h-3.5 w-3.5 text-slate-500' />
              <span>Sổ chi phí S2c</span>
              <ExternalLink className='h-3 w-3 text-slate-400' />
            </Link>
          </div>

          {/* 2 Bento Cards */}
          <div className='mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2'>
            {/* Card 1: Chi phí hoạt động S2c */}
            <div className='flex flex-col justify-between rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/40 via-white to-white p-4 shadow-2xs hover:border-blue-200 transition-all'>
              <div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-800'>
                      <FileText className='h-4 w-4' />
                    </div>
                    <div>
                      <h4 className='text-xs font-bold uppercase tracking-wider text-slate-800'>
                        Chi phí hoạt động (S2c)
                      </h4>
                      <p className='text-[11px] text-slate-500'>Dịch vụ, điện nước, mặt bằng...</p>
                    </div>
                  </div>
                  <span className='rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-900'>
                    {expenseIssues.length} khoản chi
                  </span>
                </div>
                <p className='mt-2.5 text-xs text-slate-600 leading-relaxed'>
                  Các khoản chi chưa đính kèm ảnh phiếu chi/hóa đơn dịch vụ. Cơ quan thuế có thể loại khỏi chi phí hợp lý khi thanh tra nếu không có chứng từ chứng minh.
                </p>
              </div>

              <div className='mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveTab(activeTab === 'expenses' ? null : 'expenses')}
                  className='inline-flex items-center gap-1 text-xs font-bold text-blue-800 hover:text-blue-950 transition-colors cursor-pointer'
                >
                  <span>{activeTab === 'expenses' ? 'Thu gọn' : `Xem danh sách (${expenseIssues.length})`}</span>
                  {activeTab === 'expenses' ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
                </button>
                <Link
                  to={`/business-owner/tax-books/s2c?year=${year}`}
                  className='inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-slate-50'
                >
                  <span>Bổ sung trên S2c</span>
                  <ExternalLink className='h-3 w-3' />
                </Link>
              </div>
            </div>

            {/* Card 2: Mua nguyên vật liệu S2d */}
            <div className='flex flex-col justify-between rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/40 via-white to-white p-4 shadow-2xs hover:border-orange-200 transition-all'>
              <div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-8 w-8 items-center justify-center rounded-xl bg-orange-100 text-orange-800'>
                      <Package className='h-4 w-4' />
                    </div>
                    <div>
                      <h4 className='text-xs font-bold uppercase tracking-wider text-slate-800'>
                        Mua nguyên vật liệu (S2d)
                      </h4>
                      <p className='text-[11px] text-slate-500'>Giá vốn hàng nhập xuất dùng</p>
                    </div>
                  </div>
                  <span className='rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-900'>
                    {inventoryIssues.length} phiếu nhập
                  </span>
                </div>
                <p className='mt-2.5 text-xs text-slate-600 leading-relaxed'>
                  Các phiếu nhập hàng tính giá vốn xuất dùng chưa đính kèm hóa đơn mua hàng hợp lệ trên Sổ S2c.
                </p>
              </div>

              <div className='mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between'>
                <button
                  type='button'
                  onClick={() => setActiveTab(activeTab === 'inventory' ? null : 'inventory')}
                  className='inline-flex items-center gap-1 text-xs font-bold text-orange-800 hover:text-orange-950 transition-colors cursor-pointer'
                >
                  <span>{activeTab === 'inventory' ? 'Thu gọn' : `Xem danh sách (${inventoryIssues.length})`}</span>
                  {activeTab === 'inventory' ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
                </button>
                <Link
                  to={`/business-owner/tax-books/s2c?year=${year}`}
                  className='inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-lg shadow-2xs hover:bg-slate-50'
                >
                  <span>Bổ sung trên S2c</span>
                  <ExternalLink className='h-3 w-3' />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Animated Drawer */}
          <AnimatePresence>
            {activeTab && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: 'easeInOut' }}
                className='mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm'
              >
                {/* Segmented Controls & Search Bar */}
                <div className='flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 pb-3 mb-3'>
                  {/* Tabs */}
                  <div className='inline-flex items-center rounded-xl bg-slate-100 p-1'>
                    <button
                      type='button'
                      onClick={() => setActiveTab('all')}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'all'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Tất cả ({totalRiskIssues})
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveTab('expenses')}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'expenses'
                          ? 'bg-white text-blue-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Chi phí S2c ({expenseIssues.length})
                    </button>
                    <button
                      type='button'
                      onClick={() => setActiveTab('inventory')}
                      className={`rounded-lg px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'inventory'
                          ? 'bg-white text-orange-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Nhập mua S2d ({inventoryIssues.length})
                    </button>
                  </div>

                  {/* Search & Close */}
                  <div className='flex items-center gap-2'>
                    <div className='relative'>
                      <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400' />
                      <input
                        type='text'
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder='Lọc mã PC-, PNK-...'
                        className='h-8 w-44 rounded-lg border border-slate-200 bg-slate-50/50 pl-8 pr-2.5 text-xs text-slate-800 placeholder-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none'
                      />
                    </div>
                    <button
                      type='button'
                      onClick={() => setActiveTab(null)}
                      className='rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer'
                    >
                      Đóng ✕
                    </button>
                  </div>
                </div>

                {/* List Items with Direct CTA Links */}
                <div className='max-h-72 space-y-2 overflow-y-auto pr-1'>
                  {drawerIssues.length === 0 ? (
                    <div className='py-6 text-center text-xs text-slate-400'>
                      Không tìm thấy mục nào phù hợp với từ khóa.
                    </div>
                  ) : (
                    drawerIssues.map((item, index) => (
                      <div
                        key={`${item.issue.code}-${item.issue.sourceId ?? index}`}
                        className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs hover:bg-slate-100/70 transition-colors'
                      >
                        <div className='flex items-center gap-2.5 min-w-0 flex-1'>
                          <span
                            className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-bold ${item.badgeColor}`}
                          >
                            {item.typeLabel}
                          </span>
                          <span className='text-slate-800 font-medium truncate'>
                            {formatIssueMessage(item.issue.message)}
                          </span>
                        </div>
                        <Link
                          to={item.bookLink}
                          className='shrink-0 inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700 border border-slate-200 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition-all'
                        >
                          <span>Bổ sung trên S2c</span>
                          <ExternalLink className='h-3 w-3 text-slate-400' />
                        </Link>
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer Footer Tip */}
                <div className='mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500'>
                  <span>💡 Bấm "Bổ sung trên S2c" để chuyển sang sổ kế toán và tải ảnh chứng từ hóa đơn lên hệ thống.</span>
                  <Link
                    to={`/business-owner/tax-books/s2c?year=${year}`}
                    className='font-semibold text-violet-700 hover:text-violet-900 inline-flex items-center gap-1'
                  >
                    <span>Mở toàn bộ Sổ S2c</span>
                    <ExternalLink className='h-3 w-3' />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
