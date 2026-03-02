import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartSkeleton } from './ChartSkeleton'
import { toPieData } from '../api'
import type { PieChartResponse } from '../api'

const CHART_HEIGHT = 420

const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#a4de6c',
]

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: 'var(--radius)',
  padding: '8px 12px',
}

interface PieChartCardProps {
  data: PieChartResponse | undefined
  isLoading: boolean
  cycle: 'weekly' | 'monthly'
}

export function PieChartCard({ data, isLoading, cycle }: PieChartCardProps) {
  const pieData = toPieData(data)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">
          Spending by category ({cycle === 'monthly' ? 'Monthly' : 'Weekly'})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <ChartSkeleton />}
        {!isLoading && pieData.length === 0 && (
          <div className="flex items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm" style={{ height: CHART_HEIGHT }}>
            No data yet
          </div>
        )}
        {!isLoading && pieData.length > 0 && (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={90}
                outerRadius={150}
                paddingAngle={2}
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const item = payload[0]
                  const name = item.name
                  const value = Number(item.value)
                  return (
                    <div style={tooltipStyle}>
                      <div className="font-medium text-foreground">{name}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">
                        Amount: <span className="text-foreground font-medium">{value.toLocaleString('en-US')}</span>
                      </div>
                    </div>
                  )
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
