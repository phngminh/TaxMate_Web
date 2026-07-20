import React, { useState, useEffect } from 'react'
import { Plus, Trash2, CheckCircle2, Wallet, X, Loader2, Link2Off } from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../contexts/BusinessContext'
import { useAuth } from '../../contexts/AuthContext'
import { getBusinessProfiles } from '../../apis/profile.api'
import {
  getPaymentAccounts,
  createPaymentAccount,
  deletePaymentAccount,
  getSePayConnectUrl,
  setDefaultPaymentAccount,
  getSePayDisconnectUrl
} from '../../apis/paymentAccount.api'
import type { PaymentAccount } from '../../types/paymentAccount.type'

const BANK_LIST = [
  { shortName: 'VCB', fullName: 'Vietcombank' },
  { shortName: 'TCB', fullName: 'Techcombank' },
  { shortName: 'MB', fullName: 'MBBank' },
  { shortName: 'ACB', fullName: 'ACB' },
  { shortName: 'VPB', fullName: 'VPBank' },
  { shortName: 'BIDV', fullName: 'BIDV' },
  { shortName: 'VTB', fullName: 'VietinBank' },
  { shortName: 'STB', fullName: 'Sacombank' },
  { shortName: 'TPB', fullName: 'TPBank' },
  { shortName: 'SHB', fullName: 'SHBank' },
  { shortName: 'HDB', fullName: 'HDBank' },
  { shortName: 'OCB', fullName: 'OCB' },
  { shortName: 'MSB', fullName: 'MSB' },
  { shortName: 'SCB', fullName: 'SCB' },
  { shortName: 'VIB', fullName: 'VIB' },
  { shortName: 'EIB', fullName: 'Eximbank' },
  { shortName: 'NAB', fullName: 'Nam A Bank' },
  { shortName: 'BAB', fullName: 'BacABank' },
  { shortName: 'PGB', fullName: 'PG Bank' },
  { shortName: 'CAKE', fullName: 'CAKE' },
  { shortName: 'TIMO', fullName: 'Timo' }
]

const BANK_MAP: Record<string, string> = {
  'Kienlongbank': 'KLB',
  'KienLongBank': 'KLB',
  'MBBank': 'MB',
  'VietinBank': 'Vietin',
  'Sacombank': 'STB',
  'VPBank': 'VPB'
}


