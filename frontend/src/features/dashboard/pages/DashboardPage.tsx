import { useState } from 'react'
import { BarChart3, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePieChart, useBehaviorChart, useSavingAmount } from '../hooks/use-dashboard-charts'
import { PieChartCard } from '../components/PieChartCard'
import { BehaviorChartCard } from '../components/BehaviorChartCard'
import { IncomeCard } from '../components/IncomeCard'
import { SavingAmountCard } from '../components/SavingAmountCard'
import { getIncomeFromPie } from '../api'
import type { ChartCycle } from '../api'

export function DashboardPage() {
  const [cycle, setCycle] = useState<ChartCycle>('monthly')

  const { data: pieData, isLoading: pieLoading } = usePieChart(cycle)
  const { data: behaviorData, isLoading: behaviorLoading } = useBehaviorChart(cycle)
  const { data: savingData, isLoading: savingLoading } = useSavingAmount()

  const income = getIncomeFromPie(pieData)
  const savingAmount = savingData?.amount || 0

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Spending breakdown and trends over time.
          </p>
        </div>
        <div className="flex rounded-lg border border-border p-1 bg-muted/30">
          <Button
            variant={cycle === 'weekly' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCycle('weekly')}
            className="gap-1.5"
          >
            <BarChart3 className="h-4 w-4" />
            Theo tuần
          </Button>
          <Button
            variant={cycle === 'monthly' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCycle('monthly')}
            className="gap-1.5"
          >
            <Calendar className="h-4 w-4" />
            Theo tháng
          </Button>
        </div>
      </div>

      <IncomeCard income={income} isLoading={pieLoading} />

      <SavingAmountCard amount={savingAmount} isLoading={savingLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        <PieChartCard
          data={pieData}
          isLoading={pieLoading}
          cycle={cycle}
        />
        <BehaviorChartCard
          data={behaviorData}
          isLoading={behaviorLoading}
          cycle={cycle}
        />
      </div>

      {!pieLoading && !behaviorLoading && (!pieData?.length) && (!behaviorData?.length) && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No data yet?</CardTitle>
            <CardDescription>
              Add transactions manually or import CSV from the Transactions page to see charts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The spending breakdown chart shows categories. The trend chart shows weekly or monthly chart.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
