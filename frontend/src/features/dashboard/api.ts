import { api } from '@/api/axios'

export type ChartCycle = 'weekly' | 'monthly'

/** Pie: { "category_name": amount, "all_spending", "start_date", "end_date" } */
export type PieChartResponse = Record<string, number | string>

const PIE_META_KEYS = ['all_spending', 'start_date', 'end_date', 'income']

/** Behavior: { "YYYY-MM-DD": amount } */
export type BehaviorResponse = Record<string, number>

export interface SavingAmountResponse {
  amount: number
}

export const dashboardApi = {
  getPieChart: (cycle: ChartCycle) =>
    api.get<PieChartResponse>(`/transaction/view_pie_chart/${cycle}`),

  getBehavior: (cycle: ChartCycle) =>
    api.get<BehaviorResponse>(`/transaction/view_behavior/${cycle}`),

  getSavingAmount: () =>
    api.get<SavingAmountResponse>(`/saving/all_amount`),
}

/** Extract income từ response */
export function getIncomeFromPie(raw: PieChartResponse | undefined): number {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return 0
  return Number(raw.income) || 0
}

/** Normalize Pie object -> Recharts Pie: { name, value }[] (bỏ metadata và income) */
export function toPieData(raw: PieChartResponse | undefined): { name: string; value: number }[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw)
    .filter(([key]) => !PIE_META_KEYS.includes(key))
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' '),
      value: Number(value),
    }))
    .filter((d) => d.value > 0)
}

/** Normalize Behavior object -> Recharts Line/Bar: { name, amount }[] (sort by date) */
export function toBehaviorData(raw: BehaviorResponse | undefined): { name: string; amount: number }[] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return []
  return Object.entries(raw)
    .map(([name, amount]) => ({ name, amount: Number(amount) }))
    .sort((a, b) => a.name.localeCompare(b.name))
}
