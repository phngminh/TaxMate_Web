import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ExternalLink,
  FileText,
  ReceiptText,
  Trash2
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { toast } from 'react-toastify'

import { getTaxPeriodById, cancelTaxPeriodDrafts } from '../../../apis/taxPeriod.api'
import { getTaxDeclarationByTaxPeriod } from '../../../apis/taxDeclaration.api'
import { useBusiness } from '../../../contexts/BusinessContext'

import type {
  DataCheckStatus,
  TaxPeriodDetail,
  TaxPeriodStatus
} from '../../../types/taxPeriod.type'

import {
  taxPeriodCalculationPath,
  taxPeriodDeclarationPath,
  taxPeriodPreviewPath
} from '../../../utils/taxPeriodRoute'
import path from '../../../constants/path'

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(value?: string | null) {
  if (!value) {
    return 'Chưa có'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định'
  }

  return date.toLocaleDateString('vi-VN')
}

function getPeriodTitle(period: TaxPeriodDetail) {
  if (period.periodType === 'Quarterly') {
    return `Kỳ thuế Quý ${period.quarter}/${period.year}`
  }

  if (period.periodType === 'Monthly') {
    return `Kỳ thuế Tháng ${period.month}/${period.year}`
  }

  return `Kỳ thuế Năm ${period.year}`
}

function getStatusLabel(status: TaxPeriodStatus) {
  switch (status) {
    case 'Open':
      return 'Đang mở'

    case 'Closed':
      return 'Đã chốt'

    case 'Calculated':
      return 'Đã tính thuế'

    case 'Submitted':
      return 'Đã nộp tờ khai'

    case 'Paid':
      return 'Đã hoàn tất'

    default:
      return status
  }
}

function getStatusDescription(status: TaxPeriodStatus) {
  switch (status) {
    case 'Open':
      return 'Kiểm tra dữ liệu doanh thu trước khi chốt kỳ.'

    case 'Closed':
      return 'Kỳ thuế đã được chốt. Bước tiếp theo là tính thuế.'

    case 'Calculated':
      return 'Số thuế đã được tính. Bạn có thể tạo và xuất tờ khai.'

    case 'Submitted':
      return 'Tờ khai của kỳ thuế này đã được tạo và gửi trước đó.'

    case 'Paid':
      return 'Kỳ thuế này đã hoàn tất.'

    default:
      return ''
  }
}

function getDataCheckLabel(status: DataCheckStatus) {
  switch (status) {
    case 'Good':
      return 'Dữ liệu ổn'

    case 'Warning':
      return 'Cần kiểm tra'

    case 'NeedReview':
      return 'Chưa có dữ liệu'

    default:
      return status
  }
}

function getDataCheckClasses(status: DataCheckStatus) {
  switch (status) {
    case 'Good':
      return 'bg-green-100 text-green-700'

    case 'Warning':
      return 'bg-amber-100 text-amber-700'

    case 'NeedReview':
      return 'bg-red-100 text-red-700'

    default:
      return 'bg-gray-100 text-gray-600'
  }
}

function getPrimaryActionLabel(status: TaxPeriodStatus) {
  switch (status) {
    case 'Open':
      return 'Xem doanh thu trước khi chốt'

    case 'Closed':
      return 'Tính thuế'

    case 'Calculated':
      return 'Xem / tạo tờ khai'

    case 'Submitted':
      return 'Xem tờ khai đã gửi'

    case 'Paid':
      return 'Xem tờ khai'

    default:
      return 'Tiếp tục'
  }
}

