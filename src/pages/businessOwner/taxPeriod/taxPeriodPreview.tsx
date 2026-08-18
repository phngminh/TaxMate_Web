import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LockKeyhole,
  ReceiptText
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
  closeTaxPeriod,
  getTaxPeriodById,
  getTaxPeriodPreview
} from '../../../apis/taxPeriod.api'

import path from '../../../constants/path'

import type {
  TaxPeriodDetail,
  TaxPeriodPreview
} from '../../../types/taxPeriod.type'

import {
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
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    isClosing,
    setIsClosing
  ] = useState(false)

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(null)

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
          previewResult
        ] = await Promise.all([
          getTaxPeriodById(
            taxPeriodId
          ),
          getTaxPeriodPreview(
            taxPeriodId
          )
        ])

        if (!active) return

        setTaxPeriod(periodResult)
        setPreview(previewResult)
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

  async function handleClosePeriod() {
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

    const message =
      preview.warnings.length > 0
        ? 'Kỳ này vẫn còn cảnh báo dữ liệu. Bạn vẫn muốn chốt kỳ thuế?'
        : 'Bạn có chắc muốn chốt kỳ thuế này?'

    const confirmed =
      window.confirm(message)

    if (!confirmed) {
      return
    }

    try {
      setIsClosing(true)

      await closeTaxPeriod(
        taxPeriodId,
        {
          confirmWarnings: true
        }
      )

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
              value={
                preview.transactionCount
              }
            />

            <CountCard
              label='Hoàn tất'
              value={
                preview.completedTransactionCount
              }
            />

            <CountCard
              label='Chưa thanh toán'
              value={
                preview.unpaidTransactionCount
              }
              warning={
                preview.unpaidTransactionCount >
                0
              }
            />

            <CountCard
              label='Đã hủy'
              value={
                preview.cancelledTransactionCount
              }
              warning={
                preview.cancelledTransactionCount >
                0
              }
            />

            <CountCard
              label='Thiếu hóa đơn'
              value={
                preview.missingInvoiceCount
              }
              warning={
                preview.missingInvoiceCount >
                0
              }
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
                    className='flex gap-2 text-sm text-amber-800'
                  >
                    <AlertTriangle
                      size={18}
                      className='mt-0.5 shrink-0'
                    />

                    <span>
                      {warning.message}
                    </span>
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
    </div>
  )
}

function CountCard({
  label,
  value,
  warning
}: {
  label: string
  value: number
  warning?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        warning
          ? 'border-amber-200 bg-amber-50'
          : 'border-gray-100 bg-gray-50'
      }`}
    >
      <p className='text-xs font-semibold text-gray-500'>
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          warning
            ? 'text-amber-700'
            : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}