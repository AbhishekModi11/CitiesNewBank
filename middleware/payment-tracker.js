export const groupPaymentsByStatus = (payments) =>
  payments.reduce((acc, payment) => {
    acc[payment.status] = [...(acc[payment.status] ?? []), payment]
    return acc
  }, {})

export const activePayments = (payments) => payments.filter((p) =>
  !['completed', 'failed', 'blocked', 'cancelled', 'declined'].includes(p.status),
)

export const completedPayments = (payments) => payments.filter((p) => p.status === 'completed')
