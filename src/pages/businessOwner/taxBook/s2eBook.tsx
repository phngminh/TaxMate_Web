import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronUp, Download, RefreshCw, WalletCards } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getMoneyAccounts, updateInitialBalance } from '../../../apis/paymentAccount.api'
import { exportS2e, getS2ePreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type { S2eAccountSection, S2eBook, S2eBookEntry } from '../../../types/taxBook.type'
import LegalBadge from '../../../components/owner/tax/LegalBadge'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

type BlockerSeverity = 'error' | 'warning'
const BLOCKER_META: Record<string, { label: string; severity: BlockerSeverity }> = {
  MissingSourceMovement:      { label: 'Khoản thu / chi chưa được đồng bộ vào Sổ tiền', severity: 'error' },
  SourceMovementMismatch:     { label: 'Số tiền, ngày hoặc tài khoản không khớp giữa đơn hàng và Sổ tiền', severity: 'error' },
  OrphanMovementSource:       { label: 'Dòng tiền trên Sổ không tìm thấy đơn hàng hoặc phiếu chi gốc', severity: 'error' },
  AutoIncomeDuplicateMovement:{ label: 'Khoản thu từ đơn hàng bị tạo thêm phiếu thu thủ công trùng lặp', severity: 'error' },
  DuplicateMovementSource:    { label: 'Một đơn hàng/phiếu chi đang được ghi nhận nhiều lần trên Sổ tiền', severity: 'warning' },
  InvalidMovementType:        { label: 'Dòng tiền mang loại giao dịch không hợp lệ', severity: 'warning' },
  InvalidMovementAmount:      { label: 'Dòng tiền có số tiền bằng 0 hoặc số âm', severity: 'warning' },
  InitialBalanceAfterPeriodStart: { label: 'Ngày số tiền ban đầu muộn hơn ngày bắt đầu kỳ sổ', severity: 'error' },
  InvalidAccountType:         { label: 'Tài khoản tiền có loại không được hỗ trợ', severity: 'error' },
  InvalidBankAccount:         { label: 'Tài khoản ngân hàng còn thiếu số tài khoản hoặc tên ngân hàng', severity: 'error' },
}

export default function S2eBookPage() {
  const { currentBusiness } = useBusiness()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = new Date()
  const yearFromUrl = Number(searchParams.get('year'))
  const quarterFromUrl = Number(searchParams.get('quarter'))
  const [year, setYear] = useState(
    Number.isInteger(yearFromUrl) && yearFromUrl >= 2024 && yearFromUrl <= 2030
      ? yearFromUrl
      : now.getFullYear()
  )
  const [quarter, setQuarter] = useState(
    Number.isInteger(quarterFromUrl) && quarterFromUrl >= 1 && quarterFromUrl <= 4
      ? quarterFromUrl
      : Math.floor(now.getMonth() / 3) + 1
  )
  const [book, setBook] = useState<S2eBook | null>(null)
  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [balances, setBalances] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [expandedCodes, setExpandedCodes] = useState<Set<string>>(new Set())
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [selectedAccountTab, setSelectedAccountTab] = useState<string>('all')
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<{
    entry: S2eBookEntry
    account: S2eAccountSection
  } | null>(null)

  const accountNameById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const acc of accounts) {
      const suffix = acc.accountNumber?.slice(-4) ?? ''
      map[acc.paymentAccountId] = acc.accountType === 'Cash'
        ? 'Tiền mặt'
        : `${acc.bankShortName ?? acc.bankName ?? 'Ngân hàng'} ••••${suffix}`
    }
    return map
  }, [accounts])

  const groupedBlockers = useMemo(() => {
    if (!book) return []
    const relevant = book.blockers.filter(b => b.code !== 'InitialBalanceUnconfirmed')
    const map = new Map<string, typeof relevant>()
    for (const b of relevant) {
      const list = map.get(b.code) ?? []
      list.push(b)
      map.set(b.code, list)
    }
    return Array.from(map.entries()).map(([code, items]) => ({ code, items }))
  }, [book])

  const displayedAccounts = useMemo(() => {
    if (!book) return []
    if (selectedAccountTab === 'all') return book.accounts
    return book.accounts.filter(a => a.paymentAccountId === selectedAccountTab)
  }, [book, selectedAccountTab])

  const toggleCode = (code: string) => setExpandedCodes(prev => {
    const next = new Set(prev)
    next.has(code) ? next.delete(code) : next.add(code)
    return next
  })

  const toggleItems = (code: string) => setExpandedItems(prev => {
    const next = new Set(prev)
    next.has(code) ? next.delete(code) : next.add(code)
    return next
  })

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const [nextBook, nextAccounts] = await Promise.all([
        getS2ePreview(currentBusiness.id, year, quarter),
        getMoneyAccounts(currentBusiness.id)
      ])
      setBook(nextBook)
      setSelectedAccountTab(current =>
        nextBook.accounts.some(account => account.paymentAccountId === current) ? current : 'all'
      )
      setAccounts(nextAccounts)
      setBalances(Object.fromEntries(nextAccounts.map((account) => [
        account.paymentAccountId,
        String(account.initialBalance ?? 0)
      ])))
    } catch {
      toast.error('Không thể tải sổ tiền S2e')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness, year, quarter])

  useEffect(() => {
    setBook(null)
    setAccounts([])
    setSelectedAccountTab('all')
    setSelectedDetailEntry(null)
    void load()
  }, [load])

  useEffect(() => {
    const next = new URLSearchParams(window.location.search)
    next.set('year', String(year))
    next.set('quarter', String(quarter))
    setSearchParams(next, { replace: true })
  }, [year, quarter, setSearchParams])

  const unconfirmedIds = new Set(
    book?.blockers
      .filter((blocker) => blocker.code === 'InitialBalanceUnconfirmed')
      .map((blocker) => blocker.paymentAccountId)
      .filter((id): id is string => Boolean(id)) ?? []
  )
  const unconfirmedAccounts = accounts.filter((account) => unconfirmedIds.has(account.paymentAccountId))

  const saveBalances = async (startFromZero: boolean) => {
    if (!book || unconfirmedAccounts.length === 0) return
    const initialBalanceDate = book.fromInclusive.split('T')[0]
    try {
      setSaving(true)
      await Promise.all(unconfirmedAccounts.map((account) => updateInitialBalance(
        account.paymentAccountId,
        {
          initialBalance: startFromZero ? 0 : Number(balances[account.paymentAccountId] ?? 0),
          initialBalanceDate
        }
      )))
      toast.success('Đã lưu số tiền ban đầu thành công')
      await load()
    } catch {
      toast.error('Không thể lưu số tiền ban đầu')
    } finally {
      setSaving(false)
    }
  }

  const download = async () => {
    if (!currentBusiness || !book) return
    try {
      setExporting(true)
      const blob = await exportS2e(currentBusiness.id, year, quarter)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `S2e-HKD_${currentBusiness.businessName}_Q${quarter}_${year}.docx`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Không thể xuất sổ tiền S2e')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <div className='mb-5 flex flex-wrap items-end justify-between gap-4'>
        <div>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='text-2xl font-bold text-gray-900'>Sổ chi tiết tiền (S2e)</h1>
            <LegalBadge
              formCode='Mẫu S2e-HKD'
              circular='TT 88/2021/TT-BTC'
              title='Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ Tài chính'
              description={'Theo dõi tiền mặt trong két và tiền gửi từng ngân hàng theo thực tế thu/chi.\n\n➜ Đích đến: Không tính thuế, dùng làm căn cứ đối chiếu nguồn gốc dòng tiền với doanh thu khi cơ quan thuế kiểm tra.'}
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
            className='flex items-center gap-2 rounded-lg bg-[#9b0000] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> {loading ? 'Đang tải...' : 'Tải lại'}
          </button>
          <button onClick={download} disabled={!book?.isReady || exporting}
            className='flex items-center gap-2 rounded-lg border border-[#9b0000] px-4 py-2.5 text-sm font-semibold text-[#9b0000] disabled:opacity-50'>
            <Download size={16} /> {exporting ? 'Đang xuất...' : 'Xuất Word'}
          </button>
        </div>
      </div>

      {book && unconfirmedAccounts.length > 0 ? (
        <section className='mb-5 rounded-xl border border-amber-300 bg-amber-50 p-5'>
          <div className='flex items-center gap-2 font-semibold text-amber-950'>
            <WalletCards size={19} /> Khai báo số tiền có sẵn để bắt đầu Sổ tiền (S2e)
          </div>
          <p className='mt-2 text-sm text-amber-900'>
            Nhập số tiền thực tế đang có trong két tiền mặt hoặc tài khoản ngân hàng tính đến ngày <strong>{new Date(book.fromInclusive).toLocaleDateString('vi-VN')}</strong>.
          </p>
          <div className='mt-2 flex flex-col gap-1 rounded-lg bg-amber-100/70 p-3 text-xs text-amber-950'>
            <span className='font-medium text-emerald-850'>
              ✓ <strong>Yên tâm:</strong> Số tiền này <strong>KHÔNG</strong> bị tính là doanh thu và <strong>KHÔNG</strong> phải chịu thuế. Hệ thống chỉ dùng làm mốc tiền ban đầu để theo dõi dòng tiền thu/chi đúng thực tế.
            </span>
            <span className='text-amber-800'>
              • Lưu ý: Chỉ nhập phần tiền phục vụ kinh doanh (không bao gồm tiền cá nhân hoặc tiền người thân gửi).
            </span>
          </div>
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {unconfirmedAccounts.map((account) => (
              <label key={account.paymentAccountId} className='text-sm font-medium text-gray-700'>
                {account.accountType === 'Cash'
                  ? 'Tiền mặt trong két / cửa hàng'
                  : `Số dư ${account.bankShortName ?? account.bankName ?? 'tài khoản ngân hàng'} ••••${account.accountNumber?.slice(-4) ?? ''}`}
                <span className='mt-0.5 block text-xs font-normal text-gray-500'>
                  {account.accountType === 'Cash'
                    ? 'Số tiền mặt thực tế sẵn sàng chi tiêu cho kinh doanh.'
                    : 'Phần tiền trong tài khoản dùng riêng cho hoạt động kinh doanh.'}
                </span>
                <div className='relative mt-1'>
                  <NumericFormat
                    inputMode='numeric'
                    value={balances[account.paymentAccountId] ?? '0'}
                    valueIsNumericString
                    thousandSeparator='.'
                    decimalSeparator=','
                    decimalScale={0}
                    allowNegative={false}
                    allowLeadingZeros={false}
                    onValueChange={({ value }) => setBalances((current) => ({
                      ...current,
                      [account.paymentAccountId]: value
                    }))}
                    className='block w-full rounded-lg border bg-white px-3 py-2 pr-10'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400'>đ</span>
                </div>
              </label>
            ))}
          </div>
          <div className='mt-4 flex flex-wrap gap-3'>
            <button
              disabled={saving}
              onClick={() => saveBalances(false)}
              className='rounded-lg bg-[#9b0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#7e0000] disabled:opacity-50'
            >
              Lưu số tiền này & Bắt đầu tính sổ
            </button>
            <button
              disabled={saving}
              onClick={() => saveBalances(true)}
              className='rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50'
            >
              Bắt đầu từ 0 đ (Cửa hàng mới)
            </button>
          </div>
        </section>
      ) : null}

      {groupedBlockers.length > 0 && (
        <div className='mb-5 overflow-hidden rounded-xl border border-red-200 bg-red-50'>
          {/* Header */}
          <div className='flex items-center justify-between px-4 py-3'>
            <div className='flex items-center gap-2 font-semibold text-red-900'>
              <span>⚠ Dữ liệu cần kiểm tra</span>
              <span className='rounded-full bg-red-200 px-2 py-0.5 text-xs font-bold text-red-900'>
                {groupedBlockers.reduce((sum, g) => sum + g.items.length, 0)} vấn đề
              </span>
            </div>
            <button
              onClick={() => {
                if (expandedCodes.size === groupedBlockers.length) {
                  setExpandedCodes(new Set())
                } else {
                  setExpandedCodes(new Set(groupedBlockers.map(g => g.code)))
                }
              }}
              className='flex items-center gap-1 text-xs text-red-700 hover:underline'
            >
              {expandedCodes.size === groupedBlockers.length ? (
                <><ChevronUp size={13} /> Thu gọn tất cả</>
              ) : (
                <><ChevronDown size={13} /> Mở rộng tất cả</>
              )}
            </button>
          </div>

          {/* Helper tip when accounts are unconfirmed */}
          {unconfirmedAccounts.length > 0 && (
            <div className='border-t border-amber-200 bg-amber-100/90 px-4 py-2.5 text-xs text-amber-950'>
              💡 <strong>Gợi ý:</strong> Bạn đang có <strong>{unconfirmedAccounts.length} tài khoản</strong> chưa khai báo số tiền ban đầu ở khung màu vàng phía trên. Sau khi bấm <strong>"Lưu số tiền này & Bắt đầu tính sổ"</strong>, hệ thống sẽ tự động cập nhật và bỏ qua các giao dịch cũ trước ngày này.
            </div>
          )}

          {/* Group rows */}
          <div className='divide-y divide-red-200 border-t border-red-200'>
            {groupedBlockers.map(({ code, items }) => {
              const meta = BLOCKER_META[code]
              const isOpen = expandedCodes.has(code)
              const showAll = expandedItems.has(code)
              const PREVIEW_LIMIT = 5
              const displayed = showAll ? items : items.slice(0, PREVIEW_LIMIT)
              const severityDot = meta?.severity === 'warning'
                ? 'bg-orange-400'
                : 'bg-red-500'

              return (
                <div key={code}>
                  {/* Group header — clickable to expand */}
                  <button
                    onClick={() => toggleCode(code)}
                    className='flex w-full items-center justify-between px-4 py-2.5 text-left hover:bg-red-100/60'
                  >
                    <div className='flex items-center gap-2'>
                      <span className={`mt-0.5 h-2 w-2 flex-shrink-0 rounded-full ${severityDot}`} />
                      <span className='text-sm font-medium text-red-900'>
                        {meta?.label ?? code}
                      </span>
                      <span className='rounded-full bg-red-200/80 px-1.5 py-0.5 text-xs font-semibold text-red-800'>
                        {items.length}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp size={14} className='text-red-500' /> : <ChevronDown size={14} className='text-red-400' />}
                  </button>

                  {/* Expandable detail list */}
                  {isOpen && (
                    <div className='border-t border-red-100 bg-white/60 px-4 pb-3 pt-2'>
                      <ul className='space-y-1'>
                        {displayed.map((item, i) => {
                          const accountLabel = item.paymentAccountId
                            ? accountNameById[item.paymentAccountId] ?? item.paymentAccountId
                            : null
                          return (
                            <li key={i} className='flex items-center justify-between gap-2 text-xs text-red-800 py-0.5'>
                              <div className='flex items-center gap-1.5'>
                                <span className='select-none text-red-400'>›</span>
                                {accountLabel && (
                                  <span className='rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-700'>
                                    {accountLabel}
                                  </span>
                                )}
                                {item.referenceId ? (
                                  <span className='font-mono text-red-600'>Mã chứng từ: #{item.referenceId.slice(0, 8)}…</span>
                                ) : (
                                  <span className='text-red-500 italic'>Chưa có mã chứng từ</span>
                                )}
                              </div>
                              {code === 'MissingSourceMovement' && (
                                <span className='text-[11px] text-red-500/80'>Chưa có dòng tiền đối ứng</span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                      {items.length > PREVIEW_LIMIT && (
                        <button
                          onClick={() => toggleItems(code)}
                          className='mt-2 text-xs font-medium text-red-600 hover:underline'
                        >
                          {showAll
                            ? '▲ Thu gọn'
                            : `▼ Xem thêm ${items.length - PREVIEW_LIMIT} vấn đề`}
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

      {book ? (
        <div className='mb-5 rounded-xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950'>
          <div className='font-semibold'>Tổng tiền kinh doanh</div>
          <div className='mt-1 flex flex-wrap items-center gap-2 tabular-nums'>
            <span>{money.format(book.openingBalance)} đ đầu kỳ</span>
            <strong>+</strong>
            <span className='font-semibold text-emerald-700'>{money.format(book.totalIn)} đ tiền vào</span>
            <strong>−</strong>
            <span className='font-semibold text-orange-700'>{money.format(book.totalOut)} đ tiền ra</span>
            <strong>=</strong>
            <span className='font-bold'>{money.format(book.endingBalance)} đ cuối kỳ</span>
          </div>
        </div>
      ) : null}

      {!book ? (
        <div className='rounded-xl border border-dashed bg-white p-12 text-center text-gray-500'>{loading ? 'Đang tải sổ...' : 'Không có dữ liệu để hiển thị.'}</div>
      ) : book.accounts.length === 0 ? (
        <div className='rounded-xl border bg-white p-12 text-center text-gray-500'>Chưa có tài khoản tiền để lập sổ.</div>
      ) : (
        <div className='space-y-4'>
          {book.accounts.length > 1 && (
            <div className='flex flex-wrap items-center gap-2 border-b pb-3'>
              <button
                type='button'
                onClick={() => setSelectedAccountTab('all')}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  selectedAccountTab === 'all'
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                Tất cả ({book.accounts.length})
              </button>
              {book.accounts.map((acc) => (
                <button
                  key={acc.paymentAccountId}
                  type='button'
                  onClick={() => setSelectedAccountTab(acc.paymentAccountId)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    selectedAccountTab === acc.paymentAccountId
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                  }`}
                >
                  {acc.displayName}
                </button>
              ))}
            </div>
          )}

          {displayedAccounts.map((account) => (
            <section key={account.paymentAccountId} className='overflow-hidden rounded-xl border bg-white'>
              <div className='flex flex-wrap justify-between gap-2 px-5 py-4'>
                <div className='font-semibold text-gray-900'>{account.displayName}{account.isActive ? '' : ' (đã ngừng sử dụng)'}</div>
                <div className='text-right text-sm text-gray-600'>
                  <div>Đầu kỳ {money.format(account.openingBalance)} đ · Cuối kỳ <strong>{money.format(account.endingBalance)} đ</strong></div>
                  <div className='mt-1 text-xs tabular-nums'>
                    {money.format(account.openingBalance)} + <span className='text-emerald-700'>{money.format(account.totalIn)} vào</span> − <span className='text-orange-700'>{money.format(account.totalOut)} ra</span> = {money.format(account.endingBalance)} đ
                  </div>
                </div>
              </div>
              <div className='overflow-x-auto border-t'>
                <table className='min-w-full text-sm'>
                  <thead className='bg-gray-50 text-gray-600'><tr>{['Ngày', 'Chứng từ', 'Diễn giải', 'Thu / Gửi vào', 'Chi / Rút ra'].map((label) => <th key={label} className='whitespace-nowrap px-3 py-3 text-right first:text-left'>{label}</th>)}</tr></thead>
                  <tbody>
                    <tr className='border-t bg-blue-50/50'>
                      <td className='px-3 py-2' colSpan={5}>
                        <div className='flex items-center gap-2'>
                          <span>Số dư đầu kỳ:</span>
                          <strong className='text-blue-950'>{money.format(account.openingBalance)} đ</strong>
                        </div>
                      </td>
                    </tr>
                    {account.entries.map((entry) => (
                      <tr
                        key={entry.moneyMovementId}
                        onClick={() => setSelectedDetailEntry({ entry, account })}
                        className='border-t hover:bg-blue-50/60 cursor-pointer transition-colors group'
                        title='Nhấp để xem chi tiết biến động tiền'
                      >
                        <td className='whitespace-nowrap px-3 py-2.5'>{new Date(entry.movementDate).toLocaleDateString('vi-VN')}</td>
                        <td className='whitespace-nowrap px-3 py-2.5 font-medium text-blue-600 group-hover:underline'>{entry.documentNumber}</td>
                        <td className='min-w-64 px-3 py-2.5'>{entry.description}</td>
                        <td className='px-3 py-2.5 text-right font-medium text-emerald-700'>{entry.amountIn ? `+${money.format(entry.amountIn)} đ` : ''}</td>
                        <td className='px-3 py-2.5 text-right font-medium text-orange-700'>{entry.amountOut ? `−${money.format(entry.amountOut)} đ` : ''}</td>
                      </tr>
                    ))}
                    <tr className='border-t bg-gray-50 font-semibold'><td className='px-3 py-3' colSpan={3}>Cộng phát sinh</td><td className='px-3 py-3 text-right'>{money.format(account.totalIn)} đ</td><td className='px-3 py-3 text-right'>{money.format(account.totalOut)} đ</td></tr>
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Modal chi tiết dòng sổ S2e */}
      {selectedDetailEntry && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150'>
          <div className='w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4'>
            <div className='flex items-start justify-between border-b pb-3'>
              <div>
                <span className='text-xs font-bold uppercase tracking-wider text-gray-400'>Chi tiết dòng sổ S2e</span>
                <h3 className='text-lg font-bold text-gray-900 mt-0.5'>
                  {selectedDetailEntry.entry.documentNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDetailEntry(null)}
                className='rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors'
              >
                ✕
              </button>
            </div>

            <div className='grid grid-cols-2 gap-3 text-sm'>
              <div className='rounded-xl bg-gray-50 p-3'>
                <span className='text-xs text-gray-500'>Ngày phát sinh</span>
                <p className='font-semibold text-gray-900 mt-0.5'>
                  {new Date(selectedDetailEntry.entry.movementDate).toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className='rounded-xl bg-gray-50 p-3'>
                <span className='text-xs text-gray-500'>Tài khoản</span>
                <p className='font-semibold text-gray-900 mt-0.5'>
                  {selectedDetailEntry.account.displayName} ({selectedDetailEntry.account.accountType === 'Cash' ? 'Tiền mặt' : 'Ngân hàng'})
                </p>
              </div>
              <div className='rounded-xl bg-gray-50 p-3 col-span-2'>
                <span className='text-xs text-gray-500'>Loại & Số tiền</span>
                <div className='mt-1 flex items-center justify-between'>
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                    selectedDetailEntry.entry.amountIn > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {selectedDetailEntry.entry.amountIn > 0 ? 'Thu / Gửi vào (+)' : 'Chi / Rút ra (−)'}
                  </span>
                  <span className={`text-base font-extrabold ${
                    selectedDetailEntry.entry.amountIn > 0 ? 'text-emerald-700' : 'text-orange-700'
                  }`}>
                    {selectedDetailEntry.entry.amountIn > 0
                      ? `+${money.format(selectedDetailEntry.entry.amountIn)} đ`
                      : `−${money.format(selectedDetailEntry.entry.amountOut)} đ`}
                  </span>
                </div>
              </div>
              <div className='rounded-xl bg-gray-50 p-3 col-span-2'>
                <span className='text-xs text-gray-500'>Diễn giải nghiệp vụ</span>
                <p className='font-medium text-gray-800 mt-0.5'>{selectedDetailEntry.entry.description}</p>
              </div>
              <div className='rounded-xl bg-gray-50 p-3 col-span-2 space-y-1 text-xs text-gray-500 font-mono'>
                <div><span className='text-gray-400'>Mã tham chiếu (ReferenceId): </span>{selectedDetailEntry.entry.referenceId || 'N/A'}</div>
                <div><span className='text-gray-400'>Mã biến động (MovementId): </span>{selectedDetailEntry.entry.moneyMovementId}</div>
              </div>
            </div>

            <div className='flex justify-end pt-2 border-t'>
              <button
                onClick={() => setSelectedDetailEntry(null)}
                className='rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors'
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
