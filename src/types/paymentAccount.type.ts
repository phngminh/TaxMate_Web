export interface PaymentAccount {
  paymentAccountId: string
  businessId: string
  bankShortName: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  description: string | null
  sePayBankAccountXid: string | null
  isSePayConnected: boolean
}

export interface CreatePaymentAccountRequest {
  bankShortName: string
  bankName: string
  accountNumber: string
  accountName: string
  isDefault: boolean
  description: string | null
}