export default function BankConfig() {
  const { currentBusiness, setCurrentBusiness } = useBusiness()
  const { user } = useAuth()
  const businessId = currentBusiness?.id

  const [accounts, setAccounts] = useState<PaymentAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // SePay automated link states
  const [showSePayModal, setShowSePayModal] = useState(false)
  const [sePayLoading, setSePayLoading] = useState(false)
  const [showDisconnectModal, setShowDisconnectModal] = useState(false)
  const [disconnectLoading, setDisconnectLoading] = useState(false)
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)

  const handleLinkSePay = async () => {
    if (!businessId) return

    // Pre-open a blank tab synchronously to prevent browser popup blocking
    const newTab = window.open('about:blank', '_blank')
    if (!newTab) {
      toast.error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép mở popup cho trang web này.')
      return
    }

    try {
      setSePayLoading(true)
      const res = await getSePayConnectUrl(businessId)
      if (res.success && res.data) {
        newTab.location.href = res.data
        setShowSePayModal(true)
      } else {
        newTab.close()
        toast.error('Không thể lấy đường dẫn liên kết ngân hàng từ SePay.')
      }
    } catch (err: any) {
      newTab.close()
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi kết nối SePay.')
    } finally {
      setSePayLoading(false)
    }
  }

  const handleSetDefault = async (accountId: string) => {
    if (!businessId) return
    try {
      setLoading(true)
      const res = await setDefaultPaymentAccount(accountId, businessId)
      if (res.success) {
        toast.success('Đã đặt tài khoản mặc định thành công!')
        fetchAccounts()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không thể thiết lập tài khoản mặc định.')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccounts = async () => {
    if (!businessId) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const res = await getPaymentAccounts(businessId)
      if (res.success) {
        setAccounts(res.data || [])
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải danh sách tài khoản nhận tiền.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      let activeId = businessId
      if (!activeId && user?.id) {
        try {
          const res = await getBusinessProfiles(user.id)
          const items = res.data?.items || []
          if (items.length > 0) {
            setCurrentBusiness(items[0])
            activeId = items[0].id
          }
        } catch (err) {
          console.error('[BankConfig] Failed to fetch fallback business profile:', err)
        }
      }

      if (activeId) {
        try {
          setLoading(true)
          const res = await getPaymentAccounts(activeId)
          if (res.success) {
            setAccounts(res.data || [])
          }
        } catch (err: any) {
          console.error(err)
          toast.error('Không thể tải danh sách tài khoản nhận tiền.')
        } finally {
          setLoading(false)
        }
      } else {
        setLoading(false)
      }
    }

    init()
  }, [businessId, user?.id])



  const handleDelete = async (acc: PaymentAccount) => {
    const isSePay = !!acc.sePayBankAccountXid
    const message = isSePay
      ? 'Tài khoản này được liên kết qua SePay Bank Hub. Bạn có chắc chắn muốn hủy liên kết trên hệ thống SePay?'
      : 'Bạn có chắc chắn muốn ngắt liên kết tài khoản ngân hàng này?'

    if (!confirm(message)) return

    try {
      if (isSePay) {
        // Pre-open a blank tab synchronously to prevent browser popup blocking
        const newTab = window.open('about:blank', '_blank')
        if (!newTab) {
          toast.error('Trình duyệt đã chặn cửa sổ bật lên. Vui lòng cho phép mở popup cho trang web này.')
          return
        }

        setDisconnectLoading(true)
        const res = await getSePayDisconnectUrl(acc.paymentAccountId)
        if (res.success && res.data) {
          newTab.location.href = res.data
          setCurrentAccountId(acc.paymentAccountId)
          setShowDisconnectModal(true)
        } else {
          newTab.close()
          toast.error('Không thể lấy đường dẫn hủy liên kết từ SePay.')
        }
      } else {
        setLoading(true)
        const res = await deletePaymentAccount(acc.paymentAccountId)
        if (res.success) {
          toast.success('Đã ngắt liên kết ngân hàng thành công!')
          fetchAccounts()
        }
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra.')
    } finally {
      setDisconnectLoading(false)
      setLoading(false)
    }
  }




  return (
    <div className='bg-[#f8f9fa] pt-6 pb-12 min-h-[calc(100vh-51px)] px-6'>
      <div className='max-w-6xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-[22px] font-bold text-gray-900 flex items-center gap-2'>
              <Wallet className='text-[#D32F2F] size-6' />
              Tài khoản Nhận tiền
            </h1>
            <p className='text-gray-500 text-xs mt-1'>
              Quản lý các tài khoản ngân hàng để nhận thanh toán và tự động đối soát qua mã VietQR
            </p>
          </div>
          <div className='flex gap-3 select-none'>
            <button
              onClick={handleLinkSePay}
              disabled={sePayLoading}
              className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2 rounded-[8px] text-[13px] font-bold transition-colors shadow-xs cursor-pointer'
            >
              {sePayLoading ? (
                <Loader2 size={16} className='animate-spin' />
              ) : (
                <Plus size={16} className='stroke-3' />
              )}
              Liên kết SePay Hub
            </button>
            <button
              onClick={() => setModalOpen(true)}
              className='flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2 rounded-[8px] text-[13px] font-bold transition-colors shadow-xs cursor-pointer'
            >
              <Plus size={16} className='stroke-3' />
              Thêm thủ công
            </button>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-20'>
            <Loader2 className='animate-spin text-[#D32F2F] size-10' />
          </div>
        ) : accounts.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {accounts.map((acc) => (
              <div
                key={acc.paymentAccountId}
                className={`bg-white rounded-[16px] border p-6 flex flex-col justify-between transition-all duration-300 ${
                  acc.isDefault
                    ? 'border-[#D32F2F]/40 shadow-xs ring-1 ring-[#D32F2F]/20'
                    : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <div>
                  <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2.5 min-w-0 flex-1 mr-2'>
                      <div className='bg-[#ffd6d8] text-[#9b0000] px-2 min-w-10 h-10 rounded-[10px] flex items-center justify-center font-bold text-xs shrink-0 select-none'>
                        {BANK_MAP[acc.bankShortName] || acc.bankShortName}
                      </div>
                      <div className='min-w-0'>
                        <h4 className='font-bold text-gray-900 text-[14px] truncate' title={acc.bankShortName}>
                          {BANK_MAP[acc.bankShortName] || acc.bankShortName}
                        </h4>
                        <p className='text-gray-500 text-[11px] font-medium leading-tight mt-0.5 break-words' title={acc.bankName}>
                          {acc.bankName}
                        </p>
                      </div>
                    </div>
                    {acc.isDefault ? (
                      <span className='bg-emerald-50 text-emerald-600 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-100 flex items-center gap-1 select-none'>
                        <CheckCircle2 size={12} className='stroke-3' />
                        Mặc định
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSetDefault(acc.paymentAccountId)}
                        className='text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 hover:border-slate-400 text-slate-600 font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer'
                      >
                        Đặt mặc định
                      </button>
                    )}
                  </div>

                  <div className='bg-gray-50 rounded-[12px] p-4 flex flex-col gap-2 border border-gray-100 mb-6'>
                    <div>
                      <span className='text-gray-400 text-[10px] font-bold uppercase tracking-wider block'>Số tài khoản</span>
                      <span className='text-gray-800 text-[16px] font-bold font-mono block mt-0.5'>{acc.accountNumber}</span>
                    </div>
                    <div>
                      <span className='text-gray-400 text-[10px] font-bold uppercase tracking-wider block'>Chủ tài khoản</span>
                      <span className='text-gray-800 text-[14px] font-bold block mt-0.5'>{acc.accountName}</span>
                    </div>
                    {acc.sePayBankAccountXid && (
                      <div className='pt-1 border-t border-gray-200/50 mt-1 flex items-center justify-between text-[11.5px]'>
                        <span className='text-gray-500 font-medium'>SePay Connected</span>
                        <span className='text-[#D32F2F] font-bold font-mono'>{acc.sePayBankAccountXid}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='flex items-center justify-end pt-4 border-t border-gray-100 gap-4'>
                  <button
                    onClick={() => handleDelete(acc)}
                    className='text-gray-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors cursor-pointer'
                    title='Xóa tài khoản này'
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='bg-white rounded-[16px] border border-gray-200 py-16 px-6 text-center shadow-xs'>
            <div className='bg-[#ffd6d8] size-16 rounded-full flex items-center justify-center mx-auto mb-4'>
              <Wallet className='text-[#D32F2F] size-8' />
            </div>
            <h3 className='text-[16px] font-bold text-gray-900'>Chưa có tài khoản nhận tiền nào</h3>
            <p className='text-gray-500 text-xs mt-1 max-w-sm mx-auto'>
              Hãy thêm tài khoản ngân hàng của bạn để bắt đầu tạo mã VietQR và nhận đối soát tự động từ khách hàng.
            </p>
            <button
              onClick={() => setModalOpen(true)}
              className='mt-5 inline-flex items-center gap-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white px-5 py-2.5 rounded-[8px] text-[13px] font-bold transition-colors'
            >
              <Plus size={16} className='stroke-3' />
              Thêm tài khoản ngay
            </button>
          </div>
        )}
      </div>

      {/* MODAL DIALOG THÊM MỚI */}
      {modalOpen && (
        <ManualAddModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          businessId={businessId}
          onSuccess={() => {
            setModalOpen(false)
            fetchAccounts()
          }}
        />
      )}


      {/* CONFIRM SEPAY LINK DIALOG */}
      {showSePayModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-blue-50 border-b border-blue-100'>
              <h3 className='text-[16px] font-bold text-blue-900 flex items-center gap-2'>
                <Wallet className='text-blue-600 size-5' />
                Liên kết SePay Bank Hub
              </h3>
              <button
                onClick={() => setShowSePayModal(false)}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-4 text-xs font-semibold text-gray-500 leading-normal'>
              <p>
                Hệ thống đã mở liên kết kết nối ngân hàng an toàn của SePay trong tab mới.
              </p>
              <p>
                Sau khi hoàn tất đăng nhập và chọn tài khoản ngân hàng trên trang của SePay, vui lòng quay lại đây và bấm nút dưới để cập nhật danh sách tài khoản nhận tiền.
              </p>
              <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => setShowSePayModal(false)}
                  className='px-6 py-2 border border-gray-300 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                >
                  Đóng
                </button>
                <button
                  type='button'
                  onClick={() => {
                    setShowSePayModal(false)
                    fetchAccounts()
                  }}
                  className='px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs cursor-pointer'
                >
                  Tôi đã hoàn thành liên kết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CONFIRM SEPAY UNLINK DIALOG */}
      {showDisconnectModal && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
          <div className='bg-white rounded-[16px] shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200'>
            <div className='flex items-center justify-between px-8 py-4 bg-red-50 border-b border-red-100'>
              <h3 className='text-[16px] font-bold text-red-900 flex items-center gap-2'>
                <Link2Off className='text-red-600 size-5' />
                Hủy liên kết tài khoản ngân hàng
              </h3>
              <button
                onClick={() => {
                  setShowDisconnectModal(false)
                  setCurrentAccountId(null)
                }}
                className='p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer'
              >
                <X size={18} />
              </button>
            </div>

            <div className='p-6 flex flex-col gap-4 text-xs font-semibold text-gray-500 leading-normal'>
              <p>
                Hệ thống đã mở liên kết hủy kết nối tài khoản ngân hàng của SePay trong tab mới.
              </p>
              <p>
                Sau khi xác nhận hủy liên kết trên trang của SePay, vui lòng quay lại đây và bấm nút dưới để xóa tài khoản cục bộ và đồng bộ lại danh sách.
              </p>
              <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100 select-none'>
                <button
                  type='button'
                  onClick={() => {
                    setShowDisconnectModal(false)
                    setCurrentAccountId(null)
                  }}
                  className='px-6 py-2 border border-gray-300 text-gray-600 text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
                >
                  Đóng
                </button>
                <button
                  type='button'
                  onClick={async () => {
                    setShowDisconnectModal(false)
                    if (currentAccountId) {
                      try {
                        setLoading(true)
                        await deletePaymentAccount(currentAccountId)
                        toast.success('Hủy liên kết tài khoản ngân hàng thành công!')
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Không thể xóa tài khoản cục bộ sau khi hủy liên kết.')
                      } finally {
                        setLoading(false)
                        setCurrentAccountId(null)
                      }
                    }
                    fetchAccounts()
                  }}
                  className='px-5 py-2 bg-red-600 hover:bg-red-700 text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs cursor-pointer'
                >
                  Tôi đã hoàn thành hủy liên kết
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SUB-COMPONENT: Modal Form Thêm ngân hàng thủ công (Cách ly State tránh lag gõ phím)
// ============================================================================
interface ManualAddModalProps {
  isOpen: boolean
  onClose: () => void
  businessId: string | undefined
  onSuccess: () => void
}

function ManualAddModal({ isOpen, onClose, businessId, onSuccess }: ManualAddModalProps) {
  const [selectedBank, setSelectedBank] = useState(BANK_LIST[0])
  const [accountNumber, setAccountNumber] = useState('')
  const [accountName, setAccountName] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    if (!accountNumber.trim()) {
      toast.error('Vui lòng nhập số tài khoản')
      return
    }
    if (!accountName.trim()) {
      toast.error('Vui lòng nhập tên chủ tài khoản')
      return
    }

    try {
      setSubmitting(true)
      const res = await createPaymentAccount(businessId, {
        bankShortName: selectedBank.shortName,
        bankName: selectedBank.fullName,
        accountNumber: accountNumber.trim(),
        accountName: accountName.trim().toUpperCase(),
        isDefault,
        description: description.trim() || null
      })

      if (res.success) {
        toast.success('Thêm tài khoản ngân hàng thành công!')
        onSuccess()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
      <div className='bg-white rounded-[16px] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200'>
        <div className='flex items-center justify-between px-8 py-4 bg-[#fef2f2] border-b border-red-100'>
          <h3 className='text-[16px] font-bold text-gray-900 flex items-center gap-2'>
            <Wallet className='text-[#D32F2F] size-5' />
            Thêm tài khoản ngân hàng nhận tiền
          </h3>
          <button
            type='button'
            onClick={onClose}
            className='p-1 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer'
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleAddAccount} className='p-6 flex flex-col gap-4'>
          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Ngân hàng <span className='text-red-500'>*</span>
            </label>
            <select
              value={selectedBank.shortName}
              onChange={(e) => {
                const b = BANK_LIST.find((x) => x.shortName === e.target.value)
                if (b) setSelectedBank(b)
              }}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white transition-all font-medium text-gray-800 cursor-pointer'
            >
              {BANK_LIST.map((bank) => (
                <option key={bank.shortName} value={bank.shortName}>
                  {bank.shortName} - {bank.fullName}
                </option>
              ))}
            </select>
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Số tài khoản <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder='Nhập số tài khoản ngân hàng...'
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 font-mono'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>
              Tên chủ tài khoản <span className='text-red-500'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder='Ví dụ: NGUYEN VAN A...'
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 uppercase'
            />
          </div>

          <div className='flex flex-col gap-1.5'>
            <label className='text-[13px] font-bold text-gray-600'>Ghi chú / Mô tả ngắn</label>
            <input
              type='text'
              placeholder='Ví dụ: Tài khoản nhận tiền chính...'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
            />
          </div>

          <div className='flex items-center gap-2 py-1 select-none'>
            <input
              type='checkbox'
              id='isDefault'
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className='accent-[#D32F2F] size-4 rounded-xs border-gray-300 cursor-pointer'
            />
            <label htmlFor='isDefault' className='text-[13px] text-gray-700 font-semibold cursor-pointer'>
              Đặt làm tài khoản nhận tiền mặc định
            </label>
          </div>

          <div className='flex items-center justify-end gap-3 mt-2 pt-4 border-t border-gray-100 select-none'>
            <button
              type='button'
              onClick={onClose}
              className='px-8 py-2 border-2 border-[#D32F2F] text-[#D32F2F] text-[13px] font-bold rounded-[8px] hover:bg-gray-50 transition-colors cursor-pointer'
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type='submit'
              className='px-5 py-2 bg-[#D32F2F] hover:bg-[#B71C1C] text-white text-[13px] font-bold rounded-[8px] transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer'
              disabled={submitting}
            >
              {submitting && <Loader2 size={14} className='animate-spin' />}
              Tạo mới
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
