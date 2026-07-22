export interface ProductIngredient {
  productId: string
  ingredientId: string
  ingredientName: string
  unit?: string
  quantity: number
}

export interface AddProductIngredientRequest {
  ingredientId: string
  quantity: number
}

export interface UpdateProductIngredientRequest {
  quantity: number
}