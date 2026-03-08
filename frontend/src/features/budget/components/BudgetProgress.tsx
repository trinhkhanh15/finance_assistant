import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BudgetData } from '../api'

const BUDGET_CATEGORIES = [
  { key: 'fad_budget', label: 'Food & Drink', apiKey: 'food and drink', color: 'bg-orange-500' },
  { key: 'shopping_budget', label: 'Shopping', apiKey: 'shopping', color: 'bg-pink-500' },
  { key: 'investment_budget', label: 'Investment', apiKey: 'investment', color: 'bg-green-500' },
  { key: 'moving_budget', label: 'Transport', apiKey: 'moving', color: 'bg-blue-500' },
  { key: 'entertainment_budget', label: 'Entertainment', apiKey: 'entertainment', color: 'bg-purple-500' },
  { key: 'other_budget', label: 'Other', apiKey: 'other', color: 'bg-gray-500' },
] as const

interface BudgetProgressProps {
  budgetData: BudgetData | undefined
  spendingData: Record<string, number> | undefined
  isLoading: boolean
}

export function BudgetProgress({ budgetData, spendingData, isLoading }: BudgetProgressProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!budgetData) {
    return null
  }

  // Get spending for a specific category from the API response
  const getCategorySpending = (apiKey: string): number => {
    if (!spendingData) return 0
    return Number(spendingData[apiKey]) || 0
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {BUDGET_CATEGORIES.map(({ key, label, apiKey, color }) => {
        const budget = budgetData[key as keyof BudgetData] as number
        const spending = getCategorySpending(apiKey)
        const progress = budget > 0 ? Math.min(100, (spending / budget) * 100) : 0
        const isOverBudget = spending > budget

        return (
          <Card key={key}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                {label}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {budget === 0 ? (
                <p className="text-sm text-muted-foreground italic">Not set</p>
              ) : (
                <>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{spending.toLocaleString('en-US')}</span>
                      <span className={isOverBudget ? 'text-destructive font-medium' : 'text-foreground'}>
                        {budget.toLocaleString('en-US')}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isOverBudget ? 'bg-destructive' : color
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.toFixed(0)}%</span>
                    {isOverBudget && (
                      <span className="text-destructive font-medium">
                        +{(spending - budget).toLocaleString('en-US')} over
                      </span>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
