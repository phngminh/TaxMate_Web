import type { ApiResponse, PagedResult } from '../types/common.type'
import type { Order, OrderDetail, CreateOrderRequest, AddOrderItemRequest, UpdateOrderItemRequest } from '../types/order.type'
import http from '../utils/http'

export const createOrder = async (businessId: string, body: CreateOrderRequest) => {
  const response = await http.post<ApiResponse<string>>(`/api/Order/business/${businessId}`, body)
  return response.data
}

export const getOrderById = async (id: string) => {
  const response = await http.get<ApiResponse<OrderDetail>>(`/api/Order/${id}`)
  return response.data
}

export const getOrders = async (
  businessId: string,
  page = 1,
  pageSize = 20
) => {
  const response = await http.get<ApiResponse<PagedResult<Order>>>(`/Order/business/${businessId}`, {
    params: {
      page,
      pageSize
    }
  })
  return response.data
}

export const addOrderItem = async (orderId: string, body: AddOrderItemRequest) => {
  const response = await http.post<ApiResponse<string>>(`/Order/${orderId}/items`, body)
  return response.data
}

export const updateOrderItem = async (
  orderId: string,
  itemId: string,
  body: UpdateOrderItemRequest
) => {
  const response = await http.put<ApiResponse<string>>(`/Order/${orderId}/items/${itemId}`, body)
  return response.data
}

export const removeOrderItem = async (orderId: string, itemId: string) => {
  const response = await http.delete<ApiResponse<string>>(`/Order/${orderId}/items/${itemId}`)
  return response.data
}


export const cancelOrder = async (orderId: string) => {
  const response = await http.post<ApiResponse<string>>(`/Order/${orderId}/cancel`)
  return response.data
}