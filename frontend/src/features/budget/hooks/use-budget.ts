import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { budgetApi, type SetBudgetRequest } from '../api'
import { useToast } from '@/hooks/use-toast'

const KEYS = {
  budget: ['budget', 'data'] as const,
  spending: ['budget', 'spending'] as const,
}

export function useBudget() {
  return useQuery({
    queryKey: KEYS.budget,
    queryFn: budgetApi.showBudget,
  })
}

export function useMonthlySpending() {
  return useQuery({
    queryKey: KEYS.spending,
    queryFn: budgetApi.getMonthlySpending,
  })
}

export function useSetBudget() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: SetBudgetRequest) => budgetApi.setBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.budget })
      toast({ title: 'Budget updated successfully', variant: 'success' })
    },
    onError: (err: any) => {
      const message = err.response?.data?.detail || 'Failed to update budget'
      toast({ title: message, variant: 'destructive' })
    },
  })
}
