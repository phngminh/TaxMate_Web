import {
  AlertTriangle,
  ArrowLeft,
  Calculator,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  ReceiptText
} from 'lucide-react'
import {
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  useNavigate,
  useParams
} from 'react-router-dom'

import { getTaxPeriodById } from '../../../apis/taxPeriod.api'

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

import {
  getTaxDeclarationByTaxPeriod
} from '../../../apis/taxDeclaration.api'

import {
  getTaxDashboard
} from '../../../apis/taxDashboard.api'

import path from '../../../constants/path'

import {
  useBusiness
} from '../../../contexts/BusinessContext'

import { toast } from 'react-toastify'

function formatMoney(value: number) {
  return `${value.toLocaleString(
    'vi-VN'
  )}đ`
}

function formatDate(
  value?: string | null
) {
  if (!value) {
    return 'Chưa có'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Không xác định'
  }

  return date.toLocaleDateString(
    'vi-VN'
  )
}

function getPeriodTitle(
  period: TaxPeriodDetail
) {
  if (
    period.periodType === 'Quarterly'
  ) {
    return `Kỳ thuế Quý ${period.quarter}/${period.year}`
  }

  if (
    period.periodType === 'Monthly'
  ) {
    return `Kỳ thuế Tháng ${period.month}/${period.year}`
  }

  return `Kỳ thuế Năm ${period.year}`
}

