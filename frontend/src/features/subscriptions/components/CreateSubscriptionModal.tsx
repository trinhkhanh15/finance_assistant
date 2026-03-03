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
import { useCreateSubscription } from '../hooks/use-subscriptions'
import { BILLING_CYCLES, type BillingCycle } from '../constants/billing-cycles'

function formatDateInput(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface CreateSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSubscriptionModal({ open, onOpenChange }: CreateSubscriptionModalProps) {
  const [serviceName, setServiceName] = useState('')
  const [amount, setAmount] = useState('')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(BILLING_CYCLES[0])
  const [nextBillingDate, setNextBillingDate] = useState(formatDateInput(new Date()))
  const [isActive, setIsActive] = useState(true)
  const serviceId = useId()
  const amountId = useId()
  const cycleId = useId()
  const dateId = useId()
  const activeId = useId()

  const createSubscription = useCreateSubscription()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseFloat(amount.replace(/,/g, '.'))
    if (!serviceName.trim() || Number.isNaN(num) || num < 0) return
    createSubscription.mutate(
      {
        service_name: serviceName.trim(),
        amount: num,
        billing_cycle: billingCycle,
        next_billing_date: nextBillingDate,
        is_active: isActive,
      },
      {
        onSuccess: () => {
          setServiceName('')
          setAmount('')
          setBillingCycle(BILLING_CYCLES[0])
          setNextBillingDate(formatDateInput(new Date()))
          setIsActive(true)
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={serviceId}>Service name</Label>
            <Input
              id={serviceId}
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. Netflix, Spotify"
              disabled={createSubscription.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={amountId}>Amount</Label>
            <Input
              id={amountId}
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={createSubscription.isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={cycleId}>Billing cycle</Label>
            <select
              id={cycleId}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}
              disabled={createSubscription.isPending}
            >
              {BILLING_CYCLES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={dateId}>Next billing date</Label>
            <Input
              id={dateId}
              type="date"
              value={nextBillingDate}
              onChange={(e) => setNextBillingDate(e.target.value)}
              disabled={createSubscription.isPending}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id={activeId}
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              disabled={createSubscription.isPending}
              className="h-4 w-4 rounded border-input"
            />
            <Label htmlFor={activeId} className="font-normal cursor-pointer">
              Active
            </Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSubscription.isPending || !serviceName.trim() || !amount}
            >
              {createSubscription.isPending ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
