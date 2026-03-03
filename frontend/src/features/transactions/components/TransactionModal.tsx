import { useState, useId } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateTransaction } from '../hooks/use-transactions'
import { TRANSACTION_CATEGORIES, type TransactionCategory } from '../constants/categories'


interface TransactionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function TransactionModal({ open, onOpenChange }: TransactionModalProps) {
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(formatDateInput(new Date()))
  const [category, setCategory] = useState<TransactionCategory>(TRANSACTION_CATEGORIES[0])
  const amountId = useId()
  const descId = useId()
  const dateId = useId()
  const categoryId = useId()

  const createTransaction = useCreateTransaction()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount.replace(/,/g, '.'))
    if (Number.isNaN(num) || !description.trim() || !date || !category.trim()) return
    createTransaction.mutate(
      { amount: num, description: description.trim(), date, category: category.trim() },
      {
        onSuccess: () => {
          setAmount('')
          setDescription('')
          setDate(formatDateInput(new Date()))
          setCategory(TRANSACTION_CATEGORIES[0])
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={true}>
        <DialogHeader>
          <DialogTitle>Add transaction</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={amountId}>Số tiền</Label>
            <Input
              id={amountId}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={createTransaction.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={descId}>Description</Label>
            <Input
              id={descId}
              type="text"
              placeholder="Mô tả giao dịch"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={createTransaction.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={dateId}>Date</Label>
            <Input
              id={dateId}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={createTransaction.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={categoryId}>Category</Label>
            <select
              id={categoryId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={category}
              onChange={(e) => setCategory(e.target.value as TransactionCategory)}
              disabled={createTransaction.isPending}
            >
              {TRANSACTION_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={createTransaction.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTransaction.isPending || !amount || !description.trim()}>
              {createTransaction.isPending ? 'Đang lưu...' : 'Thêm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
