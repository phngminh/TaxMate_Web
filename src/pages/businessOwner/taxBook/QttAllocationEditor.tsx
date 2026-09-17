import { useState } from 'react'
import { createPaymentAccount } from '../../../apis/paymentAccount.api'
import type { PaymentAccount } from '../../../types/paymentAccount.type'
import type { QttOffsetObligationOption } from '../../../types/taxBook.type'
import { allocationRequest, type Allocation, type AllocationChoice, type OffsetDraft } from './qttAllocation'

const money = (value: number) => `${value.toLocaleString('vi-VN')}đ`
const input = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200'

export default function QttAllocationEditor({ value, onChange, overpaid, accounts, onAccountAdded, obligations, businessId, disabled, fromTkn }: {
  value: Allocation; onChange: (value: Allocation) => void; overpaid: number
  accounts: PaymentAccount[]; onAccountAdded: (account: PaymentAccount) => void
  obligations: QttOffsetObligationOption[]; businessId: string; disabled: boolean; fromTkn: boolean
}) {
  const [addingAccount, setAddingAccount] = useState(false)
  const request = allocationRequest(value, overpaid, 0)
  const remaining = overpaid - request.refundAmount - request.offsetAmount
  const choose = (choice: AllocationChoice) => onChange({ ...value, choice, refundAmount: choice === 'refund' ? overpaid : 0, offsets: [] })
  const patchOffset = (key: string, patch: Partial<OffsetDraft>) => onChange({ ...value, offsets: value.offsets.map(x => x.key === key ? { ...x, ...patch } : x) })
  const options: { key: AllocationChoice; label: string; detail: string }[] = fromTkn ? [
    { key: 'offset', label: 'Đề nghị trừ vào khoản thuế đang còn nợ', detail: 'Luồng từ thông báo doanh thu yêu cầu bù trừ toàn bộ số tiền nộp thừa.' }
  ] : [
    { key: 'carry', label: 'Để trừ vào thuế kỳ sau', detail: `Ghi chuyển toàn bộ ${money(overpaid)} sang kỳ sau.` },
    { key: 'refund', label: 'Đề nghị hoàn về tài khoản ngân hàng', detail: 'Cơ quan thuế sẽ xem xét đề nghị hoàn tiền.' },
    { key: 'offset', label: 'Đề nghị trừ vào khoản thuế đang còn nợ', detail: 'Chọn khoản thuế; phần tiền còn lại chuyển sang kỳ sau.' }
  ]
  return <fieldset disabled={disabled} className="space-y-5 disabled:opacity-60">
    <legend className="mb-3 text-xl font-semibold">Bạn muốn xử lý {money(overpaid)} này thế nào?</legend>
    <div className="divide-y divide-slate-100">
      {options.map(option => <label key={option.key} className="flex cursor-pointer items-start gap-3 py-4">
        <input type="radio" name="qtt-allocation" className="mt-1 size-4 accent-slate-900" checked={value.choice === option.key} onChange={() => choose(option.key)} />
        <span><span className="block font-medium">{option.label}</span><span className="mt-1 block text-sm text-slate-600">{option.detail}</span></span>
      </label>)}
    </div>
    {!fromTkn && <button type="button" className="text-sm underline underline-offset-4" onClick={() => onChange({ ...value, choice: 'mixed' })}>
      Chia số tiền theo nhiều cách{value.choice === 'mixed' ? ' · Đang chọn' : ''}
    </button>}

    {(value.choice === 'refund' || value.choice === 'mixed') && <div className="space-y-3 border-t border-slate-200 pt-5">
      {value.choice === 'mixed' ? <MoneyField label="Số tiền đề nghị hoàn" value={value.refundAmount} onChange={refundAmount => onChange({ ...value, refundAmount })} />
        : <p className="font-medium">Số tiền đề nghị hoàn: {money(overpaid)}</p>}
      <p className="text-sm text-slate-600">Chọn tài khoản nhận tiền, kiểm tra tên chủ tài khoản và số tài khoản.</p>
      {accounts.map(account => <label key={account.paymentAccountId} className="flex cursor-pointer items-start gap-3 py-2">
        <input type="radio" name="refund-account" className="mt-1 size-4 accent-slate-900" checked={value.accountId === account.paymentAccountId}
          onChange={() => onChange({ ...value, accountId: account.paymentAccountId })} />
        <span>{account.bankName} · {account.accountNumber}<span className="block text-sm text-slate-600">{account.accountName}</span></span>
      </label>)}
      {accounts.length === 0 && <p className="text-sm">Chưa có tài khoản ngân hàng. Thêm tài khoản bên dưới.</p>}
      {accounts.length > 0 && !addingAccount && <button type="button" className="text-sm underline" onClick={() => setAddingAccount(true)}>Thêm tài khoản ngân hàng</button>}
      {(addingAccount || accounts.length === 0) && <BankAccountForm businessId={businessId} onSaved={account => {
        onAccountAdded(account); onChange({ ...value, accountId: account.paymentAccountId }); setAddingAccount(false)
      }} />}
    </div>}

    {(value.choice === 'offset' || value.choice === 'mixed') && <div className="space-y-4 border-t border-slate-200 pt-5">
      <h3 className="font-semibold">Chọn khoản thuế còn nợ</h3>
      {obligations.length === 0 && <p className="text-sm text-slate-600">Không có khoản thuế còn nợ trong danh sách.</p>}
      {obligations.map(option => {
        const selected = value.offsets.find(x => x.taxDeclarationObligationId === option.obligationId)
        return <div key={option.obligationId} className="border-b border-slate-100 py-3">
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" className="mt-1 size-4 accent-slate-900" checked={Boolean(selected)} disabled={disabled || (!selected && remaining <= 0)} onChange={e => {
              onChange({ ...value, offsets: e.target.checked ? [...value.offsets, {
                key: option.obligationId, taxDeclarationObligationId: option.obligationId,
                outstandingAmount: option.outstandingAmount,
                offsetAmount: Math.min(option.outstandingAmount, Math.max(0, remaining))
              }] : value.offsets.filter(x => x.taxDeclarationObligationId !== option.obligationId) })
            }} />
            <span className="min-w-0 flex-1"><span className="block">{option.budgetContent} · {option.declarationCode}</span>
              <span className="block text-sm text-slate-600">{option.taxpayerName} · MST {option.taxCode}{option.dueDate ? ` · Hạn ${new Date(option.dueDate).toLocaleDateString('vi-VN')}` : ''}</span></span>
            <span className="text-right tabular-nums">{money(option.outstandingAmount)}</span>
          </label>
          {selected && <div className="mt-3 pl-7"><MoneyField label="Số tiền đề nghị bù trừ" value={selected.offsetAmount} onChange={offsetAmount => patchOffset(selected.key, { offsetAmount })} /></div>}
        </div>
      })}
      {value.offsets.filter(x => !x.taxDeclarationObligationId).map(item => <div key={item.key} className="space-y-3 border-b border-slate-200 py-4">
        <div className="flex items-center justify-between"><h4 className="font-medium">Khoản thuế chưa có trong danh sách</h4>
          <button type="button" className="text-sm underline" onClick={() => onChange({ ...value, offsets: value.offsets.filter(x => x.key !== item.key) })}>Bỏ khoản này</button></div>
        <p className="text-sm text-slate-600">Điền theo thông báo của cơ quan thuế. Các thông tin có dấu * là bắt buộc.</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ['taxCode', 'Mã số thuế *'], ['taxpayerName', 'Tên người nộp thuế *'],
            ['obligationIdentifier', 'Số thông báo hoặc mã hồ sơ *'], ['budgetContent', 'Tên khoản thuế *'],
            ['chapterCode', 'Mã chương trên thông báo (nếu có)'], ['subsectionCode', 'Mã tiểu mục trên thông báo (nếu có)'],
            ['collectingAuthority', 'Cơ quan thu'], ['administrativeAreaCode', 'Mã địa bàn trên thông báo (nếu có)'],
            ['dueDate', 'Hạn nộp']
          ] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input type={key === 'dueDate' ? 'date' : 'text'} className={input}
            value={item[key] ?? ''} onChange={e => patchOffset(item.key, { [key]: e.target.value })} /></label>)}
          <MoneyField label="Số tiền còn nợ *" value={item.outstandingAmount} onChange={outstandingAmount => patchOffset(item.key, { outstandingAmount })} />
          <MoneyField label="Số tiền đề nghị bù trừ *" value={item.offsetAmount} onChange={offsetAmount => patchOffset(item.key, { offsetAmount })} />
        </div>
      </div>)}
      <button type="button" className="text-sm underline underline-offset-4" onClick={() => onChange({ ...value, offsets: [...value.offsets, {
        key: crypto.randomUUID(), outstandingAmount: 0, offsetAmount: 0
      }] })}>Thêm khoản thuế chưa có trong danh sách</button>
    </div>}

    {value.choice && <dl aria-live="polite" className="space-y-2 border-t border-slate-200 pt-5 text-sm">
      <Amount label="Đề nghị hoàn về ngân hàng" value={request.refundAmount} />
      {request.refundAmount > 0 && <p className="text-slate-600">{accounts.find(x => x.paymentAccountId === value.accountId)?.accountNumber ?? 'Chưa chọn tài khoản nhận tiền'}</p>}
      <Amount label="Đề nghị trừ vào các khoản thuế đã chọn" value={request.offsetAmount} />
      <Amount label="Còn lại chuyển sang kỳ sau" value={remaining} />
      <div className="border-t border-slate-200 pt-2 font-semibold"><Amount label="Tổng tiền nộp thừa" value={overpaid} /></div>
      {remaining < 0 && <p role="alert" className="text-red-700">Đang phân bổ vượt {money(-remaining)}. Hãy giảm số tiền hoàn hoặc bù trừ.</p>}
    </dl>}
  </fieldset>
}

