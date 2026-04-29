'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { logout } from '@/actions/auth'
import { Menu, X, User, Building2, LogOut, Settings } from 'lucide-react'
import LanguageSelector from './LanguageSelector'
import { Suspense } from 'react'

function LanguageSelectorSkeleton() {
  return (
    <div className="w-[70px] h-8 bg-gray-200 rounded-md animate-pulse"></div>
  )
}

export default function MobileMenuClient({ 
  user, 
  mobileNavLinks, 
  currentConferenceYear, 
  paroisseNom 
}: { 
  user: any, 
  mobileNavLinks: React.ReactNode[], 
  currentConferenceYear: any, 
  paroisseNom: string | null 
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Bouton menu mobile */}
      <div className="flex items-center gap-2 sm:hidden">
        <Suspense fallback={<LanguageSelectorSkeleton />}>
          <LanguageSelector />
        </Suspense>
        
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          <Menu className="size-6 text-gray-600" />
        </button>
      </div>

      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40 sm:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Menu */}
      <div 
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 sm:hidden overflow-y-auto ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4">
          {/* Header du menu */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <X className="size-5 text-gray-600" />
            </button>
          </div>

          {/* Informations utilisateur dans le menu mobile */}
          {user && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                {user.profile_img ? (
                  <div className="relative w-10 h-10 rounded-full overflow-hidden">
                    <Image
                      src={user.profile_img}
                      alt={user.nom_complet}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-600">
                      {user.nom_complet?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900">{user.nom_complet}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
              </div>
              
              {user.role && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <User className="size-4" />
                  <span className="capitalize">{user.role.nom}</span>
                </div>
              )}
              
              {paroisseNom && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="size-4" />
                  <span>{paroisseNom}</span>
                </div>
              )}
            </div>
          )}

          {/* Année de conférence */}
          {currentConferenceYear && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">
                {currentConferenceYear.annee?.label}
              </p>
            </div>
          )}

          {/* Liens de navigation mobile */}
          <div className="space-y-1">
            {mobileNavLinks.map((link, index) => (
              <div key={index} onClick={() => setIsOpen(false)} className="w-full">
                {link}
              </div>
            ))}
          </div>

          {/* Séparateur */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* Liens supplémentaires */}
          <div className="space-y-1">
            <Link 
              href="/profile" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="size-5" />
              <span>Mon profil</span>
            </Link>
            
            <Link 
              href="/settings" 
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-3 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="size-5" />
              <span>Paramètres</span>
            </Link>

            <form action={logout}>
              <button 
                type="submit"
                className="flex items-center gap-3 w-full px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="size-5" />
                <span>Déconnexion</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}