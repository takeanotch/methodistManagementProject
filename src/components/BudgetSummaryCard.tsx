// components/cards/BudgetSummaryCard.tsx
'use client'

interface BudgetSummaryCardProps {
  recettes: number
  depenses: number
  solde: number
  className?: string
}

export default function BudgetSummaryCard({ recettes, depenses, solde, className = '' }: BudgetSummaryCardProps) {
  const formatMontant = (value: number) => value.toLocaleString('fr-FR')

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Recettes</p>
            <p className="text-2xl font-bold text-green-600">{formatMontant(recettes)} FC</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-5 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6h18M9 12h6M5 18h14" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Dépenses</p>
            <p className="text-2xl font-bold text-red-600">{formatMontant(depenses)} FC</p>
          </div>
        </div>
      </div>

      <div className={`bg-white rounded-lg border p-5 hover:shadow-md transition-shadow ${solde >= 0 ? 'border-green-200' : 'border-red-200'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${solde >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
            <svg className={`w-6 h-6 ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500">Solde</p>
            <p className={`text-2xl font-bold ${solde >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatMontant(solde)} FC
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}