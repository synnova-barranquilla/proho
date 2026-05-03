import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Bike, Car, Loader2, X } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { PlacaInput } from '#/components/ui/formatted-input'
import { formatPlaca } from '#/lib/formatters'
import type { Doc } from '../../../convex/_generated/dataModel'
import {
  isValidPlate,
  normalizePlate,
  PLATE_FORMAT_HINT,
  PLATE_LENGTH,
} from '../../../convex/lib/plate'

type VehicleRow = Doc<'vehicles'> & { unit: Doc<'units'> | null }

interface PlateSearchBarProps {
  onSubmit: (plate: string) => void
  isProcessing: boolean
  vehicles: VehicleRow[]
}

export function PlateSearchBar({
  onSubmit,
  isProcessing,
  vehicles,
}: PlateSearchBarProps) {
  const [plate, setPlate] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const justSubmittedRef = useRef(false)

  const plateNorm = useMemo(() => normalizePlate(plate), [plate])

  const suggestions = useMemo(() => {
    if (!plateNorm || plateNorm.length < 2) return []
    return vehicles
      .filter((v) => v.active && v.plate.includes(plateNorm))
      .slice(0, 8)
  }, [plateNorm, vehicles])

  const handleSubmit = useCallback(() => {
    const trimmed = plate.trim()
    if (isValidPlate(normalizePlate(trimmed)) && !justSubmittedRef.current) {
      justSubmittedRef.current = true
      setShowDropdown(false)
      setSelectedIndex(-1)
      onSubmit(trimmed)
    }
  }, [plate, onSubmit])

  // Auto-submit when plate reaches a valid Colombian format (6 chars)
  useEffect(() => {
    if (isValidPlate(plateNorm) && !justSubmittedRef.current) {
      handleSubmit()
    }
  }, [plateNorm, handleSubmit])

  const handleChange = (value: string) => {
    justSubmittedRef.current = false
    setPlate(value)
    setShowDropdown(true)
    setSelectedIndex(-1)
  }

  const handleSelect = (vehicle: VehicleRow) => {
    justSubmittedRef.current = true
    setPlate(vehicle.plate)
    setShowDropdown(false)
    setSelectedIndex(-1)
    onSubmit(vehicle.plate)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex])
      } else {
        handleSubmit()
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Escape') {
      setShowDropdown(false)
      setSelectedIndex(-1)
    }
  }

  const handleClear = () => {
    justSubmittedRef.current = false
    setPlate('')
    setShowDropdown(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus and reset after processing completes
  useEffect(() => {
    if (!isProcessing) {
      justSubmittedRef.current = false
      setPlate('')
      inputRef.current?.focus()
    }
  }, [isProcessing])

  const hasSuggestions = showDropdown && suggestions.length > 0
  const showFormatError =
    plateNorm.length === PLATE_LENGTH && !isValidPlate(plateNorm)

  return (
    <div className="relative">
      <PlacaInput
        ref={inputRef}
        value={plate}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => plateNorm.length >= 2 && setShowDropdown(true)}
        placeholder="Ingrese placa..."
        disabled={isProcessing}
        className="h-14 text-center font-mono text-2xl tracking-wider"
        autoFocus
      />
      {showFormatError && (
        <p className="mt-1.5 text-center text-sm text-destructive">
          {PLATE_FORMAT_HINT}
        </p>
      )}
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : plate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {hasSuggestions && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full z-50 mb-1 w-full rounded-md border bg-popover shadow-lg"
        >
          {suggestions.map((veh, i) => {
            const Icon = veh.type === 'MOTORCYCLE' ? Bike : Car
            const unit = veh.unit
            return (
              <button
                key={veh._id}
                type="button"
                className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors ${
                  i === selectedIndex
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-muted/50'
                } ${i < suggestions.length - 1 ? 'border-b' : ''}`}
                onClick={() => handleSelect(veh)}
                onMouseEnter={() => setSelectedIndex(i)}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="font-mono text-base font-medium">
                  {formatPlaca(veh.plate)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {veh.type === 'MOTORCYCLE'
                    ? 'Moto'
                    : veh.type === 'OTHER'
                      ? 'Otro'
                      : 'Carro'}
                </Badge>
                {unit && (
                  <span className="ml-auto text-sm text-muted-foreground">
                    T{unit.tower} — {unit.number}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
