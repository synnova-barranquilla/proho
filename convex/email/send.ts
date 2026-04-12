const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'Synnova <avisos@synnova.com.co>'

interface SendEmailArgs {
  to: string | string[]
  subject: string
  html: string
}

interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(args: SendEmailArgs): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY not configured')
    return { success: false, error: 'RESEND_API_KEY not configured' }
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: Array.isArray(args.to) ? args.to : [args.to],
        subject: args.subject,
        html: args.html,
      }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error(`Resend API error: ${response.status} ${errorBody}`)
      return { success: false, error: `Resend API ${response.status}` }
    }

    const data = (await response.json()) as { id: string }
    return { success: true, id: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`sendEmail failed: ${message}`)
    return { success: false, error: message }
  }
}
