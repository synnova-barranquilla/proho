import { Button, Hr, Text } from '@react-email/components'

import { EmailLayout } from './layout'

interface NovedadItem {
  hora: string
  descripcion: string
}

interface DailySummaryEmailProps {
  nombreConjunto: string
  fecha: string
  vehiculosDentro: number
  ingresosAyer: number
  salidasAyer: number
  novedadesAyer: number
  rechazosAyer: number
  novedades: NovedadItem[]
  historicoUrl: string
}

export function DailySummaryEmail({
  nombreConjunto = 'Torres del Parque',
  fecha = '10 de abril de 2026',
  vehiculosDentro = 12,
  ingresosAyer = 47,
  salidasAyer = 43,
  novedadesAyer = 3,
  rechazosAyer = 1,
  novedades = [
    { hora: '08:15', descripcion: 'Ingreso en mora (ABC-123, T1-301)' },
    { hora: '14:30', descripcion: 'Vehículo duplicado (DEF-456, T2-102)' },
    { hora: '19:45', descripcion: 'Novedad manual: "Barrera dañada"' },
  ],
  historicoUrl = 'https://app.synnova.com.co/admin/c/ejemplo/control-acceso',
}: DailySummaryEmailProps) {
  return (
    <EmailLayout preview={`Resumen de ayer — ${nombreConjunto}`}>
      <Text style={heading}>Resumen del día anterior</Text>
      <Text style={subheading}>
        {nombreConjunto} — {fecha}
      </Text>

      <table style={statsTable}>
        <tbody>
          <StatRow label="Vehículos dentro al cierre" value={vehiculosDentro} />
          <StatRow label="Ingresos" value={ingresosAyer} />
          <StatRow label="Salidas" value={salidasAyer} />
          <StatRow
            label="Novedades"
            value={novedadesAyer}
            highlight={novedadesAyer > 0}
          />
          <StatRow
            label="Rechazos"
            value={rechazosAyer}
            highlight={rechazosAyer > 0}
          />
        </tbody>
      </table>

      {novedades.length > 0 && (
        <>
          <Hr style={hr} />
          <Text style={sectionTitle}>Novedades del día</Text>
          {novedades.map((n, i) => (
            <Text key={i} style={novedadRow}>
              <span style={novedadHora}>{n.hora}</span> — {n.descripcion}
            </Text>
          ))}
        </>
      )}

      <Button style={button} href={historicoUrl}>
        Ver histórico completo
      </Button>
    </EmailLayout>
  )
}

export default DailySummaryEmail

function StatRow({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: number
  highlight?: boolean
}) {
  return (
    <tr>
      <td style={statLabel}>{label}</td>
      <td style={{ ...statValue, ...(highlight ? { color: '#e25c3d' } : {}) }}>
        {value}
      </td>
    </tr>
  )
}

const heading = {
  fontSize: '20px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  padding: '0 24px',
  margin: '0 0 4px',
}

const subheading = {
  fontSize: '14px',
  color: '#8898aa',
  padding: '0 24px',
  margin: '0 0 20px',
}

const statsTable = {
  width: '100%',
  padding: '0 24px',
  borderCollapse: 'collapse' as const,
}

const statLabel = {
  fontSize: '14px',
  color: '#525f7f',
  padding: '6px 0',
}

const statValue = {
  fontSize: '14px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  textAlign: 'right' as const,
  padding: '6px 0',
  fontVariantNumeric: 'tabular-nums' as const,
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '16px 0',
}

const sectionTitle = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  padding: '0 24px',
  margin: '0 0 8px',
}

const novedadRow = {
  fontSize: '13px',
  lineHeight: '20px',
  color: '#525f7f',
  padding: '0 24px',
  margin: '0 0 4px',
}

const novedadHora = {
  fontWeight: '600' as const,
  color: '#1a1a1a',
  fontVariantNumeric: 'tabular-nums' as const,
}

const button = {
  backgroundColor: '#18181b',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600' as const,
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 24px',
  margin: '24px',
}
