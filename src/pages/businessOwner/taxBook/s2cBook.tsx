import { useEffect, useState } from 'react'
import { Check, Download, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { confirmS2cEvidenceReview, exportS2c, getS2cPreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2cBook, S2cExpenseGroupCode } from '../../../types/taxBook.type'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const groupLabels: Record<S2cExpenseGroupCode, string> = {
  Labor: 'Chi phí nhân công',
  PurchasedServices: 'Dịch vụ mua ngoài',
  OtherDirect: 'Chi phí khác',
}

export default function S2cBookPage() {
  const { currentBusiness } = useBusiness()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [book, setBook] = useState<S2cBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmingReview, setConfirmingReview] = useState(false)

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2cPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ chi phí S2c')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setBook(null)
  }, [currentBusiness?.id, year, quarter])

  const download = async () => {
    if (!currentBusiness || !book) return
    const hardBlocker = book.warnings.some((warning) => !warning.canOverride)
    if (hardBlocker) return

    try {
      setExporting(true)
      const blob = await exportS2c(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2c-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ chi phí S2c')
    } finally {
      setExporting(false)
    }
  }

  const confirmReview = async () => {
    if (!currentBusiness || !book) return
    try {
      setConfirmingReview(true)
      setBook(await confirmS2cEvidenceReview(currentBusiness.id, year, quarter))
      toast.success('Đã lưu xác nhận rà soát chứng từ')
    } catch {
      toast.error('Không thể lưu xác nhận rà soát')
    } finally {
      setConfirmingReview(false)
    }
  }

  const hasHardBlocker = book?.warnings.some((warning) => !warning.canOverride) ?? false
  const hasEvidenceWarnings = book?.warnings.some((warning) => warning.canOverride) ?? false

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Sổ chi phí sản xuất, kinh doanh (S2c)</h1>
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
            Xem sổ
          </button>
          <button onClick={confirmReview}
            disabled={!book || hasHardBlocker || confirmingReview}
            className='flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50'>
            <Check size={16} />
            {confirmingReview ? 'Đang lưu...' : 'Xác nhận đã rà soát'}
          </button>
          <button onClick={download}
            disabled={!book || hasHardBlocker || (hasEvidenceWarnings && !book.evidenceReviewedAt) || exporting}
            className='flex items-center gap-2 rounded-lg border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] disabled:opacity-50'>
            <Download size={16} />
            {exporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>

      {book?.evidenceReviewedAt ? (
        <div className='mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800'>
          Đã xác nhận rà soát lúc {new Date(book.evidenceReviewedAt).toLocaleString('vi-VN')}.
        </div>
      ) : null}

      {book?.warnings.length ? (
        <div className='mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4'>
          <div className='font-semibold text-amber-900'>Dữ liệu cần kiểm tra</div>
          {book.warnings.map((warning, index) => (
            <div key={`${warning.code}-${warning.sourceId}-${index}`} className='mt-1 text-sm text-amber-800'>• {warning.message}</div>
          ))}
        </div>
      ) : null}

      {book && book.excludedCashPaymentExpenseCount > 0 ? (
        <div className='mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900'>
          {book.excludedCashPaymentExpenseCount} khoản từ 5 triệu đồng trở lên thanh toán bằng tiền mặt,
          tổng {money.format(book.excludedCashPaymentExpenseAmount)} đ, không được cộng vào chi phí dự kiến được trừ.
        </div>
      ) : null}

      {book && book.excludedInventoryCashCost > 0 ? (
        <div className='mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900'>
          {money.format(book.excludedInventoryCashCost)} đ trong giá trị nguyên vật liệu xuất dùng có nguồn từ
          phiếu nhập từ 5 triệu đồng trở lên thanh toán bằng tiền mặt, nên không được cộng vào chi phí dự kiến được trừ.
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>
          Chọn năm, quý rồi bấm “Xem sổ”.
        </div>
      ) : (
        <div className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <Summary label='Doanh thu từ S2b' value={book.totalRevenue} />
            <Summary label='Nguyên vật liệu xuất dùng từ S2d' value={book.materialCost} />
            <Summary label='Chi phí nhân công' value={book.laborCost} />
            <Summary label='Dịch vụ mua ngoài' value={book.purchasedServicesCost} />
            <Summary label='Chi phí khác' value={book.otherDirectCost} />
            <Summary label='Kết quả sau chi phí' value={book.netIncome} accent />
          </div>

          <div className='overflow-x-auto rounded-xl border bg-white'>
            <table className='min-w-full text-sm'>
              <thead className='bg-gray-50 text-gray-600'>
                <tr>
                  {['Ngày', 'Số phiếu', 'Nội dung', 'Danh mục', 'Nhóm S2c', 'Số tiền', 'Chứng từ'].map((label) => (
                    <th key={label} className='whitespace-nowrap px-4 py-3 text-left last:text-center'>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {book.lines.length === 0 ? (
                  <tr><td colSpan={7} className='px-4 py-12 text-center text-gray-500'>Không có khoản chi được đưa vào S2c trong kỳ.</td></tr>
                ) : book.lines.map((line) => (
                  <tr key={line.expenseId} className='border-t'>
                    <td className='whitespace-nowrap px-4 py-3'>{new Date(line.expenseDate).toLocaleDateString('vi-VN')}</td>
                    <td className='whitespace-nowrap px-4 py-3'>{line.voucherNumber}</td>
                    <td className='min-w-56 px-4 py-3 font-medium text-gray-900'>{line.expenseTitle}</td>
                    <td className='px-4 py-3'>{line.categoryName}</td>
                    <td className='whitespace-nowrap px-4 py-3'>{groupLabels[line.groupCode]}</td>
                    <td className='whitespace-nowrap px-4 py-3 text-right font-semibold'>{money.format(line.amount)} đ</td>
                    <td className={`px-4 py-3 text-center font-medium ${line.hasEvidence ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {line.hasEvidence ? 'Có tệp chứng từ' : 'Chưa có tệp chứng từ'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className='border-t bg-gray-50 font-semibold'>
                <tr>
                  <td colSpan={5} className='px-4 py-3 text-right'>Tổng chi phí dự kiến được trừ (gồm nguyên vật liệu từ S2d)</td>
                  <td className='whitespace-nowrap px-4 py-3 text-right'>{money.format(book.totalExpense)} đ</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Summary({ label, value, accent = false }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className='rounded-xl border bg-white p-4'>
      <div className='text-sm text-gray-500'>{label}</div>
      <div className={`mt-1 text-xl font-bold ${accent ? (value >= 0 ? 'text-emerald-700' : 'text-red-700') : 'text-gray-900'}`}>
        {money.format(value)} đ
      </div>
    </div>
  )
}
