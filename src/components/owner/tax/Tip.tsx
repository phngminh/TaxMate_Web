import type { ReactNode } from 'react'

interface TipProps {
  /** Nội dung tooltip — có thể là string hoặc JSX */
  content: ReactNode
  /** Element kích hoạt tooltip */
  children: ReactNode
  /** Hướng tooltip: top (default) | bottom | left | right */
  side?: 'top' | 'bottom' | 'left' | 'right'
  /** Căn ngang: start | center (default) | end */
  align?: 'start' | 'center' | 'end'
  /** Class thêm cho wrapper */
  className?: string
  /** Chiều rộng tối đa tooltip, mặc định max-w-xs */
  maxWidth?: string
}

const sideStyles = {
  top: {
    box: 'bottom-full mb-2',
    arrow: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
  },
  bottom: {
    box: 'top-full mt-2',
    arrow: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
  },
  left: {
    box: 'right-full mr-2 top-1/2 -translate-y-1/2',
    arrow: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
  },
  right: {
    box: 'left-full ml-2 top-1/2 -translate-y-1/2',
    arrow: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
  },
}

const alignStyles = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

export default function Tip({
  content,
  children,
  side = 'top',
  align = 'center',
  className = '',
  maxWidth = 'max-w-xs',
}: TipProps) {
  const { box, arrow } = sideStyles[side]
  const alignCls = side === 'top' || side === 'bottom' ? alignStyles[align] : ''

  return (
    <span className={`group/tip relative inline-flex items-center ${className}`}>
      {children}

      {/* Tooltip box */}
      <span
        role='tooltip'
        className={[
          'pointer-events-none absolute z-[9999] w-max',
          maxWidth,
          box,
          alignCls,
          // Hiện/ẩn
          'opacity-0 scale-95 group-hover/tip:opacity-100 group-hover/tip:scale-100',
          // Animation nhanh, mượt
          'transition-all duration-150 ease-out',
          // Style
          'rounded-lg bg-gray-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl',
          'whitespace-pre-line',
        ].join(' ')}
      >
        {content}

        {/* Mũi tên */}
        <span
          className={[
            'pointer-events-none absolute h-0 w-0 border-4',
            arrow,
          ].join(' ')}
        />
      </span>
    </span>
  )
}
