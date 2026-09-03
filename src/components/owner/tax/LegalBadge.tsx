import { useState, useRef, useEffect } from 'react'
import { HelpCircle, BookOpen, X } from 'lucide-react'

interface LegalBadgeProps {
  formCode: string
  circular: string
  title?: string
  article?: string
  description: string
  className?: string
}

export default function LegalBadge({
  formCode,
  circular,
  title = 'Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ Tài chính',
  article = 'Phụ lục 2 - Hệ thống sổ kế toán',
  description,
  className = ''
}: LegalBadgeProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className={`relative inline-block ${className}`} ref={popoverRef}>
      <button
        type='button'
        onClick={() => setIsOpen(!isOpen)}
        className='inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 transition-colors hover:border-sky-300 hover:bg-sky-100/80 focus:outline-none focus:ring-2 focus:ring-sky-500/20 shadow-2xs cursor-pointer select-none'
        title='Xem căn cứ pháp lý'
      >
        <BookOpen size={13} className='text-sky-600 shrink-0' />
        <span>{formCode} · {circular}</span>
        <HelpCircle size={13} className='text-sky-500 shrink-0' />
      </button>

      {isOpen && (
        <div className='absolute left-0 top-full z-50 mt-1.5 w-80 sm:w-96 rounded-xl border border-sky-100 bg-white p-4 shadow-xl text-left animate-in fade-in zoom-in-95 duration-150'>
          <div className='flex items-start justify-between gap-2 border-b border-gray-100 pb-2.5'>
            <div>
              <span className='inline-block rounded-md bg-sky-100 px-2 py-0.5 text-[11px] font-bold text-sky-800 uppercase tracking-wide'>
                Căn cứ pháp lý
              </span>
              <h4 className='mt-1 text-sm font-bold text-gray-900'>
                {formCode}
              </h4>
            </div>
            <button
              type='button'
              onClick={() => setIsOpen(false)}
              className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors'
            >
              <X size={15} />
            </button>
          </div>

          <div className='mt-2.5 space-y-2 text-xs text-gray-600 leading-relaxed'>
            <div className='rounded-lg bg-gray-50 p-2 border border-gray-100'>
              <p className='font-semibold text-gray-800'>{title}</p>
              <p className='text-[11px] text-gray-500'>{article}</p>
            </div>
            <p className='text-gray-700 whitespace-pre-line'>
              {description}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
