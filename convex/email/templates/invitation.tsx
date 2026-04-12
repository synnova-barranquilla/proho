import { Button, Text } from '@react-email/components'

import { EmailLayout } from './layout'

interface InvitationEmailProps {
  nombreInvitado: string
  nombreConjunto: string
  rolInvitado: string
  loginUrl: string
}

export function InvitationEmail({
  nombreInvitado = 'Usuario',
  nombreConjunto = 'Torres del Parque',
  rolInvitado = 'Vigilante',
  loginUrl = 'https://app.synnova.com.co/login',
}: InvitationEmailProps) {
  return (
    <EmailLayout preview={`Has sido invitado a ${nombreConjunto}`}>
      <Text style={heading}>Hola {nombreInvitado},</Text>
      <Text style={paragraph}>
        Has sido invitado al conjunto <strong>{nombreConjunto}</strong> como{' '}
        <strong>{rolInvitado}</strong> en la plataforma Synnova.
      </Text>
      <Text style={paragraph}>
        Para acceder, haz clic en el siguiente botón e inicia sesión con tu
        cuenta.
      </Text>
      <Button style={button} href={loginUrl}>
        Ingresar a Synnova
      </Button>
      <Text style={note}>
        Si no esperabas esta invitación, puedes ignorar este correo.
      </Text>
    </EmailLayout>
  )
}

export default InvitationEmail

const heading = {
  fontSize: '20px',
  fontWeight: '600' as const,
  color: '#1a1a1a',
  padding: '0 24px',
  margin: '0 0 16px',
}

const paragraph = {
  fontSize: '14px',
  lineHeight: '24px',
  color: '#525f7f',
  padding: '0 24px',
  margin: '0 0 12px',
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

const note = {
  fontSize: '12px',
  lineHeight: '18px',
  color: '#8898aa',
  padding: '0 24px',
  margin: '16px 0 0',
}
