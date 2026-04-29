import type { SearchableSelectOption } from '#/components/ui/searchable-select'

/**
 * Builds abbreviation aliases for a unit so users can search with
 * condensed strings like "t1302", "1302", "ta101", "a101".
 *
 * Examples:
 *   ("A", "101")     → ["a101", "ta101", "101"]
 *   ("1", "302")     → ["1302", "t1302", "302"]
 *   ("Norte", "205") → ["norte205", "tnorte205", "205"]
 */
function buildUnidadAliases(tower: string, number: string): string[] {
  const t = tower.toLowerCase().replace(/\s+/g, '')
  const n = number.toLowerCase().replace(/\s+/g, '')
  return [`${t}${n}`, `t${t}${n}`, n]
}

/**
 * Maps an array of units to SearchableSelectOption[] with search aliases.
 * Centralizes the label format ("Torre X — Y") and alias generation.
 */
export function buildUnidadOptions(
  unidades: Array<{ _id: string; tower: string; number: string }>,
): SearchableSelectOption[] {
  return unidades.map((u) => ({
    value: u._id,
    label: `Torre ${u.tower} — ${u.number}`,
    searchAliases: buildUnidadAliases(u.tower, u.number),
  }))
}
