import { api } from '@/api/axios'

export interface CreateTransactionRequest {
  amount: number
  description: string
  date: string
  category: string
  subscription_id?: number
  goal_id?: number
}

export interface Transaction {
  id: number
  amount: number
  description: string
  date: string
  category: string
  subscription_id?: number
  goal_id?: number
  created_at?: string
}

export interface ViewTransaction {
  id: number
  amount: number
  description: string
  date: string
  category?: string
  subscription_id?: number
  goal_id?: number
}

export interface ImportCsvResponse {
  message: string
  failed: unknown[]
}

export const transactionApi = {
  manual: (data: CreateTransactionRequest) =>
    api.post<Transaction>('/transaction/manual', data),

  importCsv: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ImportCsvResponse>('/transaction/import_csv', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  getUncategorized: () =>
    api.get<ViewTransaction[]>('/transaction/view_uncategorized_transactions'),

  categorize: (transactionId: number, category: string) =>
    api.put<Transaction>(`/transaction/categorize/${transactionId}`, { data: category }),
}
