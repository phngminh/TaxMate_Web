export interface Service {
  id: string
  name: string
  category: string
  type: string
  unit: string
  price: number
  status: 'active' | 'inactive'
}