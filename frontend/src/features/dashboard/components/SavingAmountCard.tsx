import { PiggyBank } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface SavingAmountCardProps {
  amount: number
  isLoading: boolean
}

export function SavingAmountCard({ amount, isLoading }: SavingAmountCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <PiggyBank className="h-4 w-4 text-blue-600" />
          Amount in Saving
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-32" />
        ) : (
          <div className="text-3xl font-bold text-blue-600">
            {amount.toLocaleString('en-US')}₫
          </div>
        )}
      </CardContent>
    </Card>
  )
}
