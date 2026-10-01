import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

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
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [anchor, setAnchor] = useState<{ top: number; left: number } | null>(null)
  const isOpen = anchor !== null

  useEffect(() => {
    if (!isOpen) return

    const updateAnchor = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) setAnchor({ top: rect.top, left: rect.left })
    }

    window.addEventListener('scroll', updateAnchor, true)
    window.addEventListener('resize', updateAnchor)
    return () => {
      window.removeEventListener('scroll', updateAnchor, true)
      window.removeEventListener('resize', updateAnchor)
    }
  }, [isOpen])

  const showTooltip = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setAnchor({ top: rect.top, left: rect.left })
  }

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={() => setAnchor(null)}
        className={`relative inline-flex items-center ${className}`}
      >
        {children}
      </span>

      {anchor && createPortal(
        <span
          className='pointer-events-none fixed z-[9999]'
          style={{ top: anchor.top, left: anchor.left }}
        >
          <span
            role='tooltip'
            className={[
              'pointer-events-none absolute w-max',
              maxWidth,
              box,
              alignCls,
              'scale-100 opacity-100 transition-all duration-150 ease-out',
              'rounded-lg bg-gray-800 px-3 py-2 text-xs leading-relaxed text-white shadow-xl',
              'whitespace-pre-line',
            ].join(' ')}
          >
            {content}
            <span className={['pointer-events-none absolute h-0 w-0 border-4', arrow].join(' ')} />
          </span>
        </span>,
        document.body
      )}
    </>
  )
}
