/**
 * Canonical list of modules available in the Synnova platform.
 * Must stay in sync with `convex/organizations/validators.ts::moduleKeys`.
 */
export const MODULE_KEYS = [
  'parking',
  'convivencia',
  'reservas',
  'inspecciones',
  'dashboard',
] as const

export type ModuleKey = (typeof MODULE_KEYS)[number]

export const MODULE_LABELS: Record<ModuleKey, string> = {
  parking: 'Parqueaderos',
  convivencia: 'Convivencia',
  reservas: 'Reservas',
  inspecciones: 'Inspecciones',
  dashboard: 'Dashboard ejecutivo',
}

export const MODULE_DESCRIPTIONS: Record<ModuleKey, string> = {
  parking: 'Control de acceso vehicular en tablets con operación offline-first',
  convivencia: 'Reportes de convivencia e incidentes del conjunto',
  reservas: 'Reserva de zonas sociales y áreas comunes',
  inspecciones: 'Inspecciones diarias de apertura y cierre',
  dashboard: 'KPIs y métricas ejecutivas del conjunto',
}
