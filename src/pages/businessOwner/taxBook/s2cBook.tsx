import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  ImagePlus,
  Loader2,
  RefreshCw,
  UploadCloud,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { confirmS2cEvidenceReview, exportS2c, getS2cPreview } from '../../../apis/taxBook.api'
import { getExpenseById, updateExpense } from '../../../apis/expense.api'
import { uploadImage } from '../../../apis/image.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { S2cBook, S2cExpenseGroupCode, S2cExpenseLine, S2cBookWarning } from '../../../types/taxBook.type'
import LegalBadge from '../../../components/owner/tax/LegalBadge'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })
const groupLabels: Record<S2cExpenseGroupCode, string> = {
  Labor: 'Chi phí nhân công (chưa được TaxMate hỗ trợ)',
  PurchasedServices: 'Dịch vụ mua ngoài',
  OtherDirect: 'Chi phí khác',
}

type WarningSeverity = 'error' | 'warning'
const WARNING_META: Record<string, { label: string; severity: WarningSeverity }> = {
  MissingExpenseEvidence: {
    label: 'Khoản chi chưa có ảnh hoặc tệp chứng từ',
    severity: 'warning',
  },
  MissingInventoryPurchaseEvidence: {
    label: 'Phiếu nhập kho tính giá xuất S2d chưa có ảnh hoặc tệp chứng từ',
    severity: 'warning',
  },
  ExpenseNotMappedToS2c: {
    label: 'Khoản chi chưa chọn nhóm S2c để tính chi phí được trừ',
    severity: 'warning',
  },
  UnclassifiedRevenue: {
    label: 'Doanh thu chưa phân loại ngành nghề',
    severity: 'error',
  },
  NegativeInventoryBalance: {
    label: 'Tồn kho bị âm trong kỳ',
    severity: 'error',
  },
  MissingOpeningInventory: {
    label: 'Chưa có số dư tồn đầu kỳ cho mặt hàng',
    severity: 'error',
  },
}

interface EvidenceTarget {
  expenseId: string
  expenseTitle: string
  amount: number
  expenseDate: string
  voucherNumber?: string
  categoryName?: string
}

