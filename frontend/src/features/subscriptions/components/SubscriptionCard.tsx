import { CreditCard, X } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useDeleteSubscription } from '../hooks/use-subscriptions'
import type { ShowSubscription } from '../api'

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

interface SubscriptionCardProps {
  subscription: ShowSubscription
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
  const deleteSubscription = useDeleteSubscription()

  const handleDelete = () => {
    if (confirm('Do you want to delete this subscription?')) {
      deleteSubscription.mutate(subscription.id)
    }
  }

  return (
    <Card className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6"
        onClick={handleDelete}
        disabled={deleteSubscription.isPending}
      >
        <X className="h-4 w-4" />
      </Button>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-primary/10 p-2">
            <CreditCard className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{subscription.service_name}</h3>
            <p className="text-xs text-muted-foreground">
              {subscription.billing_cycle.charAt(0).toUpperCase() + subscription.billing_cycle.slice(1)} •{' '}
              {subscription.is_active ? (
                <span className="text-green-600 dark:text-green-400">Active</span>
              ) : (
                <span className="text-muted-foreground">Inactive</span>
              )}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Amount</span>
          <span className="font-medium">{subscription.amount.toLocaleString('en-US')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Next billing</span>
          <span>{formatDate(subscription.next_billing_date)}</span>
        </div>
      </CardContent>
    </Card>
  )
}
