import { useQuery } from '@tanstack/react-query'
import { dashboardApi, type ChartCycle } from '../api'

export function usePieChart(cycle: ChartCycle) {
  return useQuery({
    queryKey: ['dashboard', 'pie', cycle],
    queryFn: () => dashboardApi.getPieChart(cycle).then((r) => r.data),
  })
}

export function useBehaviorChart(cycle: ChartCycle) {
  return useQuery({
    queryKey: ['dashboard', 'behavior', cycle],
    queryFn: () => dashboardApi.getBehavior(cycle).then((r) => r.data),
  })
}

export function useSavingAmount() {
  return useQuery({
    queryKey: ['dashboard', 'saving', 'amount'],
    queryFn: () => dashboardApi.getSavingAmount().then((r) => r.data),
  })
}
