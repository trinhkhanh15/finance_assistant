import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from './ChartSkeleton'
import { toBehaviorData } from '../api'
import type { BehaviorResponse } from '../api'

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
}
const CHART_HEIGHT = 420
const labelStyle = { color: 'hsl(var(--foreground))' }

function formatAmount(value: number) {
  return `${Number(value).toLocaleString('vi-VN')}₫`
}

/** Format YYYY-MM-DD -> dd/MM for axis */
function formatDateLabel(dateStr: string): string {
  const d = dateStr.split('-')
  if (d.length !== 3) return dateStr
  return `${d[2]}/${d[1]}`
}

interface BehaviorChartCardProps {
  data: BehaviorResponse | undefined
  isLoading: boolean
  cycle: 'weekly' | 'monthly'
}

export function BehaviorChartCard({ data, isLoading, cycle }: BehaviorChartCardProps) {
  const chartData = toBehaviorData(data)
  const isMonthly = cycle === 'monthly'

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Spending trend ({isMonthly ? 'Monthly' : 'Weekly'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <ChartSkeleton />}
        {!isLoading && chartData.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm" style={{ height: CHART_HEIGHT }}>
            No data yet
          </div>
        )}
        {!isLoading && chartData.length > 0 && (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            {isMonthly ? (
              <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatDateLabel}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
                />
                <Tooltip
                  formatter={(value: number) => [formatAmount(value), 'Chi tiêu']}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  labelFormatter={(label) => label}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            ) : (
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={formatDateLabel}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${v / 1000}K` : String(v))}
                />
                <Tooltip
                  formatter={(value: number) => [formatAmount(value), 'Chi tiêu']}
                  contentStyle={tooltipStyle}
                  labelStyle={labelStyle}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
