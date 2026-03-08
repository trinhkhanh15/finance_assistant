import { api } from '@/api/axios'

export interface Target {
  id: number
  name: string
  description?: string
  start_date: string
  end_date: string
  current_amount: number
  target_amount: number
  status?: string
}

export interface CreateTargetRequest {
  name: string
  description?: string
  start_date: string
  end_date: string
  current_amount: number
  target_amount: number
}

export interface DepositRequest {
  amount: number
}

export const savingApi = {
  //getCurrent: () => api.get<Target[]>('/saving/show_current').then((r) => r.data),
  getAll: () => api.get<Target[]>('/saving/show_all').then((r) => r.data),
  create: (data: CreateTargetRequest) => api.post<Target>('/saving/create', data),
  deposit: (goalId: number, data: DepositRequest) =>
    api.post<Target>(`/saving/deposit/${goalId}`, data),
  withdraw: (goalId: number, amount: number) =>
    api.post(`/saving/withdraw/${goalId}`, null, { params: { amount } }),
  delete: (goalId: number) => api.delete<boolean>(`/saving/delete/${goalId}`),
}
