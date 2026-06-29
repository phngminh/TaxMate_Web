export interface Product {
  id: string
  name: string
  mainCategory: string
  category: string
  description: string
  unit: string
  price: number
  status: 'active' | 'inactive'
}