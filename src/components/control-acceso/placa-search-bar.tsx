import { useCallback, useEffect, useRef, useState } from 'react'

import { Loader2, X } from 'lucide-react'

import { Button } from '#/components/ui/button'
import { PlacaInput } from '#/components/ui/formatted-input'

interface PlacaSearchBarProps {
  onSubmit: (placa: string) => void
  isProcesando: boolean
}

export function PlacaSearchBar({
  onSubmit,
  isProcesando,
}: PlacaSearchBarProps) {
  const [placa, setPlaca] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = useCallback(() => {
    const trimmed = placa.trim()
    if (trimmed.length >= 4) {
      onSubmit(trimmed)
    }
  }, [placa, onSubmit])

  // Auto-submit when placa reaches 6 chars (valid Colombian format)
  useEffect(() => {
    if (placa.length >= 6) {
      handleSubmit()
    }
  }, [placa, handleSubmit])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleClear = () => {
    setPlaca('')
    inputRef.current?.focus()
  }

  // Auto-focus on mount and after processing
  useEffect(() => {
    if (!isProcesando) {
      inputRef.current?.focus()
    }
  }, [isProcesando])

  return (
    <div className="relative">
      <PlacaInput
        ref={inputRef}
        value={placa}
        onChange={setPlaca}
        onKeyDown={handleKeyDown}
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
    </div>
  )
}
