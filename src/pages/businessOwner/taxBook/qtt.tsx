import { Download, Loader2, ArrowLeft, ArrowUpRight, CircleAlert, CheckCircle2, FileCheck2, CalendarDays } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { QttIndicators } from '../../../types/taxBook.type'
import { useQttPage } from './useQttPage'
import QttAllocationEditor from './QttAllocationEditor'
import QttReadiness from './QttReadiness'

const money = (value: number) => `${value.toLocaleString('vi-VN', { maximumFractionDigits: 0 })}đ`
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-indigo-200 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-50'
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50'
const progress: Record<string, string> = {
  check: 'Đang kiểm tra dữ liệu…', calculate: 'Đang tính thuế…', create: 'Đang tạo hồ sơ…',
  allocate: 'Đang lưu cách xử lý tiền thừa…', confirm: 'Đang xác nhận hồ sơ…', download: 'Đang tải tờ khai…',
  reconcile: 'Đang kiểm tra trạng thái đã lưu…', review: 'Đang lưu việc kiểm tra…', submit: 'Đang ghi nhận đã nộp…'
}

export default function QttPage() {
  const { currentBusiness } = useBusiness()
  const [params] = useSearchParams()
  return <QttContent key={`${currentBusiness?.id}:${params.get('year')}:${params.get('fromTkn')}`} />
}

