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
import { getBusinessTaxPeriods } from '../../apis/taxPeriod.api'
import TaxQuarterCard from '../../components/owner/tax/TaxQuarterCard'
import path from '../../constants/path'
import { useBusiness } from '../../contexts/BusinessContext'

import type {
  TaxDashboardUiData
} from '../../types/taxDashboard.type'

import type {
  TaxPeriodSummary
} from '../../types/taxPeriod.type'

import {
  mapTaxDashboardApiToUi
} from '../../utils/taxDashboardMapper'

import {
  taxPeriodDetailPath
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

  const {
    currentBusiness,
    businessId
  } = useBusiness()

  const currentYear =
    new Date().getFullYear()

  const [dashboard, setDashboard] =
    useState<TaxDashboardUiData | null>(
      null
    )

  const [taxPeriods, setTaxPeriods] =
    useState<TaxPeriodSummary[]>([])

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
        return
      }

      try {
        setIsLoading(true)
        setErrorMessage(null)

        const [
          dashboardResponse,
          taxPeriodResponse
        ] = await Promise.all([
          getTaxDashboard({
            businessId,
            year: currentYear
          }),

          getBusinessTaxPeriods({
            businessId,
            year: currentYear,
            periodType: 'Quarterly'
          })
        ])

        if (!active) return

        setDashboard(
          mapTaxDashboardApiToUi(
            dashboardResponse
          )
        )

        setTaxPeriods(taxPeriodResponse)
      } catch (error) {
        if (!active) return

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
    currentYear
  ])

  const progressWidth = useMemo(() => {
    if (!dashboard) {
      return 0
    }

    return Math.min(
      Math.max(
        dashboard.progressPercentage,
        0
      ),
      100
    )
  }, [dashboard])

  function findQuarterTaxPeriodId(
    quarter: number
  ) {
    return taxPeriods.find(
      (period) =>
        period.periodType ===
          'Quarterly' &&
        period.year === currentYear &&
        period.quarter === quarter
    )?.id
  }

  function handleOpenQuarter(
    taxPeriodId?: string
  ) {
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

  const isRequired =
    dashboard.thresholdStatus ===
    'Required'

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
              {currentBusiness?.businessName}
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
            <p className='text-sm leading-6 text-gray-700'>
              {
                dashboard.warningMessage
              }
            </p>

            <button
              type='button'
              className='mt-2 flex items-center gap-1 text-sm font-bold text-blue-600 hover:underline'
            >
              Tìm hiểu thêm
              <ArrowRight size={15} />
            </button>
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
                {dashboard.statusLabel}
              </div>
            </div>

            <div className='mt-8'>
              <div className='mb-3 flex flex-wrap items-center justify-between gap-3'>
                <span className='text-sm font-semibold text-gray-500'>
                  {
                    dashboard.progressPercentage
                  }
                  % ngưỡng
                </span>

                <span className='rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-gray-600'>
                  Còn{' '}
                  {formatRemaining(
                    dashboard.remainingAmount
                  )}
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
                Phân tích doanh thu theo quý
              </h2>

              <p className='text-sm text-gray-500'>
                Theo dõi doanh thu và trạng
                thái từng kỳ thuế.
              </p>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
            {dashboard.quarters.map(
              (quarter, index) => (
                <TaxQuarterCard
                  key={quarter.id}
                  quarter={quarter}
                  taxPeriodId={
                    findQuarterTaxPeriodId(
                      index + 1
                    )
                  }
                  onOpen={
                    handleOpenQuarter
                  }
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}