function getStatusLabel(
  status: TaxPeriodStatus
) {
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

function getStatusDescription(
  status: TaxPeriodStatus
) {
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

function getDataCheckLabel(
  status: DataCheckStatus
) {
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

function getDataCheckClasses(
  status: DataCheckStatus
) {
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

function getPrimaryActionLabel(
  status: TaxPeriodStatus
) {
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
  danger
}: {
  label: string
  value: string
  danger?: boolean
}) {
  return (
    <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
      <p className='text-sm font-semibold text-gray-500'>
        {label}
      </p>

      <p
        className={`mt-2 text-2xl font-black ${
          danger
            ? 'text-red-600'
            : 'text-gray-900'
        }`}
      >
        {value}
      </p>
    </div>
  )
}

function InfoRow({
  label,
  value
}: {
  label: string
  value: string | number
}) {
  return (
    <div className='flex items-center justify-between gap-6 border-b border-gray-100 py-3 last:border-b-0'>
      <span className='text-sm text-gray-500'>
        {label}
      </span>

      <span className='text-right text-sm font-bold text-gray-800'>
        {value}
      </span>
    </div>
  )
}

export default function TaxPeriodDetailPage() {
  const navigate = useNavigate()

  const { taxPeriodId } = useParams<{
    taxPeriodId: string
  }>()

  const [
    taxPeriod,
    setTaxPeriod
  ] = useState<TaxPeriodDetail | null>(
    null
  )

  const [
    isLoading,
    setIsLoading
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage
  ] = useState<string | null>(null)

  const [
    declarationStatus,
    setDeclarationStatus
  ] = useState<
    'Draft' | 'Submitted' | null
  >(null)

  const {
    businesses
  } = useBusiness()

  useEffect(() => {
    let active = true

    async function loadTaxPeriod() {
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

        /*
        * STEP 1
        * Lấy TaxPeriod trước.
        *
        * Chúng ta cần businessId + year
        * của kỳ thuế để kiểm tra ngưỡng
        * của toàn Owner.
        */
        const periodResult =
          await getTaxPeriodById(
            taxPeriodId
          )

        if (!active) {
          return
        }

        /*
        * STEP 2
        * Tập hợp tất cả BusinessProfile
        * thuộc Owner.
        *
        * periodResult.businessId được
        * thêm vào để tránh trường hợp
        * BusinessContext chưa có profile
        * hiện tại.
        */
        const ownerBusinessIds =
          Array.from(
            new Set([
              periodResult.businessId,
              ...businesses.map(
                (business) =>
                  business.id
              )
            ])
          )

        /*
        * STEP 3
        * Lấy Tax Dashboard của tất cả
        * business trong cùng năm.
        */
        const ownerDashboards =
          await Promise.all(
            ownerBusinessIds.map(
              (ownerBusinessId) =>
                getTaxDashboard({
                  businessId:
                    ownerBusinessId,
                  year:
                    periodResult.year
                })
            )
          )

        if (!active) {
          return
        }

        /*
        * STEP 4
        * Cộng doanh thu của toàn Owner.
        */
        const ownerAnnualRevenue =
          ownerDashboards.reduce(
            (total, item) =>
              total +
              item.threshold
                .accumulatedRevenue,
            0
          )

        /*
        * Tất cả dashboard dùng cùng
        * threshold nên lấy từ phần tử đầu.
        */
        const thresholdAmount =
          ownerDashboards[0]
            ?.threshold.amount ??
          1_000_000_000

        const isQuarterlyFilingRequired =
          ownerAnnualRevenue >
          thresholdAmount

        /*
        * STEP 5
        * Owner chưa vượt 1 tỷ:
        *
        * KHÔNG cho mở TaxPeriod Detail.
        *
        * Bao gồm cả trường hợp user tự
        * gõ URL.
        */
        if (
          !isQuarterlyFilingRequired
        ) {
          toast.info(
            `Tổng doanh thu của chủ hộ trong năm ${periodResult.year} chưa vượt ngưỡng ${thresholdAmount.toLocaleString(
              'vi-VN'
            )}đ. Bạn chưa thuộc diện thực hiện kê khai thuế theo quý.`
          )

          navigate(
            path.BUSINESS_OWNER_TAX,
            {
              replace: true
            }
          )

          return
        }

        /*
        * STEP 6
        * Đã vượt ngưỡng:
        * cho phép hiển thị Detail.
        */
        setTaxPeriod(
          periodResult
        )

        /*
        * STEP 7
        * Chỉ kiểm tra Declaration từ
        * Calculated trở đi.
        *
        * Open / Closed chắc chắn chưa cần
        * declaration nên không GET để
        * tránh 404 không cần thiết.
        */
        if (
          periodResult.status ===
            'Calculated' ||
          periodResult.status ===
            'Submitted' ||
          periodResult.status ===
            'Paid'
        ) {
          const declarationResult =
            await getTaxDeclarationByTaxPeriod(
              taxPeriodId
            )

          if (!active) {
            return
          }

          setDeclarationStatus(
            declarationResult?.status ??
              null
          )
        } else {
          setDeclarationStatus(null)
        }
      } catch (error) {
        console.error(
          '[TaxPeriodDetail] Failed:',
          error
        )

        if (!active) {
          return
        }

        setErrorMessage(
          'Không thể tải chi tiết kỳ thuế.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void loadTaxPeriod()

    return () => {
      active = false
    }
  }, [
    taxPeriodId,
    businesses,
    navigate
  ])

  const appliedTaxRate =
    useMemo(() => {
      if (
        !taxPeriod ||
        taxPeriod.taxableRevenue <= 0 ||
        taxPeriod.estimatedTax <= 0
      ) {
        return 0
      }

      return Number(
        (
          (taxPeriod.estimatedTax /
            taxPeriod.taxableRevenue) *
          100
        ).toFixed(2)
      )
    }, [taxPeriod])

  function handlePrimaryAction() {
    if (
      !taxPeriod ||
      !taxPeriodId
    ) {
      return
    }

    switch (taxPeriod.status) {
      case 'Open':
        navigate(
          taxPeriodPreviewPath(
            taxPeriodId
          )
        )
        return

      case 'Closed':
        navigate(
          taxPeriodCalculationPath(
            taxPeriodId
          )
        )
        return

      case 'Calculated':
      case 'Submitted':
      case 'Paid':
        navigate(
          taxPeriodDeclarationPath(
            taxPeriodId
          )
        )
        return
    }
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
        <div className='text-center'>
          <div className='mx-auto size-10 animate-spin rounded-full border-4 border-gray-200 border-t-red-600' />

          <p className='mt-4 text-sm font-semibold text-gray-500'>
            Đang tải kỳ thuế...
          </p>
        </div>
      </div>
    )
  }

  if (
    errorMessage ||
    !taxPeriod
  ) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] px-6'>
        <div className='w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle
            size={48}
            className='mx-auto text-red-500'
          />

          <h2 className='mt-4 text-xl font-black text-gray-900'>
            Không tìm thấy kỳ thuế
          </h2>

          <p className='mt-2 text-sm text-gray-500'>
            {errorMessage}
          </p>

          <button
            type='button'
            onClick={() =>
              navigate(-1)
            }
            className='mt-6 rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700'
          >
            Quay lại
          </button>
        </div>
      </div>
    )
  }

  const hasWarning =
    taxPeriod.dataCheckStatus !==
    'Good'

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
                  {getPeriodTitle(
                    taxPeriod
                  )}
                </h1>

                <p className='mt-1 text-sm font-semibold text-gray-500'>
                  {formatDate(
                    taxPeriod.periodStartDate
                  )}
                  {' - '}
                  {formatDate(
                    taxPeriod.periodEndDate
                  )}
                </p>

                <p className='mt-1 text-sm text-gray-400'>
                  Hạn nộp:{' '}
                  {formatDate(
                    taxPeriod.dueDate
                  )}
                </p>
              </div>
            </div>

            <div className='text-right'>
              <span className='inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700'>
                {getStatusLabel(
                  taxPeriod.status
                )}
              </span>

              <p className='mt-2 max-w-sm text-sm leading-6 text-gray-500'>
                {getStatusDescription(
                  taxPeriod.status
                )}
              </p>
            </div>
          </div>
        </div>

        <div className='mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
          <MetricCard
            label='Tổng doanh thu'
            value={formatMoney(
              taxPeriod.totalRevenue
            )}
          />

          <MetricCard
            label='Doanh thu chịu thuế'
            value={formatMoney(
              taxPeriod.taxableRevenue
            )}
          />

          <MetricCard
            label='Tổng thuế ước tính'
            value={formatMoney(
              taxPeriod.estimatedTax
            )}
          />

          <MetricCard
            label='Nợ thuế'
            value={formatMoney(
              taxPeriod.taxAmountDebt
            )}
            danger={
              taxPeriod.taxAmountDebt >
              0
            }
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
              value={formatMoney(
                taxPeriod.salesRevenue
              )}
            />

            <InfoRow
              label='Doanh thu khác'
              value={formatMoney(
                taxPeriod.otherRevenue
              )}
            />

            <InfoRow
              label='Thuế GTGT ước tính'
              value={formatMoney(
                taxPeriod.vatTaxAmount
              )}
            />

            <InfoRow
              label='Thuế TNCN ước tính'
              value={formatMoney(
                taxPeriod.personalIncomeTaxAmount
              )}
            />

            <InfoRow
              label='Tỷ lệ thuế tạm tính'
              value={`${appliedTaxRate}%`}
            />
          </div>

          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <div className='mb-5 flex items-center justify-between gap-3'>
              <div className='flex items-center gap-3'>
                <div className='flex size-10 items-center justify-center rounded-xl bg-green-50 text-green-600'>
                  <CheckCircle2
                    size={21}
                  />
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
                {getDataCheckLabel(
                  taxPeriod.dataCheckStatus
                )}
              </span>
            </div>

            <InfoRow
              label='Số giao dịch'
              value={
                taxPeriod.transactionCount
              }
            />

            <InfoRow
              label='Đã thanh toán'
              value={
                taxPeriod.paidTransactionCount
              }
            />

            <InfoRow
              label='Chưa thanh toán'
              value={
                taxPeriod.unpaidTransactionCount
              }
            />

            <InfoRow
              label='Chưa có hóa đơn'
              value={
                taxPeriod.missingInvoiceCount
              }
            />

            <InfoRow
              label='Số khoản chi phí'
              value={
                taxPeriod.expenseCount
              }
            />

            {hasWarning && (
              <div className='mt-5 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4'>
                <AlertTriangle
                  size={20}
                  className='mt-0.5 shrink-0 text-amber-600'
                />

                <p className='text-sm leading-6 text-amber-800'>
                  Kỳ này còn dữ liệu cần
                  kiểm tra. Hãy xem lại
                  doanh thu trước khi chốt
                  kỳ thuế.
                </p>
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
              done={
                taxPeriod.status !== 'Open'
              }
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
              done={
                declarationStatus !== null
              }
            />

            <FlowStep
              number={5}
              title='Gửi tờ khai'
              done={
                declarationStatus ===
                'Submitted'
              }
            />
          </div>
        </div>

        <div className='mt-6 flex justify-end gap-3'>
          <button
            type='button'
            onClick={() =>
              navigate(-1)
            }
            className='h-12 rounded-xl border border-gray-300 bg-white px-6 text-sm font-bold text-gray-700 hover:bg-gray-50'
          >
            Quay lại
          </button>

          <button
            type='button'
            onClick={
              handlePrimaryAction
            }
            className='flex h-12 min-w-56 items-center justify-center gap-2 rounded-xl bg-red-600 px-6 text-sm font-bold text-white transition hover:bg-red-700'
          >
            {taxPeriod.status ===
            'Open' ? (
              <CircleDollarSign
                size={18}
              />
            ) : (
              <FileText size={18} />
            )}

            {getPrimaryActionLabel(
              taxPeriod.status
            )}
          </button>
        </div>
      </div>
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
        {done ? (
          <CheckCircle2 size={17} />
        ) : (
          number
        )}
      </div>

      <p className='mt-3 text-sm font-bold text-gray-800'>
        {title}
      </p>
    </div>
  )
}