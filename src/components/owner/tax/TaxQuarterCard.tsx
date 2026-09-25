import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck
} from 'lucide-react'

import type {
  TaxQuarter
} from '../../../types/taxDashboard.type'

import type {
  TaxPeriodStatus
} from '../../../types/taxPeriod.type'

interface Props {
  quarter: TaxQuarter
  taxPeriodId?: string
  taxPeriodStatus?: TaxPeriodStatus

  disabled?: boolean
  isExempt?: boolean

  onOpen: (
    taxPeriodId: string | undefined
  ) => void
}

function getFilingStatus(
  taxPeriodStatus: TaxPeriodStatus | undefined,
  disabled: boolean,
  isExempt: boolean,
  fallbackText: string
) {
  if (isExempt) {
    return {
      label: 'Miễn 100% thuế (Dưới 1 tỷ)',
      className:
        'bg-emerald-100 text-emerald-800 border border-emerald-300/80',
      completed: true
    }
  }

  if (disabled) {
    return {
      label: 'Chỉ theo dõi doanh thu',
      className:
        'bg-gray-100 text-gray-500',
      completed: false
    }
  }

  switch (taxPeriodStatus) {
    case 'Open':
      return {
        label: 'Cần thực hiện kê khai',
        className:
          'bg-red-50 text-red-600',
        completed: false
      }

    case 'Closed':
      return {
        label: 'Đã chốt - chờ tính thuế',
        className:
          'bg-amber-50 text-amber-700',
        completed: false
      }

    case 'Calculated':
      return {
        label: 'Đã tính thuế - chờ gửi',
        className:
          'bg-blue-50 text-blue-700',
        completed: false
      }

    case 'Submitted':
    case 'Paid':
      return {
        label: 'Đã hoàn thành kê khai',
        className:
          'bg-green-50 text-green-700',
        completed: true
      }

    default:
      return {
        label: fallbackText,
        className:
          'bg-gray-100 text-gray-500',
        completed: false
      }
  }
}

export default function TaxQuarterCard({
  quarter,
  taxPeriodId,
  taxPeriodStatus,
  disabled = false,
  isExempt = false,
  onOpen
}: Props) {
  const filingStatus =
    getFilingStatus(
      taxPeriodStatus,
      disabled,
      isExempt,
      quarter.statusText
    )

  return (
    <button
      type='button'
      disabled={disabled}
      onClick={() =>
        onOpen(taxPeriodId)
      }
      className={`group flex min-h-44 flex-col rounded-2xl border p-5 text-left shadow-xs transition-all duration-200 ${
        disabled
          ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-80'
          : isExempt
            ? 'border-emerald-200/90 bg-emerald-50/50 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md'
            : filingStatus.completed
              ? 'border-green-200 bg-green-50 hover:-translate-y-0.5 hover:shadow-md'
              : 'border-blue-100 bg-[#eef7ff] hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md'
      }`}
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-2'>
          {isExempt ? (
            <ShieldCheck
              size={19}
              className='text-emerald-600 shrink-0'
            />
          ) : (
            <CalendarDays
              size={18}
              className={
                disabled
                  ? 'text-gray-400'
                  : filingStatus.completed
                    ? 'text-green-600'
                    : 'text-blue-500'
              }
            />
          )}

          <span className='text-base font-bold text-gray-700'>
            {quarter.name}
          </span>
        </div>

        {disabled ? (
          <LockKeyhole
            size={18}
            className='text-gray-400'
          />
        ) : filingStatus.completed ? (
          <CheckCircle2
            size={20}
            className={isExempt ? 'text-emerald-600' : 'text-green-600'}
          />
        ) : (
          <ArrowRight
            size={18}
            className='text-gray-400 transition-transform group-hover:translate-x-1'
          />
        )}
      </div>

      <div className='mt-6 text-3xl font-extrabold text-gray-900'>
        {quarter.revenueText}
      </div>

      <div
        className={`mt-auto inline-flex items-center self-start rounded-full px-3 py-1 text-xs font-bold ${filingStatus.className}`}
      >
        {filingStatus.completed && !isExempt && (
          <CheckCircle2
            size={13}
            className='mr-1'
          />
        )}

        {filingStatus.label}
      </div>
    </button>
  )
}