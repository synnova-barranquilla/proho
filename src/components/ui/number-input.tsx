import { NumberField } from '@base-ui/react/number-field'

import { cn } from '#/lib/utils'

interface NumberInputProps {
  /**
   * The controlled number value. Use `null` to represent "no value" (the
   * input is visibly empty). When the user clears the field, Base UI
   * reports `null` via `onChange` — callers that want a `0` fallback
   * should coerce in their handler (e.g. `onChange={(v) => setX(v ?? 0)}`).
   */
  value: number | null
  onChange: (value: number | null) => void
  /**
   * Clamp the accepted range. Values outside the range are clamped on
   * blur; during typing, Base UI allows out-of-range input so the user
   * can freely edit, and clamps back inside the range when focus leaves.
   */
  min?: number
  max?: number
  /**
   * Step used by keyboard arrows and the (optional) increment/decrement
   * controls. Defaults to `1`.
   */
  step?: number
  /**
   * `Intl.NumberFormatOptions` for visible formatting (thousands
   * separators, currency, etc.). Omit for plain integer display. Base UI
   * uses the same options internally so the caret position is preserved
   * across reformats when editing in the middle of the value.
   */
  format?: Intl.NumberFormatOptions
  placeholder?: string
  className?: string
  disabled?: boolean
  id?: string
  name?: string
}

/**
 * Typed numeric input built on `@base-ui/react/number-field`.
 *
 * Properties inherited from Base UI:
 * - Only digits are accepted at the keyboard (letters and symbols are
 *   blocked automatically).
 * - The caret stays in the correct position when editing in the middle of
 *   the value, even when the formatted length changes.
 * - The user can freely clear the field to retype — the empty state is
 *   represented as `value === null`, which the caller controls.
 *
 * Visual style mirrors the `<Input>` component in `components/ui/input.tsx`
 * so both can be used interchangeably inside `<Field>` groups.
 */
export function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  format,
  placeholder,
  className,
  disabled,
  id,
  name,
}: NumberInputProps) {
  return (
    <NumberField.Root
      value={value}
      onValueChange={(next) => onChange(next)}
      min={min}
      max={max}
      step={step}
      format={format}
      disabled={disabled}
      id={id}
      name={name}
    >
      <NumberField.Input
        placeholder={placeholder}
        className={cn(
          // Same style as `<Input>` — keep the two visually interchangeable.
          'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none',
          'placeholder:text-muted-foreground',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          'md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40',
          className,
        )}
      />
    </NumberField.Root>
  )
}
