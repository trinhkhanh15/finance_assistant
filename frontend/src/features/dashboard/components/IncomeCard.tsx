import { TrendingUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface IncomeCardProps {
  income: number
  isLoading: boolean
}

export function IncomeCard({ income, isLoading }: IncomeCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="h-4 w-4 text-green-600" />
          Total Income
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-3xl font-bold text-green-600">
            {income.toLocaleString('en-US')}₫
          </div>
        )}
      </CardContent>
    </Card>
  )
}