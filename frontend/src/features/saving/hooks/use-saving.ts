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
    queryFn: savingApi.getAll,
  })
}

export function useAllSavingGoals() {
  return useQuery({
    queryKey: KEYS.all,
    queryFn: savingApi.getAll,
  })
}

// Helper function to extract error message
function getErrorMessage(
  err: { response?: { data?: { detail?: string | string[]; message?: string } }; message?: string },
  defaultMessage: string
): string {
  const data = err.response?.data as { detail?: string | string[]; message?: string } | undefined
  
  if (data?.detail) {
    if (typeof data.detail === 'string') return data.detail
    if (Array.isArray(data.detail)) {
      const first = data.detail[0]
      return typeof first === 'object' && first && 'msg' in first 
        ? String((first as { msg: string }).msg) 
        : String(first)
    }
  }
  
  if (typeof data?.message === 'string') return data.message
  if (typeof err.message === 'string') return err.message
  
  return defaultMessage
}

export function useCreateGoal() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data: CreateTargetRequest) => savingApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      toast({ title: 'Goal created successfully', variant: 'success' })
    },
    onError: (err: any) => {
      const message = getErrorMessage(err, 'Failed to create goal')
      toast({ title: message, variant: 'destructive' })
    },
  })
}

export function useDeposit() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: ({ goalId, amount }: { goalId: number; amount: number }) =>
      savingApi.deposit(goalId, { amount }).then((r) => r.data),
    onSuccess: (updatedGoal) => {
      queryClient.invalidateQueries({ queryKey: KEYS.current })
      queryClient.invalidateQueries({ queryKey: KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['user', 'balance'] })

      const isCompleted = updatedGoal?.status?.toLowerCase() === 'completed'
      if (isCompleted) {
        toast({
          title: 'Congratulations! Goal completed',
          description: `${updatedGoal.name} is now marked as completed.`,
          variant: 'success',
        })
        return
      }

      toast({ title: 'Deposit successful', variant: 'success' })
    },
    onError: (err: any) => {
      const message = getErrorMessage(err, 'Deposit failed')
      toast({ title: message, variant: 'destructive' })
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
    onError: (err: any) => {
      const message = getErrorMessage(err, 'Withdrawal failed')
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
      toast({ title: 'Goal deleted successfully', variant: 'success' })
    },
    onError: (err: any) => {
      const message = getErrorMessage(err, 'Delete failed')
      toast({ title: message, variant: 'destructive' })
    },
  })
}
