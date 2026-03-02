import { Skeleton } from '@/components/ui/skeleton'

const CHART_HEIGHT = 420

export function ChartSkeleton() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="w-full rounded-lg" style={{ height: CHART_HEIGHT }} />
      <div className="flex justify-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  )
}
