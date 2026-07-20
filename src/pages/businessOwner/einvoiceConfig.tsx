import React, { useState, useEffect, useMemo } from 'react'
import { Receipt, Activity, CheckCircle, Wifi, AlertTriangle, Loader2, ShieldCheck, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import { useBusiness } from '../../contexts/BusinessContext'
import {
  getEInvoiceConfig,
  saveEInvoiceConfig,
  getEInvoiceQuota,
  getSavedProvidersAndTemplates,
  testConnectionAndGetProviders,
  getTemplates
} from '../../apis/einvoice.api'
import type { SePayProviderItem, SePayTemplateItem } from '../../types/einvoice.type'

export default function EInvoiceConfig() {
  const { currentBusiness } = useBusiness()
  const businessId = currentBusiness?.id

  // Loading states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)

  // Auth & Connection states
  const [isSandbox, setIsSandbox] = useState(true)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [quotaRemaining, setQuotaRemaining] = useState<number | null>(null)
  const [quotaWarningThreshold, setQuotaWarningThreshold] = useState(100)

  // Dropdown options
  const [providers, setProviders] = useState<SePayProviderItem[]>([])
  const [selectedProviderId, setSelectedProviderId] = useState('')
  const [templates, setTemplates] = useState<SePayTemplateItem[]>([])
  const [selectedTemplateCode, setSelectedTemplateCode] = useState('')
  const [selectedSymbol, setSelectedSymbol] = useState('')

  const getBaseUrl = (sandbox: boolean) => {
    return sandbox
      ? 'https://einvoice-api-sandbox.sepay.vn'
      : 'https://einvoice-api.sepay.vn'
  }

  const fetchQuota = async () => {
    if (!businessId) return
    try {
      const res = await getEInvoiceQuota(businessId)
      if (res.success && res.data !== undefined) {
        setQuotaRemaining(res.data)
      }
    } catch (err) {
      console.error('Error fetching quota:', err)
    }
  }

  const loadInitialData = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      // 1. Fetch Config
      const configRes = await getEInvoiceConfig(businessId)
      if (configRes.success && configRes.data) {
        const config = configRes.data
        setIsSandbox(config.baseUrl.includes('sandbox'))
        setClientId(config.clientId)
        setClientSecret('') // Do not expose Client Secret on screen
        setIsEnabled(config.isEnabled)
        setQuotaWarningThreshold(config.quotaWarningThreshold || 100)
        setIsConnected(true)

        // 2. Fetch saved providers and templates
        const savedRes = await getSavedProvidersAndTemplates(businessId)
        if (savedRes.success && savedRes.data) {
          setProviders(savedRes.data.providers || [])
          setSelectedProviderId(config.providerAccountId || '')
          setTemplates(savedRes.data.templates || [])
          setSelectedTemplateCode(config.invoiceTemplateCode || '')
          setSelectedSymbol(config.symbol || '')
        }
      } else {
        setIsConnected(false)
      }

      // 3. Fetch Quota
      await fetchQuota()
    } catch (err: any) {
      // 404 is normal when not configured
      if (err?.response?.status !== 404) {
        console.error(err)
        toast.error('Không thể tải cấu hình hóa đơn điện tử.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInitialData()
  }, [businessId])

  // Handles clicking "Kiểm tra kết nối"
  const handleTestConnection = async () => {
    if (!clientId.trim()) {
      toast.error('Vui lòng nhập Client ID')
      return
    }
    // For new connection or when updating client, Client Secret is required
    if (!isConnected && !clientSecret.trim()) {
      toast.error('Vui lòng nhập Client Secret')
      return
    }

    try {
      setConnecting(true)
      const res = await testConnectionAndGetProviders({
        baseUrl: getBaseUrl(isSandbox),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim()
      })

      if (res.success && res.data) {
        setProviders(res.data)
        setIsConnected(true)
        toast.success('Kết nối SePay thành công! Vui lòng chọn nhà cung cấp.')
        // Reset subsequent fields
        setSelectedProviderId('')
        setTemplates([])
        setSelectedTemplateCode('')
        setSelectedSymbol('')
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Kết nối SePay thất bại. Vui lòng kiểm tra lại thông tin.')
      setIsConnected(false)
    } finally {
      setConnecting(false)
    }
  }

  // Handle selected provider change
  const handleProviderChange = async (providerId: string) => {
    setSelectedProviderId(providerId)
    setSelectedTemplateCode('')
    setSelectedSymbol('')
    setTemplates([])

    if (!providerId) return

    try {
      setLoadingTemplates(true)
      const res = await getTemplates({
        baseUrl: getBaseUrl(isSandbox),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        providerAccountId: providerId
      })

      if (res.success && res.data) {
        setTemplates(res.data)
      }
    } catch (err: any) {
      console.error(err)
      toast.error('Không thể tải danh sách mẫu hóa đơn từ nhà cung cấp này.')
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Handle save configuration
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId) return

    if (!isConnected) {
      toast.error('Vui lòng kiểm tra kết nối thành công trước khi lưu.')
      return
    }
    if (!selectedProviderId) {
      toast.error('Vui lòng chọn tài khoản nhà cung cấp.')
      return
    }
    if (!selectedTemplateCode) {
      toast.error('Vui lòng chọn mẫu số hóa đơn.')
      return
    }
    if (!selectedSymbol) {
      toast.error('Vui lòng chọn ký hiệu hóa đơn.')
      return
    }

    try {
      setSaving(true)
      const providerObj = providers.find(x => x.id === selectedProviderId)
      const res = await saveEInvoiceConfig(businessId, {
        provider: providerObj?.provider || 'Unknown',
        baseUrl: getBaseUrl(isSandbox),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim() || undefined, // send undefined if blank to keep previous one on server
        providerAccountId: selectedProviderId,
        invoiceTemplateCode: selectedTemplateCode,
        symbol: selectedSymbol,
        isEnabled,
        quotaWarningThreshold: Number(quotaWarningThreshold)
      })

      if (res.success) {
        toast.success('Lưu cấu hình hóa đơn điện tử thành công!')
        loadInitialData() // refresh all state
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err?.response?.data?.message || 'Lưu cấu hình thất bại.')
    } finally {
      setSaving(false)
    }
  }

  const isLowQuota = useMemo(() => {
    if (quotaRemaining === null) return false
    return quotaRemaining <= quotaWarningThreshold
  }, [quotaRemaining, quotaWarningThreshold])

  return (
    <div className='bg-[#f8f9fa] pt-6 pb-12 min-h-[calc(100vh-51px)] px-6'>
      <div className='max-w-5xl mx-auto'>
        <div className='flex items-center justify-between mb-8'>
          <div>
            <h1 className='text-[22px] font-bold text-gray-900 flex items-center gap-2'>
              <Receipt className='text-[#D32F2F] size-6' />
              Cấu hình Hóa đơn Điện tử (HĐĐT)
            </h1>
            <p className='text-gray-500 text-xs mt-1'>
              Tích hợp với tài khoản SePay E-Invoice để xuất hóa đơn điện tử tự động khi hoàn tất đơn hàng POS
            </p>
          </div>
        </div>

        {loading ? (
          <div className='flex justify-center items-center py-20'>
            <Loader2 className='animate-spin text-[#D32F2F] size-10' />
          </div>
        ) : (
          <form onSubmit={handleSave} className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
            {/* CỘT TRÁI - CONFIG CHI TIẾT */}
            <div className='lg:col-span-2 flex flex-col gap-6'>
              {/* CARD KẾT NỐI */}
              <div className='bg-white rounded-[16px] border border-gray-200 p-6 shadow-xs'>
                <div className='flex items-center justify-between pb-4 border-b border-gray-100 mb-6'>
                  <h3 className='font-bold text-[15px] text-gray-900 flex items-center gap-2'>
                    <Wifi className='text-blue-600 size-5' />
                    Thông tin kết nối SePay
                  </h3>
                  <div className='flex items-center gap-2'>
                    <span className='text-xs font-semibold text-gray-600 select-none'>Sandbox Mode</span>
                    <input
                      type='checkbox'
                      checked={isSandbox}
                      onChange={(e) => {
                        setIsSandbox(e.target.checked)
                        setIsConnected(false) // reset connection on change
                      }}
                      className='accent-[#D32F2F] size-4 rounded-xs cursor-pointer'
                    />
                  </div>
                </div>

                <div className='flex flex-col gap-4'>
                  <div className='flex flex-col gap-1.5'>
                    <label className='text-[13px] font-bold text-gray-600'>
                      Client ID <span className='text-red-500'>*</span>
                    </label>
                    <input
                      type='text'
                      required
                      placeholder='Nhập Client ID của SePay API...'
                      value={clientId}
                      onChange={(e) => {
                        setClientId(e.target.value)
                        setIsConnected(false) // reset connection on change
                      }}
                      className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 font-mono'
                    />
                  </div>

                  <div className='flex flex-col gap-1.5'>
                    <label className='text-[13px] font-bold text-gray-600'>
                      Client Secret {isConnected ? '(Bỏ trống nếu không thay đổi)' : <span className='text-red-500'>*</span>}
                    </label>
                    <input
                      type='password'
                      placeholder={isConnected ? '••••••••••••••••••••••••' : 'Nhập Client Secret của SePay API...'}
                      value={clientSecret}
                      onChange={(e) => {
                        setClientSecret(e.target.value)
                        setIsConnected(false) // reset connection on change
                      }}
                      className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800 font-mono'
                    />
                  </div>

                  <div className='flex items-center justify-between mt-2 pt-2 border-t border-gray-50'>
                    <div className='flex items-center gap-1.5'>
                      <div className={`size-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      <span className='text-xs font-semibold text-gray-500'>
                        {isConnected ? 'Đã kết nối SePay' : 'Chưa kết nối'}
                      </span>
                    </div>

                    <button
                      type='button'
                      onClick={handleTestConnection}
                      disabled={connecting}
                      className='flex items-center gap-1.5 border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded-[8px] text-[12px] font-bold transition-colors'
                    >
                      {connecting && <Loader2 size={12} className='animate-spin' />}
                      Kiểm tra kết nối
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD CẤU HÌNH HÓA ĐƠN */}
              <div className='bg-white rounded-[16px] border border-gray-200 p-6 shadow-xs'>
                <h3 className='font-bold text-[15px] text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100 mb-6'>
                  <ShieldCheck className='text-purple-600 size-5' />
                  Chọn tài khoản và mẫu hóa đơn
                </h3>

                {!isConnected ? (
                  <div className='py-8 text-center bg-gray-50 rounded-[12px] border border-dashed border-gray-200'>
                    <p className='text-gray-400 text-xs font-semibold'>
                      Vui lòng điền thông tin kết nối và bấm "Kiểm tra kết nối" phía trên để mở cấu hình này.
                    </p>
                  </div>
                ) : (
                  <div className='flex flex-col gap-4'>
                    <div className='flex flex-col gap-1.5'>
                      <label className='text-[13px] font-bold text-gray-600'>
                        Tài khoản Nhà cung cấp (Provider Account) <span className='text-red-500'>*</span>
                      </label>
                      <select
                        value={selectedProviderId}
                        onChange={(e) => handleProviderChange(e.target.value)}
                        className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white transition-all font-medium text-gray-800 cursor-pointer'
                      >
                        <option value=''>-- Chọn tài khoản --</option>
                        {providers.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.provider} ({p.tax_authority_approved_date ? `Approved: ${new Date(p.tax_authority_approved_date).toLocaleDateString('vi-VN')}` : 'No date'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {loadingTemplates ? (
                      <div className='flex items-center justify-center py-6'>
                        <Loader2 className='animate-spin text-[#D32F2F] size-6' />
                        <span className='text-xs text-gray-500 font-semibold ml-2'>Đang tải mẫu hóa đơn...</span>
                      </div>
                    ) : selectedProviderId && templates.length > 0 ? (
                      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                        <div className='flex flex-col gap-1.5'>
                          <label className='text-[13px] font-bold text-gray-600'>
                            Mẫu hóa đơn (Template) <span className='text-red-500'>*</span>
                          </label>
                          <select
                            value={selectedTemplateCode}
                            onChange={(e) => setSelectedTemplateCode(e.target.value)}
                            className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white transition-all font-medium text-gray-800 cursor-pointer'
                          >
                            <option value=''>-- Chọn mẫu hóa đơn --</option>
                            {templates.map(t => (
                              <option key={t.template_code} value={t.template_code}>
                                {t.template_code} - {t.invoice_label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='flex flex-col gap-1.5'>
                          <label className='text-[13px] font-bold text-gray-600'>
                            Ký hiệu (Symbol) <span className='text-red-500'>*</span>
                          </label>
                          <select
                            value={selectedSymbol}
                            onChange={(e) => setSelectedSymbol(e.target.value)}
                            className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2.5 text-[13.5px] outline-hidden focus:border-[#D32F2F] bg-white transition-all font-medium text-gray-800 cursor-pointer'
                          >
                            <option value=''>-- Chọn ký hiệu --</option>
                            {/* Unique list of symbols of selected template */}
                            {templates
                              .filter(x => !selectedTemplateCode || x.template_code === selectedTemplateCode)
                              .map(t => (
                                <option key={t.invoice_series} value={t.invoice_series}>
                                  {t.invoice_series}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      selectedProviderId && (
                        <div className='p-4 text-center bg-amber-50 rounded-[12px] border border-amber-100 text-amber-700 text-xs font-semibold'>
                          Không tìm thấy mẫu hóa đơn nào được cấp phép cho tài khoản nhà cung cấp này.
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CỘT PHẢI - TRẠNG THÁI & HẠN MỨC */}
            <div className='flex flex-col gap-6'>
              {/* CARD TRẠNG THÁI & QUOTA */}
              <div className='bg-white rounded-[16px] border border-gray-200 p-6 shadow-xs flex flex-col gap-4'>
                <h3 className='font-bold text-[15px] text-gray-900 flex items-center gap-2 pb-4 border-b border-gray-100'>
                  <Activity className='text-emerald-500 size-5' />
                  Hạn ngạch & Hoạt động
                </h3>

                {/* Switch bật tắt kích hoạt */}
                <div className='flex items-center justify-between p-3.5 bg-gray-50 rounded-[12px] border border-gray-100'>
                  <div className='flex flex-col'>
                    <span className='text-xs font-bold text-gray-800'>Trạng thái HĐĐT</span>
                    <span className='text-[10px] text-gray-400 font-medium leading-tight mt-0.5'>Bật để xuất tự động</span>
                  </div>
                  <input
                    type='checkbox'
                    checked={isEnabled}
                    onChange={(e) => setIsEnabled(e.target.checked)}
                    className='accent-[#D32F2F] size-5 rounded-xs cursor-pointer'
                  />
                </div>

                {/* Quota Remaining */}
                <div className='flex flex-col gap-2 p-4 bg-[#fef2f2] rounded-[12px] border border-red-50 relative overflow-hidden'>
                  <div className='flex items-center justify-between'>
                    <span className='text-xs font-bold text-gray-500'>Hạn ngạch còn lại</span>
                    <button
                      type='button'
                      onClick={fetchQuota}
                      className='p-1 hover:bg-red-100/50 rounded-md transition-colors text-[#D32F2F]'
                      title='Tải lại hạn ngạch'
                    >
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className='flex items-baseline gap-1 mt-1'>
                    <span className='text-4xl font-extrabold text-[#D32F2F] font-mono'>
                      {quotaRemaining !== null ? quotaRemaining.toLocaleString() : '---'}
                    </span>
                    <span className='text-xs font-bold text-gray-400'>số hóa đơn</span>
                  </div>

                  {isLowQuota && quotaRemaining !== null && (
                    <div className='flex items-start gap-1.5 mt-3 text-amber-700 bg-amber-50 rounded-lg p-2.5 border border-amber-100 text-[11px] leading-normal'>
                      <AlertTriangle size={14} className='shrink-0 mt-0.5' />
                      <span>Hạn ngạch sắp hết! Hãy mua thêm để việc thanh toán bán hàng không bị gián đoạn.</span>
                    </div>
                  )}
                </div>

                {/* Ngưỡng Cảnh báo */}
                <div className='flex flex-col gap-1.5'>
                  <label className='text-[13px] font-bold text-gray-600'>Ngưỡng cảnh báo (số)</label>
                  <input
                    type='number'
                    min={1}
                    required
                    value={quotaWarningThreshold}
                    onChange={(e) => setQuotaWarningThreshold(Number(e.target.value))}
                    className='w-full border border-gray-200 rounded-[8px] px-3.5 py-2 text-[13.5px] outline-hidden focus:border-[#D32F2F] transition-all font-medium text-gray-800'
                  />
                </div>

                {/* Button Save */}
                <button
                  type='submit'
                  disabled={saving || !isConnected}
                  className={`mt-4 w-full flex items-center justify-center gap-2 text-white py-2.5 rounded-[8px] text-[13px] font-bold transition-all shadow-xs ${
                    isConnected
                      ? 'bg-[#D32F2F] hover:bg-[#B71C1C] cursor-pointer'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  {saving && <Loader2 size={15} className='animate-spin' />}
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
