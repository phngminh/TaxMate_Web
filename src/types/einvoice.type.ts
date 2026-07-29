export interface EInvoiceConfig {
  provider: string
  baseUrl: string
  clientId: string
  clientSecret?: string
  providerAccountId: string
  invoiceTemplateCode: string
  symbol: string
  isEnabled: boolean
  quotaWarningThreshold?: number
}

export interface SePayProviderItem {
  id: string
  provider: string
  active: boolean
  tax_authority_approved_date?: string
}

export interface SePayTemplateItem {
  template_code: string
  invoice_series: string
  invoice_label: string
}

export interface SaveEInvoiceConfigRequest {
  provider: string
  baseUrl: string
  clientId: string
  clientSecret?: string
  providerAccountId: string
  invoiceTemplateCode: string
  symbol: string
  isEnabled: boolean
  quotaWarningThreshold?: number
}

export interface TestConnectionRequest {
  baseUrl: string
  clientId: string
  clientSecret: string
}

export interface GetTemplatesRequest {
  baseUrl: string
  clientId: string
  clientSecret: string
  providerAccountId: string
}

