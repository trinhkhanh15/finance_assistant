import { api } from '@/api/axios'

export interface Subscription {
  id: number
  service_name: string
  amount: number
  billing_cycle: string
  next_billing_date: string
  is_active: boolean
  created_at?: string
}

export interface ShowSubscription {
  id: number
  service_name: string
  amount: number
  billing_cycle: string
  next_billing_date: string
  is_active: boolean
}

export interface CreateSubscriptionRequest {
  service_name: string
  amount: number
  billing_cycle: string
  next_billing_date: string
  is_active: boolean
}

export const subscriptionApi = {
  getMe: () => api.get<ShowSubscription[]>('/subscription/me').then((r) => r.data),
  create: (data: CreateSubscriptionRequest) =>
    api.post<Subscription>('/subscription/create', data),
  delete: (subscriptionId: number) =>
    api.delete<boolean>(`/subscription/delete/${subscriptionId}`).then((r) => r.data),
}
