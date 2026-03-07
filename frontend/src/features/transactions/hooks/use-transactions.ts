import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { transactionApi, type CreateTransactionRequest } from '../api'
import { useToast } from '@/hooks/use-toast'

const keys = {
  uncategorized: ['transactions', 'uncategorized'] as const,
}

export function useUncategorizedTransactions() {
  return useQuery({
    queryKey: keys.uncategorized,
    queryFn: () => transactionApi.getUncategorized().then((r) => r.data),
  })
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (data: CreateTransactionRequest) =>
      transactionApi.manual(data).then((r) => r.data),
    onSuccess: (data) => {
      // Check if response indicates insufficient balance
      if (data.description?.toLowerCase() === 'insufficient_balance') {
        toast({ title: 'Your balance is not enough for this transaction', variant: 'destructive' })
        return
      }
      queryClient.invalidateQueries({ queryKey: keys.uncategorized })
      toast({ title: 'Transaction added successfully', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const msg =
        (err.response?.data?.detail as string) || 'Failed to add transaction'
      toast({ title: msg, variant: 'destructive' })
    },
  })
}

export function useImportCsv() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: (file: File) => transactionApi.importCsv(file).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: keys.uncategorized })
      toast({
        title: data.message,
        variant: data.failed?.length ? 'default' : 'success',
      })
      if (data.failed?.length) {
        toast({
          title: `${data.failed.length} transaction(s) failed`,
          variant: 'destructive',
        })
      }
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const msg =
      (err.response?.data?.detail as string) || 'CSV import failed'
      toast({ title: msg, variant: 'destructive' })
    },
  })
}

export function useCategorizeTransaction() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: ({ transactionId, category }: { transactionId: number; category: string }) =>
      transactionApi.categorize(transactionId, category).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.uncategorized })
      toast({ title: 'Category updated', variant: 'success' })
    },
    onError: (err: { response?: { data?: { detail?: string } } }) => {
      const msg =
      (err.response?.data?.detail as string) || 'Update failed'
      toast({ title: msg, variant: 'destructive' })
    },
  })
}
