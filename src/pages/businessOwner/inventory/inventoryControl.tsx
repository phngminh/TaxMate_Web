import { useEffect, useState } from 'react'
import { ClipboardCheck, Loader2 } from 'lucide-react'
import { toast } from 'react-toastify'
import { getInventoryInitializationPreview, initializeInventory, reconcileInventory } from '../../../apis/inventory.api'
import { toggleStockTracking } from '../../../apis/profile.api'
import { useBusiness } from '../../../contexts/BusinessContext'
import type { InventoryInitializationPreview, ReconcileInventoryRequest } from '../../../types/inventory.type'

interface CountInput {
  quantity: number
  unitValue: number
}

export default function InventoryControlPage() {
  const { businesses, currentBusiness, setBusinesses, setCurrentBusiness } = useBusiness()
  const [preview, setPreview] = useState<InventoryInitializationPreview | null>(null)
  const [counts, setCounts] = useState<Record<string, CountInput>>({})
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10))
  const [documentNumber, setDocumentNumber] = useState(`KK-${Date.now().toString().slice(-6)}`)
  const [description, setDescription] = useState('Kiểm kê tồn kho thực tế')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const keyOf = (productId: string | null, ingredientId: string | null) => productId ?? ingredientId ?? ''

  const load = async () => {
    if (!currentBusiness) return
    try {
      setLoading(true)
      const result = await getInventoryInitializationPreview(currentBusiness.id)
      setPreview(result)
      setCounts(Object.fromEntries(result.items.map(item => [
        keyOf(item.productId, item.ingredientId),
        { quantity: item.currentQuantity, unitValue: item.currentUnitValue ?? 0 }
      ])))
    } catch {
      toast.error('Không thể tải dữ liệu tồn kho')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [currentBusiness?.id])

  const updateBusinessTracking = (enabled: boolean) => {
    if (!currentBusiness) return
    const updated = { ...currentBusiness, isStockTrackingEnabled: enabled }
    setCurrentBusiness(updated)
    setBusinesses(businesses.map(item => item.id === updated.id ? updated : item))
  }

  const save = async () => {
    if (!currentBusiness || !preview) return
    if (!documentNumber.trim() || !description.trim()) {
      toast.error('Vui lòng nhập số chứng từ và diễn giải')
      return
    }
    if (Object.values(counts).some(value => value.quantity < 0 || value.unitValue < 0)) {
      toast.error('Số lượng và đơn giá không được âm')
      return
    }

    const date = new Date(`${occurredAt}T00:00:00`).toISOString()
    try {
      setSaving(true)
      if (!preview.isInitialized) {
        await initializeInventory(currentBusiness.id, {
          occurredAt: date,
          documentNumber: documentNumber.trim(),
          description: description.trim(),
          lines: preview.items.map(item => {
            const value = counts[keyOf(item.productId, item.ingredientId)]
            return {
              ...(item.productId ? { productId: item.productId } : { ingredientId: item.ingredientId! }),
              quantity: value.quantity,
              ...(value.quantity > 0 ? { totalValue: value.quantity * value.unitValue } : {})
            }
          })
        })
      } else {
        const reconciliation: ReconcileInventoryRequest = {
          occurredAt: date,
          documentNumber: documentNumber.trim(),
          description: description.trim(),
          lines: preview.items.map(item => {
            const value = counts[keyOf(item.productId, item.ingredientId)]
            const increase = value.quantity - item.currentQuantity
            return {
              ...(item.productId ? { productId: item.productId } : { ingredientId: item.ingredientId! }),
              actualQuantity: value.quantity,
              ...(increase > 0 ? { adjustmentInTotalValue: increase * value.unitValue } : {})
            }
          })
        }
        if (!preview.isStockTrackingEnabled) {
          await toggleStockTracking(currentBusiness.id, {
            isStockTrackingEnabled: true,
            reconciliation
          })
          updateBusinessTracking(true)
        } else {
          await reconcileInventory(currentBusiness.id, reconciliation)
        }
      }
      toast.success(preview.isInitialized ? 'Đã cập nhật kiểm kê tồn kho' : 'Đã khởi tạo tồn kho')
      await load()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Không thể lưu dữ liệu tồn kho')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className='mx-auto max-w-6xl p-6'>
      <div className='mb-5'>
        <h1 className='flex items-center gap-2 text-2xl font-bold text-gray-900'><ClipboardCheck className='text-[#9b0000]' /> Khởi tạo / kiểm kê tồn kho</h1>
        <p className='mt-1 text-sm text-gray-500'>Nhập số lượng thực tế của toàn bộ sản phẩm và nguyên liệu.</p>
      </div>

      <div className='mb-4 grid gap-3 rounded-xl border bg-white p-4 md:grid-cols-3'>
        <label className='text-sm text-gray-600'>Ngày chứng từ<input type='date' value={occurredAt} onChange={e => setOccurredAt(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' /></label>
        <label className='text-sm text-gray-600'>Số chứng từ<input value={documentNumber} onChange={e => setDocumentNumber(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' /></label>
        <label className='text-sm text-gray-600'>Diễn giải<input value={description} onChange={e => setDescription(e.target.value)} className='mt-1 block w-full rounded-lg border px-3 py-2' /></label>
      </div>

      <div className='overflow-hidden rounded-xl border bg-white'>
        {loading ? <div className='flex justify-center p-12'><Loader2 className='animate-spin' /></div> : (
          <table className='w-full text-sm'>
            <thead className='bg-gray-50 text-gray-600'><tr><th className='px-4 py-3 text-left'>Mặt hàng</th><th className='px-4 py-3 text-right'>Tồn hệ thống</th><th className='px-4 py-3 text-right'>Tồn thực tế</th><th className='px-4 py-3 text-right'>Đơn giá phần tăng</th></tr></thead>
            <tbody>{preview?.items.map(item => {
              const key = keyOf(item.productId, item.ingredientId)
              const value = counts[key] ?? { quantity: 0, unitValue: 0 }
              const needsValue = !preview.isInitialized ? value.quantity > 0 : value.quantity > item.currentQuantity
              return <tr key={key} className='border-t'>
                <td className='px-4 py-3 font-medium'>{item.name}<span className='ml-2 text-xs text-gray-400'>{item.unit}</span></td>
                <td className='px-4 py-3 text-right'>{item.currentQuantity.toLocaleString('vi-VN')}</td>
                <td className='px-4 py-3'><input type='number' min={0} step='any' value={value.quantity} onChange={e => setCounts(old => ({ ...old, [key]: { ...value, quantity: Number(e.target.value) } }))} className='ml-auto block w-32 rounded-lg border px-3 py-2 text-right' /></td>
                <td className='px-4 py-3'><input type='number' min={0} step='any' disabled={!needsValue} value={value.unitValue} onChange={e => setCounts(old => ({ ...old, [key]: { ...value, unitValue: Number(e.target.value) } }))} className='ml-auto block w-40 rounded-lg border px-3 py-2 text-right disabled:bg-gray-100' /></td>
              </tr>
            })}</tbody>
          </table>
        )}
      </div>

      <div className='mt-4 flex justify-end'><button disabled={!preview || saving} onClick={save} className='rounded-lg bg-[#9b0000] px-5 py-2.5 font-semibold text-white disabled:opacity-50'>{saving ? 'Đang lưu...' : !preview?.isInitialized ? 'Xác nhận tồn đầu' : !preview.isStockTrackingEnabled ? 'Kiểm kê và bật quản lý tồn' : 'Lưu kiểm kê'}</button></div>
    </div>
  )
}
