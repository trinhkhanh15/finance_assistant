import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { BudgetData } from '../api'

const BUDGET_DISPLAY = [
  { key: 'fad_budget', label: 'Food & Drink', color: 'bg-orange-500' },
  { key: 'shopping_budget', label: 'Shopping', color: 'bg-pink-500' },
  { key: 'investment_budget', label: 'Investment', color: 'bg-green-500' },
  { key: 'moving_budget', label: 'Transport', color: 'bg-blue-500' },
  { key: 'entertainment_budget', label: 'Entertainment', color: 'bg-purple-500' },
  { key: 'other_budget', label: 'Other', color: 'bg-gray-500' },
] as const

interface BudgetDisplayProps {
  data: BudgetData | undefined
  isLoading: boolean
}

export function BudgetDisplay({ data, isLoading }: BudgetDisplayProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <p className="text-muted-foreground">No budget set yet. Click "Set Budget" to create one.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {BUDGET_DISPLAY.map(({ key, label, color }) => (
        <Card key={key}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className={`w-3 h-3 rounded-full ${color}`} />
              {label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(data[key as keyof BudgetData] as number).toLocaleString('en-US')}₫
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
