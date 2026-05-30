const BASE = '/api/v1/payments'

export async function createRazorpayOrder(getToken: () => Promise<string | null>) {
  const token = await getToken()
  const res = await fetch(`${BASE}/create-order/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to create order')
  return res.json()
}

export async function verifyRazorpayPayment(
  data: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  getToken: () => Promise<string | null>
) {
  const token = await getToken()
  const res = await fetch(`${BASE}/verify-payment/`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Payment verification failed')
  return res.json()
}