export default function S2cBookPage() {
  const { currentBusiness } = useBusiness()
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth() / 3) + 1)
  const [book, setBook] = useState<S2cBook | null>(null)
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [confirmingReview, setConfirmingReview] = useState(false)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Quick Evidence Upload state
  const [evidenceTarget, setEvidenceTarget] = useState<EvidenceTarget | null>(null)
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null)
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null)
  const [isSavingEvidence, setIsSavingEvidence] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      setBook(await getS2cPreview(currentBusiness.id, year, quarter))
    } catch {
      toast.error('Không thể tải sổ chi phí S2c')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    setExpandedCodes(new Set())
    setExpandedItems(new Set())
    void load()
  }, [load])

  const expenseLineById = useMemo(() => {
    const map = new Map<string, S2cExpenseLine>()
    if (!book) return map
    for (const line of book.lines) {
      map.set(line.expenseId, line)
    }
    return map
  }, [book])

  const groupedWarnings = useMemo(() => {
    if (!book) return []
    const map = new Map<string, S2cBookWarning[]>()
    for (const w of book.warnings) {
      const list = map.get(w.code) ?? []
      list.push(w)
      map.set(w.code, list)
    }
    return Array.from(map.entries()).map(([code, items]) => ({ code, items }))
  }, [book])

  const toggleCode = (code: string) =>
    setExpandedCodes((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })

  const toggleItems = (code: string) =>
    setExpandedItems((prev) => {
      const next = new Set(prev)
      next.has(code) ? next.delete(code) : next.add(code)
      return next
    })

  const openUploadModal = (line: S2cExpenseLine) => {
    setEvidenceTarget({
      expenseId: line.expenseId,
      expenseTitle: line.expenseTitle,
      amount: line.amount,
      expenseDate: line.expenseDate,
      voucherNumber: line.voucherNumber,
      categoryName: line.categoryName,
    })
    setEvidenceFile(null)
    setEvidencePreview(null)
  }

  const openUploadModalById = async (expenseId: string) => {
    const matched = expenseLineById.get(expenseId)
    if (matched) {
      openUploadModal(matched)
      return
    }
    try {
      const res = await getExpenseById(expenseId)
      if (res.success && res.data) {
        setEvidenceTarget({
          expenseId: res.data.expenseId,
          expenseTitle: res.data.expenseTitle,
          amount: res.data.amount,
          expenseDate: res.data.expenseDate,
          voucherNumber: res.data.expenseId,
          categoryName: res.data.categoryName,
        })
        setEvidenceFile(null)
        setEvidencePreview(null)
      } else {
        navigate(`/business-owner/expenses?expenseId=${encodeURIComponent(expenseId)}&autoOpen=true`)
      }
    } catch {
      navigate(`/business-owner/expenses?expenseId=${encodeURIComponent(expenseId)}&autoOpen=true`)
    }
  }

  const closeUploadModal = () => {
    setEvidenceTarget(null)
    setEvidenceFile(null)
    setEvidencePreview(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setEvidenceFile(file)
      setEvidencePreview(URL.createObjectURL(file))
    }
  }

  const handleSaveEvidence = async () => {
    if (!evidenceTarget || !evidenceFile) {
      toast.error('Vui lòng chọn ảnh chứng từ trước khi lưu')
      return
    }
    try {
      setIsSavingEvidence(true)
      const uploadedUrl = await uploadImage(evidenceFile)

      const res = await getExpenseById(evidenceTarget.expenseId)
      if (!res.success || !res.data) {
        throw new Error(res.message || 'Không thể lấy thông tin khoản chi')
      }
      const exp = res.data

      const updateRes = await updateExpense(evidenceTarget.expenseId, {
        expenseCategoryId: exp.expenseCategoryId,
        expenseTitle: exp.expenseTitle,
        amount: exp.amount,
        expenseDate: exp.expenseDate,
        paymentMethod: exp.paymentMethod,
        receiptImageUrl: uploadedUrl,
        note: exp.note,
        fileUrl: exp.fileUrl,
        dueDate: exp.dueDate,
        paidDate: exp.paidDate,
        supplierId: exp.supplierId,
      })

      if (!updateRes.success) {
        throw new Error(updateRes.message || 'Không thể cập nhật chứng từ cho khoản chi')
      }

      toast.success('Bổ sung chứng từ thành công!')
      closeUploadModal()
      void load()
    } catch (err: any) {
      toast.error(err.message || 'Đã có lỗi xảy ra khi tải lên chứng từ')
    } finally {
      setIsSavingEvidence(false)
    }
  }

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
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Sổ chi phí sản xuất, kinh doanh (S2c)</h1>
            <LegalBadge
              formCode='Mẫu S2c-HKD'
              circular='TT 88/2021/TT-BTC'
              title='Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ Tài chính'
              description={'Ghi nhận các khoản chi phí kinh doanh thực tế (mặt bằng, điện nước, mua ngoài...). \n\n➜ Đích đến: Tổng hợp thành Chỉ tiêu [10] khi quyết toán để giảm trừ thu nhập chịu thuế.'}
            />
          </div>
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
            className='flex items-center gap-2 rounded-lg bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 cursor-pointer'>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button onClick={confirmReview}
            disabled={!book || hasHardBlocker || confirmingReview}
            className='flex items-center gap-2 rounded-lg border border-emerald-700 px-4 py-2.5 text-sm font-semibold text-emerald-700 disabled:opacity-50 cursor-pointer'>
            <Check size={16} />
            {confirmingReview ? 'Đang lưu...' : 'Xác nhận đã rà soát'}
          </button>
          <button onClick={download}
            disabled={!book || hasHardBlocker || (hasEvidenceWarnings && !book.evidenceReviewedAt) || exporting}
            className='flex items-center gap-2 rounded-lg border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] disabled:opacity-50 cursor-pointer'>
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

      {groupedWarnings.length > 0 && (
        <div className='mb-5 overflow-hidden rounded-xl border border-amber-300 bg-amber-50'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-2 font-semibold text-amber-950'>
              <span>⚠ Dữ liệu cần kiểm tra</span>
              <span className='rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900'>
                {groupedWarnings.reduce((sum, g) => sum + g.items.length, 0)} vấn đề
              </span>
            </div>
            <button
              onClick={() => {
                if (expandedCodes.size === groupedWarnings.length) {
                  setExpandedCodes(new Set())
                } else {
                  setExpandedCodes(new Set(groupedWarnings.map((g) => g.code)))
                }
              }}
              className='flex items-center gap-1 text-xs font-medium text-amber-900 hover:underline cursor-pointer'
            >
              {expandedCodes.size === groupedWarnings.length ? (
                <>
                  <ChevronUp size={13} /> Thu gọn tất cả
                </>
              ) : (
                <>
                  <ChevronDown size={13} /> Mở rộng tất cả
                </>
              )}
            </button>
          </div>

          {/* Group rows */}
          <div className='divide-y divide-amber-200 border-t border-amber-200'>
            {groupedWarnings.map(({ code, items }) => {
              const meta = WARNING_META[code]
              const isOpen = expandedCodes.has(code)
              const showAll = expandedItems.has(code)
              const PREVIEW_LIMIT = 5
              const displayed = showAll ? items : items.slice(0, PREVIEW_LIMIT)
              const severityDot = meta?.severity === 'error' ? 'bg-red-500' : 'bg-amber-500'

              return (
                <div key={code}>
                  {/* Group header — clickable to expand */}
                  <button
                    onClick={() => toggleCode(code)}
                    className='flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-amber-100/60 cursor-pointer'
                  >
                    <div className='flex items-center gap-2'>
                      <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${severityDot}`} />
                      <span className='text-sm font-medium text-amber-950'>{meta?.label ?? code}</span>
                      <span className='rounded-full bg-amber-200/80 px-1.5 py-0.5 text-xs font-semibold text-amber-900'>
                        {items.length}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={14} className='text-amber-700' /> : <ChevronDown size={14} className='text-amber-600' />}
                  </button>

                  {/* Expandable detail list */}
                  {isOpen && (
                    <div className='border-t border-amber-200/60 bg-white/70 px-4 pb-3 pt-2'>
                      <ul className='space-y-1.5'>
                        {displayed.map((item, i) => {
                          const matchedLine = item.sourceId ? expenseLineById.get(item.sourceId) : undefined
                          const isInventoryPurchase = code === 'MissingInventoryPurchaseEvidence'

                          return (
                            <li
                              key={`${code}-${item.sourceId ?? i}`}
                              className='flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950 py-1.5 border-b border-amber-100/60 last:border-b-0'
                            >
                              <div className='flex flex-wrap items-center gap-2'>
                                <span className='select-none text-amber-500 font-bold'>›</span>

                                {matchedLine ? (
                                  <>
                                    <span className='font-semibold text-gray-900'>{matchedLine.expenseTitle}</span>
                                    <span className='font-bold text-orange-700 tabular-nums'>
                                      {money.format(matchedLine.amount)} đ
                                    </span>
                                    <span className='text-gray-500'>
                                      ({new Date(matchedLine.expenseDate).toLocaleDateString('vi-VN')})
                                    </span>
                                    {matchedLine.categoryName && (
                                      <span className='rounded bg-amber-100 px-1.5 py-0.5 text-[11px] text-amber-900'>
                                        {matchedLine.categoryName}
                                      </span>
                                    )}
                                    <span className='font-mono text-[11px] text-gray-500'>
                                      #{matchedLine.voucherNumber.slice(0, 10)}…
                                    </span>
                                  </>
                                ) : isInventoryPurchase ? (
                                  <>
                                    <span className='font-semibold text-gray-900'>Phiếu nhập kho tính giá xuất S2d</span>
                                    {item.sourceId && (
                                      <span className='font-mono text-[11px] text-gray-600'>
                                        Mã phiếu: #{item.sourceId.slice(0, 8)}…
                                      </span>
                                    )}
                                  </>
                                ) : (
                                  <span className='text-gray-800'>{item.message}</span>
                                )}
                              </div>

                              <div>
                                {isInventoryPurchase ? (
                                  <button
                                    onClick={() =>
                                      navigate(
                                        `/business-owner/purchase-expenses?id=${encodeURIComponent(item.sourceId ?? '')}&autoOpen=true`
                                      )
                                    }
                                    className='inline-flex items-center gap-1 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 transition-colors cursor-pointer'
                                    title='Đi tới danh sách phiếu nhập kho để bổ sung chứng từ'
                                  >
                                    <span>Xem phiếu nhập</span>
                                    <ExternalLink size={12} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => {
                                      if (matchedLine) {
                                        openUploadModal(matchedLine)
                                      } else if (item.sourceId) {
                                        void openUploadModalById(item.sourceId)
                                      }
                                    }}
                                    className='inline-flex items-center gap-1.5 rounded-md bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 text-[11.5px] font-semibold text-amber-900 transition-colors cursor-pointer'
                                    title='Bổ sung ảnh chứng từ nhanh cho khoản chi này'
                                  >
                                    <ImagePlus size={13} />
                                    <span>Bổ sung chứng từ</span>
                                  </button>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>

                      {items.length > PREVIEW_LIMIT && (
                        <button
                          onClick={() => toggleItems(code)}
                          className='mt-2 text-xs font-medium text-amber-800 hover:underline cursor-pointer'
                        >
                          {showAll ? '▲ Thu gọn' : `▼ Xem thêm ${items.length - PREVIEW_LIMIT} vấn đề`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {book && book.excludedCashPaymentExpenseCount > 0 ? (
        <div className='mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950'>
          <p className='font-bold text-sky-900 mb-1 flex items-center gap-1.5'>
            <span>💡 Quy định chi tiền mặt từ 5 triệu đồng (Luật thuế):</span>
          </p>
          <p>
            Phát hiện <strong>{book.excludedCashPaymentExpenseCount} khoản chi</strong> từ 5 triệu đồng trở lên thanh toán bằng tiền mặt (tổng <strong>{money.format(book.excludedCashPaymentExpenseAmount)} đ</strong>). Theo quy định về hóa đơn chứng từ hợp pháp, các khoản này không đủ điều kiện thanh toán không dùng tiền mặt nên không được cộng vào chi phí dự kiến được trừ khi quyết toán thuế.
          </p>
        </div>
      ) : null}

      {book && book.excludedInventoryCashCost > 0 ? (
        <div className='mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950'>
          <p className='font-bold text-sky-900 mb-1 flex items-center gap-1.5'>
            <span>💡 Chi phí nguyên vật liệu xuất dùng bằng tiền mặt:</span>
          </p>
          <p>
            <strong>{money.format(book.excludedInventoryCashCost)} đ</strong> trong giá trị nguyên vật liệu xuất dùng có nguồn gốc từ phiếu nhập từ 5 triệu đồng trở lên thanh toán bằng tiền mặt, do đó không được tính vào chi phí dự kiến được trừ khi quyết toán thuế.
          </p>
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>
          {loading ? 'Đang tải sổ...' : 'Không có dữ liệu để hiển thị.'}
        </div>
      ) : (
        <div className='space-y-5'>
          <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
            <Summary label='Doanh thu từ S2b' value={book.totalRevenue} />
            <Summary label='Nguyên vật liệu xuất dùng từ S2d' value={book.materialCost} />
            <Summary label='Dịch vụ mua ngoài' value={book.purchasedServicesCost} />
            <Summary label='Chi phí khác' value={book.otherDirectCost} />
            <Summary label='Kết quả sau chi phí' value={book.netIncome} accent />
          </div>

          <div className='rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950'>
            <div className='font-semibold'>Tiền vào trừ các khoản chi dự kiến được trừ</div>
            <div className='mt-2 flex flex-wrap items-center gap-2 tabular-nums'>
              <span className='font-semibold text-emerald-700'>+ {money.format(book.totalRevenue)} đ doanh thu</span>
              <strong>−</strong>
              <span className='text-orange-700'>{money.format(book.materialCost)} đ nguyên vật liệu</span>
              <strong>−</strong>
              <span className='text-orange-700'>{money.format(book.purchasedServicesCost)} đ dịch vụ mua ngoài</span>
              <strong>−</strong>
              <span className='text-orange-700'>{money.format(book.otherDirectCost)} đ chi phí khác</span>
              <strong>=</strong>
              <span className={`font-bold ${book.netIncome >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                {money.format(book.netIncome)} đ
              </span>
            </div>
            <div className='mt-2 text-xs text-sky-800'>TaxMate hiện chưa hỗ trợ chi phí nhân công; khoản này chưa được tổng hợp vào sổ S2c.</div>
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
                  <tr key={line.expenseId} className='border-t hover:bg-gray-50/70 transition-colors'>
                    <td className='whitespace-nowrap px-4 py-3'>{new Date(line.expenseDate).toLocaleDateString('vi-VN')}</td>
                    <td className='whitespace-nowrap px-4 py-3'>
                      <button
                        onClick={() =>
                          navigate(
                            `/business-owner/expenses?expenseId=${encodeURIComponent(line.expenseId)}&autoOpen=true`
                          )
                        }
                        className='group inline-flex items-center gap-1 font-mono text-gray-800 hover:text-[#9b0000] hover:underline cursor-pointer'
                        title='Xem & chỉnh sửa chi tiết khoản chi'
                      >
                        <span>{line.voucherNumber}</span>
                        <ExternalLink size={12} className='text-gray-400 group-hover:text-[#9b0000]' />
                      </button>
                    </td>
                    <td className='min-w-56 px-4 py-3 font-medium text-gray-900'>{line.expenseTitle}</td>
                    <td className='px-4 py-3'>{line.categoryName}</td>
                    <td className='whitespace-nowrap px-4 py-3'>{groupLabels[line.groupCode]}</td>
                    <td className='whitespace-nowrap px-4 py-3 text-right font-semibold'>{money.format(line.amount)} đ</td>
                    <td className='px-4 py-3 text-center'>
                      {line.hasEvidence ? (
                        <span className='inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700'>
                          <Check size={12} />
                          Có tệp chứng từ
                        </span>
                      ) : (
                        <button
                          onClick={() => openUploadModal(line)}
                          className='inline-flex items-center gap-1.5 rounded-md bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-900 transition-colors cursor-pointer'
                          title='Nhấn để tải lên ảnh hóa đơn / chứng từ cho khoản chi này'
                        >
                          <ImagePlus size={13} />
                          <span>Chưa có tệp chứng từ</span>
                        </button>
                      )}
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

      {/* Quick Evidence Upload Modal */}
      {evidenceTarget && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in duration-200'>
          <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-100'>
            {/* Header */}
            <div className='flex items-center justify-between border-b border-orange-100 bg-gradient-to-r from-orange-50 to-white px-6 py-4'>
              <div className='flex items-center gap-2.5'>
                <div className='flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-orange-600 shadow-xs'>
                  <ImagePlus size={18} />
                </div>
                <div>
                  <h3 className='text-[15px] font-bold text-gray-900'>Bổ sung chứng từ chi phí</h3>
                  <p className='text-xs text-gray-500'>Cập nhật hóa đơn / biên lai cho sổ S2c</p>
                </div>
              </div>
              <button
                onClick={closeUploadModal}
                className='rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div className='p-6 space-y-4'>
              {/* Expense mini card */}
              <div className='rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 space-y-1.5 text-xs'>
                <div className='flex items-center justify-between'>
                  <span className='font-bold text-gray-900 text-sm'>{evidenceTarget.expenseTitle}</span>
                  <span className='font-bold text-orange-600 text-sm tabular-nums'>
                    {money.format(evidenceTarget.amount)} đ
                  </span>
                </div>
                <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-500'>
                  <span>Ngày: {new Date(evidenceTarget.expenseDate).toLocaleDateString('vi-VN')}</span>
                  {evidenceTarget.categoryName && <span>Danh mục: {evidenceTarget.categoryName}</span>}
                  {evidenceTarget.voucherNumber && (
                    <span className='font-mono text-[11px]'>#{evidenceTarget.voucherNumber}</span>
                  )}
                </div>
              </div>

              {/* Upload Drop Zone / Preview */}
              <div>
                <label className='mb-1.5 block text-[13px] font-bold text-gray-700'>
                  Hình ảnh hóa đơn, chứng từ <span className='text-red-500'>*</span>
                </label>
                {evidencePreview ? (
                  <div className='relative rounded-xl border-2 border-dashed border-orange-200 bg-orange-50/30 p-2 text-center group overflow-hidden'>
                    <img
                      src={evidencePreview}
                      alt='Xem trước chứng từ'
                      className='mx-auto max-h-56 w-full rounded-lg object-contain bg-white/70'
                    />
                    <div className='mt-2 flex items-center justify-center gap-2'>
                      <button
                        type='button'
                        onClick={() => fileInputRef.current?.click()}
                        className='rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-xs hover:bg-gray-50 cursor-pointer'
                      >
                        Chọn ảnh khác
                      </button>
                      <button
                        type='button'
                        onClick={() => {
                          setEvidenceFile(null)
                          setEvidencePreview(null)
                        }}
                        className='rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 cursor-pointer'
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-6 transition-all hover:border-orange-400 hover:bg-orange-50/30'
                  >
                    <div className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 mb-2'>
                      <UploadCloud size={24} />
                    </div>
                    <p className='text-sm font-semibold text-gray-800'>Bấm để tải lên ảnh chứng từ</p>
                    <p className='mt-1 text-xs text-gray-500'>Hỗ trợ PNG, JPG, JPEG, WEBP (tối đa 10MB)</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  className='hidden'
                  onChange={handleFileChange}
                />
              </div>

              {/* Link to full edit page */}
              <div className='text-right'>
                <button
                  type='button'
                  onClick={() => {
                    const id = evidenceTarget.expenseId
                    closeUploadModal()
                    navigate(`/business-owner/expenses?expenseId=${encodeURIComponent(id)}&autoOpen=true`)
                  }}
                  className='inline-flex items-center gap-1 text-xs font-medium text-orange-700 hover:underline cursor-pointer'
                >
                  <span>Mở trang chi tiết khoản chi đầy đủ</span>
                  <ExternalLink size={11} />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className='flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/80 px-6 py-3.5'>
              <button
                type='button'
                onClick={closeUploadModal}
                disabled={isSavingEvidence}
                className='rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-xs hover:bg-gray-100 transition-colors disabled:opacity-50 cursor-pointer'
              >
                Hủy
              </button>
              <button
                type='button'
                onClick={handleSaveEvidence}
                disabled={!evidenceFile || isSavingEvidence}
                className='inline-flex items-center gap-2 rounded-lg bg-orange-600 px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-orange-700 transition-colors disabled:opacity-50 cursor-pointer'
              >
                {isSavingEvidence ? (
                  <>
                    <Loader2 size={14} className='animate-spin' />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Lưu chứng từ</span>
                  </>
                )}
              </button>
            </div>
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
