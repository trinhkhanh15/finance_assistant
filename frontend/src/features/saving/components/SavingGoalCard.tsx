import { useState, useId } from 'react'
import { Wallet, TrendingUp, TrendingDown, X, CircleCheckBig } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDeposit, useWithdraw, useDeleteGoal } from '../hooks/use-saving'
import { useToast } from '@/hooks/use-toast'
import type { Target } from '../api'
import { cn } from '@/lib/utils'

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

interface SavingGoalCardProps {
  goal: Target
}

export function SavingGoalCard({ goal }: SavingGoalCardProps) {
  const [depositOpen, setDepositOpen] = useState(false)
  const [withdrawOpen, setWithdrawOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const depositId = useId()
  const withdrawId = useId()

  const deposit = useDeposit()
  const withdraw = useWithdraw()
  const deleteGoal = useDeleteGoal()
  const { toast } = useToast()

  const progress = goal.target_amount > 0
    ? Math.min(100, (goal.current_amount / goal.target_amount) * 100)
    : 0
  const isCompleted = goal.status?.toLowerCase() === 'completed' || progress >= 100

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount.replace(/,/g, '.'))
    if (Number.isNaN(num) || num <= 0) return
    deposit.mutate(
      { goalId: goal.id, amount: num },
      { onSuccess: () => { setAmount(''); setDepositOpen(false) } }
    )
  }

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount.replace(/,/g, '.'))
    if (Number.isNaN(num) || num <= 0) {
      toast({ title: 'Enter a valid amount', variant: 'destructive' })
      return
    }
    if (num > goal.current_amount) {
      toast({
        title: 'Not enough amount',
        description: `Available: ${goal.current_amount.toLocaleString('en-US')}. You cannot withdraw more than the current amount.`,
        variant: 'destructive',
      })
      return
    }
    withdraw.mutate(
      { goalId: goal.id, amount: num },
      { onSuccess: () => { setAmount(''); setWithdrawOpen(false) } }
    )
  }

  const handleDelete = () => {
    if (confirm('Do you want to delete this goal?')) {
      deleteGoal.mutate(goal.id)
    }
  }

  return (
    <>
      <Card
        className={cn(
          'relative',
          isCompleted && 'border-green-500/50 bg-green-50/40 dark:bg-green-950/20'
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={handleDelete}
          disabled={deleteGoal.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'rounded-full p-2',
                  isCompleted ? 'bg-green-600/15' : 'bg-primary/10'
                )}
              >
                <Wallet className={cn('h-4 w-4', isCompleted ? 'text-green-700 dark:text-green-400' : 'text-primary')} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{goal.name}</h3>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-600/15 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                      <CircleCheckBig className="h-3.5 w-3.5" />
                      Completed
                    </span>
                  )}
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground">{goal.description}</p>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {goal.current_amount.toLocaleString('en-US')} / {goal.target_amount.toLocaleString('en-US')}
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300 rounded-full',
                isCompleted ? 'bg-green-600' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isCompleted && (
            <p className="text-xs font-medium text-green-700 dark:text-green-400">
              Congratulations! You completed this saving goal.
            </p>
          )}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setDepositOpen(true)}
              disabled={isCompleted}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {isCompleted ? 'Completed' : 'Deposit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1"
              onClick={() => setWithdrawOpen(true)}
              disabled={goal.current_amount <= 0}
            >
              <TrendingDown className="h-3.5 w-3.5" />
              Withdraw
            </Button>
          </div>
          {(goal.start_date || goal.end_date) && (
            <p className="text-xs text-muted-foreground">
              {goal.start_date && formatDate(goal.start_date)}
              {goal.start_date && goal.end_date && ' → '}
              {goal.end_date && formatDate(goal.end_date)}
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deposit — {goal.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeposit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={depositId}>Amount</Label>
              <Input
                id={depositId}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={deposit.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDepositOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={deposit.isPending || !amount}>
                {deposit.isPending ? 'Saving...' : 'Deposit'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw — {goal.name}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              Available: {goal.current_amount.toLocaleString('en-US')}
            </p>
          </DialogHeader>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={withdrawId}>Amount</Label>
              <Input
                id={withdrawId}
                type="text"
                inputMode="decimal"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={withdraw.isPending}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setWithdrawOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={withdraw.isPending || !amount}>
                {withdraw.isPending ? 'Processing...' : 'Withdraw'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
