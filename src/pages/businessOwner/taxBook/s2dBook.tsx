import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { exportS2d, getS2dPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2dBook } from '../../../types/taxBook.type'
import LegalBadge from '../../../components/owner/tax/LegalBadge'
import Tip from '../../../components/owner/tax/Tip'

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

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2dPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ kho S2d')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    void load()
  }, [load])

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
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Sổ chi tiết tồn kho (S2d)</h1>
            <LegalBadge
              formCode='Mẫu S2d-HKD'
              circular='TT 88/2021/TT-BTC'
              title='Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ Tài chính'
              article='Phụ lục 2 - Hệ thống sổ kế toán hộ kinh doanh'
              description='Sổ S2d-HKD dùng để theo dõi chi tiết số lượng và giá trị nhập, xuất, tồn kho của từng loại nguyên vật liệu, dụng cụ, sản phẩm và hàng hóa theo trình tự thời gian. Dữ liệu này làm căn cứ tính giá trị xuất kho và giá vốn hàng bán trong kỳ quyết toán.'
            />
          </div>
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
            {loading ? 'Đang tải...' : 'Tải lại'}
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
          {loading ? 'Đang tải sổ...' : 'Không có dữ liệu để hiển thị.'}
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
                <span className='mt-1 block text-xs font-normal text-gray-500 tabular-nums'>
                  Tồn tiền: {money.format(item.openingValue)} đ đầu kỳ + {money.format(item.totalInboundValue)} đ nhập − {money.format(item.totalOutboundValue)} đ xuất = {money.format(item.endingValue)} đ cuối kỳ
                </span>
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
                        <td className='min-w-52 px-3 py-2'>
                          {line.description}
                          {line.isProvisionalValue ? (
                            <Tip
                              content='Theo phương pháp bình quân cả kỳ (TT 88), đơn giá xuất kho trong kỳ mở là tạm tính. Hệ thống sẽ chốt đơn giá bình quân chính thức khi đóng kỳ.'
                              side='top'
                              align='start'
                              maxWidth='max-w-sm'
                            >
                              <span className='ml-2 inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-medium text-amber-800 cursor-help'>
                                Tạm tính ⓘ
                              </span>
                            </Tip>
                          ) : null}
                        </td>
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