function MetricCard({
  label,
  value,
  danger,
  warning,
  success,
  isPending
}: {
  label: string
  value: string
  danger?: boolean
  warning?: boolean
  success?: boolean
  isPending?: boolean
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-all ${
        isPending
          ? 'border-dashed border-gray-200 bg-gray-50/40'
          : 'border-gray-100'
      }`}
    >
      <div className='flex items-center justify-between gap-2'>
        <p className='text-sm font-semibold text-gray-500'>
          {label}
        </p>
        {isPending && (
          <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500'>
            <Clock size={11} /> Chờ tính
          </span>
        )}
      </div>

      <div className='mt-2.5 flex items-baseline'>
        {isPending ? (
          <span className='inline-flex items-center rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 shadow-2xs'>
            {value}
          </span>
        ) : (
          <p
            className={`text-2xl font-black ${
              danger
                ? 'text-red-600'
                : warning
                  ? 'text-amber-600'
                  : success
                    ? 'text-green-600'
                    : 'text-gray-900'
            }`}
          >
            {value}
          </p>
        )}
      </div>
    </div>
  )
}

interface BreakdownChip {
  businessId: string
  businessName: string
  count: number
  onClick: (e: React.MouseEvent) => void
}

function InfoRow({
  label,
  value,
  onClick,
  actionText,
  warning,
  danger,
  success,
  isPending,
  breakdowns
}: {
  label: string
  value: string | number
  onClick?: () => void
  actionText?: string
  warning?: boolean
  danger?: boolean
  success?: boolean
  isPending?: boolean
  breakdowns?: BreakdownChip[]
}) {
  const isZero = typeof value === 'number' ? value === 0 : Number(value) === 0
  const canClick = Boolean(onClick && (!danger && !warning || !isZero))

  return (
    <div className='border-b border-gray-100 py-3 last:border-b-0'>
      <div
        onClick={canClick ? onClick : undefined}
        className={`flex items-center justify-between gap-4 ${
          canClick
            ? 'group cursor-pointer hover:bg-gray-50/90 -mx-3 px-3 py-1 rounded-xl transition-all'
            : '-mx-3 px-3 py-1'
        }`}
      >
        <span
          className={`text-sm font-medium transition-colors ${
            canClick ? 'text-gray-600 group-hover:text-gray-900' : 'text-gray-500'
          }`}
        >
          {label}
        </span>

        <div className='flex items-center gap-2'>
          {isPending ? (
            <span className='inline-flex items-center rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500'>
              {value}
            </span>
          ) : (
            <span
              className={`text-right text-sm font-bold tabular-nums ${
                danger && !isZero
                  ? 'text-red-600 font-black'
                  : warning && !isZero
                    ? 'text-amber-600 font-black'
                    : isZero
                      ? 'text-gray-800'
                      : success
                        ? 'text-green-600'
                        : 'text-gray-800'
              }`}
            >
              {value}
            </span>
          )}

          {canClick && actionText && !isZero && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold transition-all shadow-2xs ${
                danger
                  ? 'bg-red-50 text-red-700 group-hover:bg-red-100 border border-red-200'
                  : warning
                    ? 'bg-amber-50 text-amber-700 group-hover:bg-amber-100 border border-amber-200'
                    : 'bg-gray-100 text-gray-700 group-hover:bg-blue-50 group-hover:text-blue-700 border border-gray-200 group-hover:border-blue-200'
              }`}
            >
              <span>{actionText}</span>
              <ExternalLink size={10} />
            </span>
          )}
        </div>
      </div>

      {breakdowns && breakdowns.length > 1 && (
        <div className='mt-2 flex flex-wrap items-center gap-1.5 pl-1'>
          <span className='text-[11px] font-medium text-gray-400'>Theo cơ sở:</span>
          {breakdowns.map((b) => {
            const isItemZero = b.count === 0
            return (
              <button
                key={b.businessId}
                type='button'
                disabled={isItemZero}
                onClick={isItemZero ? undefined : b.onClick}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-all select-none ${
                  isItemZero
                    ? 'bg-gray-50/90 text-gray-400 border border-gray-200/70 cursor-default'
                    : b.count > 0 && danger
                      ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer'
                      : b.count > 0 && warning
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 shadow-2xs hover:scale-105 active:scale-95 cursor-pointer'
                }`}
                title={isItemZero ? 'Không có đơn nào' : `Xem đơn của ${b.businessName}`}
              >
                <span className='truncate max-w-[120px]'>{b.businessName}</span>
                <span
                  className={`rounded px-1.5 py-0.2 text-[11px] font-black ${
                    isItemZero
                      ? 'bg-gray-100 text-gray-400'
                      : b.count > 0 && danger
                        ? 'bg-red-200/80 text-red-800'
                        : b.count > 0 && warning
                          ? 'bg-amber-200/80 text-amber-800'
                          : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {b.count}
                </span>
                {!isItemZero && <ExternalLink size={10} className='opacity-60' />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isProcessing,
  confirmVariant = 'warning',
  onConfirm,
  onCancel
}: {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  isProcessing?: boolean
  confirmVariant?: 'danger' | 'warning'
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
      role='presentation'
    >
      <div
        role='dialog'
        aria-modal='true'
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
      >
        <div className='flex items-start gap-4'>
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${confirmVariant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle size={22} />
          </div>

          <div className='min-w-0'>
            <h2 className='text-lg font-black text-gray-900'>
              {title}
            </h2>

            <p className='mt-2 text-sm leading-6 text-gray-500'>
              {description}
            </p>
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            disabled={isProcessing}
            onClick={onCancel}
            className='h-11 rounded-xl border border-gray-300 bg-white px-5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
          >
            Hủy
          </button>

          <button
            type='button'
            disabled={isProcessing}
            onClick={onConfirm}
            className={`h-11 min-w-32 rounded-xl px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:bg-gray-300 ${confirmVariant === 'warning' ? 'bg-amber-500 hover:bg-amber-600' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {isProcessing ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TaxPeriodDetailPage() {
  const navigate = useNavigate()

  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()

  const [taxPeriod, setTaxPeriod] = useState<TaxPeriodDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [declarationStatus, setDeclarationStatus] = useState<'Draft' | 'Submitted' | null>(null)
  const [isCancellingDrafts, setIsCancellingDrafts] = useState(false)
  const [isCancelDraftsConfirmOpen, setIsCancelDraftsConfirmOpen] = useState(false)

  const { businesses } = useBusiness()

  const loadTaxPeriod = useCallback(async () => {
    if (!taxPeriodId) {
      setErrorMessage('Không tìm thấy mã kỳ thuế.')
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setErrorMessage(null)

      const periodResult = await getTaxPeriodById(taxPeriodId)
      setTaxPeriod(periodResult)

      if (
        periodResult.status === 'Calculated' ||
        periodResult.status === 'Submitted' ||
        periodResult.status === 'Paid'
      ) {
        const declarationResult = await getTaxDeclarationByTaxPeriod(taxPeriodId)
        setDeclarationStatus(declarationResult?.status ?? null)
      } else {
        setDeclarationStatus(null)
      }
    } catch (error) {
      console.error('[TaxPeriodDetail] Failed:', error)
      setErrorMessage('Không thể tải chi tiết kỳ thuế.')
    } finally {
      setIsLoading(false)
    }
  }, [taxPeriodId])

  useEffect(() => {
    void loadTaxPeriod()
  }, [loadTaxPeriod])

  async function handleConfirmCancelDrafts() {
    if (!taxPeriodId) return

    try {
      setIsCancellingDrafts(true)
      const count = await cancelTaxPeriodDrafts(taxPeriodId)
      toast.success(`Đã hủy thành công ${count} đơn hàng nháp trong kỳ.`)
      setIsCancelDraftsConfirmOpen(false)
      await loadTaxPeriod()
    } catch (error: any) {
      console.error('[TaxPeriodDetail] Cancel drafts failed:', error)
      toast.error(error?.response?.data?.message || 'Không thể hủy các đơn hàng nháp.')
    } finally {
      setIsCancellingDrafts(false)
    }
  }

  const appliedTaxRate = useMemo(() => {
    if (!taxPeriod || taxPeriod.taxableRevenue <= 0 || taxPeriod.estimatedTax <= 0) {
      return 0
    }

    return Number(((taxPeriod.estimatedTax / taxPeriod.taxableRevenue) * 100).toFixed(2))
  }, [taxPeriod])

  function handlePrimaryAction() {
    if (!taxPeriod || !taxPeriodId) {
      return
    }

    switch (taxPeriod.status) {
      case 'Open':
        navigate(taxPeriodPreviewPath(taxPeriodId))
        return

      case 'Closed':
        navigate(taxPeriodCalculationPath(taxPeriodId))
        return

      case 'Calculated':
      case 'Submitted':
      case 'Paid':
        navigate(taxPeriodDeclarationPath(taxPeriodId))
        return
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='text-center'>
          <div className='mx-auto size-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600' />
          <p className='mt-4 text-sm font-semibold text-gray-500'>Đang tải kỳ thuế...</p>
        </div>
      </div>
    )
  }

  if (errorMessage || !taxPeriod) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] px-6'>
        <div className='w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle size={48} className='mx-auto text-red-500' />
          <h2 className='mt-4 text-xl font-black text-gray-900'>Không tìm thấy kỳ thuế</h2>
          <p className='mt-2 text-sm text-gray-500'>{errorMessage}</p>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700'
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const hasWarning = taxPeriod.dataCheckStatus !== 'Good'
  const isCalculated = ['Calculated', 'Submitted', 'Paid'].includes(taxPeriod.status)

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto w-full max-w-7xl'>
        <button
          type='button'
          onClick={() => navigate(-1)}
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-red-600'
        >
          <ArrowLeft size={18} />
          Quay lại tổng quan thuế
        </button>

        <div className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
          <div className='flex flex-wrap items-start justify-between gap-5'>
            <div className='flex items-start gap-4'>
              <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
                <ReceiptText size={28} />
              </div>

              <div>
                <h1 className='text-2xl font-black text-gray-900'>
                  {getPeriodTitle(taxPeriod)}
                </h1>

                <p className='mt-1 text-sm font-semibold text-gray-500'>
                  {formatDate(taxPeriod.periodStartDate)}
                  {' - '}
                  {formatDate(taxPeriod.periodEndDate)}
                </p>

                <p className='mt-1 text-sm text-gray-400'>
                  Hạn nộp: {formatDate(taxPeriod.dueDate)}
                </p>
              </div>
            </div>

            <div className='text-right'>
              <span className='inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700'>
                {getStatusLabel(taxPeriod.status)}
              </span>

              <p className='mt-2 max-w-sm text-sm leading-6 text-gray-500'>
                {getStatusDescription(taxPeriod.status)}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Tổng doanh thu'
            value={formatMoney(taxPeriod.totalRevenue)}
          />

          <MetricCard
            label='Doanh thu chịu thuế'
            value={formatMoney(taxPeriod.taxableRevenue)}
          />

          <MetricCard
            label='Tổng thuế ước tính'
            value={isCalculated ? formatMoney(taxPeriod.estimatedTax) : 'Chưa tính toán'}
            isPending={!isCalculated}
          />

          <MetricCard
            label='Số thuế chưa nộp'
            value={isCalculated ? formatMoney(taxPeriod.taxAmountDebt) : 'Chưa tính'}
            isPending={!isCalculated}
            danger={
              isCalculated &&
              taxPeriod.taxAmountDebt > 0 &&
              Boolean(
                taxPeriod.dueDate &&
                  new Date() > new Date(taxPeriod.dueDate)
              )
            }
            warning={
              isCalculated &&
              taxPeriod.taxAmountDebt > 0 &&
              (!taxPeriod.dueDate ||
                new Date() <= new Date(taxPeriod.dueDate))
            }
            success={isCalculated && taxPeriod.taxAmountDebt === 0}
          />
        </div>

        <div className='mt-6 grid gap-6 xl:grid-cols-2'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <div className='mb-5 flex items-center gap-3'>
              <div className='flex size-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600'>
                <Calculator size={21} />
              </div>

              <h2 className='text-lg font-black text-gray-900'>
                Chi tiết tính thuế
              </h2>
            </div>

            <InfoRow
              label='Doanh thu bán hàng'
              value={formatMoney(taxPeriod.salesRevenue)}
            />

            <InfoRow
              label='Doanh thu khác'
              value={formatMoney(taxPeriod.otherRevenue)}
            />

            <InfoRow
              label='Thuế GTGT ước tính'
              value={isCalculated ? formatMoney(taxPeriod.vatTaxAmount) : 'Chưa tính'}
              isPending={!isCalculated}
            />

            <InfoRow
              label='Thuế TNCN ước tính'
              value={isCalculated ? formatMoney(taxPeriod.personalIncomeTaxAmount) : 'Chưa tính'}
              isPending={!isCalculated}
            />

            <InfoRow
              label='Tỷ lệ thuế tạm tính'
              value={isCalculated ? `${appliedTaxRate}%` : 'Chờ tính toán'}
              isPending={!isCalculated}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <div className='mb-5 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600'>
                  <CheckCircle2 size={21} />
                </div>

                <h2 className='text-lg font-black text-gray-900'>
                  Kiểm tra dữ liệu
                </h2>
              </div>

              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${getDataCheckClasses(
                  taxPeriod.dataCheckStatus
                )}`}
              >
                {getDataCheckLabel(taxPeriod.dataCheckStatus)}
              </span>
            </div>

            <InfoRow
              label='Số giao dịch'
              value={taxPeriod.transactionCount}
              actionText='Xem tất cả'
              onClick={() => {
                const params = new URLSearchParams()
                if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
              }}
              breakdowns={taxPeriod.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.transactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const params = new URLSearchParams()
                  params.set('businessId', b.businessId)
                  if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                  navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
                }
              }))}
            />

            <InfoRow
              label='Đã thanh toán'
              value={taxPeriod.paidTransactionCount}
              actionText='Xem đơn'
              onClick={() => {
                const params = new URLSearchParams()
                params.set('status', 'Completed')
                if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
              }}
              breakdowns={taxPeriod.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.paidTransactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const params = new URLSearchParams()
                  params.set('businessId', b.businessId)
                  params.set('status', 'Completed')
                  if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                  navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
                }
              }))}
            />

            <InfoRow
              label='Chưa thanh toán'
              value={taxPeriod.unpaidTransactionCount}
              warning={taxPeriod.unpaidTransactionCount > 0}
              actionText={taxPeriod.unpaidTransactionCount > 0 ? 'Xử lý ngay' : undefined}
              onClick={() => {
                const params = new URLSearchParams()
                params.set('taxPeriodId', taxPeriod.id)
                params.set('status', 'Unpaid')
                if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
              }}
              breakdowns={taxPeriod.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.unpaidTransactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const params = new URLSearchParams()
                  params.set('businessId', b.businessId)
                  params.set('taxPeriodId', taxPeriod.id)
                  params.set('status', 'Unpaid')
                  if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                  navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
                }
              }))}
            />

            <InfoRow
              label='Chưa xuất HĐĐT'
              value={taxPeriod.missingInvoiceCount}
              warning={taxPeriod.missingInvoiceCount > 0}
              actionText={taxPeriod.missingInvoiceCount > 0 ? 'Xuất HĐ ngay' : undefined}
              onClick={() => {
                const params = new URLSearchParams()
                params.set('status', 'Completed')
                params.set('hasInvoice', 'false')
                if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
              }}
              breakdowns={taxPeriod.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.missingInvoiceCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const params = new URLSearchParams()
                  params.set('businessId', b.businessId)
                  params.set('status', 'Completed')
                  params.set('hasInvoice', 'false')
                  if (taxPeriod.periodStartDate) params.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod.periodEndDate) params.set('endDate', taxPeriod.periodEndDate)
                  navigate(`${path.BUSINESS_OWNER_ORDERS}?${params.toString()}`)
                }
              }))}
            />

            <InfoRow
              label='Số khoản chi phí'
              value={taxPeriod.expenseCount}
              actionText='Xem chi phí'
              onClick={() => {
                const params = new URLSearchParams()
                params.set('year', taxPeriod.year.toString())
                if (taxPeriod.quarter) params.set('quarter', taxPeriod.quarter.toString())
                navigate(`${path.BUSINESS_OWNER_S2C_BOOK}?${params.toString()}`)
              }}
            />

            {hasWarning && (
              <div className='mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4'>
                <div className='flex items-center gap-3'>
                  <AlertTriangle
                    size={20}
                    className='mt-0.5 shrink-0 text-amber-600'
                  />

                  <p className='text-sm leading-6 text-amber-800'>
                    Kỳ này còn dữ liệu cần kiểm tra. Hãy xem lại doanh thu trước khi chốt kỳ thuế.
                  </p>
                </div>

                {taxPeriod.unpaidTransactionCount > 0 && (
                  <button
                    type='button'
                    disabled={isCancellingDrafts}
                    onClick={() => setIsCancelDraftsConfirmOpen(true)}
                    className='inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 shrink-0'
                  >
                    <Trash2 size={13} />
                    {isCancellingDrafts ? 'Đang hủy...' : `Hủy nhanh ${taxPeriod.unpaidTransactionCount} đơn nháp`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <h2 className='text-lg font-black text-gray-900'>
            Luồng khai thuế
          </h2>

          <div className='mt-5 grid gap-4 md:grid-cols-5'>
            <FlowStep
              number={1}
              title='Kiểm tra doanh thu'
              done
            />

            <FlowStep
              number={2}
              title='Chốt kỳ thuế'
              done={taxPeriod.status !== 'Open'}
            />

            <FlowStep
              number={3}
              title='Tính thuế'
              done={[
                'Calculated',
                'Submitted',
                'Paid'
              ].includes(taxPeriod.status)}
            />

            <FlowStep
              number={4}
              title='Tạo tờ khai'
              done={declarationStatus !== null}
            />

            <FlowStep
              number={5}
              title='Gửi tờ khai'
              done={declarationStatus === 'Submitted'}
            />
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={() => navigate(-1)}
            className='h-12 rounded-xl border border-gray-300 bg-white px-6 text-sm font-bold text-gray-700 hover:bg-gray-50'
          >
            Quay lại
          </button>

          <button
            type='button'
            onClick={handlePrimaryAction}
            className='flex h-12 min-w-56 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700'
          >
            {taxPeriod.status === 'Open' ? (
              <CircleDollarSign size={18} />
            ) : (
              <FileText size={18} />
            )}

            {getPrimaryActionLabel(taxPeriod.status)}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={isCancelDraftsConfirmOpen}
        title='Hủy toàn bộ đơn nháp trong kỳ?'
        description={`Bạn có chắc chắn muốn hủy tất cả ${taxPeriod.unpaidTransactionCount} đơn hàng nháp dở dang của tất cả các cơ sở trong kỳ thuế này không? Thao tác này sẽ chuyển các đơn nháp sang trạng thái "Đã hủy" để đưa số chưa thanh toán về 0.`}
        confirmLabel='Xác nhận hủy đơn nháp'
        confirmVariant='warning'
        isProcessing={isCancellingDrafts}
        onCancel={() => setIsCancelDraftsConfirmOpen(false)}
        onConfirm={() => void handleConfirmCancelDrafts()}
      />
    </div>
  )
}

function FlowStep({
  number,
  title,
  done
}: {
  number: number
  title: string
  done: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        done
          ? 'border-green-200 bg-green-50'
          : 'border-gray-200 bg-gray-50'
      }`}
    >
      <div
        className={`flex size-8 items-center justify-center rounded-full text-sm font-black ${
          done
            ? 'bg-green-600 text-white'
            : 'bg-gray-200 text-gray-500'
        }`}
      >
        {done ? <CheckCircle2 size={17} /> : number}
      </div>

      <p className='mt-3 text-sm font-bold text-gray-800'>
        {title}
      </p>
    </div>
  )
}
