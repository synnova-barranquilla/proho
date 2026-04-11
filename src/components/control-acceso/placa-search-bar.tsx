import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Bike, Car, Loader2, X } from 'lucide-react'

import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { PlacaInput } from '#/components/ui/formatted-input'
import { formatPlaca } from '#/lib/formatters'
import type { Doc } from '../../../convex/_generated/dataModel'
import { normalizePlaca } from '../../../convex/lib/placa'

type VehiculoRow = Doc<'vehiculos'> & { unidad: Doc<'unidades'> | null }

interface PlacaSearchBarProps {
  onSubmit: (placa: string) => void
  isProcesando: boolean
  vehiculos: VehiculoRow[]
}

export function PlacaSearchBar({
  onSubmit,
  isProcesando,
  vehiculos,
}: PlacaSearchBarProps) {
  const [placa, setPlaca] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const justSubmittedRef = useRef(false)

  const placaNorm = useMemo(() => normalizePlaca(placa), [placa])

  const suggestions = useMemo(() => {
    if (!placaNorm || placaNorm.length < 2) return []
    return vehiculos
      .filter((v) => v.active && v.placa.includes(placaNorm))
      .slice(0, 8)
  }, [placaNorm, vehiculos])

  const handleSubmit = useCallback(() => {
    const trimmed = placa.trim()
    if (trimmed.length >= 4 && !justSubmittedRef.current) {
      justSubmittedRef.current = true
      setShowDropdown(false)
      setSelectedIndex(-1)
      onSubmit(trimmed)
    }
  }, [placa, onSubmit])

  // Auto-submit when placa reaches 6 chars (valid Colombian format)
  useEffect(() => {
    if (placa.length >= 6 && !justSubmittedRef.current) {
      handleSubmit()
    }
  }, [placa, handleSubmit])

  const handleChange = (value: string) => {
    justSubmittedRef.current = false
    setPlaca(value)
    setShowDropdown(true)
    setSelectedIndex(-1)
  }

  const handleSelect = (vehiculo: VehiculoRow) => {
    justSubmittedRef.current = true
    setPlaca(vehiculo.placa)
    setShowDropdown(false)
    setSelectedIndex(-1)
    onSubmit(vehiculo.placa)
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
    setPlaca('')
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
    if (!isProcesando) {
      justSubmittedRef.current = false
      setPlaca('')
      inputRef.current?.focus()
    }
  }, [isProcesando])

  const hasSuggestions = showDropdown && suggestions.length > 0

  return (
    <div className="relative">
      <PlacaInput
        ref={inputRef}
        value={placa}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => placaNorm.length >= 2 && setShowDropdown(true)}
        placeholder="Ingrese placa..."
        disabled={isProcesando}
        className="h-14 text-center font-mono text-2xl tracking-wider"
        autoFocus
      />
      <div className="absolute right-2 top-1/2 flex -translate-y-1/2 gap-1">
        {isProcesando ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : placa ? (
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
          className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg"
        >
          {suggestions.map((veh, i) => {
            const Icon = veh.tipo === 'MOTO' ? Bike : Car
            const unidad = veh.unidad
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
                  {formatPlaca(veh.placa)}
                </span>
                <Badge variant="outline" className="text-xs">
                  {veh.tipo === 'MOTO'
                    ? 'Moto'
                    : veh.tipo === 'OTRO'
                      ? 'Otro'
                      : 'Carro'}
                </Badge>
                {unidad && (
                  <span className="ml-auto text-sm text-muted-foreground">
                    T{unidad.torre} — {unidad.numero}
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
