import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getOwnerTaxProfile } from '../../../apis/taxProfile.api'
import path from '../../../constants/path'
import { useBusiness } from '../../../contexts/BusinessContext'
import { useTaxProfileRevision } from '../../../hooks/useTaxProfileRevision'
import type { OwnerTaxProfile } from '../../../types/taxProfile.type'

interface Props {
  children: React.ReactNode
  bookType?: 's2b' | 's2c' | 's2d' | 's2e' | 'qtt'
}

export default function TaxBookRouteGuard({ children, bookType }: Props) {
  const { currentBusiness } = useBusiness()
  const profileRevision = useTaxProfileRevision()
  const [profile, setProfile] = useState<OwnerTaxProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentBusiness?.id) {
      setLoading(false)
      return
    }
    let isMounted = true
    getOwnerTaxProfile(currentBusiness.id)
      .then((p) => {
        if (isMounted) {
          setProfile(p)
          setLoading(false)
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [currentBusiness?.id, profileRevision])

  if (loading) {
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-800' />
      </div>
    )
  }

  // Chốt chặn 1: Không phải IncomeBased thì cấm toàn bộ sổ S2b-S2e và QTT
  const isIncomeBased =
    profile?.declaredRevenueBracket !== 'AtOrBelow1B' &&
    profile?.personalIncomeTaxMethod === 'IncomeBased'

  if (!isIncomeBased) {
    toast.warn('Hộ kinh doanh tính thuế theo tỷ lệ doanh thu không áp dụng hệ thống sổ kế toán S2b–S2e.')
    return <Navigate to={path.BUSINESS_OWNER_TAX} replace />
  }

  // Chốt chặn 2: Dịch vụ hoặc tắt kho thì cấm S2d
  const isServiceStore =
    currentBusiness?.mainCategoryId === 'd2222222-2222-2222-2222-222222222222' ||
    Boolean(currentBusiness?.mainCategoryName?.toLowerCase().includes('dịch vụ'))

  if (bookType === 's2d' && (isServiceStore || currentBusiness?.isStockTrackingEnabled === false)) {
    toast.warn('Cơ sở dịch vụ hoặc cơ sở không theo dõi kho không áp dụng Sổ kho S2d.')
    return <Navigate to={path.BUSINESS_OWNER_S2B_BOOK} replace />
  }

  return <>{children}</>
}
