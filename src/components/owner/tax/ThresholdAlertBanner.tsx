import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertTriangle, ArrowRight, TrendingUp, X } from 'lucide-react'
import { toast } from 'react-toastify'
import { dismissThresholdReview, getOwnerTaxProfile } from '../../../apis/taxProfile.api'
import path from '../../../constants/path'
import type { RevenueThresholdReview } from '../../../types/taxProfile.type'

interface ThresholdAlertBannerProps {
  businessId: string
}

export default function ThresholdAlertBanner({ businessId }: ThresholdAlertBannerProps) {
  const [reviews, setReviews] = useState<RevenueThresholdReview[]>([])
  const [dismissingId, setDismissingId] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!businessId) {
      setReviews([])
      return
    }

    let isMounted = true
    const fetchProfile = async () => {
      try {
        const profile = await getOwnerTaxProfile(businessId)
        if (isMounted && profile?.thresholdReviews) {
          const pending = profile.thresholdReviews.filter(
            (review) => review.status === 'PendingReview'
          )
          setReviews(pending)
        }
      } catch {
        // Silently catch to not disrupt main layout
      }
    }

    void fetchProfile()

    return () => {
      isMounted = false
    }
  }, [businessId, location.pathname])

  const activeAlert = useMemo(() => {
    if (!reviews.length) return null
    // Priority: Crossed50B > Crossed3B > Crossed1B
    const priority = ['Crossed50B', 'Crossed3B', 'Crossed1B']
    return [...reviews].sort((a, b) => {
      const idxA = priority.indexOf(a.thresholdCode)
      const idxB = priority.indexOf(b.thresholdCode)
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB)
    })[0]
  }, [reviews])

  if (!activeAlert) return null

  const isOutsideScope = activeAlert.isOutsideSupportedScope || activeAlert.thresholdCode === 'Crossed50B'

  const getAlertContent = () => {
    if (isOutsideScope) {
      return {
        title: 'Doanh thu vượt mốc 50 tỷ đồng — Ngoài phạm vi hỗ trợ',
        subtitle: 'TaxMate hiện chỉ hỗ trợ kê khai cho hộ kinh doanh có doanh thu dưới 50 tỷ đồng.',
        ctaText: 'Xem chi tiết',
        badgeBg: 'bg-red-500',
        pingBg: 'bg-red-400',
        containerBg: 'from-[#450a0a] via-[#7f1d1d] to-[#450a0a]',
        borderClass: 'border-red-500/40',
        glowClass: 'shadow-[0_4px_20px_rgba(239,68,68,0.25)]',
        ctaClass: 'from-red-400 to-red-500 text-red-950 hover:from-red-300 hover:to-red-400'
      }
    }

    if (activeAlert.thresholdCode === 'Crossed3B') {
      return {
        title: 'Doanh thu vượt mốc 3 tỷ đồng',
        subtitle: 'Cần xem lại phương pháp kê khai thuế TNCN cho năm tiếp theo.',
        ctaText: 'Xác nhận ngay',
        badgeBg: 'bg-amber-500',
        pingBg: 'bg-amber-400',
        containerBg: 'from-[#451a03] via-[#78350f] to-[#451a03]',
        borderClass: 'border-amber-500/40',
        glowClass: 'shadow-[0_4px_20px_rgba(245,158,11,0.2)]',
        ctaClass: 'from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400'
      }
    }

    // Default: Crossed1B
    return {
      title: 'Doanh thu vượt mốc 1 tỷ đồng',
      subtitle: 'Cần xác nhận phương pháp kê khai thuế mới (Doanh thu hoặc Thu nhập).',
      ctaText: 'Xác nhận ngay',
      badgeBg: 'bg-amber-500',
      pingBg: 'bg-amber-400',
      containerBg: 'from-[#451a03] via-[#78350f] to-[#451a03]',
      borderClass: 'border-amber-500/40',
      glowClass: 'shadow-[0_4px_20px_rgba(245,158,11,0.2)]',
      ctaClass: 'from-amber-400 to-amber-500 text-amber-950 hover:from-amber-300 hover:to-amber-400'
    }
  }

  const content = getAlertContent()

  const handleCtaClick = () => {
    navigate(`${path.BUSINESS_OWNER_TAX}#threshold-review`)
    // If already on tax page, trigger scroll
    if (location.pathname === path.BUSINESS_OWNER_TAX) {
      const el = document.getElementById('threshold-review')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }

  const handleDismiss = async () => {
    if (!businessId || !activeAlert) return
    try {
      setDismissingId(activeAlert.alertId)
      await dismissThresholdReview(businessId, activeAlert.alertId)
      setReviews((prev) => prev.filter((r) => r.alertId !== activeAlert.alertId))
      toast.info('Đã đóng thông báo ngưỡng doanh thu')
    } catch {
      toast.error('Không thể đóng thông báo lúc này')
    } finally {
      setDismissingId(null)
    }
  }

  return (
    <aside
      role='alert'
      aria-live='polite'
      className={`relative z-40 w-full border-b bg-linear-to-r px-4 py-2.5 backdrop-blur-md transition-all duration-300 ${content.containerBg} ${content.borderClass} ${content.glowClass}`}
      style={{
        animation: 'bannerSlideDown 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div className='mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3'>
        {/* Left info */}
        <div className='flex items-center gap-3'>
          {/* Pulsing Live Dot */}
          <span className='relative flex size-2.5 shrink-0'>
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${content.pingBg}`}
            />
            <span
              className={`relative inline-flex size-2.5 rounded-full ${content.badgeBg}`}
            />
          </span>

          {/* Icon */}
          <div className='flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white shadow-inner'>
            {isOutsideScope ? (
              <AlertTriangle size={16} className='text-red-300' />
            ) : (
              <TrendingUp size={16} className='text-amber-300' />
            )}
          </div>

          {/* Text message */}
          <div className='flex flex-wrap items-baseline gap-x-2 text-sm'>
            <span className='font-black tracking-wide text-white'>
              {content.title}
            </span>
            <span className='text-xs font-medium text-white/80 sm:text-sm'>
              — {content.subtitle}
            </span>
          </div>
        </div>

        {/* Right actions */}
        <div className='flex items-center gap-2.5'>
          <button
            type='button'
            onClick={handleCtaClick}
            className={`flex h-8 items-center gap-1.5 rounded-full bg-linear-to-r px-4 text-xs font-black shadow-md transition-all duration-150 hover:shadow-lg active:scale-95 ${content.ctaClass}`}
          >
            <span>{content.ctaText}</span>
            <ArrowRight size={13} strokeWidth={2.5} />
          </button>

          {activeAlert.canDismiss && !isOutsideScope && (
            <button
              type='button'
              disabled={dismissingId === activeAlert.alertId}
              onClick={() => void handleDismiss()}
              className='flex size-7 items-center justify-center rounded-full text-white/60 transition-colors hover:bg-white/15 hover:text-white disabled:opacity-50'
              title='Đóng thông báo'
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bannerSlideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </aside>
  )
}
