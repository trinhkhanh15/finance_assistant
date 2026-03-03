import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSavingGoals } from '../hooks/use-saving'
import { SavingGoalCard } from '../components/SavingGoalCard'
import { CreateGoalModal } from '../components/CreateGoalModal'

export function SavingPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const { data: goals = [], isLoading, isError, error } = useSavingGoals()

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Savings</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Saving goals with progress. Deposit or withdraw for each goal.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">New goal</span>
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
              {(error as { message?: string })?.message || 'Failed to load goals.'}
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && goals.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No saving goals yet</CardTitle>
            <CardDescription>
              Create a goal to start tracking. Set a target amount and add deposits over time.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setCreateOpen(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Create your first goal
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !isError && goals.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => (
            <SavingGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}

      <CreateGoalModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  )
}
