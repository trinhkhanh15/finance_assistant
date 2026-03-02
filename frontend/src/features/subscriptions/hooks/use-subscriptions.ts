import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { subscriptionApi, type CreateSubscriptionRequest } from '../api'
import { useToast } from '@/hooks/use-toast'

const KEYS = {
  me: ['subscription', 'me'] as const,
}

export function useSubscriptions() {
  return useQuery({
    queryKey: KEYS.me,
    queryFn: () => subscriptionApi.getMe(),
  })
}

export function useCreateSubscription() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (data: CreateSubscriptionRequest) =>
      subscriptionApi.create(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.me })
      toast({ title: 'Subscription created', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: (err.response?.data?.detail as string) || 'Failed to create subscription',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  return useMutation({
    mutationFn: (subscriptionId: number) =>
      subscriptionApi.delete(subscriptionId),
    onSuccess: (success) => {
      if (success) {
        queryClient.invalidateQueries({ queryKey: KEYS.me })
        toast({ title: 'Subscription deleted', variant: 'success' })
      } else {
        toast({
          title: 'Failed to delete subscription',
          variant: 'destructive',
        })
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      toast({
        title: (err.response?.data?.detail as string) || 'Failed to delete subscription',
        variant: 'destructive',
      })
    },
  })
}
