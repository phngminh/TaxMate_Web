import axios from 'axios'
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CircleDollarSign,
  Plus,
  ReceiptText,
  TrendingUp
} from 'lucide-react'
import {
  useEffect,
  useState
} from 'react'
import {
  useNavigate
} from 'react-router-dom'
import { toast } from 'react-toastify'

import { getTaxDashboard } from '../../apis/taxDashboard.api'
import {
  confirmAnnualRevenueConclusion,
  getAnnualRevenueConclusion,
  getOwnerTaxProfile
} from '../../apis/taxProfile.api'
import {
  getTaxFilingTasks,
  openTaxFilingTask
} from '../../apis/taxFilingTask.api'
import { getBusinessTaxPeriods } from '../../apis/taxPeriod.api'
import TaxFilingTaskCard from '../../components/owner/tax/TaxFilingTaskCard'
import TaxQuarterCard from '../../components/owner/tax/TaxQuarterCard'
import TaxProfileCard from '../../components/owner/tax/TaxProfileCard'
import path from '../../constants/path'
import { useBusiness } from '../../contexts/BusinessContext'
import { useTaxProfileRevision } from '../../hooks/useTaxProfileRevision'

import type {
  TaxDashboardUiData
} from '../../types/taxDashboard.type'

import type {
  AnnualRevenueConclusionPreview
} from '../../types/annualRevenueConclusion.type'

import type {
  TaxPeriodSummary
} from '../../types/taxPeriod.type'

import type {
  TaxFilingTask
} from '../../types/taxFilingTask.type'
import type {
  OwnerTaxProfile,
  TaxMethod
} from '../../types/taxProfile.type'

import {
  mapTaxDashboardApiToUi
} from '../../utils/taxDashboardMapper'

import {
  taxPeriodDetailPath,
  tknTaxPeriodDetailPath
} from '../../utils/taxPeriodRoute'

function formatVnd(value: number) {
  return `${value.toLocaleString('vi-VN')}đ`
}

function formatRemaining(value: number) {
  if (value >= 1_000_000_000) {
    return `${(
      value / 1_000_000_000
    ).toFixed(1)} tỷ`
  }

  if (value >= 1_000_000) {
    return `${(
      value / 1_000_000
    ).toFixed(1)} triệu`
  }

  return formatVnd(value)
}

