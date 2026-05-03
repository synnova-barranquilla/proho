import { Bike, Car } from 'lucide-react'

import { cn } from '#/lib/utils'
import type { PlateType } from '../../../convex/lib/plate'

/** UI alias — selectable vehicle types match the plate-detection domain type. */
export type SelectableVehicleType = PlateType

interface VehicleTypeCardsProps {
  value: SelectableVehicleType
  onValueChange: (value: SelectableVehicleType) => void
  disabled?: boolean
  className?: string
}

const OPTIONS: Array<{
  value: SelectableVehicleType
  label: string
  Icon: typeof Car
}> = [
  { value: 'CAR', label: 'Carro', Icon: Car },
  { value: 'MOTORCYCLE', label: 'Moto', Icon: Bike },
]

export function VehicleTypeCards({
  value,
  onValueChange,
  disabled,
  className,
}: VehicleTypeCardsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Tipo de vehículo"
      className={cn('grid grid-cols-2 gap-3', className)}
    >
      {OPTIONS.map(({ value: optVal, label, Icon }) => {
        const selected = value === optVal
        return (
          <button
            key={optVal}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onValueChange(optVal)}
            className={cn(
              'flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-lg border-2 p-3 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              selected
                ? 'border-primary bg-primary/5 text-foreground'
                : 'border-input text-muted-foreground hover:border-muted-foreground hover:bg-muted/30',
            )}
          >
            <Icon
              className={cn(
                'h-6 w-6',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                selected ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </button>
        )
      })}
    </div>
  )
}
