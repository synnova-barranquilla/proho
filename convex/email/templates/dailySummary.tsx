import { Button, Text } from '@react-email/components'

import { EmailLayout } from './layout'

interface DailySummaryEmailProps {
  nombreConjunto: string
  fecha: string
  vehiculosDentro: number
  ingresosAyer: number
  salidasAyer: number
  rechazosAyer: number
  historicoUrl: string
}

export function DailySummaryEmail({
  nombreConjunto = 'Torres del Parque',
  fecha = '10 de abril de 2026',
  vehiculosDentro = 12,
  ingresosAyer = 47,
  salidasAyer = 43,
  rechazosAyer = 1,
  historicoUrl = 'https://app.synnova.com.co/c/ejemplo/control-acceso',
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
            label="Rechazos"
            value={rechazosAyer}
            highlight={rechazosAyer > 0}
          />
        </tbody>
      </table>

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