export default function TaxDashboard() {
  const navigate = useNavigate()
  const profileRevision = useTaxProfileRevision()

  const {
    currentBusiness,
    businessId
  } = useBusiness()

  const currentYear =
    new Date().getFullYear()

  const conclusionYear = currentYear - 1

  const [dashboard, setDashboard] =
    useState<TaxDashboardUiData | null>(
      null
    )

  const [taxPeriods, setTaxPeriods] =
    useState<TaxPeriodSummary[]>([])

  const [filingTasks, setFilingTasks] =
    useState<TaxFilingTask[]>([])

  const [openingTaskId, setOpeningTaskId] =
    useState<string | null>(null)

  const [annualConclusion, setAnnualConclusion] =
    useState<AnnualRevenueConclusionPreview | null>(null)
  const [taxProfile, setTaxProfile] =
    useState<OwnerTaxProfile | null>(null)
  const [annualMethod, setAnnualMethod] =
    useState<TaxMethod>('RevenueBased')

  const [isConfirmingConclusion, setIsConfirmingConclusion] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(false)

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchTaxDashboard() {
      if (!businessId) {
        setDashboard(null)
        setTaxPeriods([])
        setFilingTasks([])
        setAnnualConclusion(null)
        setTaxProfile(null)
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)

        /*
        * Dashboard API mới đã aggregate theo Owner.
        *
        * Chỉ cần gọi 1 lần với businessId hiện tại.
        * Backend tự:
        *
        * businessId
        *   -> BusinessProfile
        *   -> OwnerId
        *   -> aggregate toàn Owner
        */
        const [
          dashboardResponse,
          taxPeriodResponse,
          filingTaskResponse,
          annualConclusionResponse,
          taxProfileResponse
        ] = await Promise.all([
          getTaxDashboard({
            businessId,
            year: currentYear
          }),

          /*
          * TaxPeriod vẫn đang thuộc BusinessProfile,
          * nên phần này vẫn lấy theo business đang chọn.
          */
          getBusinessTaxPeriods({
            businessId,
            year: currentYear,
            periodType: 'Quarterly'
          }),

          getTaxFilingTasks(
            businessId,
            currentYear
          ),

          getAnnualRevenueConclusion(
            businessId,
            conclusionYear
          ).catch(() => null),

          getOwnerTaxProfile(businessId)
        ])

        if (!active) {
          return
        }

        setDashboard(
          mapTaxDashboardApiToUi(
            dashboardResponse
          )
        )

        setTaxPeriods(
          taxPeriodResponse
        )

        let resolvedTasks = filingTaskResponse
        if (annualConclusionResponse?.alreadyConfirmed) {
          const conclusionTasks = await getTaxFilingTasks(
            businessId,
            conclusionYear
          )
          resolvedTasks = [
            ...conclusionTasks,
            ...filingTaskResponse
          ]
        }

        if (!active) return
        setFilingTasks(resolvedTasks)
        setAnnualConclusion(annualConclusionResponse)
        setTaxProfile(taxProfileResponse)
      } catch (error) {
        if (!active) {
          return
        }

        if (axios.isAxiosError(error)) {
          console.error(
            '[Tax Dashboard] API error',
            {
              status:
                error.response?.status,

              data:
                error.response?.data,

              url:
                error.config?.url,

              params:
                error.config?.params
            }
          )
        } else {
          console.error(
            '[Tax Dashboard] Error',
            error
          )
        }

        setErrorMessage(
          'Không thể tải dữ liệu thuế.'
        )
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    void fetchTaxDashboard()

    return () => {
      active = false
    }
  }, [
    businessId,
    conclusionYear,
    currentYear,
    profileRevision
  ])

  function findQuarterTaxPeriod(
      quarter: number
    ) {
      return taxPeriods.find(
        (period) =>
          period.periodType ===
            'Quarterly' &&
          period.year === currentYear &&
          period.quarter === quarter
      )
    }

    function handleOpenQuarter(
    taxPeriodId?: string
  ) {
    if (!dashboard) {
      return
    }

    /*
    * BE là source of truth.
    */
    if (
      dashboard.accumulatedRevenue <=
      dashboard.thresholdAmount
    ) {
      toast.info(
        `Tổng doanh thu của chủ hộ chưa vượt ngưỡng ${formatVnd(
          dashboard.thresholdAmount
        )}. Bạn hiện chỉ có thể theo dõi doanh thu theo quý.`
      )

      return
    }

    if (!taxPeriodId) {
      toast.info(
        'Không tìm thấy kỳ thuế cho quý này.'
      )

      return
    }

    navigate(
      taxPeriodDetailPath(
        taxPeriodId
      )
    )
  }

  function handleOpenAssistant() {
    window.dispatchEvent(
      new Event(
        'taxmate:open-ai-assistant'
      )
    )
  }

  async function handleOpenFilingTask(
    task: TaxFilingTask
  ) {
    if (!businessId) return

    if (
      task.status === 'NotApplicable' ||
      !task.primaryAction.enabled ||
      task.primaryAction.code === 'None'
    ) {
      toast.info(
        'Hồ sơ này không cần thực hiện trong tình trạng hiện tại.'
      )
      return
    }

    if (
      task.primaryAction.code !== 'Open'
    ) {
      if (!task.taxPeriodId) {
        toast.error(
          'Không tìm thấy kỳ thông báo doanh thu tương ứng.'
        )
        return
      }

      navigate(
        tknTaxPeriodDetailPath(
          task.taxPeriodId
        )
      )
      return
    }

    try {
      setOpeningTaskId(task.taskId)
      const opened =
        await openTaxFilingTask(
          businessId,
          task.taskId
        )

      setFilingTasks((current) =>
        current.map((item) =>
          item.taskId === opened.taskId
            ? opened
            : item
        )
      )

      if (!opened.taxPeriodId) {
        throw new Error(
          'Open task did not return a tax period.'
        )
      }

      navigate(
        tknTaxPeriodDetailPath(
          opened.taxPeriodId
        )
      )
    } catch (error) {
      const responseData =
        axios.isAxiosError(error)
          ? (error.response?.data as {
              message?: string
            } | undefined)
          : undefined

      toast.error(
        responseData?.message ||
          'Không thể mở hồ sơ thông báo doanh thu.'
      )
    } finally {
      setOpeningTaskId(null)
    }
  }

  async function handleConfirmAnnualConclusion() {
    if (!businessId || !annualConclusion?.canConfirm) return

    try {
      setIsConfirmingConclusion(true)
      const confirmed = await confirmAnnualRevenueConclusion(
        businessId,
        annualConclusion.taxYear,
        annualConclusion.requiredTaxMethod ??
          (annualConclusion.allowedTaxMethods.length > 0
            ? annualMethod
            : undefined)
      )
      const conclusionTasks = await getTaxFilingTasks(
        businessId,
        confirmed.taxYear
      )
      setAnnualConclusion(confirmed)
      setFilingTasks((current) => [
        ...conclusionTasks,
        ...current.filter(
          (task) => task.taxYear !== confirmed.taxYear
        )
      ])
      toast.success(
        `Đã xác nhận kết luận doanh thu năm ${confirmed.taxYear}.`
      )
    } catch (error) {
      const responseData = axios.isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)
        : undefined
      toast.error(
        responseData?.message ||
          'Chưa thể xác nhận kết luận doanh thu năm.'
      )
    } finally {
      setIsConfirmingConclusion(false)
    }
  }

  if (!businessId) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center px-6'>
        <div className='rounded-2xl bg-white px-10 py-12 text-center shadow-sm'>
          <ReceiptText
            size={46}
            className='mx-auto text-gray-300'
          />

          <h2 className='mt-4 text-xl font-bold text-gray-800'>
            Chưa có hồ sơ kinh doanh
          </h2>

          <p className='mt-2 text-sm text-gray-500'>
            Hãy chọn hoặc tạo một cửa hàng
            trước khi xem thông tin thuế.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto size-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#d00c0c]' />

          <p className='mt-4 text-sm font-semibold text-gray-500'>
            Đang tải dữ liệu thuế...
          </p>
        </div>
      </div>
    )
  }

  if (errorMessage) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center px-6'>
        <div className='rounded-2xl bg-white px-10 py-12 text-center shadow-sm'>
          <AlertTriangle
            size={46}
            className='mx-auto text-red-500'
          />

          <h2 className='mt-4 text-xl font-bold text-gray-800'>
            Không thể tải dữ liệu
          </h2>

          <p className='mt-2 text-sm text-gray-500'>
            {errorMessage}
          </p>
        </div>
      </div>
    )
  }

  if (!dashboard) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center'>
        <p className='text-gray-500'>
          Chưa có dữ liệu thuế.
        </p>
      </div>
    )
  }

  const thresholdAmount =
    dashboard.thresholdAmount

  /*
  * Không tự suy luận nữa.
  * BE đã quyết định Taxable / NotTaxable.
  */
  const isRequired =
    dashboard.thresholdStatus ===
    'Taxable'

  const isEInvoiceRequired =
    dashboard.eInvoiceStatus ===
    'RequiredEInvoice'

  /*
  * Có thể > 100%, nhưng thanh progress
  * chỉ rộng tối đa 100%.
  */
  const progressWidth =
    Math.min(
      Math.max(
        dashboard.progressPercentage,
        0
      ),
      100
    )

  const exceededAmount =
    Math.max(
      dashboard.accumulatedRevenue -
        dashboard.thresholdAmount,
      0
    )

  const reachedButNotExceeded =
    !isRequired &&
    dashboard.accumulatedRevenue >=
      dashboard.thresholdAmount

  return (
    <div className='min-h-[calc(100vh-56px)] bg-[#f4f5f7] px-6 py-7'>
      <div className='mx-auto w-full max-w-7xl'>
        {/* Heading */}
        <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
          <div>
            <div className='flex items-center gap-2 text-sm font-semibold text-gray-500'>
              <ReceiptText size={17} />
              Quản lý thuế
            </div>

            <h1 className='mt-1 text-3xl font-extrabold text-gray-900'>
              Tổng quan thuế
            </h1>

            <p className='mt-1 text-sm text-gray-500'>
              Tổng hợp toàn bộ cơ sở kinh doanh
              {' • '}
              Năm {dashboard.year}
            </p>
          </div>

          <div className='flex gap-3'>
            <button
              type='button'
              onClick={() =>
                navigate(
                  path.BUSINESS_OWNER_POS
                )
              }
              className='flex h-11 items-center gap-2 rounded-xl border border-[#c90000] bg-white px-5 text-sm font-bold text-[#c90000] transition hover:bg-red-50'
            >
              <Plus size={17} />
              Ghi doanh thu
            </button>

            <button
              type='button'
              onClick={
                handleOpenAssistant
              }
              className='flex h-11 items-center gap-2 rounded-xl bg-[#c90000] px-5 text-sm font-bold text-white transition hover:bg-[#a90000]'
            >
              <Bot size={17} />
              Tư vấn thuế
            </button>
          </div>
        </div>

        {/* Warning */}
        <div
          className={`mb-6 flex items-start gap-4 rounded-2xl border p-5 ${
            isRequired
              ? 'border-red-200 bg-red-50'
              : 'border-sky-200 bg-sky-50'
          }`}
        >
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-white ${
              isRequired
                ? 'text-red-500'
                : 'text-sky-500'
            }`}
          >
            <ReceiptText size={25} />
          </div>

          <div className='flex-1'>
            <div>
              <p
                className={`font-extrabold ${
                  isRequired
                    ? 'text-red-700'
                    : 'text-sky-700'
                }`}
              >
                {isRequired
                  ? 'Đã thuộc diện kê khai thuế theo quý'
                  : 'Chưa thuộc diện kê khai thuế theo quý'}
              </p>

              <p className='mt-1 text-sm leading-6 text-gray-700'>
                {isRequired
                  ? `Tổng doanh thu của chủ hộ trong năm ${dashboard.year} đã vượt ngưỡng ${formatVnd(
                      thresholdAmount
                    )}. Bạn có thể thực hiện quy trình kê khai cho từng quý.`
                  : `Tổng doanh thu của chủ hộ trong năm ${dashboard.year} hiện chưa vượt ngưỡng ${formatVnd(
                      thresholdAmount
                    )}. Các kỳ quý chỉ được dùng để theo dõi doanh thu và chưa thể mở quy trình kê khai.`}
              </p>
            </div>

            <button
              type='button'
              className='mt-2 flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline'
            >
              Tìm hiểu thêm
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* E-invoice obligation */}
        <div
          className={`mb-6 flex items-start gap-4 rounded-2xl border p-5 ${
            isEInvoiceRequired
              ? 'border-amber-200 bg-amber-50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div
            className={`flex size-12 shrink-0 items-center justify-center rounded-full bg-white ${
              isEInvoiceRequired
                ? 'text-amber-600'
                : 'text-gray-400'
            }`}
          >
            <ReceiptText size={25} />
          </div>

          <div className='flex-1'>
            <p className={`font-extrabold ${
              isEInvoiceRequired ? 'text-amber-800' : 'text-gray-700'
            }`}>
              {isEInvoiceRequired
                ? 'Đã đạt ngưỡng bắt buộc sử dụng hóa đơn điện tử'
                : 'Chưa đạt ngưỡng bắt buộc sử dụng hóa đơn điện tử'}
            </p>
            <p className='mt-1 text-sm leading-6 text-gray-600'>
              Ngưỡng HĐĐT áp dụng năm {dashboard.year} là{' '}
              <span className='font-bold'>
                {formatVnd(dashboard.eInvoiceThresholdAmount)}
              </span>
              {isEInvoiceRequired
                ? '. Doanh thu tích lũy đã đạt hoặc vượt ngưỡng này.'
                : `. Còn ${formatVnd(dashboard.eInvoiceRemainingAmount)} để đạt ngưỡng.`}
            </p>
          </div>
        </div>

        {/* Overview */}
        <div className='grid gap-6 lg:grid-cols-[1.35fr_0.65fr]'>
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <div className='flex flex-wrap items-center justify-between gap-3'>
              <div>
                <p className='text-sm font-bold uppercase tracking-wide text-gray-400'>
                  Tổng doanh thu tích lũy
                  {' '}
                  {dashboard.year}
                </p>

                <p className='mt-2 text-xs font-medium text-gray-400'>
                  Tổng hợp từ{' '}
                  {dashboard.businesses.length}{' '}
                  cơ sở kinh doanh
                </p>

                <div className='mt-3 text-4xl font-black text-gray-900'>
                  {formatVnd(
                    dashboard.accumulatedRevenue
                  )}
                </div>
              </div>

              <div
                className={`rounded-full px-4 py-2 text-sm font-bold ${
                  isRequired
                    ? 'bg-red-100 text-red-600'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {isRequired
                  ? 'Đã vào diện kê khai'
                  : 'Chưa vào diện kê khai'}
              </div>
            </div>

            <div className='mt-8'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                <span className='text-sm font-semibold text-gray-500'>
                  {dashboard.progressPercentage}
                  % ngưỡng
                </span>

                <span
                  className={`rounded-lg px-3 py-1.5 text-sm font-bold ${
                    isRequired
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-gray-600'
                  }`}
                >
                  {isRequired
                    ? `Đã vượt ${formatRemaining(
                        exceededAmount
                      )}`
                    : reachedButNotExceeded
                      ? 'Đã chạm ngưỡng, chưa vượt'
                      : `Còn ${formatRemaining(
                          dashboard.remainingAmount
                        )}`}
                </span>
              </div>

              <div className='h-4 overflow-hidden rounded-full bg-gray-200'>
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isRequired
                      ? 'bg-red-500'
                      : 'bg-green-500'
                  }`}
                  style={{
                    width:
                      `${progressWidth}%`
                  }}
                />
              </div>

              <div className='mt-2 flex justify-between text-xs font-semibold text-gray-400'>
                <span>0đ</span>

                <span>
                  {formatVnd(
                    dashboard.thresholdAmount
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className='rounded-2xl bg-white p-6 shadow-sm'>
            <div className='flex size-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600'>
              <TrendingUp size={25} />
            </div>

            <p className='mt-5 text-sm font-bold uppercase tracking-wide text-gray-400'>
              Dự báo cuối năm{' '}
              {dashboard.year}
            </p>

            <div className='mt-3 text-3xl font-black text-gray-900'>
              {formatVnd(
                dashboard.forecastRevenue
              )}
            </div>

            <p className='mt-3 text-sm font-medium text-gray-500'>
              {
                dashboard.forecastBasedOn
              }
            </p>
          </div>
        </div>

        {/* Business revenue breakdown */}
        {dashboard.businesses.length > 0 && (
          <div className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
            <div className='flex flex-wrap items-end justify-between gap-3'>
              <div>
                <h2 className='text-xl font-extrabold text-gray-900'>
                  Doanh thu theo cơ sở kinh doanh
                </h2>

                <p className='mt-1 text-sm text-gray-500'>
                  Chi tiết doanh thu đóng góp
                  vào tổng doanh thu của chủ hộ
                  trong năm {dashboard.year}.
                </p>
              </div>

              <div className='text-right'>
                <p className='text-xs font-bold uppercase tracking-wide text-gray-400'>
                  Tổng chủ hộ
                </p>

                <p className='mt-1 text-xl font-black text-red-600'>
                  {formatVnd(
                    dashboard.accumulatedRevenue
                  )}
                </p>
              </div>
            </div>

            <div className='mt-5 grid gap-4 md:grid-cols-2'>
              {dashboard.businesses.map(
                (business) => (
                  <div
                    key={business.businessId}
                    className='rounded-xl border border-gray-200 bg-gray-50 p-4'
                  >
                    <div className='flex items-start justify-between gap-4'>
                      <p className='text-sm font-bold text-gray-800'>
                        {business.businessName}
                      </p>

                      <p className='text-lg font-black text-gray-900'>
                        {formatVnd(
                          business.revenue
                        )}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        )}

        {taxProfile && (
          <TaxProfileCard
            businessId={businessId}
            profile={taxProfile}
            onChanged={setTaxProfile}
          />
        )}

        {/* Owner-wide filing tasks */}
        {annualConclusion?.shouldShow && (
          <section className='mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div className='max-w-3xl'>
                <p className='text-xs font-bold uppercase tracking-wide text-emerald-700'>
                  Kết luận doanh thu năm {annualConclusion.taxYear}
                </p>
                <h2 className='mt-1 text-xl font-extrabold text-emerald-950'>
                  Nhóm năm sau: {
                    annualConclusion.targetRevenueBracket === 'AtOrBelow1B'
                      ? 'Không quá 1 tỷ'
                      : annualConclusion.targetRevenueBracket === 'Over1BTo3B'
                        ? 'Trên 1 đến 3 tỷ'
                        : 'Trên 3 đến 50 tỷ'
                  }
                </h2>
                <p className='mt-2 text-sm leading-6 text-emerald-900'>
                  TaxMate đã tổng hợp {formatVnd(annualConclusion.annualRevenue)}. Thay đổi áp dụng từ năm {annualConclusion.appliesFromYear}; các tờ khai và khoản đã nộp trước đó vẫn được giữ nguyên.
                </p>
                {annualConclusion.allowedTaxMethods.length > 1 && (
                  <select
                    className='mt-3 rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm'
                    value={annualMethod}
                    onChange={(event) => setAnnualMethod(event.target.value as TaxMethod)}
                  >
                    <option value='RevenueBased'>TNCN theo doanh thu</option>
                    <option value='IncomeBased'>TNCN theo thu nhập tính thuế</option>
                  </select>
                )}
              </div>
              <button
                type='button'
                disabled={
                  !annualConclusion.canConfirm ||
                  isConfirmingConclusion
                }
                onClick={() => {
                  void handleConfirmAnnualConclusion()
                }}
                className='h-11 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-gray-300'
              >
                {isConfirmingConclusion
                  ? 'Đang xác nhận...'
                  : 'Xác nhận kết luận năm'}
              </button>
            </div>

            {annualConclusion.blockingIssues.length > 0 && (
              <div className='mt-4 rounded-xl border border-amber-200 bg-white p-4'>
                <p className='text-sm font-bold text-amber-800'>
                  Cần hoàn tất trước khi xác nhận
                </p>
                <ul className='mt-2 space-y-1 text-sm text-amber-700'>
                  {annualConclusion.blockingIssues.map((issue) => (
                    <li key={issue.code}>• {issue.message}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {filingTasks.length > 0 && (
          <section className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
            <div className='flex flex-wrap items-start justify-between gap-4'>
              <div>
                <p className='text-xs font-bold uppercase tracking-wide text-red-500'>
                  Việc cần làm về thuế
                </p>
                <h2 className='mt-1 text-xl font-extrabold text-gray-900'>
                  Thông báo doanh thu 01/TKN-CNKD
                </h2>
                <p className='mt-1 max-w-3xl text-sm leading-6 text-gray-500'>
                  Lịch áp dụng chung cho chủ hộ. TaxMate tự chọn đúng kỳ sáu tháng hoặc cả năm từ hồ sơ thuế đã xác nhận.
                </p>
              </div>
              <span className='rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600'>
                Năm {currentYear}
              </span>
            </div>

            <div className='mt-5 grid gap-4 xl:grid-cols-2'>
              {filingTasks.map((task) => (
                <TaxFilingTaskCard
                  key={task.taskId}
                  task={task}
                  isOpening={
                    openingTaskId === task.taskId
                  }
                  onOpen={(selectedTask) => {
                    void handleOpenFilingTask(
                      selectedTask
                    )
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Quarter analysis */}
        <div className='mt-6 rounded-2xl bg-white p-6 shadow-sm'>
          <div className='mb-5 flex items-center gap-3'>
            <div className='flex size-10 items-center justify-center rounded-xl bg-red-50 text-red-600'>
              <CircleDollarSign
                size={21}
              />
            </div>

            <div>
              <h2 className='text-xl font-extrabold text-gray-900'>
                {isRequired
                  ? 'Kê khai thuế theo quý'
                  : 'Theo dõi doanh thu theo quý'}
              </h2>

              <p className='text-sm text-gray-500'>
                {isRequired
                  ? (
                      <>
                        Doanh thu hiển thị theo tổng
                        chủ hộ. Trạng thái kê khai áp
                        dụng cho cơ sở{' '}
                        <span className='font-bold text-gray-700'>
                          {currentBusiness?.businessName}
                        </span>.
                      </>
                    )
                  : 'Doanh thu từng quý vẫn được hiển thị theo tổng chủ hộ, nhưng quy trình kê khai đang được khóa do chủ hộ chưa vượt ngưỡng.'}
              </p>
            </div>
          </div>
          {!isRequired && (
            <div className='mb-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4'>
              <AlertTriangle
                size={20}
                className='mt-0.5 shrink-0 text-sky-600'
              />

              <div>
                <p className='text-sm font-bold text-sky-800'>
                  Quy trình kê khai theo quý đang được khóa
                </p>

                <p className='mt-1 text-sm leading-6 text-sky-700'>
                  Chủ hộ chưa vượt ngưỡng doanh thu{' '}
                  {formatVnd(
                    thresholdAmount
                  )}.
                  Bạn vẫn có thể theo dõi doanh thu
                  của từng quý, nhưng chưa thể mở
                  chi tiết kỳ để chốt, tính thuế hoặc
                  tạo tờ khai.
                </p>
              </div>
            </div>
          )}
          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {dashboard.quarters.map(
              (quarter, index) => {
                const taxPeriod =
                  findQuarterTaxPeriod(
                    index + 1
                  )

                return (
                  <TaxQuarterCard
                    key={quarter.id}
                    quarter={quarter}
                    taxPeriodId={
                      taxPeriod?.id
                    }
                    taxPeriodStatus={
                      taxPeriod?.status
                    }
                    disabled={!isRequired}
                    onOpen={
                      handleOpenQuarter
                    }
                  />
                )
              }
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