function QttContent() {
  const q = useQttPage()
  const { currentBusiness, businesses } = useBusiness()
  const d = q.declaration
  const i = q.indicators
  const openQuarters = q.preview?.quarters.filter(x => !x.closed) ?? []
  const pendingReviews = q.preview?.evidenceReviewPeriods.filter(x => x.required && !x.reviewed) ?? []
  const headline = q.screen === 'blocked'
    ? openQuarters.length ? `Còn ${openQuarters.length} quý cần hoàn tất`
      : pendingReviews.length ? 'Cần kiểm tra chi phí trước khi tính thuế' : 'Còn dữ liệu cần kiểm tra'
    : i && i.indicator19 > 0 ? 'Bạn cần nộp thêm'
      : i && i.indicator20 > 0 ? 'Bạn đã nộp thừa' : 'Bạn không cần nộp thêm thuế'
  const statusColor = q.screen === 'blocked' || (i?.indicator19 ?? 0) > 0
    ? 'text-amber-800' : (i?.indicator20 ?? 0) > 0 ? 'text-sky-700' : 'text-emerald-700'
  const statusBackground = q.screen === 'blocked' || (i?.indicator19 ?? 0) > 0
    ? 'from-amber-50/90 to-white' : (i?.indicator20 ?? 0) > 0 ? 'from-sky-50/90 to-white' : 'from-emerald-50/90 to-white'

  return <main id="qtt-top" className="mx-auto mb-6 max-w-5xl scroll-mt-20 rounded-3xl bg-white px-5 pb-44 pt-5 text-slate-900 shadow-sm ring-1 ring-slate-200/60 sm:mt-5 sm:px-9 sm:pb-40 sm:pt-7">
    <Link to="/business-owner/tax" className="mb-5 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-indigo-600"><ArrowLeft size={14} />Về quản lý thuế</Link>
    <header className="flex flex-wrap items-start justify-between gap-4 pb-5">
      <div><p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-indigo-500">Hồ sơ thuế · Cả năm</p><h1 className="text-2xl font-semibold tracking-tight">Quyết toán thu nhập cá nhân</h1>
        <p className="mt-2 text-sm text-slate-500">{d?.taxpayerName ?? q.preview?.taxpayerName ?? 'Chủ hộ kinh doanh'} · Mẫu 02/CNKD-TNCN-QTT</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">Gồm {q.preview?.businesses.map(x => x.businessName).join(', ') || businesses.map(x => x.businessName).join(', ')}</p>
      </div>
      <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1 text-xs text-slate-500"><CalendarDays size={16} />Năm<select aria-label="Năm quyết toán" className="rounded-lg border-0 bg-transparent px-1 py-2 text-sm font-semibold text-slate-800" value={q.year} disabled={q.busy || q.loading}
        onChange={e => q.setYear(Number(e.target.value))}>
        {Array.from(new Set([q.year, ...Array.from({ length: 8 }, (_, n) => new Date().getFullYear() + 1 - n)])).sort((a, b) => b - a).map(year => <option key={year}>{year}</option>)}
      </select></label>
    </header>
    {!currentBusiness ? <p className="py-8">Chọn cơ sở kinh doanh để xem quyết toán của chủ hộ.</p>
      : q.loading ? <div role="status" className="flex items-center gap-3 py-12 text-slate-600"><Loader2 className="animate-spin" size={20} />Đang tổng hợp hồ sơ…</div>
        : <>
          {q.error && <div role="alert" className="my-5 border-l-2 border-amber-600 py-2 pl-4 text-sm text-amber-900">
            <p>{q.error}</p>{(q.needsReconcile || !q.screen) && <button className="mt-3 underline" disabled={q.busy} onClick={() => void q.load()}>Kiểm tra lại trạng thái</button>}
          </div>}
          {q.notice && <p role="status" className="my-5 text-sm text-slate-700">{q.notice}</p>}
          {q.screen && <div className="divide-y divide-slate-200">
            <nav aria-label="Điều hướng quyết toán" className="flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 py-3 text-xs font-medium text-slate-500">
              <a href="#qtt-status" className="hover:text-indigo-600">Tổng quan</a>
              {q.screen === 'blocked' ? <>{openQuarters.length > 0 && <a href="#qtt-quarters" className="text-amber-800 hover:underline">Quý cần hoàn tất ({openQuarters.length})</a>}<a href="#qtt-expenses" className="hover:text-indigo-600">Chi phí & chứng từ</a></>
                : <><a href="#qtt-calculation" className="hover:text-indigo-600">Bảng tính thuế</a>{(i?.indicator20 ?? 0) > 0 && <a href="#qtt-allocation" className="hover:text-indigo-600">Tiền nộp thừa</a>}<a href="#qtt-taxpayer" className="hover:text-indigo-600">Thông tin tờ khai</a></>}
            </nav>
            <section id="qtt-status" aria-live="polite" className={`scroll-mt-24 bg-gradient-to-r ${statusBackground} -mx-5 px-5 py-7 sm:-mx-9 sm:px-9 sm:py-8`}>
              <p className={`mb-3 flex items-center gap-1.5 text-xs font-semibold ${statusColor}`}>{q.screen === 'blocked' ? <CircleAlert size={16} /> : q.screen === 'locked' ? <FileCheck2 size={16} /> : <CheckCircle2 size={16} />}{q.screen === 'blocked' ? 'CẦN HOÀN TẤT' : q.screen === 'locked' ? 'HỒ SƠ ĐÃ KHÓA' : 'ĐÃ CÓ KẾT QUẢ'}</p>
              <h2 className={q.screen === 'blocked' ? 'text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl' : 'text-base text-slate-600'}>{headline}</h2>
              {q.screen !== 'blocked' && i && <p className={`mt-2 break-words text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl ${statusColor}`}>{money(i.indicator19 || i.indicator20)}</p>}
              <p className="mt-4 text-sm leading-6 text-slate-600">{q.screen === 'blocked'
                ? openQuarters.length ? `Hoàn tất kê khai Quý ${openQuarters.map(x => x.quarter).join(', ')} để mở bước tính thuế và tải tờ khai năm.` : 'Xử lý các việc bên dưới để mở bước tính thuế và tải tờ khai.'
                : q.screen === 'locked' ? d?.status === 'Submitted'
                  ? 'Hồ sơ đã khóa · Bạn đã ghi nhận nộp hồ sơ cho cơ quan thuế.'
                  : 'Hồ sơ đã khóa · Chưa ghi nhận nộp cho cơ quan thuế.'
                  : 'Đã đủ điều kiện lập quyết toán · Hồ sơ chưa nộp.'}</p>
              {q.screen === 'draft' && <p className="mt-1 text-sm text-slate-600">{i?.indicator20 ? 'Chọn cách xử lý tiền nộp thừa bên dưới.' : 'Bạn vẫn cần nộp hồ sơ quyết toán cho cơ quan thuế.'}</p>}
            </section>
            {q.screen === 'blocked' && q.preview && <QttReadiness preview={q.preview} year={q.year} fromTkn={q.fromTkn} busy={q.busy} onReview={q.reviewPeriod} />}
            {q.screen !== 'blocked' && i && <>
              <section id="qtt-calculation" className="scroll-mt-24 py-6"><h2 className="mb-4 text-lg font-semibold">Số tiền này được tính như thế nào?</h2>
                <table className="w-full text-sm sm:text-base"><tbody className="divide-y divide-slate-100">{formulaRows(i).map(row => <tr key={row.label}>
                  <th scope="row" className={`py-3 pr-4 text-left ${row.total ? 'font-semibold' : 'font-normal text-slate-700'}`}>{row.label}</th>
                  <td className={`py-3 text-right tabular-nums ${row.total ? 'font-semibold' : ''}`}>{money(row.amount)}</td>
                </tr>)}</tbody></table>
                {q.calculation?.applicableRateReason && <p className="mt-3 text-sm text-slate-600">{q.calculation.applicableRateReason.replace(/QTT/g, 'Quyết toán thuế')}</p>}
              </section>
              {i.indicator20 > 0 && <section id="qtt-allocation" className="scroll-mt-24 py-6">{q.screen === 'draft' && currentBusiness
                ? <QttAllocationEditor value={q.allocation} onChange={q.setAllocation} overpaid={i.indicator20} accounts={q.accounts}
                  onAccountAdded={account => q.setAccounts([...q.accounts, account])} obligations={q.obligations} businessId={currentBusiness.id} disabled={q.busy || q.needsReconcile} fromTkn={Boolean(q.fromTkn)} />
                : <><h2 className="text-lg font-semibold">Cách xử lý tiền nộp thừa đã ghi trên hồ sơ</h2>
                  <dl className="mt-4 space-y-3 text-sm">
                    <SummaryLine label="Đề nghị hoàn về ngân hàng" amount={i.indicator22} />
                    {d?.refundAccount && <div><dt className="sr-only">Tài khoản nhận tiền</dt><dd>{d.refundAccount.bankName} · {d.refundAccount.accountNumber} · {d.refundAccount.accountName}</dd></div>}
                    <SummaryLine label="Đề nghị trừ vào các khoản thuế còn nợ" amount={i.indicator23} />
                    {d?.offsetItems.map((item, index) => <SummaryLine key={index} label={`${item.budgetContent} · ${item.obligationIdentifier}`} amount={item.offsetAmount} />)}
                    <SummaryLine label="Chuyển sang kỳ sau" amount={i.indicator24} />
                  </dl><p className="mt-4 text-sm text-slate-600">Đây là nội dung đề nghị trên tờ khai, chưa phải xác nhận xử lý của cơ quan thuế.</p></>}
              </section>}
              {q.screen === 'draft' && q.preview && q.preview.warnings.length > 0 && <QttReadiness preview={q.preview} year={q.year} fromTkn={q.fromTkn} busy={q.busy} onReview={q.reviewPeriod} />}
              <section id="qtt-taxpayer" className="scroll-mt-24 py-6"><h2 className="text-lg font-semibold">Thông tin trên tờ khai</h2>
                <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[150px_1fr]">
                  <dt className="text-slate-500">Người nộp thuế</dt><dd>{d?.taxpayerName ?? q.preview?.taxpayerName}</dd>
                  <dt className="text-slate-500">Mã số thuế</dt><dd>{d?.taxCode ?? q.preview?.taxCode ?? 'Chưa cập nhật mã số thuế'}</dd>
                  <dt className="text-slate-500">Địa chỉ</dt><dd>{d?.taxpayerAddress ?? q.preview?.taxpayerAddress ?? 'Chưa cập nhật địa chỉ'}</dd>
                  <dt className="text-slate-500">Năm quyết toán</dt><dd>{q.year}</dd>
                </dl>
              </section>
              <footer className="space-y-4 py-6">{q.screen === 'draft' ? <>
                <p className="text-sm leading-6 text-slate-600">Sau khi xác nhận, số liệu và cách xử lý tiền nộp thừa trên hồ sơ này sẽ được khóa. Thao tác này chưa gửi hồ sơ đến cơ quan thuế.</p>
                {q.validation && <p id="allocation-error" className="text-sm text-amber-800">{q.validation}</p>}
                <button className={`${primary} w-full sm:w-auto`} disabled={q.busy || q.needsReconcile || Boolean(q.validation)} aria-describedby={q.validation ? 'allocation-error' : undefined} onClick={() => void q.confirmAndDownload()}>
                  {q.busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}{q.busy ? progress[q.step] : 'Xác nhận và tải tờ khai'}
                </button>
              </> : <>
                <p className="text-sm text-slate-600">Tải tờ khai không đồng nghĩa đã gửi hồ sơ hoặc đã nộp tiền thuế.</p>
                <div className="flex flex-wrap gap-3"><button className={primary} disabled={q.busy} onClick={() => void q.downloadOnly()}><Download size={18} />{q.step === 'download' ? 'Đang tải…' : 'Tải lại tờ khai'}</button>
                  {d?.status === 'Generated' && !q.showSubmitConfirmation && <button className={secondary} disabled={q.busy || q.needsReconcile} onClick={() => q.setShowSubmitConfirmation(true)}>Ghi nhận đã nộp hồ sơ</button>}</div>
                {d?.status === 'Generated' && q.showSubmitConfirmation && <div className="space-y-3 border-l-2 border-slate-300 pl-4">
                  <p className="text-sm">Tôi đã nộp hồ sơ quyết toán năm {q.year} này cho cơ quan thuế. Thao tác này chỉ ghi nhận trạng thái trong phần mềm.</p>
                  <div className="flex gap-3"><button className={secondary} disabled={q.busy || q.needsReconcile} onClick={() => void q.markSubmitted()}>Lưu trạng thái đã nộp</button>
                    <button className="text-sm underline" disabled={q.busy} onClick={() => q.setShowSubmitConfirmation(false)}>Chưa nộp</button></div>
                </div>}
              </>}</footer>
            </>}
          </div>}
          {q.screen && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs text-slate-400">
            <span>Đã hiển thị hết các phần của hồ sơ năm {q.year}.</span><a href="#qtt-top" className="inline-flex items-center gap-1 text-indigo-600 hover:underline">Về đầu trang<ArrowUpRight size={14} /></a>
          </div>}
        </>}
  </main>
}

