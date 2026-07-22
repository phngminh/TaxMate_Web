import type { User } from '../types/auth.type'
import type {
  AdminUserDetail,
  AdminUserListItem,
  GetUsersParams,
} from '../types/adminUser.type'
import type { ApiResponse, PagedResult } from '../types/common.type'
import http from '../utils/http'

export const getUsers = async (params: GetUsersParams = {}) => {
  const {
    pageNumber = 1,
    pageSize = 10,
    search,
    role,
    accountStatus,
  } = params

  const response = await http.get<ApiResponse<PagedResult<AdminUserListItem>>>(
    '/User',
    {
      params: {
        pageNumber,
        pageSize,
        search: search || undefined,
        role: role || undefined,
        accountStatus: accountStatus || undefined,
      },
    },
  )
  return response.data
}

export const getUserById = async (id: string) => {
  const response = await http.get<ApiResponse<AdminUserDetail>>(`/User/${id}`)
  return response.data
}

export const toggleUserStatus = async (id: string) => {
  const response = await http.patch<ApiResponse<User>>(
    `/User/${id}/toggle-status`,
  )
  return response.data
}
