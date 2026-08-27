import { useCallback, useEffect, useState } from 'react'
import { Download, RefreshCw, WalletCards } from 'lucide-react'
import { NumericFormat } from 'react-number-format'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getMoneyAccounts, updateInitialBalance } from '../../../apis/paymentAccount.api'
import { exportS2e, getS2ePreview } from '../../../apis/taxBook.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type { S2eBook } from '../../../types/taxBook.type'

const money = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 })

export default function S2eBookPage() {
  const { currentBusiness } = useBusiness()
  const [searchParams, setSearchParams] = useSearchParams()
  const now = new Date()
  const yearFromUrl = Number(searchParams.get('year'))
  const quarterFromUrl = Number(searchParams.get('quarter'))
  const [year, setYear] = useState(
    Number.isInteger(yearFromUrl) && yearFromUrl >= 2000 && yearFromUrl <= 2100
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

  const load = useCallback(async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const [nextBook, nextAccounts] = await Promise.all([
        getS2ePreview(currentBusiness.id, year, quarter),
        getMoneyAccounts(currentBusiness.id)
      ])
      setBook(nextBook)
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
      toast.success('Đã xác nhận số dư đầu kỳ')
      await load()
    } catch {
      toast.error('Không thể lưu số dư đầu kỳ')
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
          <h1 className='text-2xl font-bold text-gray-900'>Sổ chi tiết tiền (S2e)</h1>
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
          <div className='flex items-center gap-2 font-semibold text-amber-950'><WalletCards size={19} /> Xác nhận số dư ban đầu cho Sổ tiền S2e</div>
          <p className='mt-2 text-sm text-amber-900'>Nhập số tiền đang dùng cho hoạt động kinh doanh tại ngày {new Date(book.fromInclusive).toLocaleDateString('vi-VN')}. Số này được dùng làm số dư đầu kỳ trên S2e, không được tính là doanh thu.</p>
          <p className='mt-1 text-xs text-amber-800'>Không bao gồm tiền cá nhân hoặc tiền của người thân.</p>
          <div className='mt-4 grid gap-3 md:grid-cols-2'>
            {unconfirmedAccounts.map((account) => (
              <label key={account.paymentAccountId} className='text-sm font-medium text-gray-700'>
                {account.accountType === 'Cash' ? 'Tiền mặt dùng cho kinh doanh' : `Số dư ${account.bankShortName ?? account.bankName ?? 'tài khoản ngân hàng'} ••••${account.accountNumber?.slice(-4) ?? ''}`}
                <span className='mt-0.5 block text-xs font-normal text-gray-500'>
                  {account.accountType === 'Cash'
                    ? 'Tiền thực tế trong quỹ hoặc tại cửa hàng.'
                    : 'Phần số dư của tài khoản được dùng cho kinh doanh.'}
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
            <button disabled={saving} onClick={() => saveBalances(false)} className='rounded-lg bg-[#9b0000] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50'>Xác nhận số dư đầu kỳ</button>
            <button disabled={saving} onClick={() => saveBalances(true)} className='rounded-lg border border-amber-700 px-4 py-2 text-sm font-semibold text-amber-900 disabled:opacity-50'>Bắt đầu từ 0</button>
          </div>
        </section>
      ) : null}

      {book?.blockers.filter((blocker) => blocker.code !== 'InitialBalanceUnconfirmed').length ? (
        <div className='mb-5 rounded-xl border border-red-200 bg-red-50 p-4'>
          <div className='font-semibold text-red-900'>Dữ liệu cần kiểm tra</div>
          {book.blockers.filter((blocker) => blocker.code !== 'InitialBalanceUnconfirmed').map((blocker, index) => (
            <div key={`${blocker.code}-${index}`} className='mt-1 text-sm text-red-800'>• {blocker.message}</div>
          ))}
        </div>
      ) : null}

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
          {book.accounts.map((account) => (
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
                      <tr key={entry.moneyMovementId} className='border-t'>
                        <td className='whitespace-nowrap px-3 py-2'>{new Date(entry.movementDate).toLocaleDateString('vi-VN')}</td>
                        <td className='whitespace-nowrap px-3 py-2'>{entry.documentNumber}</td>
                        <td className='min-w-64 px-3 py-2'>{entry.description}</td>
                        <td className='px-3 py-2 text-right'>{entry.amountIn ? `${money.format(entry.amountIn)} đ` : ''}</td>
                        <td className='px-3 py-2 text-right'>{entry.amountOut ? `${money.format(entry.amountOut)} đ` : ''}</td>
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
    </div>
  )
}
