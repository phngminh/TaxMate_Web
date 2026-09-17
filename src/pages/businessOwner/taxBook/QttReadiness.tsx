import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Search, CircleAlert, CheckCircle2, ReceiptText, X } from 'lucide-react'
import { useBusiness } from '../../../contexts/BusinessContext'
import { taxPeriodPreviewPath } from '../../../utils/taxPeriodRoute'
import type { QttPreview } from '../../../types/taxBook.type'

const button = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-indigo-300 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-indigo-500 disabled:opacity-40'
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-40'
const labels: Record<string, string> = {
  MissingExpenseEvidence: 'Chưa có ảnh hoặc tệp chứng từ.',
  MissingInventoryPurchaseEvidence: 'Chưa có chứng từ cho khoản mua hàng nhập kho.',
  ExpenseNotMappedToS2c: 'Chưa chọn nhóm chi phí nên khoản này chưa được tính.',
  CashExpenseExcluded: 'Khoản thanh toán tiền mặt này không được tính vào chi phí được trừ.',
  LaborExpenseUnsupported: 'Phần mềm chưa hỗ trợ tính khoản chi nhân công này.',
  RevenueS2bEqualsS2c: 'Tổng doanh thu trong các sổ chưa khớp. Cần kiểm tra lại doanh thu và chi phí.',
  MaterialS2dReconcilesS2c: 'Tiền hàng đã xuất dùng chưa khớp với chi phí nguyên vật liệu.',
  InventoryValueReconciles: 'Số tiền hàng tồn chưa khớp với hàng nhập và xuất.',
  UnclassifiedRevenue: 'Có khoản doanh thu chưa chọn ngành kinh doanh.',
  NegativeInventoryBalance: 'Có mặt hàng xuất nhiều hơn số đang có. Cần kiểm tra nhập và xuất kho.',
  MissingOpeningInventory: 'Có mặt hàng chưa nhập số tồn đầu kỳ.',
  QttNotEligible: 'Năm này không thuộc trường hợp lập quyết toán bằng chức năng này.',
  AnnualRevenueOver50B: 'Doanh thu năm vượt phạm vi quyết toán mà phần mềm hỗ trợ.',
  PitPaymentSourceMethodMissing: 'Có khoản thuế đã nộp chưa xác định được cách tính ban đầu.',
  UnclassifiedTaxPayment: 'Có khoản tiền thuế chưa xác định được loại thuế.',
  PitPaymentNotCompleted: 'Có khoản thuế chưa thanh toán thành công nên chưa được trừ khỏi số phải nộp.'
}
const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`

export default function QttReadiness({ preview, year, fromTkn, busy, onReview }: {
  preview: QttPreview; year: number; fromTkn: string | null; busy: boolean
  onReview: (businessId: string, quarter: number) => Promise<void>
}) {
  const navigate = useNavigate()
  const { businesses, setCurrentBusiness } = useBusiness()
  const goTo = (businessId: string | null, destination: string) => {
    const business = businesses.find(x => x.id === businessId)
    if (business) setCurrentBusiness(business)
    navigate(destination)
  }
  const name = (id: string) => preview.businesses.find(x => x.businessId === id)?.businessName ?? 'Cơ sở kinh doanh'
  const openQuarters = preview.quarters.filter(x => !x.closed)
  const blockers = preview.hardBlockers.filter(x => !/^Quarter\dNotClosed$/.test(x.code))
  const otherWarnings = preview.warnings.filter(x => !['EvidenceReviewRequired', 'MissingExpenseEvidence', 'ExpenseNotMappedToS2c', 'MissingInventoryPurchaseEvidence'].includes(x.code))
  const returnQuery = new URLSearchParams({ returnTo: 'qtt', year: String(year) })
  if (fromTkn) returnQuery.set('fromTkn', fromTkn)
  const periods = preview.evidenceReviewPeriods.filter(p => p.required || preview.expenseReviewRows.some(r => r.businessId === p.businessId && r.quarter === p.quarter && r.issueCodes.length > 0))
  const pending = periods.filter(p => p.required && !p.reviewed)
  const initial = pending[0] ?? periods.find(p => p.quarter === (openQuarters[0]?.quarter ?? 4)) ?? periods[0]
  const [selection, setSelection] = useState<{ businessId: string; quarter: number } | null>(null)
  const period = periods.find(p => p.businessId === selection?.businessId && p.quarter === selection.quarter) ?? initial
  const [query, setQuery] = useState('')
  const [onlyIssues, setOnlyIssues] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 6
  const rows = period ? preview.expenseReviewRows.filter(r => r.businessId === period.businessId && r.quarter === period.quarter) : []
  const filtered = rows.filter(r => (!onlyIssues || r.issueCodes.length > 0) &&
    `${r.description} ${r.documentNumber}`.toLocaleLowerCase('vi').includes(query.trim().toLocaleLowerCase('vi')))
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const selectPeriod = (businessId: string, quarter: number) => {
    setSelection({ businessId, quarter }); setQuery(''); setPage(1)
  }
  const openQuarter = (q: QttPreview['quarters'][number]) => goTo(q.businessId, q.taxPeriodId
    ? `${taxPeriodPreviewPath(q.taxPeriodId)}?${returnQuery}` : `/business-owner/tax?${returnQuery}&quarter=${q.quarter}`)
  const nextAction = () => {
    if (openQuarters[0]) return openQuarter(openQuarters[0])
    if (blockers.length) { document.getElementById('qtt-data-issues')?.scrollIntoView({ block: 'start', behavior: 'smooth' }); return }
    if (pending[0]) selectPeriod(pending[0].businessId, pending[0].quarter)
    document.getElementById('qtt-expenses')?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }

  return <>
    {openQuarters.length > 0 && <section id="qtt-quarters" className="scroll-mt-24 py-6">
      <h2 className="text-lg font-semibold">Hoàn tất kê khai theo quý</h2>
      <p className="mt-2 text-sm text-slate-600">Kỳ kê khai dùng chung cho các cơ sở của chủ hộ.</p>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2" aria-label="Tình trạng bốn quý">{preview.quarters.map(q => <span key={q.quarter} className={`inline-flex items-center gap-1.5 text-sm font-medium ${q.closed ? 'text-emerald-700' : 'text-amber-800'}`}>
        {q.closed ? <CheckCircle2 size={16} /> : <CircleAlert size={16} />}Quý {q.quarter} · {q.closed ? 'Đã chốt' : 'Chưa chốt'}
      </span>)}</div>
      <ul className="mt-3 divide-y divide-slate-100">{openQuarters.map(q => <li key={q.quarter} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <span>Quý {q.quarter}/{year} · {q.taxPeriodId ? 'Chưa chốt kỳ' : 'Chưa lập kê khai'}</span>
        <button className={primary} disabled={busy} onClick={() => openQuarter(q)}>
          {q.taxPeriodId ? `Kiểm tra và chốt Quý ${q.quarter}` : `Lập kê khai Quý ${q.quarter}`}<ArrowRight size={16} />
        </button>
      </li>)}</ul>
    </section>}
    {blockers.length > 0 && <section id="qtt-data-issues" className="scroll-mt-24 py-6">
      <h2 className="text-lg font-semibold">Dữ liệu cần kiểm tra</h2>
      <ul className="mt-3 space-y-4">{blockers.map((issue, index) => <li key={`${issue.code}-${index}`} className="text-sm leading-6">
        <p>{labels[issue.code] ?? 'Có dữ liệu cần kiểm tra trước khi hoàn tất. Mở sổ liên quan để xem khoản cần xử lý.'}{issue.businessId ? ` · ${name(issue.businessId)}` : ''}</p>
        <button className="mt-1 underline underline-offset-4" disabled={busy} onClick={() => goTo(issue.businessId,
          `/business-owner/tax-books/${/Inventory|S2d|Material/.test(issue.code) ? 's2d' : 's2c'}?year=${year}`)}>Mở sổ để kiểm tra</button>
      </li>)}</ul>
    </section>}
    {periods.length > 0 && period && <section id="qtt-expenses" className="scroll-mt-24 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-lg font-semibold"><ReceiptText size={20} className="text-indigo-500" />Chi phí & chứng từ</h2>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${pending.length ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
          {pending.length ? <CircleAlert size={14} /> : <CheckCircle2 size={14} />}{pending.length ? `${pending.length} kỳ cần kiểm tra` : 'Đã kiểm tra các kỳ'}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-500">{pending.length
        ? 'Chọn cơ sở và quý để xem chứng từ, sau đó xác nhận đã kiểm tra cả quý.'
        : 'Các kỳ đã được xác nhận. Bạn có thể xem lại chứng từ; việc này không chặn bước tiếp theo.'}</p>
      <div className="mt-5 flex flex-wrap items-end gap-4">
        <label className="w-full min-w-0 text-xs font-medium text-slate-500 sm:w-auto sm:flex-1">Cơ sở kinh doanh
          <select aria-label="Cơ sở kiểm tra chi phí" value={period.businessId} disabled={busy} className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800"
            onChange={e => { const target = periods.find(p => p.businessId === e.target.value && p.quarter === period.quarter) ?? periods.find(p => p.businessId === e.target.value)!; selectPeriod(target.businessId, target.quarter) }}>
            {preview.businesses.filter(b => periods.some(p => p.businessId === b.businessId)).map(b => <option key={b.businessId} value={b.businessId}>{b.businessName}</option>)}
          </select>
        </label>
        <div><p className="mb-1.5 text-xs font-medium text-slate-500">Quý</p><div className="flex gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Chọn quý chi phí">
          {[1, 2, 3, 4].map(quarter => { const p = periods.find(x => x.businessId === period.businessId && x.quarter === quarter); return <button key={quarter} aria-pressed={period.quarter === quarter}
            className={`min-h-9 min-w-12 rounded-lg px-3 text-sm font-semibold transition-colors disabled:opacity-30 ${period.quarter === quarter ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-indigo-700'}`}
            disabled={busy || !p} onClick={() => selectPeriod(period.businessId, quarter)}>Q{quarter}{p?.required && !p.reviewed && <span className="ml-1 inline-block size-1.5 rounded-full bg-amber-500" aria-label="chưa kiểm tra" />}</button> })}
        </div></div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <label className="flex min-w-48 flex-1 items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-slate-400"><Search size={16} />
          <input aria-label="Tìm khoản chi" placeholder="Tìm tên khoản chi hoặc mã phiếu…" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }} className="w-full bg-transparent text-sm text-slate-800 outline-none" />
        </label>
        {query && <button aria-label="Xóa tìm kiếm chi phí" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" onClick={() => { setQuery(''); setPage(1) }}><X size={16} /></button>}
        <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" className="accent-indigo-600" checked={onlyIssues} onChange={e => { setOnlyIssues(e.target.checked); setPage(1) }} />Chỉ khoản cần lưu ý ({rows.filter(r => r.issueCodes.length).length})</label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-y border-slate-200 bg-slate-50/80 px-3 py-2.5 text-xs text-slate-500">
        <span>{name(period.businessId)} · Quý {period.quarter} · {rows.length} khoản</span>
        <span className={`flex items-center gap-1 font-medium ${period.reviewed || !period.required ? 'text-emerald-700' : 'text-amber-800'}`}>{period.reviewed || !period.required ? <CheckCircle2 size={14} /> : <CircleAlert size={14} />}{period.reviewed || !period.required ? 'Đã kiểm tra' : 'Chưa xác nhận kiểm tra'}</span>
      </div>
      <ul className="divide-y divide-slate-100">{visibleRows.map(row => <li key={row.sourceId} className="px-1 py-3 text-sm">
        <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="font-medium text-slate-800">{row.description}</p>
          <p className="mt-1 break-words text-xs text-slate-400">{new Date(/Z$|[+-]\d\d:\d\d$/.test(row.documentDate) ? row.documentDate : `${row.documentDate}Z`).toLocaleDateString('vi-VN', { timeZone: 'Asia/Bangkok' })} · {row.documentNumber}</p></div>
          <p className="shrink-0 text-right font-semibold tabular-nums text-slate-800">{money(row.amount)}</p></div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className={row.includedAmount === 0 ? 'font-medium text-slate-500' : 'text-slate-500'}>{row.includedAmount === null ? 'Chi phí tính theo hàng đã xuất dùng' : row.includedAmount === 0 ? 'Chưa được tính vào chi phí' : `Chi phí được tính: ${money(row.includedAmount)}`}</span>
          {row.issueCodes.map(code => <span key={code} className="text-amber-800">{labels[code] ?? 'Khoản chi này cần được kiểm tra lại.'}</span>)}
        </div>
      </li>)}</ul>
      {filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">{rows.length ? 'Không có khoản chi khớp bộ lọc.' : 'Chưa có dòng chứng từ. Có thể xem chi phí hàng đã xuất dùng trong sổ chi phí.'}</p>}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 py-3 text-sm">
        <p className="text-xs text-slate-500" aria-live="polite">{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} / ${filtered.length} khoản` : '0 khoản'} · Trang {currentPage}/{pageCount}</p>
        <div className="flex gap-2"><button aria-label="Trang chi phí trước" className={button} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} />Trước</button>
          <button aria-label="Trang chi phí sau" className={button} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>Sau<ChevronRight size={16} /></button></div>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button className={button} disabled={busy} onClick={() => goTo(period.businessId, `/business-owner/tax-books/s2c?${returnQuery}&quarter=${period.quarter}`)}>Mở sổ chi phí Quý {period.quarter}<ArrowRight size={15} /></button>
        {period.required && !period.reviewed && <button className={primary} disabled={busy} onClick={() => void onReview(period.businessId, period.quarter)}>Xác nhận đã kiểm tra cả Quý {period.quarter}</button>}
      </div>
      {period.required && !period.reviewed && <p className="mt-2 text-xs leading-5 text-slate-500">Xác nhận áp dụng cho cả quý, gồm mọi trang và khoản đang lọc. Không tự bổ sung hóa đơn hay thay đổi số tiền được tính.</p>}
    </section>}
    {otherWarnings.length > 0 && <section className="py-6"><h2 className="text-lg font-semibold">Thông tin cần lưu ý</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-600">{otherWarnings.map((issue, index) => <li key={index}>{labels[issue.code] ?? 'Có dữ liệu cần xem lại trong sổ chi phí.'}</li>)}</ul>
    </section>}
    {!preview.canClose && <div className="fixed inset-x-0 bottom-0 z-40 border-t border-indigo-100 bg-white/95 px-4 py-3 shadow-[0_-4px_24px_rgba(30,41,59,0.06)] backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <div><p className="flex items-center gap-2 text-sm font-semibold text-slate-800"><CircleAlert size={17} className="text-amber-500" />Chưa thể tạo tờ khai năm {year}</p>
          <p className="mt-1 text-xs text-slate-500">{openQuarters.length ? `Cần hoàn tất Quý ${openQuarters.map(q => q.quarter).join(', ')} trước.` : blockers.length ? 'Cần xử lý dữ liệu còn vướng trước khi tính thuế.' : `Còn ${pending.length} kỳ chi phí chưa xác nhận.`}</p></div>
        <button className={`${primary} w-full sm:w-auto`} disabled={busy} onClick={nextAction}>{openQuarters[0] ? `Tiếp tục với Quý ${openQuarters[0].quarter}` : blockers.length ? 'Xem dữ liệu cần xử lý' : 'Kiểm tra chi phí'}<ArrowRight size={16} /></button>
      </div>
    </div>}
  </>
}
