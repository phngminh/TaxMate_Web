export interface Ingredient {
  id: string
  businessId?: string
  name: string
  unit?: string
  estimatedPrice?: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIngredientRequest {
  name: string
  unit?: string
  estimatedPrice?: number
}

export interface UpdateIngredientRequest {
  name: string
  unit?: string
  estimatedPrice?: number
}