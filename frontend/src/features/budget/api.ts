import { api } from '@/api/axios'

export interface BudgetData {
  fad_budget: number
  shopping_budget: number
  investment_budget: number
  moving_budget: number
  entertainment_budget: number
  other_budget: number
}

export interface SetBudgetRequest extends BudgetData {}

export type SpendingData = Record<string, number>

export const budgetApi = {
  setBudget: (data: SetBudgetRequest) =>
    api.put<{ message: string; budget: BudgetData }>('/user/set_budget', data),

  showBudget: () =>
    api.get<BudgetData>('/user/show_budget').then((r) => r.data),

  getMonthlySpending: () =>
    api.get<SpendingData>('/transaction/view_pie_chart/monthly').then((r) => r.data),
}
