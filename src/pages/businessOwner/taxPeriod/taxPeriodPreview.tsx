import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  LockKeyhole,
  ReceiptText,
  Trash2
} from 'lucide-react'
import {
  useEffect,
  useState
} from 'react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'
import { toast } from 'react-toastify'

import {
  cancelTaxPeriodDrafts,
  closeTaxPeriod,
  getTaxPeriodById,
  getTaxPeriodCalculationPreview,
  getTaxPeriodPreview
} from '../../../apis/taxPeriod.api'

import path from '../../../constants/path'

import type {
  CalculateTaxPeriodResponse,
  TaxPeriodDetail,
  TaxPeriodPreview
} from '../../../types/taxPeriod.type'

import {
  taxPeriodCalculationPath,
  taxPeriodDetailPath
} from '../../../utils/taxPeriodRoute'

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatDate(
  value?: string | null
) {
  if (!value) return 'Chưa có'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định'
  }

  return date.toLocaleDateString('vi-VN')
}

function InfoRow({
  label,
  value,
  danger
}: {
  label: string
  value: string | number
  danger?: boolean
}) {
  return (
    <div className='flex items-center justify-between gap-6 border-b border-gray-100 py-3 last:border-b-0'>
      <span className='text-sm text-gray-500'>
        {label}
      </span>

      <span
        className={`text-right text-sm font-bold ${
          danger
            ? 'text-red-600'
            : 'text-gray-800'
        }`}
      >
        {value}
      </span>
    </div>
  )
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  isProcessing,
  confirmVariant = 'danger',
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
        aria-labelledby='confirm-dialog-title'
        aria-describedby='confirm-dialog-description'
        className='w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl'
      >
        <div className='flex items-start gap-4'>
          <div className={`flex size-11 shrink-0 items-center justify-center rounded-full ${confirmVariant === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
            <AlertTriangle size={22} />
          </div>

          <div className='min-w-0'>
            <h2
              id='confirm-dialog-title'
              className='text-lg font-black text-gray-900'
            >
              {title}
            </h2>

            <p
              id='confirm-dialog-description'
              className='mt-2 text-sm leading-6 text-gray-500'
            >
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

export default function TaxPeriodPreviewPage() {
  const navigate = useNavigate()

  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()

  const [
    taxPeriod,
    setTaxPeriod
  ] =
    useState<TaxPeriodDetail | null>(
      null
    )

  const [
    preview,
    setPreview
  ] =
    useState<TaxPeriodPreview | null>(
      null
    )

  const [
    calcPreview,
    setCalcPreview
  ] = useState<CalculateTaxPeriodResponse | null>(null)

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    isClosing,
    setIsClosing
  ] = useState(false)

  const [
    isCloseConfirmOpen,
    setIsCloseConfirmOpen
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(null)

  const [
    isCancellingDrafts,
    setIsCancellingDrafts
  ] = useState(false)

  const [
    isCancelDraftsConfirmOpen,
    setIsCancelDraftsConfirmOpen
  ] = useState(false)

  useEffect(() => {
    let active = true

    async function loadData() {
      if (!taxPeriodId) {
        setErrorMessage(
          'Không tìm thấy mã kỳ thuế.'
        )
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)

        const [
          periodResult,
          previewResult,
          calcResult
        ] = await Promise.all([
          getTaxPeriodById(
            taxPeriodId
          ),
          getTaxPeriodPreview(
            taxPeriodId
          ),
          getTaxPeriodCalculationPreview(
            taxPeriodId
          ).catch(() => null)
        ])

        if (!active) return

        setTaxPeriod(periodResult)
        setPreview(previewResult)
        setCalcPreview(calcResult)
      } catch (error) {
        console.error(
          '[TaxPeriodPreview] Failed:',
          error
        )

        if (!active) return

        setErrorMessage(
          'Không thể tải dữ liệu xem trước kỳ thuế.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      active = false
    }
  }, [taxPeriodId])

  function handleClosePeriod() {
    if (
      !taxPeriodId ||
      !taxPeriod ||
      !preview
    ) {
      return
    }

    if (taxPeriod.status !== 'Open') {
      toast.info(
        'Kỳ thuế này đã được xử lý và không thể chốt lại.'
      )
      return
    }

    if (!preview.canClose) {
      toast.warning(
        'Kỳ thuế chưa đủ điều kiện để chốt.'
      )
      return
    }

    setIsCloseConfirmOpen(true)
  }

  async function confirmClosePeriod() {
    if (
      !taxPeriodId ||
      !preview
    ) {
      return
    }

    try {
      setIsClosing(true)

      await closeTaxPeriod(
        taxPeriodId,
        {
          confirmWarnings:
            preview.warnings.length > 0
        }
      )

      setIsCloseConfirmOpen(false)

      toast.success(
        'Chốt kỳ thuế thành công.'
      )

      navigate(
        taxPeriodDetailPath(
          taxPeriodId
        ),
        {
          replace: true
        }
      )
    } catch (error) {
      console.error(
        '[TaxPeriodPreview] Close failed:',
        error
      )

      toast.error(
        'Không thể chốt kỳ thuế.'
      )
    } finally {
      setIsClosing(false)
    }
  }

  async function handleConfirmCancelDrafts() {
    if (!taxPeriodId) return

    try {
      setIsCancellingDrafts(true)
      const count = await cancelTaxPeriodDrafts(taxPeriodId)
      toast.success(`Đã hủy thành công ${count} đơn hàng nháp trong kỳ.`)
      setIsCancelDraftsConfirmOpen(false)

      const [periodResult, previewResult] = await Promise.all([
        getTaxPeriodById(taxPeriodId),
        getTaxPeriodPreview(taxPeriodId)
      ])
      setTaxPeriod(periodResult)
      setPreview(previewResult)
    } catch (error: any) {
      console.error('[TaxPeriodPreview] Cancel drafts failed:', error)
      toast.error(
        error?.response?.data?.message || 'Không thể hủy các đơn hàng nháp.'
      )
    } finally {
      setIsCancellingDrafts(false)
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='text-center'>
          <div className='mx-auto size-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600' />

          <p className='mt-4 text-sm font-semibold text-gray-500'>
            Đang tải dữ liệu doanh thu...
          </p>
        </div>
      </div>
    )
  }

  if (
    errorMessage ||
    !taxPeriod ||
    !preview
  ) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle
            size={48}
            className='mx-auto text-red-500'
          />

          <h2 className='mt-4 text-xl font-black'>
            Không thể xem kỳ thuế
          </h2>

          <p className='mt-2 text-sm text-gray-500'>
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  const hasWarning =
    preview.unpaidTransactionCount >
      0 ||
    preview.missingInvoiceCount >
      0 ||
    preview.cancelledTransactionCount >
      0 ||
    preview.dataCheckStatus !==
      'Good' ||
    preview.warnings.length > 0

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f5f6f8] px-6 py-7'>
      <div className='mx-auto w-full max-w-7xl'>
        <button
          type='button'
          onClick={() =>
            navigate(-1)
          }
          className='mb-5 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-red-600'
        >
          <ArrowLeft size={18} />

          Quay lại chi tiết kỳ thuế
        </button>

        <div className='rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center gap-4'>
            <div className='flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
              <ReceiptText size={28} />
            </div>

            <div>
              <h1 className='text-2xl font-black text-gray-900'>
                Doanh thu trước khi chốt kỳ
              </h1>

              <p className='mt-1 text-sm text-gray-500'>
                Kiểm tra dữ liệu trước
                khi khóa kỳ kê khai.
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 grid gap-6 lg:grid-cols-2'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-black'>
              Thông tin kỳ
            </h2>

            <InfoRow
              label='Loại kỳ'
              value={
                taxPeriod.periodType
              }
            />

            <InfoRow
              label='Năm'
              value={taxPeriod.year}
            />

            <InfoRow
              label='Quý'
              value={
                taxPeriod.quarter ??
                '—'
              }
            />

            <InfoRow
              label='Từ ngày'
              value={formatDate(
                taxPeriod.periodStartDate
              )}
            />

            <InfoRow
              label='Đến ngày'
              value={formatDate(
                taxPeriod.periodEndDate
              )}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <h2 className='mb-4 text-lg font-black'>
              Tổng hợp doanh thu
            </h2>

            <InfoRow
              label='Doanh thu bán hàng'
              value={formatMoney(
                preview.salesRevenue
              )}
            />

            <InfoRow
              label='Doanh thu khác'
              value={formatMoney(
                preview.otherRevenue
              )}
            />

            <InfoRow
              label='Tổng doanh thu'
              value={formatMoney(
                preview.totalRevenue
              )}
            />

            <InfoRow
              label='Doanh thu chịu thuế'
              value={formatMoney(
                preview.taxableRevenue
              )}
            />

            <InfoRow
              label='Tổng chi phí'
              value={formatMoney(
                preview.totalExpense
              )}
            />
          </div>
        </div>

        {calcPreview && (
          <div className='mt-6 rounded-2xl bg-white p-6 shadow-sm border border-slate-100'>
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4'>
              <div className='flex items-center gap-3'>
                <div className='flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700'>
                  <ReceiptText className='h-5 w-5' />
                </div>
                <div>
                  <h2 className='text-lg font-black text-slate-900'>
                    Ước tính thuế phải nộp (Tạm tính)
                  </h2>
                  <p className='text-xs text-slate-500'>
                    Dự kiến số thuế GTGT và TNCN phải nộp dựa trên các giao dịch hoàn tất
                  </p>
                </div>
              </div>
              <div className='flex flex-wrap items-center gap-2.5'>
                <span className='rounded-full bg-violet-50 border border-violet-200 px-3 py-1 text-xs font-bold text-violet-700'>
                  {calcPreview.status === 'Preview' ? 'Số liệu ước tính (Kỳ đang mở)' : 'Đã chốt tính thuế'}
                </span>
                <button
                  type='button'
                  onClick={() => navigate(`${taxPeriodCalculationPath(taxPeriodId!)}?mode=preview`)}
                  className='inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-2.5 py-1 text-xs font-bold text-violet-700 hover:bg-violet-50 transition'
                >
                  <Calculator size={14} /> Chi tiết bảng tính thuế →
                </button>
              </div>
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-3'>
              <div className='rounded-xl bg-slate-50 p-4 border border-slate-100'>
                <span className='text-xs font-semibold text-slate-500'>Thuế GTGT tạm tính</span>
                <p className='mt-1 text-xl font-black text-slate-900'>{formatMoney(calcPreview.totalVatTaxAmount)}</p>
              </div>
              <div className='rounded-xl bg-slate-50 p-4 border border-slate-100'>
                <span className='text-xs font-semibold text-slate-500'>Thuế TNCN tạm tính</span>
                <p className='mt-1 text-xl font-black text-slate-900'>{formatMoney(calcPreview.totalPersonalIncomeTaxAmount)}</p>
              </div>
              <div className='rounded-xl bg-violet-50/70 p-4 border border-violet-100'>
                <span className='text-xs font-bold text-violet-700'>Tổng thuế tạm tính phải nộp</span>
                <p className='mt-1 text-xl font-black text-violet-900'>{formatMoney(calcPreview.totalTaxPayableAmount)}</p>
              </div>
            </div>

            {calcPreview.lines.length > 0 && (
              <div className='mt-5 overflow-hidden rounded-xl border border-slate-100'>
                <div className='bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600 uppercase tracking-wider'>
                  Chi tiết thuế theo ngành nghề kinh doanh
                </div>
                <div className='divide-y divide-slate-100'>
                  {calcPreview.lines.map((line) => (
                    <div key={line.id} className='flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm'>
                      <div>
                        <p className='font-bold text-slate-900'>{line.businessActivityName}</p>
                        <p className='text-xs text-slate-400'>Mã: {line.businessActivityCode} · Doanh thu: {formatMoney(line.totalRevenue)}</p>
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-slate-900'>Thuế: {formatMoney(line.vatTaxAmount + line.personalIncomeTaxAmount)}</p>
                        <p className='text-xs text-slate-400'>GTGT {line.vatTaxRate}%: {formatMoney(line.vatTaxAmount)} · TNCN {line.personalIncomeTaxRate}%: {formatMoney(line.personalIncomeTaxAmount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <div className='flex items-center gap-3'>
            {hasWarning ? (
              <CircleAlert
                className='text-amber-600'
              />
            ) : (
              <CheckCircle2
                className='text-green-600'
              />
            )}

            <h2 className='text-lg font-black'>
              Kiểm tra dữ liệu
            </h2>
          </div>

          <div className='mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
            <CountCard
              label='Giao dịch'
              value={preview.transactionCount}
              onClick={() => {
                const p = new URLSearchParams()
                if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                navigate(`/business-owner/orders?${p.toString()}`)
              }}
              breakdowns={preview.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.transactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const p = new URLSearchParams()
                  p.set('businessId', b.businessId)
                  if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                  navigate(`/business-owner/orders?${p.toString()}`)
                }
              }))}
            />

            <CountCard
              label='Hoàn tất'
              value={preview.completedTransactionCount}
              onClick={() => {
                const p = new URLSearchParams()
                p.set('status', 'Completed')
                if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                navigate(`/business-owner/orders?${p.toString()}`)
              }}
              breakdowns={preview.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.paidTransactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const p = new URLSearchParams()
                  p.set('businessId', b.businessId)
                  p.set('status', 'Completed')
                  if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                  navigate(`/business-owner/orders?${p.toString()}`)
                }
              }))}
            />

            <CountCard
              label='Chưa thanh toán'
              value={preview.unpaidTransactionCount}
              warning={preview.unpaidTransactionCount > 0}
              actionText={preview.unpaidTransactionCount > 0 ? 'Xử lý ngay' : undefined}
              onClick={() => {
                const p = new URLSearchParams()
                p.set('status', 'Unpaid')
                if (taxPeriodId) p.set('taxPeriodId', taxPeriodId)
                if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                navigate(`/business-owner/orders?${p.toString()}`)
              }}
              breakdowns={preview.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.unpaidTransactionCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const p = new URLSearchParams()
                  p.set('businessId', b.businessId)
                  p.set('status', 'Unpaid')
                  if (taxPeriodId) p.set('taxPeriodId', taxPeriodId)
                  if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                  navigate(`/business-owner/orders?${p.toString()}`)
                }
              }))}
            />

            <CountCard
              label='Đã hủy'
              value={preview.cancelledTransactionCount}
              warning={preview.cancelledTransactionCount > 0}
              onClick={() => {
                const p = new URLSearchParams()
                p.set('status', 'Cancelled')
                if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                navigate(`/business-owner/orders?${p.toString()}`)
              }}
            />

            <CountCard
              label='Chưa xuất HĐĐT'
              value={preview.missingInvoiceCount}
              warning={preview.missingInvoiceCount > 0}
              actionText={preview.missingInvoiceCount > 0 ? 'Xuất HĐ ngay' : undefined}
              onClick={() => {
                const p = new URLSearchParams()
                p.set('status', 'Completed')
                p.set('hasInvoice', 'false')
                if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                navigate(`/business-owner/orders?${p.toString()}`)
              }}
              breakdowns={preview.businessBreakdowns?.map((b) => ({
                businessId: b.businessId,
                businessName: b.businessName,
                count: b.missingInvoiceCount,
                onClick: (e) => {
                  e.stopPropagation()
                  const p = new URLSearchParams()
                  p.set('businessId', b.businessId)
                  p.set('status', 'Completed')
                  p.set('hasInvoice', 'false')
                  if (taxPeriod?.periodStartDate) p.set('startDate', taxPeriod.periodStartDate)
                  if (taxPeriod?.periodEndDate) p.set('endDate', taxPeriod.periodEndDate)
                  navigate(`/business-owner/orders?${p.toString()}`)
                }
              }))}
            />
          </div>

          {preview.warnings.length >
            0 && (
            <div className='mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4'>
              {preview.warnings.map(
                (warning) => (
                  <div
                    key={
                      warning.code
                    }
                    className='flex flex-wrap items-center justify-between gap-2 text-sm text-amber-800'
                  >
                    <div className='flex items-center gap-2'>
                      <AlertTriangle
                        size={18}
                        className='shrink-0'
                      />

                      <span>
                        {warning.message}
                      </span>
                    </div>

                    {warning.code === 'UNPAID_TRANSACTIONS' && preview.unpaidTransactionCount > 0 && (
                      <button
                        type='button'
                        disabled={isCancellingDrafts}
                        onClick={() => setIsCancelDraftsConfirmOpen(true)}
                        className='inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-amber-600 transition cursor-pointer disabled:opacity-50 shrink-0'
                      >
                        <Trash2 size={13} />
                        {isCancellingDrafts ? 'Đang hủy...' : `Hủy nhanh ${preview.unpaidTransactionCount} đơn nháp`}
                      </button>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        <div className='mt-6 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-5'>
          <LockKeyhole
            size={22}
            className='shrink-0 text-red-600'
          />

          <p className='text-sm leading-6 text-red-800'>
            Sau khi chốt kỳ, doanh
            thu của kỳ này sẽ được
            dùng làm căn cứ tính
            thuế và tạo tờ khai.
          </p>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={() =>
              navigate(
                path.BUSINESS_OWNER_ORDERS
              )
            }
            className='h-12 rounded-xl border border-red-600 bg-white px-6 text-sm font-bold text-red-600 hover:bg-red-50'
          >
            Xem / sửa giao dịch
          </button>

          <button
            type='button'
            onClick={() =>
              navigate(
                `${taxPeriodCalculationPath(taxPeriodId!)}?mode=preview`
              )
            }
            className='h-12 rounded-xl border border-violet-600 bg-violet-50 px-5 text-sm font-bold text-violet-700 hover:bg-violet-100 flex items-center gap-2 transition'
          >
            <Calculator size={18} />
            Xem trước bước tính thuế
          </button>

          <button
            type='button'
            disabled={
              isClosing ||
              taxPeriod.status !==
                'Open'
            }
            onClick={
              handleClosePeriod
            }
            className={`h-12 min-w-44 rounded-xl px-6 text-sm font-bold text-white ${
              hasWarning
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:cursor-not-allowed disabled:bg-gray-300`}
          >
            {isClosing
              ? 'Đang chốt...'
              : 'Chốt kỳ thuế'}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={isCloseConfirmOpen}
        title={
          preview.warnings.length > 0
            ? 'Chốt kỳ khi vẫn còn cảnh báo?'
            : 'Xác nhận chốt kỳ thuế'
        }
        description={
          preview.warnings.length > 0
            ? 'Kỳ thuế vẫn còn cảnh báo dữ liệu. Nếu tiếp tục, dữ liệu hiện tại sẽ được dùng làm căn cứ tính thuế và tạo tờ khai.'
            : 'Sau khi chốt, dữ liệu của kỳ này sẽ được dùng làm căn cứ tính thuế và tạo tờ khai.'
        }
        confirmLabel='Chốt kỳ thuế'
        isProcessing={isClosing}
        onCancel={() =>
          setIsCloseConfirmOpen(false)
        }
        onConfirm={() => {
          void confirmClosePeriod()
        }}
      />

      <ConfirmDialog
        open={isCancelDraftsConfirmOpen}
        title='Hủy toàn bộ đơn nháp trong kỳ?'
        description={`Bạn có chắc chắn muốn hủy tất cả ${preview?.unpaidTransactionCount || 0} đơn hàng nháp dở dang của tất cả các cơ sở trong kỳ thuế này không? Thao tác này sẽ chuyển các đơn nháp sang trạng thái "Đã hủy" để đưa số chưa thanh toán về 0.`}
        confirmLabel='Xác nhận hủy đơn nháp'
        confirmVariant='warning'
        isProcessing={isCancellingDrafts}
        onCancel={() => setIsCancelDraftsConfirmOpen(false)}
        onConfirm={() => {
          void handleConfirmCancelDrafts()
        }}
      />
    </div>
  )
}

interface BreakdownChip {
  businessId: string
  businessName: string
  count: number
  onClick: (e: React.MouseEvent) => void
}

function CountCard({
  label,
  value,
  warning,
  danger,
  onClick,
  actionText,
  breakdowns
}: {
  label: string
  value: number
  warning?: boolean
  danger?: boolean
  onClick?: () => void
  actionText?: string
  breakdowns?: BreakdownChip[]
}) {
  const isZero = value === 0
  const canClick = Boolean(onClick && (!danger && !warning || !isZero))

  return (
    <div
      onClick={canClick ? onClick : undefined}
      className={`rounded-xl border p-4 transition-all flex flex-col justify-between ${
        canClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 group' : ''
      } ${
        danger && !isZero
          ? 'border-red-200 bg-red-50 hover:bg-red-100/70'
          : warning && !isZero
            ? 'border-amber-200 bg-amber-50 hover:bg-amber-100/70'
            : isZero
              ? 'border-gray-100 bg-gray-50/60'
              : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300'
      }`}
    >
      <div>
        <div className='flex items-center justify-between'>
          <p
            className={`text-xs font-semibold transition-colors ${
              canClick ? 'text-gray-500 group-hover:text-gray-900' : 'text-gray-400'
            }`}
          >
            {label}
          </p>
          {canClick && (
            <ExternalLink size={12} className='text-gray-400 group-hover:text-blue-600 transition-colors' />
          )}
        </div>

        <p
          className={`mt-2 text-2xl font-black ${
            danger && !isZero
              ? 'text-red-700'
              : warning && !isZero
                ? 'text-amber-700'
                : 'text-gray-900'
          }`}
        >
          {value}
        </p>

        {canClick && actionText && !isZero && (
          <span className='mt-2 inline-block text-[11px] font-bold text-blue-600 group-hover:underline'>
            {actionText} →
          </span>
        )}
      </div>

      {breakdowns && breakdowns.length > 1 && (
        <div className='mt-3 flex flex-wrap gap-1 border-t border-gray-200/60 pt-2'>
          {breakdowns.map((b) => {
            const isItemZero = b.count === 0
            return (
              <button
                key={b.businessId}
                type='button'
                disabled={isItemZero}
                onClick={isItemZero ? undefined : b.onClick}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold transition select-none ${
                  isItemZero
                    ? 'bg-gray-50/90 text-gray-400 border border-gray-200/70 cursor-default'
                    : b.count > 0 && danger
                      ? 'bg-red-100 text-red-800 hover:bg-red-200 hover:scale-105 cursor-pointer'
                      : b.count > 0 && warning
                        ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 hover:scale-105 cursor-pointer'
                        : 'bg-white text-gray-700 hover:bg-gray-200 border border-gray-200 hover:scale-105 cursor-pointer'
                }`}
                title={isItemZero ? 'Không có đơn nào' : `Xem đơn của ${b.businessName}`}
              >
                <span className='truncate max-w-[65px]'>{b.businessName}:</span>
                <span className={`font-black ${isItemZero ? 'text-gray-400' : ''}`}>{b.count}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}