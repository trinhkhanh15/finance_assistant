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
import { useCreateGoal } from '../hooks/use-saving'

function formatDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CreateGoalModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateGoalModal({ open, onOpenChange }: CreateGoalModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(formatDateInput(new Date()))
  const [endDate, setEndDate] = useState('')
  const [currentAmount, setCurrentAmount] = useState('0')
  const [targetAmount, setTargetAmount] = useState('')
  const nameId = useId()
  const descId = useId()
  const startId = useId()
  const endId = useId()
  const currentId = useId()
  const targetId = useId()

  const createGoal = useCreateGoal()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const current = parseFloat(currentAmount.replace(/,/g, '.')) || 0
    const target = parseFloat(targetAmount.replace(/,/g, '.'))
    if (!name.trim() || Number.isNaN(target) || target <= 0) return
    createGoal.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        start_date: startDate,
        end_date: endDate || startDate,
        current_amount: current,
        target_amount: target,
      },
      {
        onSuccess: () => {
          setName('')
          setDescription('')
          setStartDate(formatDateInput(new Date()))
          setEndDate('')
          setCurrentAmount('0')
          setTargetAmount('')
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create saving goal</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Name</Label>
            <Input
              id={nameId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Goal name"
              disabled={createGoal.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={descId}>Description (optional)</Label>
            <Input
              id={descId}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
              disabled={createGoal.isPending}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={startId}>Start date</Label>
              <Input
                id={startId}
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={createGoal.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={endId}>End date</Label>
              <Input
                id={endId}
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={createGoal.isPending}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={currentId}>Current amount</Label>
              <Input
                id={currentId}
                type="text"
                inputMode="decimal"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                disabled={createGoal.isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={targetId}>Target amount</Label>
              <Input
                id={targetId}
                type="text"
                inputMode="decimal"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="0"
                disabled={createGoal.isPending}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createGoal.isPending || !name.trim() || !targetAmount}>
              {createGoal.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
