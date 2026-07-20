import type { PaymentAccount, CreatePaymentAccountRequest } from '../types/paymentAccount.type'
import type { ApiResponse } from '../types/common.type'
import http from '../utils/http'

export const getPaymentAccounts = async (businessId: string) => {
  const response = await http.get<ApiResponse<PaymentAccount[]>>(
    `/PaymentAccount/business/${businessId}`
  )
  return response.data
}

export const createPaymentAccount = async (
  businessId: string,
  body: CreatePaymentAccountRequest
) => {
  const response = await http.post<ApiResponse<PaymentAccount>>(
    `/PaymentAccount/business/${businessId}`,
    body
  )
  return response.data
}

export const deletePaymentAccount = async (id: string) => {
  const response = await http.delete<ApiResponse<boolean>>(
    `/PaymentAccount/${id}`
  )
  return response.data
}

export const createSePayMockPayment = async (
  transactionId: string,
  paymentAccountId: string
) => {
  const response = await http.post<ApiResponse<any>>(
    `/PaymentAccount/sepay-mock-payment`,
    null,
    {
      params: {
        transactionId,
        paymentAccountId
      }
    }
  )
  return response.data
}

export const getSePayConnectUrl = async (businessId: string) => {
  const response = await http.get<ApiResponse<string>>(
    `/PaymentAccount/sepay-connect-url`,
    {
      params: { businessId }
    }
  )
  return response.data
}

export const setDefaultPaymentAccount = async (accountId: string, businessId: string) => {
  const response = await http.patch<ApiResponse<any>>(
    `/PaymentAccount/${accountId}/set-default`,
    null,
    {
      params: { businessId }
    }
  )
  return response.data
}

export const syncSePayAccounts = async (businessId: string) => {
  const response = await http.post<ApiResponse<{ synced: number; total: number }>>(
    `/PaymentAccount/sepay-sync`,
    null,
    {
      params: { businessId }
    }
  )
  return response.data
}

export const getSePayDisconnectUrl = async (paymentAccountId: string) => {
  const response = await http.get<ApiResponse<string>>(
    `/PaymentAccount/sepay-disconnect-url`,
    {
      params: { paymentAccountId }
    }
  )
  return response.data
}
