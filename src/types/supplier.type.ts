export interface Supplier {
  id: string
  businessId: string
  name: string
  contactName?: string
  phoneNumber?: string
  address?: string
  note?: string
  createdAt?: string
  updatedAt?: string
}

export interface CreateSupplierRequest {
  name: string
  contactName?: string
  phoneNumber?: string
  address?: string
  note?: string
}

export interface UpdateSupplierRequest {
  name: string
  contactName?: string
  phoneNumber?: string
  address?: string
  note?: string
}
