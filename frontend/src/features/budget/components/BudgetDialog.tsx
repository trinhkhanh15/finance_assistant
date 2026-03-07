import { useState, useEffect, useId } from 'react'
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
import { useSetBudget } from '../hooks/use-budget'
import type { BudgetData } from '../api'

interface BudgetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: BudgetData
}

const BUDGET_FIELDS = [
  { key: 'fad_budget', label: 'Food & Drink' },
  { key: 'shopping_budget', label: 'Shopping' },
  { key: 'investment_budget', label: 'Investment' },
  { key: 'moving_budget', label: 'Transport' },
  { key: 'entertainment_budget', label: 'Entertainment' },
  { key: 'other_budget', label: 'Other' },
] as const

export function BudgetDialog({ open, onOpenChange, initialData }: BudgetDialogProps) {
  const [budgets, setBudgets] = useState({
    fad_budget: 0,
    shopping_budget: 0,
    investment_budget: 0,
    moving_budget: 0,
    entertainment_budget: 0,
    other_budget: 0,
  })

  const setBudget = useSetBudget()
  const ids = {
    fad: useId(),
    shopping: useId(),
    investment: useId(),
    moving: useId(),
    entertainment: useId(),
    other: useId(),
  }

  useEffect(() => {
    if (initialData) {
      setBudgets(initialData)
    }
  }, [initialData])

  const handleChange = (key: keyof typeof budgets, value: string) => {
    setBudgets((prev) => ({
      ...prev,
      [key]: parseInt(value) || 0,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setBudget.mutate(budgets, {
      onSuccess: () => {
        onOpenChange(false)
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Monthly Budget</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUDGET_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={ids[key as keyof typeof ids]}>{label}</Label>
                <Input
                  id={ids[key as keyof typeof ids]}
                  type="number"
                  //placeholder="0"
                  value={budgets[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={setBudget.isPending}
                  min="0"
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={setBudget.isPending}>
              {setBudget.isPending ? 'Saving...' : 'Save Budget'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
