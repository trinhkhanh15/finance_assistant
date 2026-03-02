import { useState, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useCategorizeTransaction } from '../hooks/use-transactions'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '../constants/categories'
import type { ViewTransaction } from '../api'


interface CategorizeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: ViewTransaction | null
}

export function CategorizeModal({ open, onOpenChange, transaction }: CategorizeModalProps) {
  const [category, setCategory] = useState<TransactionCategory>(TRANSACTION_CATEGORIES[0])
  const categoryId = useId()
  const categorize = useCategorizeTransaction()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!transaction || !category.trim()) return
    categorize.mutate(
      { transactionId: transaction.id, category: category.trim() },
      {
        onSuccess: () => onOpenChange(false),
      }
    )
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Categorize transaction</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {transaction.description} — {transaction.amount.toLocaleString('vi-VN')}₫
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={categoryId}>Category</Label>
            <select
              id={categoryId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              disabled={categorize.isPending}
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={categorize.isPending}>
              {categorize.isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
