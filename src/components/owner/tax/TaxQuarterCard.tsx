import {
  ArrowRight,
  CalendarDays
} from 'lucide-react'

import type { TaxQuarter } from '../../../types/taxDashboard.type'

interface Props {
  quarter: TaxQuarter
  taxPeriodId?: string
  onOpen: (
    taxPeriodId: string | undefined
  ) => void
}

export default function TaxQuarterCard({
  quarter,
  taxPeriodId,
  onOpen
}: Props) {
  const statusClass =
    quarter.status === 'normal'
      ? 'text-green-600 bg-green-50'
      : quarter.status === 'in_progress'
        ? 'text-amber-600 bg-amber-50'
        : 'text-gray-500 bg-gray-100'

  return (
    <button
      type='button'
      onClick={() => onOpen(taxPeriodId)}
      className='group flex min-h-44 flex-col rounded-2xl border border-blue-100 bg-[#eef7ff] p-5 text-left shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md'
    >
      <div className='flex w-full items-center justify-between'>
        <div className='flex items-center gap-2'>
          <CalendarDays
            size={18}
            className='text-blue-500'
          />

          <span className='text-base font-bold text-gray-600'>
            {quarter.name}
          </span>
        </div>

        <ArrowRight
          size={18}
          className='text-gray-400 transition-transform group-hover:translate-x-1'
        />
      </div>

      <div className='mt-6 text-3xl font-extrabold text-gray-900'>
        {quarter.revenueText}
      </div>

      <div
        className={`mt-auto inline-flex self-start rounded-full px-3 py-1 text-xs font-bold ${statusClass}`}
      >
        {quarter.statusText}
      </div>
    </button>
  )
}