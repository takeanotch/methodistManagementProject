
// lib/currency.ts
export type Currency = 'USD' | 'CDF' | 'EUR'

export const CURRENCIES = {
  USD: { symbol: '$', label: 'Dollar US', code: 'USD' },
  CDF: { symbol: 'FC', label: 'Franc Congolais', code: 'CDF' },
  EUR: { symbol: '€', label: 'Euro', code: 'EUR' }
} as const

export const EXCHANGE_RATES = {
  USD: 1,
  CDF: 2800,  // Taux de change pour CDF
  EUR: 0.92
}

export function convertToUSD(montant: number, currency: Currency): number {
  if (currency === 'USD') return montant
  if (currency === 'CDF') return montant / EXCHANGE_RATES.CDF
  if (currency === 'EUR') return montant / EXCHANGE_RATES.EUR
  return montant // fallback
}

export function formatCurrency(montant: number, currency: Currency): string {
  // Vérification de sécurité
  if (!CURRENCIES[currency]) {
    console.error(`Devise non supportée: ${currency}`)
    return `${montant.toLocaleString('fr-FR')} ${currency}`
  }
  
  const { symbol } = CURRENCIES[currency]
  const formattedAmount = montant.toLocaleString('fr-FR', {
    minimumFractionDigits: currency === 'CDF' ? 0 : 2,
    maximumFractionDigits: currency === 'CDF' ? 0 : 2
  })
  return `${formattedAmount} ${symbol}`
}