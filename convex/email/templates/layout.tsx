import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Text,
} from '@react-email/components'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Text style={logo}>Synnova</Text>
          <Hr style={hr} />
          {children}
          <Hr style={hr} />
          <Text style={footer}>
            Synnova — Gestión de conjuntos residenciales
          </Text>
          <Text style={disclaimer}>
            Este correo es informativo. No se procesan respuestas enviadas a
            esta dirección.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '560px',
}

const logo = {
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#1a1a1a',
  padding: '0 24px',
  margin: '0 0 12px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 24px',
  margin: '0',
}

const disclaimer = {
  color: '#b4bcc8',
  fontSize: '11px',
  lineHeight: '14px',
  padding: '0 24px',
  margin: '8px 0 0',
  fontStyle: 'italic' as const,
}
