// components/skeletons/DepartmentGestionSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-5 h-5 bg-gray-200 animate-pulse" />
          <div className="flex-1">
            <div className="flex items-center gap-3 mt-1">
              <div className="h-8 w-48 bg-gray-200 animate-pulse" />
              <div className="h-8 w-8 bg-gray-200 animate-pulse" />
            </div>
            <div className="h-4 w-24 bg-gray-200 animate-pulse mt-0.5" />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-10">
          <div className="h-3 w-20 bg-gray-200 animate-pulse" />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-6 mb-6 border-b border-gray-200">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="px-1 py-3">
            <div className="h-4 w-16 bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Filtres années */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-8 w-20 bg-gray-200 animate-pulse border border-gray-200" />
        ))}
      </div>

      {/* Stats principales - 6 colonnes */}
      <div className="grid grid-cols-6 gap-3 mb-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white border border-gray-200 p-3">
            <div className="h-7 w-12 bg-gray-200 animate-pulse mb-1" />
            <div className="h-3 w-20 bg-gray-200 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Stats secondaires - 5 colonnes */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white border border-gray-200 p-3">
            <div className="flex items-center justify-between">
              <div className="h-5 w-8 bg-gray-200 animate-pulse" />
              <div className="w-3.5 h-3.5 bg-gray-200 animate-pulse" />
            </div>
            <div className="h-3 w-24 bg-gray-200 animate-pulse mt-1" />
          </div>
        ))}
      </div>

      {/* Budget - Recettes et Dépenses */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-200 animate-pulse" />
                <div className="h-4 w-28 bg-gray-200 animate-pulse" />
              </div>
              <div className="h-3 w-16 bg-gray-200 animate-pulse" />
            </div>
            
            <div className="w-full h-2 bg-gray-100 mb-3">
              <div className="h-full w-1/3 bg-gray-200 animate-pulse" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              {[1, 2, 3].map((j) => (
                <div key={j}>
                  <div className="h-6 w-16 mx-auto bg-gray-200 animate-pulse mb-0.5" />
                  <div className="h-3 w-12 mx-auto bg-gray-200 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Section Projets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-16 bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 animate-pulse" />
        </div>
        <div className="border border-gray-200 bg-white p-8">
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 bg-gray-200 animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Activités récentes et à venir */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {[1, 2].map((i) => (
          <div key={i}>
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-32 bg-gray-200 animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 animate-pulse" />
            </div>
            <div className="border border-gray-200 bg-white">
              {[1, 2, 3].map((j) => (
                <div key={j} className="p-4 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="h-4 w-40 bg-gray-200 animate-pulse mb-1" />
                      <div className="h-3 w-28 bg-gray-200 animate-pulse" />
                    </div>
                    <div className="h-5 w-16 bg-gray-200 animate-pulse ml-2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Plans d'action récents */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 w-40 bg-gray-200 animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 animate-pulse" />
        </div>
        <div className="border border-gray-200 bg-white">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-b border-gray-100 last:border-b-0">
              <div className="h-4 w-48 bg-gray-200 animate-pulse mb-1" />
              <div className="h-3 w-64 bg-gray-200 animate-pulse mb-2" />
              <div className="h-3 w-32 bg-gray-200 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}