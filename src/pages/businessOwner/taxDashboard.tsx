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
  useMemo,
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
import { getBusinessTaxPeriods, getTaxPeriodById } from '../../apis/taxPeriod.api'
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
  taxPeriodDeclarationPath,
  taxPeriodDetailPath,
  tknTaxPeriodPreviewPath
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

  const firstCrossingQuarter = useMemo(() => {
    const crossedAlert = taxProfile?.thresholdReviews?.find(
      (r) =>
        (r.thresholdCode === 'Crossed1B' || r.thresholdAmount === 1000000000) &&
        r.year === (dashboard?.year ?? currentYear)
    )
    return crossedAlert ? crossedAlert.quarter : null
  }, [taxProfile, dashboard?.year, currentYear])

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

      if (
        task.status === 'Completed' ||
        task.primaryAction.code === 'View'
      ) {
        navigate(
          taxPeriodDeclarationPath(
            task.taxPeriodId
          )
        )
        return
      }

      try {
        setOpeningTaskId(task.taskId)
        const period =
          await getTaxPeriodById(
            task.taxPeriodId
          )
        if (period.status === 'Open') {
          navigate(
            tknTaxPeriodPreviewPath(
              task.taxPeriodId
            )
          )
        } else {
          navigate(
            taxPeriodDeclarationPath(
              task.taxPeriodId
            )
          )
        }
      } catch {
        navigate(
          taxPeriodDeclarationPath(
            task.taxPeriodId
          )
        )
      } finally {
        setOpeningTaskId(null)
      }
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
        tknTaxPeriodPreviewPath(
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
      const [conclusionTasks, updatedProfile] = await Promise.all([
        getTaxFilingTasks(businessId, confirmed.taxYear),
        getOwnerTaxProfile(businessId)
      ])
      setAnnualConclusion(confirmed)
      setTaxProfile(updatedProfile)
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
        {annualConclusion?.shouldShow &&
          !annualConclusion.blockingIssues.some(
            (x) => x.code === 'LaterTaxProfileInUse'
          ) && (
            <section className='mt-6 overflow-hidden rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-xl ring-1 ring-inset ring-white/20 sm:p-8'>
              <div className='flex flex-wrap items-center justify-between gap-3'>
                <div className='flex flex-wrap items-center gap-2'>
                  <span className='inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-emerald-800'>
                    ✦ Kết luận doanh thu năm {annualConclusion.taxYear}
                  </span>
                  <span className='rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600'>
                    Áp dụng từ năm {annualConclusion.appliesFromYear}
                  </span>
                </div>
                {annualConclusion.targetRevenueBracket === 'AtOrBelow1B' && (
                  <span className='inline-flex items-center rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800'>
                    Miễn 100% Thuế GTGT & TNCN
                  </span>
                )}
              </div>

              <div className='mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[1.6fr_1fr] lg:items-center'>
                <div>
                  <h2 className='text-xl font-black tracking-tight text-slate-900 sm:text-2xl'>
                    {annualConclusion.targetRevenueBracket === 'AtOrBelow1B'
                      ? 'Quy mô tiêu chuẩn · Dưới 1 tỷ/năm'
                      : annualConclusion.targetRevenueBracket === 'Over1BTo3B'
                        ? 'Quy mô từ 1 đến 3 tỷ/năm'
                        : 'Quy mô trên 3 tỷ đến 50 tỷ/năm'}
                  </h2>
                  <div className='mt-3 flex flex-wrap items-baseline gap-2'>
                    <span className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                      Doanh thu ghi nhận năm {annualConclusion.taxYear}:
                    </span>
                    <span className='font-black text-slate-900 tabular-nums text-2xl sm:text-3xl'>
                      {formatVnd(annualConclusion.annualRevenue)}
                    </span>
                  </div>
                  <p className='mt-2 text-xs leading-relaxed text-slate-600 sm:text-sm'>
                    {annualConclusion.targetRevenueBracket === 'AtOrBelow1B'
                      ? 'Doanh thu năm trong ngưỡng quy định. Cơ sở của bạn tiếp tục hưởng chính sách miễn thuế và thông báo doanh thu định kỳ.'
                      : 'Hệ thống đã tổng hợp doanh thu và đối soát các Quý hoạt động để chuẩn hóa phương pháp tính thuế cho năm sau.'}
                  </p>
                </div>

                <div className='flex flex-col items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 lg:items-end'>
                  <button
                    type='button'
                    disabled={!annualConclusion.canConfirm || isConfirmingConclusion}
                    onClick={() => {
                      void handleConfirmAnnualConclusion()
                    }}
                    className='inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 text-sm font-bold text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 sm:w-auto'
                  >
                    {isConfirmingConclusion
                      ? 'Đang xác nhận...'
                      : 'Xác nhận & Áp dụng'}
                  </button>
                  <p className='text-[11px] text-slate-400'>
                    {annualConclusion.canConfirm
                      ? 'Nhấn xác nhận để kích hoạt chế độ thuế năm mới.'
                      : 'Cần hoàn tất các Quý trước khi xác nhận.'}
                  </p>
                </div>
              </div>

              {/* Bento Selection Cards nếu có lựa chọn 2 phương pháp */}
              {annualConclusion.allowedTaxMethods.length > 1 && (
                <div className='mt-6 border-t border-slate-100 pt-5'>
                  <p className='text-xs font-bold uppercase tracking-wider text-slate-400'>
                    Lựa chọn phương pháp tính thuế TNCN năm {annualConclusion.appliesFromYear}
                  </p>
                  <div className='mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2'>
                    <button
                      type='button'
                      onClick={() => setAnnualMethod('RevenueBased')}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                        annualMethod === 'RevenueBased'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <span className='rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-800'>
                          Khuyên dùng
                        </span>
                        {annualMethod === 'RevenueBased' && (
                          <span className='text-xs font-bold text-emerald-600'>✓ Đang chọn</span>
                        )}
                      </div>
                      <p className='mt-2 font-bold text-slate-900'>Theo tỷ lệ Doanh thu (Khoán %)</p>
                      <p className='mt-1 text-xs text-slate-500'>
                        Đơn giản, tính % trên doanh thu vượt 1 tỷ, không yêu cầu hóa đơn chi phí đầu vào.
                      </p>
                    </button>

                    <button
                      type='button'
                      onClick={() => setAnnualMethod('IncomeBased')}
                      className={`flex flex-col rounded-2xl border p-4 text-left transition-all active:scale-[0.99] ${
                        annualMethod === 'IncomeBased'
                          ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20'
                          : 'border-slate-200/80 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className='flex items-center justify-between'>
                        <span className='rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600'>
                          Biên lợi nhuận thấp
                        </span>
                        {annualMethod === 'IncomeBased' && (
                          <span className='text-xs font-bold text-emerald-600'>✓ Đang chọn</span>
                        )}
                      </div>
                      <p className='mt-2 font-bold text-slate-900'>Theo Thu nhập tính thuế (Doanh thu - Chi phí)</p>
                      <p className='mt-1 text-xs text-slate-500'>
                        Khấu trừ chi phí thực tế có hóa đơn hợp lệ trước khi tính thuế.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* Quarter progress pills */}
              {annualConclusion.quarters.length > 0 && (
                <div className='mt-6 border-t border-slate-100 pt-4'>
                  <div className='flex flex-wrap items-center gap-2'>
                    <span className='text-xs font-bold text-slate-400'>Tiến trình các Quý:</span>
                    {annualConclusion.quarters.map((q) => (
                      <span
                        key={q.quarter}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold ${
                          q.isReady
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                            : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                        }`}
                      >
                        Quý {q.quarter}: {q.isReady ? '✓ Đã xong' : 'Chưa nộp'}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocking issues */}
              {annualConclusion.blockingIssues.length > 0 && (
                <div className='mt-4 rounded-xl border border-amber-200/80 bg-amber-50/50 p-4'>
                  <p className='text-xs font-bold uppercase tracking-wider text-amber-900'>
                    Cần hoàn tất trước khi xác nhận:
                  </p>
                  <ul className='mt-1.5 space-y-1 text-xs text-amber-800'>
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
                    isExempt={
                      firstCrossingQuarter !== null &&
                      index + 1 < firstCrossingQuarter
                    }
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
