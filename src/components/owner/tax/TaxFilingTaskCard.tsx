import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  MinusCircle
} from 'lucide-react'

import type {
  TaxFilingTask,
  TaxFilingTaskStatus
} from '../../../types/taxFilingTask.type'

const statusPresentation: Record<
  TaxFilingTaskStatus,
  { label: string; classes: string }
> = {
  Upcoming: {
    label: 'Sắp tới',
    classes: 'bg-gray-100 text-gray-600'
  },
  Ready: {
    label: 'Có thể thực hiện',
    classes: 'bg-blue-100 text-blue-700'
  },
  InProgress: {
    label: 'Đang thực hiện',
    classes: 'bg-amber-100 text-amber-700'
  },
  Completed: {
    label: 'Đã hoàn thành',
    classes: 'bg-green-100 text-green-700'
  },
  Blocked: {
    label: 'Cần xử lý',
    classes: 'bg-red-100 text-red-700'
  },
  NotApplicable: {
    label: 'Không còn áp dụng',
    classes: 'bg-slate-100 text-slate-600'
  }
}

function formatDate(value: string | null) {
  if (!value) return 'Chưa xác định'

  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('vi-VN')
}

function actionLabel(task: TaxFilingTask) {
  switch (task.primaryAction.code) {
    case 'Open':
      return 'Bắt đầu'
    case 'Continue':
      return 'Tiếp tục'
    case 'View':
      return 'Xem hồ sơ'
    default:
      return 'Không cần thực hiện'
  }
}

export default function TaxFilingTaskCard({
  task,
  isOpening,
  onOpen
}: {
  task: TaxFilingTask
  isOpening: boolean
  onOpen: (task: TaxFilingTask) => void
}) {
  const presentation =
    statusPresentation[task.status]
  const isNotApplicable =
    task.status === 'NotApplicable'
  const blockers =
    task.eligibility.blockers.filter(
      (blocker) =>
        blocker.code !== 'WindowNotStarted'
    )

  return (
    <article className='rounded-2xl border border-gray-200 bg-white p-5 shadow-sm'>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex min-w-0 items-start gap-3'>
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${
              isNotApplicable
                ? 'bg-slate-100 text-slate-500'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {isNotApplicable ? (
              <MinusCircle size={22} />
            ) : task.status === 'Completed' ? (
              <CheckCircle2 size={22} />
            ) : (
              <FileText size={22} />
            )}
          </div>

          <div className='min-w-0'>
            <p className='text-xs font-bold uppercase tracking-wide text-gray-400'>
              {task.formCode}
            </p>
            <h3 className='mt-1 text-lg font-black text-gray-900'>
              {task.window.label}
            </h3>
            <p className='mt-1 text-sm leading-6 text-gray-500'>
              {task.reason.message}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-xs font-bold ${presentation.classes}`}
        >
          {presentation.label}
        </span>
      </div>

      <div className='mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm'>
        <span className='flex items-center gap-2 text-gray-500'>
          <Clock3 size={16} />
          Hạn nộp:{' '}
          <strong
            className={
              task.isOverdue
                ? 'text-red-600'
                : 'text-gray-800'
            }
          >
            {formatDate(task.deadline)}
          </strong>
        </span>
        {task.isOverdue && (
          <span className='font-bold text-red-600'>
            Đã quá hạn
          </span>
        )}
      </div>

      {blockers.length > 0 && !isNotApplicable && (
        <div className='mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4'>
          <div className='flex gap-2'>
            <AlertTriangle
              size={18}
              className='mt-0.5 shrink-0 text-amber-600'
            />
            <div>
              <p className='text-sm font-bold text-amber-800'>
                Cần hoàn tất trước khi mở hồ sơ
              </p>
              <ul className='mt-1 space-y-1 text-sm leading-5 text-amber-700'>
                {blockers.map((blocker) => (
                  <li key={`${blocker.code}-${blocker.message}`}>
                    {blocker.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className='mt-5 flex justify-end'>
        <button
          type='button'
          disabled={
            isOpening ||
            !task.primaryAction.enabled ||
            task.primaryAction.code === 'None' ||
            isNotApplicable
          }
          onClick={() => onOpen(task)}
          className='flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500'
        >
          {isOpening ? 'Đang mở...' : actionLabel(task)}
          {!isOpening &&
            task.primaryAction.code !== 'None' && (
              <ArrowRight size={17} />
            )}
        </button>
      </div>
    </article>
  )
}
