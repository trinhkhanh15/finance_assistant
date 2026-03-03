import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSubscriptions } from '../hooks/use-subscriptions'
import { SubscriptionCard } from '../components/SubscriptionCard'
import { CreateSubscriptionModal } from '../components/CreateSubscriptionModal'

export function SubscriptionsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: subscriptions = [], isLoading, isError, error } = useSubscriptions()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Subscriptions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recurring services and next billing dates.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">New subscription</span>
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      )}

      {isError && (
        <Card className="border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-destructive">
              {(error as { message?: string })?.message || 'Failed to load subscriptions.'}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && subscriptions.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No subscriptions yet</CardTitle>
            <CardDescription>
              Add subscriptions to track recurring payments like streaming, software, or memberships.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && subscriptions.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subscriptions.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      )}

      <CreateSubscriptionModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
