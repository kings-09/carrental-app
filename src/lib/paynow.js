import { Paynow } from 'paynow'

export function createPaynow() {
  const paynow = new Paynow(
    process.env.PAYNOW_INTEGRATION_ID,
    process.env.PAYNOW_INTEGRATION_KEY
  )

  paynow.resultUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/paynow/webhook`
  paynow.returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/success`

  return paynow
}