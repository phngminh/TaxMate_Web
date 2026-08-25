export interface PaymentAccount {
  paymentAccountId: string
  businessId: string
  accountType: 'Cash' | 'Bank'
  bankShortName: string
  bankName: string
  accountNumber: string
  accountName: string
  initialBalance: number | null
  initialBalanceDate: string | null
  isActive: boolean
  isDefault: boolean
  description: string | null
  sePayBankAccountXid: string | null
  isSePayConnected: boolean
}

export interface UpdateInitialBalanceRequest {
  initialBalance: number
  initialBalanceDate: string
}

export interface CreatePaymentAccountRequest {
  bankShortName: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  description: string | null
}