function SummaryLine({ label, amount }: { label: string; amount: number }) {
  return <div className="flex justify-between gap-4"><dt>{label}</dt><dd className="text-right tabular-nums">{money(amount)}</dd></div>
}

function formulaRows(i: QttIndicators): { label: string; amount: number; total?: boolean }[] {
  return [
    { label: 'Doanh thu cả năm', amount: i.indicator09 },
    { label: 'Trừ chi phí được tính khi tính thuế', amount: i.indicator10 },
    { label: 'Phần thu nhập dùng để tính thuế', amount: i.indicator11 },
    { label: `Thuế tính cho cả năm · ${i.indicator12Rate}%${i.indicator11 < 0 ? ' (thu nhập âm nên thuế bằng 0)' : ''}`, amount: i.indicator13 },
    ...(i.indicator14 ? [{ label: 'Trừ thuế đã được khấu trừ', amount: i.indicator14 }] : []),
    { label: 'Trừ thuế đã nộp trong năm', amount: i.indicator15 },
    ...(i.indicator16 ? [{ label: 'Trừ số thuế được giảm', amount: i.indicator16 }] : []),
    ...(i.indicator18 ? [{ label: 'Trừ khoản thuế nhỏ được miễn nộp', amount: i.indicator18 }] : []),
    { label: i.indicator19 > 0 ? 'Còn cần nộp thêm' : i.indicator20 > 0 ? 'Bạn đã nộp thừa' : 'Không cần nộp thêm', amount: i.indicator19 || i.indicator20, total: true }
  ]
}
