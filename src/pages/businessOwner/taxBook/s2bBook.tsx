import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { exportS2b, getS2bPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2bBook } from '../../../types/taxBook.type'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export default function S2bBookPage() {
  const { currentBusiness } = useBusiness()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [book, setBook] = useState<S2bBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2bPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ doanh thu S2b')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    void load()
  }, [load])

  const download = async () => {
    if (!currentBusiness || !book?.isValid) return
    try {
      setExporting(true)
      const blob = await exportS2b(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2b-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ doanh thu S2b')
    } finally {
      setExporting(false)
    }
  }

  const totalVat = book?.groups.reduce((sum, group) => sum + group.vatAmount, 0) ?? 0

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Sổ doanh thu bán hàng hóa, dịch vụ (S2b)</h1>
          <p className='mt-1 text-sm text-gray-500'>{currentBusiness?.businessName ?? 'Chưa chọn cửa hàng'}</p>
        </div>
        <div className='flex flex-wrap items-end gap-3'>
          <label className='text-sm text-gray-600'>Năm
            <input className='mt-1 block w-28 rounded-lg border px-3 py-2' type='number' value={year}
              onChange={(event) => setYear(Number(event.target.value))} />
          </label>
          <label className='text-sm text-gray-600'>Quý
            <select className='mt-1 block w-24 rounded-lg border px-3 py-2' value={quarter}
              onChange={(event) => setQuarter(Number(event.target.value))}>
              {[1, 2, 3, 4].map((value) => <option key={value} value={value}>Quý {value}</option>)}
            </select>
          </label>
          <button onClick={load} disabled={!currentBusiness || loading}
            className='flex items-center gap-2 rounded-lg bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button onClick={download} disabled={!book?.isValid || exporting}
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
            <div key={`${blocker.code}-${blocker.sourceId}-${index}`} className='mt-1 text-sm text-amber-800'>• {blocker.message}</div>
          ))}
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>
          {loading ? 'Đang tải sổ...' : 'Không có dữ liệu để hiển thị.'}
        </div>
      ) : (
        <div className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            <Summary label='Doanh thu POS' value={book.completedTransactionRevenue} />
            <Summary label='Doanh thu nhập thêm' value={book.manualBusinessRevenue} />
            <Summary label='Tổng doanh thu' value={book.totalRevenue} />
            <Summary label='Tổng thuế GTGT' value={totalVat} />
          </div>

          <div className='rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-950'>
            <div className='font-semibold'>Cách tính tổng doanh thu</div>
            <div className='mt-1 flex flex-wrap items-center gap-2 tabular-nums'>
              <span>{money.format(book.completedTransactionRevenue)} đ từ POS</span>
              <strong>+</strong>
              <span>{money.format(book.manualBusinessRevenue)} đ nhập thêm</span>
              <strong>=</strong>
              <span className='font-bold'>{money.format(book.totalRevenue)} đ</span>
            </div>
          </div>

          {book.groups.length === 0 ? (
            <div className='rounded-xl border bg-white p-12 text-center text-gray-500'>Không có doanh thu trong kỳ.</div>
          ) : (
            <div className='overflow-x-auto rounded-xl border bg-white'>
              <table className='min-w-full text-sm'>
                <thead className='bg-gray-50 text-gray-600'>
                  <tr>
                    {['Ngành nghề', 'Doanh thu POS', 'Nhập thủ công', 'Tổng doanh thu', 'Thuế suất GTGT', 'Thuế GTGT'].map((label) => (
                      <th key={label} className='whitespace-nowrap px-4 py-3 text-right first:text-left'>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {book.groups.map((group) => (
                    <tr key={group.businessCategoryId} className='border-t'>
                      <td className='min-w-64 px-4 py-3 font-medium text-gray-900'>{group.businessCategoryName}</td>
                      <td className='px-4 py-3 text-right'>{money.format(group.completedTransactionRevenue)} đ</td>
                      <td className='px-4 py-3 text-right'>{money.format(group.manualBusinessRevenue)} đ</td>
                      <td className='px-4 py-3 text-right font-semibold'>{money.format(group.totalRevenue)} đ</td>
                      <td className='px-4 py-3 text-right'>{group.vatRate}%</td>
                      <td className='px-4 py-3 text-right font-semibold text-[#9b0000]'>{money.format(group.vatAmount)} đ</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className='rounded-xl border bg-white p-4'>
      <div className='text-sm text-gray-500'>{label}</div>
      <div className='mt-1 text-xl font-bold text-gray-900'>{money.format(value)} đ</div>
    </div>
  )
}
