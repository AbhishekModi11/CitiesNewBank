export const formatRupees = (value) =>
  `₹${Number(value ?? 0).toLocaleString('en-IN')}`

export const formatMoney = formatRupees
