import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { savingApi, type CreateTargetRequest } from '../api'
import { useToast } from '@/hooks/use-toast'

const KEYS = {
  current: ['saving', 'current'] as const,
  all: ['saving', 'all'] as const,
}

export function useSavingGoals() {
  return useQuery({
    queryKey: KEYS.current,
    queryFn: savingApi.getCurrent,
  })
}

export function useAllSavingGoals() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: savingApi.getAll,
  })
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data: CreateTargetRequest) => savingApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      toast({ title: 'Goal created', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: (err.response?.data?.detail as string) || 'Failed to create goal',
        variant: 'destructive',
      })
    },
  })
}

export function useDeposit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      savingApi.deposit(goalId, { amount }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] })
      toast({ title: 'Deposit successful', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: (err.response?.data?.detail as string) || 'Deposit failed',
        variant: 'destructive',
      })
    },
  })
}

export function useWithdraw() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      savingApi.withdraw(goalId, amount).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] })
      toast({ title: 'Withdrawal successful', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string | string[]; message?: string } }; message?: string }) => {
      const data = err.response?.data as { detail?: string | string[]; message?: string } | undefined
      let message = 'Withdrawal failed'
      if (data) {
        if (typeof data.detail === 'string') message = data.detail
        else if (Array.isArray(data.detail)) {
          const first = data.detail[0]
          message = typeof first === 'object' && first && 'msg' in first ? String((first as { msg: string }).msg) : String(first)
        } else if (typeof data.message === 'string') message = data.message
      }
      if (message.toLowerCase().includes('does not have enough amount')) {
        message = 'This goal does not have enough amount to withdraw.'
      }
      toast({ title: message, variant: 'destructive' })
    },
  })
}

export function useDeleteGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (goalId: number) => savingApi.delete(goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      toast({ title: 'Goal deleted', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: (err.response?.data?.detail as string) || 'Delete failed',
        variant: 'destructive',
      })
    },
  })
}
