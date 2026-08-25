import { useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { exportS2d, getS2dPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2dBook } from '../../../types/taxBook.type'

const number = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 3 })
const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export default function S2dBookPage() {
  const { currentBusiness } = useBusiness()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [book, setBook] = useState<S2dBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2dPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ kho S2d')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setBook(null)
  }, [currentBusiness?.id, year, quarter])

  const download = async () => {
    if (!currentBusiness) return
    try {
      setExporting(true)
      const blob = await exportS2d(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2d-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ kho S2d')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Sổ chi tiết tồn kho (S2d)</h1>
          <p className='mt-1 text-sm text-gray-500'>{currentBusiness?.businessName ?? 'Chưa chọn cửa hàng'}</p>
        </div>
        <div className='flex flex-wrap items-end gap-3'>
          <label className='text-sm text-gray-600'>
            Năm
            <input className='mt-1 block w-28 rounded-lg border px-3 py-2' type='number' value={year}
              onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <label className='text-sm text-gray-600'>
            Quý
            <select className='mt-1 block w-24 rounded-lg border px-3 py-2' value={quarter}
              onChange={(event) => setQuarter(Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}
            </select>
          </label>
          <button onClick={load} disabled={!currentBusiness || loading}
            className='flex items-center gap-2 rounded-lg bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Xem sổ
          </button>
          <button onClick={download} disabled={!currentBusiness || exporting}
            className='flex items-center gap-2 rounded-lg border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] disabled:opacity-50'>
            <Download size={16} />
            {exporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>

      {book?.blockers.length ? (
        <div className='mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4'>
          <div className='font-semibold text-amber-900'>Dữ liệu cần kiểm tra</div>
          {book.blockers.map((blocker, index) => (
            <div key={`${blocker.code}-${index}`} className='mt-1 text-sm text-amber-800'>• {blocker.message}</div>
          ))}
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>
          Chọn năm, quý rồi bấm “Xem sổ”.
        </div>
      ) : book.items.length === 0 ? (
        <div className='rounded-xl border bg-white p-12 text-center text-gray-500'>Không có phát sinh kho trong kỳ.</div>
      ) : (
        <div className='space-y-4'>
          {book.items.map((item) => (
            <details key={item.productId ?? item.ingredientId ?? item.itemName} className='overflow-hidden rounded-xl border bg-white' open>
              <summary className='cursor-pointer px-5 py-4 font-semibold text-gray-900'>
                {item.itemName} {item.unit ? `(${item.unit})` : ''}
                <span className='ml-3 text-sm font-normal text-gray-500'>Tồn cuối: {number.format(item.endingQuantity)} · {money.format(item.endingValue)} đ</span>
              </summary>
              <div className='overflow-x-auto border-t'>
                <table className='min-w-full text-sm'>
                  <thead className='bg-gray-50 text-gray-600'>
                    <tr>{['Ngày', 'Chứng từ', 'Diễn giải', 'Nhập SL', 'Nhập tiền', 'Xuất SL', 'Xuất tiền', 'Tồn SL', 'Tồn tiền'].map((label) => <th key={label} className='whitespace-nowrap px-3 py-3 text-right first:text-left'>{label}</th>)}</tr>
                  </thead>
                  <tbody>
                    <tr className='border-t bg-blue-50/50'>
                      <td className='px-3 py-2' colSpan={7}>Số dư đầu kỳ</td>
                      <td className='px-3 py-2 text-right'>{number.format(item.openingQuantity)}</td>
                      <td className='px-3 py-2 text-right'>{money.format(item.openingValue)}</td>
                    </tr>
                    {item.lines.map((line) => (
                      <tr key={line.inventoryMovementId} className='border-t'>
                        <td className='whitespace-nowrap px-3 py-2'>{new Date(line.documentDate).toLocaleDateString('vi-VN')}</td>
                        <td className='whitespace-nowrap px-3 py-2'>{line.documentNumber}</td>
                        <td className='min-w-52 px-3 py-2'>{line.description}{line.isProvisionalValue ? <span className='ml-2 text-xs text-amber-700'>Tạm tính</span> : null}</td>
                        <td className='px-3 py-2 text-right'>{line.inboundQuantity == null ? '' : number.format(line.inboundQuantity)}</td>
                        <td className='px-3 py-2 text-right'>{line.inboundValue == null ? '' : money.format(line.inboundValue)}</td>
                        <td className='px-3 py-2 text-right'>{line.outboundQuantity == null ? '' : number.format(line.outboundQuantity)}</td>
                        <td className='px-3 py-2 text-right'>{line.outboundValue == null ? '' : money.format(line.outboundValue)}</td>
                        <td className='px-3 py-2 text-right'>{number.format(line.runningQuantity)}</td>
                        <td className='px-3 py-2 text-right'>{money.format(line.runningValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  )
}
