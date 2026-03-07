import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useBudget, useMonthlySpending } from '../hooks/use-budget'
import { BudgetDialog } from '../components/BudgetDialog'
import { BudgetProgress } from '../components/BudgetProgress'

export function BudgetPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { data: budgetData, isLoading: budgetLoading } = useBudget()
  const { data: spendingData, isLoading: spendingLoading } = useMonthlySpending()

  const isLoading = budgetLoading || spendingLoading

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Budget</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Set and manage your monthly budget for different categories.
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          <span className="ml-2">Set Budget</span>
        </Button>
      </div>

      <BudgetProgress
        budgetData={budgetData}
        spendingData={spendingData}
        isLoading={isLoading}
      />

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialData={budgetData}
      />
    </div>
  )
}
