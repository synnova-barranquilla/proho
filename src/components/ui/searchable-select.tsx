import { useEffect, useMemo, useRef, useState } from 'react'

import { ChevronDown, X } from 'lucide-react'

import { cn } from '#/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
  /** Optional secondary text shown to the right */
  detail?: string
  /** Additional strings to match against when filtering (matched with startsWith) */
  searchAliases?: string[]
}

interface SearchableSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SearchableSelectOption[]
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Sin resultados',
  disabled = false,
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!search.trim()) return options
    const q = search.toLowerCase()
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.detail?.toLowerCase().includes(q) ||
        o.searchAliases?.some((a) => a.startsWith(q)),
    )
  }, [search, options])

  const selectedOption = options.find((o) => o.value === value)

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    setOpen(false)
    setSearch('')
    setHighlightIndex(-1)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onValueChange('')
    setSearch('')
  }

  const handleTriggerClick = () => {
    if (disabled) return
    setOpen((prev) => !prev)
    setHighlightIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightIndex >= 0 && highlightIndex < filtered.length) {
        handleSelect(filtered[highlightIndex].value)
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  // Focus input when dropdown opens
  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
    }
  }, [open])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const el = listRef.current.children[highlightIndex] as
        | HTMLElement
        | undefined
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlightIndex])

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          !selectedOption && 'text-muted-foreground',
        )}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {value && !disabled && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              onKeyDown={() => {}}
              className="rounded-sm p-0.5 hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </button>

      {open && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="p-2">
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setHighlightIndex(-1)
              }}
              onKeyDown={handleKeyDown}
              placeholder={searchPlaceholder}
              className="h-8 w-full rounded-sm border border-input bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div ref={listRef} className="max-h-48 overflow-y-auto px-1 pb-1">
            {filtered.length === 0 ? (
              <p className="px-2 py-3 text-center text-sm text-muted-foreground">
                {emptyMessage}
              </p>
            ) : (
              filtered.map((option, i) => (
                <button
                  key={option.value}
                  type="button"
                  className={cn(
                    'flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors',
                    i === highlightIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'hover:bg-muted/50',
                    option.value === value && 'font-medium',
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setHighlightIndex(i)}
                >
                  <span className="truncate">{option.label}</span>
                  {option.detail && (
                    <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                      {option.detail}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
