import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

import { getTaxPeriodById } from '../../../apis/taxPeriod.api'
import path from '../../../constants/path'
import {
  taxPeriodDeclarationPath,
  tknTaxPeriodPreviewPath
} from '../../../utils/taxPeriodRoute'

export default function TknTaxPeriodDetailPage() {
  const navigate = useNavigate()
  const { taxPeriodId } = useParams<{ taxPeriodId: string }>()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function redirect() {
      if (!taxPeriodId) {
        navigate(path.BUSINESS_OWNER_TAX, { replace: true })
        return
      }

      try {
        const period = await getTaxPeriodById(taxPeriodId)
        if (!active) return

        if (period.periodType !== 'Tkn') {
          setErrorMessage('Kỳ thuế này không phải hồ sơ 01/TKN-CNKD.')
          return
        }

        if (period.status === 'Open') {
          navigate(tknTaxPeriodPreviewPath(taxPeriodId), { replace: true })
        } else {
          navigate(taxPeriodDeclarationPath(taxPeriodId), { replace: true })
        }
      } catch (error) {
        if (!active) return
        setErrorMessage('Không thể tải thông tin kỳ thông báo doanh thu.')
      }
    }

    void redirect()

    return () => {
      active = false
    }
  }, [navigate, taxPeriodId])

  if (errorMessage) {
    return (
      <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8] px-6'>
        <div className='max-w-md rounded-2xl bg-white p-8 text-center shadow-sm'>
          <AlertTriangle size={46} className='mx-auto text-red-500' />
          <h1 className='mt-4 text-xl font-black text-gray-900'>Không thể mở hồ sơ</h1>
          <p className='mt-2 text-sm text-gray-500'>{errorMessage}</p>
          <button
            type='button'
            onClick={() => navigate(path.BUSINESS_OWNER_TAX)}
            className='mt-6 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white'
          >
            Về tổng quan thuế
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='flex min-h-[calc(100vh-56px)] items-center justify-center bg-[#f5f6f8]'>
      <p className='font-semibold text-gray-500'>Đang chuyển tiếp đến hồ sơ 01/TKN-CNKD...</p>
    </div>
  )
}
