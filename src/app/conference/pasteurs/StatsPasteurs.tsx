// app/conference/pasteurs/StatsPasteurs.tsx
interface Props {
  pasteurs: any[]
}

export default function StatsPasteurs({ pasteurs }: Props) {
  const totalPasteurs = pasteurs.length
  const pasteursActifs = pasteurs.filter(p => p.est_actif).length
  const pasteursAffectes = pasteurs.filter(p => p.affectation_actuelle).length
  const pasteursNonAffectes = totalPasteurs - pasteursAffectes

  const stats = [
    {
      label: 'Total pasteurs',
      value: totalPasteurs,
      color: 'gray'
    },
    {
      label: 'Actifs',
      value: pasteursActifs,
      color: 'emerald'
    },
    {
      label: 'Affectés',
      value: pasteursAffectes,
      color: 'blue'
    },
    {
      label: 'Non affectés',
      value: pasteursNonAffectes,
      color: 'amber'
    }
  ]

  const getColorClasses = (color: string) => {
    const classes: Record<string, { bg: string, border: string, text: string }> = {
      gray: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900' },
      emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-900' },
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900' },
      amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-900' }
    }
    return classes[color] || classes.gray
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat) => {
        const colors = getColorClasses(stat.color)
        return (
          <div 
            key={stat.label} 
            className={`${colors.bg} p-4 border ${colors.border}`}
          >
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
              {stat.label}
            </p>
            <p className={`text-2xl font-light ${colors.text}`}>
              {stat.value}
            </p>
          </div>
        )
      })}
    </div>
  )
}