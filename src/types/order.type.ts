export interface Order {
  transactionId: string
  transactionCode: string
  transactionDate: string
  totalAmount: number
  status: string
  itemCount: number
  invoiceNumber?: string
}

export interface OrderDetail {
  transactionId: string
  transactionCode: string
  transactionDate: string
  status: string
  note?: string
  invoiceNumber?: string

  subTotal: number

  discountType?: string
  discountValue?: number
  discountAmount: number

  surchargeName?: string
  surchargeType?: string
  surchargeValue?: number
  surchargeAmount: number

  totalAmount: number

  items: OrderItem[]
  payments: OrderPayment[]
}

export interface OrderItem {
  transactionItemId: string
  productId?: string
  productName: string
  unit?: string
  unitPrice: number
  quantity: number

  discountType?: string
  discountValue?: number
  discountAmount: number

  lineTotal: number
  note?: string
}

export interface OrderPayment {
  paymentId: string
  paymentMethod: string
  amount: number
  paymentAccountId?: string
  bankName?: string
  paidAt?: string
}

export interface CreateOrderRequest {
  note?: string
}

export interface AddOrderItemRequest {
  productId: string
  quantity: number
  discountType?: string
  discountValue?: number
  note?: string
}

export interface UpdateOrderItemRequest {
  quantity?: number
  discountType?: string
  discountValue?: number
  note?: string
}