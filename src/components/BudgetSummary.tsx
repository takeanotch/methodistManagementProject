// // components/BudgetSummary.tsx
// 'use client'

// interface BudgetSummaryProps {
//   budget: {
//     recettes: number
//     depenses: number
//     solde: number
//     details?: {
//       recettesList: Array<{ id: number; libelle: string; montant: number }>
//       depensesList: Array<{ id: number; libelle: string; montant: number }>
//     }
//   }
// }

// export default function BudgetSummary({ budget }: BudgetSummaryProps) {
//   const formatBudget = (montant: number) => {
//     return new Intl.NumberFormat('fr-FR').format(montant) + ' FC'
//   }

//   const getSoldeColor = (solde: number) => {
//     if (solde > 0) return 'text-green-600'
//     if (solde < 0) return 'text-red-600'
//     return 'text-gray-600'
//   }

//   return (
//     <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
//       <div className="grid grid-cols-3 divide-x divide-gray-200">
//         <div className="p-4 text-center">
//           <div className="text-sm text-gray-500 mb-1">Recettes</div>
//           <div className="text-xl font-bold text-green-600">
//             {formatBudget(budget.recettes)}
//           </div>
//         </div>
//         <div className="p-4 text-center">
//           <div className="text-sm text-gray-500 mb-1">Dépenses</div>
//           <div className="text-xl font-bold text-red-600">
//             {formatBudget(budget.depenses)}
//           </div>
//         </div>
//         <div className="p-4 text-center">
//           <div className="text-sm text-gray-500 mb-1">Solde</div>
//           <div className={`text-xl font-bold ${getSoldeColor(budget.solde)}`}>
//             {formatBudget(budget.solde)}
//           </div>
//         </div>
//       </div>

//       {budget.details && (budget.details.recettesList.length > 0 || budget.details.depensesList.length > 0) && (
//         <div className="border-t border-gray-200 p-4">
//           <div className="grid grid-cols-2 gap-4">
//             {/* Recettes */}
//             {budget.details.recettesList.length > 0 && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-700 mb-2">Détail des recettes</h4>
//                 <div className="space-y-1">
//                   {budget.details.recettesList.map((recette) => (
//                     <div key={recette.id} className="flex justify-between text-sm">
//                       <span className="text-gray-600">{recette.libelle}</span>
//                       <span className="text-green-600 font-medium">
//                         {formatBudget(recette.montant)}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Dépenses */}
//             {budget.details.depensesList.length > 0 && (
//               <div>
//                 <h4 className="text-sm font-medium text-gray-700 mb-2">Détail des dépenses</h4>
//                 <div className="space-y-1">
//                   {budget.details.depensesList.map((depense) => (
//                     <div key={depense.id} className="flex justify-between text-sm">
//                       <span className="text-gray-600">{depense.libelle}</span>
//                       <span className="text-red-600 font-medium">
//                         {formatBudget(depense.montant)}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }

// components/BudgetSummary.tsx
'use client'

interface BudgetSummaryProps {
  budget: {
    recettes: number
    depenses: number
    solde: number
    details?: {
      recettesList: Array<{ id: number; libelle: string; montant: number }>
      depensesList: Array<{ id: number; libelle: string; montant: number }>
    }
  }
}

export default function BudgetSummary({ budget }: BudgetSummaryProps) {
  const formatBudget = (montant: number) => {
    return new Intl.NumberFormat('fr-FR').format(montant) + ' FC'
  }

  const getSoldeColor = (solde: number) => {
    if (solde > 0) return 'text-green-600'
    if (solde < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="grid grid-cols-3 divide-x divide-gray-200">
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Recettes</div>
          <div className="text-xl font-bold text-green-600">
            {formatBudget(budget.recettes)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Dépenses</div>
          <div className="text-xl font-bold text-red-600">
            {formatBudget(budget.depenses)}
          </div>
        </div>
        <div className="p-4 text-center">
          <div className="text-sm text-gray-500 mb-1">Solde</div>
          <div className={`text-xl font-bold ${getSoldeColor(budget.solde)}`}>
            {formatBudget(budget.solde)}
          </div>
        </div>
      </div>

      {budget.details && (budget.details.recettesList.length > 0 || budget.details.depensesList.length > 0) && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Recettes */}
            {budget.details.recettesList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détail des recettes</h4>
                <div className="space-y-1">
                  {budget.details.recettesList.map((recette) => (
                    <div key={recette.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{recette.libelle}</span>
                      <span className="text-green-600 font-medium">
                        {formatBudget(recette.montant)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dépenses */}
            {budget.details.depensesList.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Détail des dépenses</h4>
                <div className="space-y-1">
                  {budget.details.depensesList.map((depense) => (
                    <div key={depense.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">{depense.libelle}</span>
                      <span className="text-red-600 font-medium">
                        {formatBudget(depense.montant)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}