function Amount({ label, value }: { label: string; value: number }) {
  return <div className="flex justify-between gap-4"><dt>{label}</dt><dd className="text-right tabular-nums">{money(value)}</dd></div>
}

function MoneyField({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label className="block text-sm">{label}<input className={`${input} text-right tabular-nums`} type="number" inputMode="numeric" min={0} step={1}
    value={Number.isNaN(value) ? '' : value} onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))} /></label>
}

function BankAccountForm({ businessId, onSaved }: { businessId: string; onSaved: (account: PaymentAccount) => void }) {
  const [bank, setBank] = useState({ bankShortName: '', bankName: '', accountName: '', accountNumber: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const save = async () => {
    if (saving || Object.values(bank).some(x => !x.trim())) return
    setSaving(true); setError('')
    try {
      const response = await createPaymentAccount(businessId, { ...bank, isDefault: false, description: null })
      if (!response.success || !response.data) throw new Error('Account creation failed')
      onSaved(response.data)
    } catch { setError('Chưa lưu được tài khoản. Kiểm tra thông tin và thử lại.') }
    finally { setSaving(false) }
  }
  return <div className="space-y-3 border-l-2 border-slate-200 pl-4">
    <div className="grid gap-3 sm:grid-cols-2">{([
      ['bankShortName', 'Tên viết tắt ngân hàng (ví dụ: VCB)'], ['bankName', 'Tên ngân hàng'],
      ['accountName', 'Tên chủ tài khoản'], ['accountNumber', 'Số tài khoản']
    ] as const).map(([key, label]) => <label key={key} className="text-sm">{label}<input className={input} value={bank[key]} disabled={saving}
      onChange={e => setBank({ ...bank, [key]: e.target.value })} /></label>)}</div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <button type="button" disabled={saving || Object.values(bank).some(x => !x.trim())} className="rounded-lg border border-slate-400 px-4 py-2 text-sm disabled:opacity-50" onClick={() => void save()}>
      {saving ? 'Đang lưu tài khoản…' : 'Lưu tài khoản nhận tiền'}
    </button>
  </div>
}
