import * as React from 'react'

import { Input } from '#/components/ui/input'
import {
  formatDocument,
  formatPhone,
  formatPlaca,
  parseDocument,
  parsePhone,
  parsePlaca,
} from '#/lib/formatters'

/**
 * Wrappers around <Input> that auto-format Colombian domain fields as the
 * user types, while keeping `value` / `onChange` in **canonical (unformatted)**
 * form. Parents can store the raw value directly and submit it without
 * extra stripping.
 *
 *   - PhoneInput:    canonical `3001234567` → display `300 123 4567`
 *   - DocumentInput: canonical `1234567`    → display `1.234.567`
 *   - PlacaInput:    canonical `ABC123`     → display `ABC-123`
 */

type BaseProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type'
> & {
  value: string
  onChange: (value: string) => void
}

export function PhoneInput({ value, onChange, ...rest }: BaseProps) {
  return (
    <Input
      {...rest}
      inputMode="numeric"
      autoComplete="tel-national"
      value={formatPhone(value)}
      onChange={(e) => onChange(parsePhone(e.target.value))}
      placeholder={rest.placeholder ?? '300 123 4567'}
    />
  )
}

export function DocumentInput({ value, onChange, ...rest }: BaseProps) {
  return (
    <Input
      {...rest}
      inputMode="numeric"
      value={formatDocument(value)}
      onChange={(e) => onChange(parseDocument(e.target.value))}
      placeholder={rest.placeholder ?? '1.234.567'}
    />
  )
}

export function PlacaInput({ value, onChange, ...rest }: BaseProps) {
  return (
    <Input
      {...rest}
      autoCapitalize="characters"
      value={formatPlaca(value)}
      onChange={(e) => onChange(parsePlaca(e.target.value))}
      placeholder={rest.placeholder ?? 'ABC-123'}
      className={rest.className}
    />
  )
}
