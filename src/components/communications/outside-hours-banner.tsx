import { Clock } from 'lucide-react'

interface OutsideHoursBannerProps {
  message: string
}

export function OutsideHoursBanner({ message }: OutsideHoursBannerProps) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <Clock className="mr-1.5 inline-block h-4 w-4" />
      {message}
    </div>
  )
}
