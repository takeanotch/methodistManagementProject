
// 'use client'

// import { useState } from 'react'
// import { useRouter } from 'next/navigation'
// import ProfileImageUpload from './ProfileImageUpload'

// interface User {
//   id: number
//   nom_complet: string
//   numero: string
//   adresse: string | null
//   profile_img: string | null
//   role: {
//     nom: string
//   }
// }

// interface ProfileClientProps {
//   user: User
// }

// export default function ProfileClient({ user }: ProfileClientProps) {
//   const router = useRouter()
//   const [profileImage, setProfileImage] = useState<string | null>(user.profile_img)

//   const handleUploadSuccess = (imageUrl: string) => {
//     setProfileImage(imageUrl)
//     router.refresh()
//   }

//   return (
//     <div className="max-w-3xl mx-auto px-4 py-8">
//       <h1 className="text-2xl font-medium tracking-tight mb-8">Profil</h1>
      
//       <div className="space-y-8">
//         {/* Photo de profil */}
//         <section className="flex items-center gap-6">
//           <ProfileImageUpload 
//             currentImage={profileImage}
//             onUploadSuccess={handleUploadSuccess}
//           />
//           <div className="space-y-1">
//             <p className="font-medium">{user.nom_complet}</p>
//             <p className="text-sm text-neutral-500 capitalize">{user.role?.nom}</p>
//           </div>
//         </section>

//         {/* Informations personnelles */}
//         <section className="border-t border-neutral-200 pt-8">
//           <h2 className="text-sm font-medium text-neutral-500 mb-6">INFORMATIONS PERSONNELLES</h2>
          
//           <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <dt className="text-sm text-neutral-500 mb-1">Nom complet</dt>
//               <dd className="text-base">{user.nom_complet}</dd>
//             </div>

//             <div>
//               <dt className="text-sm text-neutral-500 mb-1">Numéro</dt>
//               <dd className="text-base">{user.numero}</dd>
//             </div>

//             <div className="md:col-span-2">
//               <dt className="text-sm text-neutral-500 mb-1">Adresse</dt>
//               <dd className="text-base">{user.adresse || 'Non renseignée'}</dd>
//             </div>
//           </dl>
//         </section>

//         {/* Badge de rôle discret */}
//         <div className="border-t border-neutral-200 pt-6">
//           <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-neutral-100">
//             <span className="text-xs text-neutral-600 capitalize">{user.role?.nom}</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// } 

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  User, 
  Phone, 
  MapPin, 
  Shield, 
  Calendar,
  Mail,
  Award
} from 'lucide-react'
import ProfileImageUpload from './ProfileImageUpload'

interface User {
  id: number
  nom_complet: string
  numero: string
  adresse: string | null
  profile_img: string | null
  created_at?: string
  email?: string | null
  role: {
    nom: string
  }
}

interface ProfileClientProps {
  user: User
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter()
  const [profileImage, setProfileImage] = useState<string | null>(user.profile_img)

  const handleUploadSuccess = (imageUrl: string) => {
    setProfileImage(imageUrl)
    router.refresh()
  }

  const getInitials = () => {
    return user.nom_complet
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = () => {
    const colors = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-green-500 to-green-600',
      'from-amber-500 to-amber-600',
      'from-rose-500 to-rose-600'
    ]
    return colors[user.id % colors.length]
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:py-12">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-900">
            Mon profil
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Gérez vos informations personnelles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche - Carte d'identité */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden sticky top-6">
              <div className="p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar */}
                  <div className="mb-4">
                    {profileImage ? (
                      <div className="w-full mx-auto ">
                         <ProfileImageUpload 
                      currentImage={profileImage}
                      onUploadSuccess={handleUploadSuccess}
                    />
                      </div>
                    ) : (
                      <div className={`w-24 h-24 rounded-full mx-auto bg-gradient-to-br ${getAvatarColor()} flex items-center justify-center`}>
                        <span className="text-3xl font-medium text-white">
                          {getInitials()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Nom et rôle */}
                  <h2 className="text-xl font-medium text-gray-900 mb-1">
                    {user.nom_complet}
                  </h2>
                  
                  <div className="mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                      {user.role?.nom}
                    </span>
                  </div>

                  {/* ID */}
                  <p className="text-xs text-gray-400 mb-4">
                    ID: {user.id}
                    {user.created_at && (
                      <> • Inscrit le {formatDate(user.created_at)}</>
                    )}
                  </p>

                  {/* Upload photo */}
                  <div className="w-full">
                  
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="border-t border-gray-200 px-6 py-4 space-y-3">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  Contact
                </h3>
                
                <div className="flex items-center gap-3 text-sm">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-600">{user.numero}</span>
                </div>
                
                {user.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail size={16} className="text-gray-400" />
                    <span className="text-gray-600">{user.email}</span>
                  </div>
                )}
                
                {user.adresse && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin size={16} className="text-gray-400 mt-0.5" />
                    <span className="text-gray-600">{user.adresse}</span>
                  </div>
                )}
              </div>

              {/* Statut */}
              <div className="border-t border-gray-200 px-6 py-4">
                <div className="flex items-center gap-2 text-sm">
                  <Shield size={16} className="text-gray-400" />
                  <span className="text-gray-500">Compte actif</span>
                  <span className="ml-auto w-2 h-2 bg-green-500 rounded-full"></span>
                </div>
              </div>
            </div>
          </div>

          {/* Colonne de droite - Détails */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations personnelles */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <User size={18} className="text-gray-400" />
                  <h3 className="font-medium text-gray-900">
                    Informations personnelles
                  </h3>
                </div>
              </div>
              
              <div className="p-6">
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Nom complet
                    </dt>
                    <dd className="text-base text-gray-900 font-medium">
                      {user.nom_complet}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Numéro de téléphone
                    </dt>
                    <dd className="text-base text-gray-900">
                      {user.numero}
                    </dd>
                  </div>

                  {user.email && (
                    <div>
                      <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                        Adresse email
                      </dt>
                      <dd className="text-base text-gray-900">
                        {user.email}
                      </dd>
                    </div>
                  )}

                  <div className="md:col-span-2">
                    <dt className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                      Adresse postale
                    </dt>
                    <dd className="text-base text-gray-900">
                      {user.adresse || (
                        <span className="text-gray-400 italic">Non renseignée</span>
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Informations système */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-gray-400" />
                  <h3 className="font-medium text-gray-900">
                    Informations système
                  </h3>
                </div>
              </div>
              
              <div className="px-6 py-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">ID utilisateur</span>
                  <span className="text-gray-900 font-mono">{user.id}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Rôle</span>
                  <span className="text-gray-900 capitalize flex items-center gap-2">
                    {user.role?.nom === 'admin' && (
                      <Award size={14} className="text-amber-500" />
                    )}
                    {user.role?.nom}
                  </span>
                </div>

                {user.created_at && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Date d'inscription</span>
                    <span className="text-gray-900 flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400" />
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Note de sécurité */}
            <div className="bg-blue-50/50 rounded-xl border border-blue-200 p-4">
              <p className="text-sm text-blue-700 flex items-start gap-2">
                <Shield size={16} className="mt-0.5 flex-shrink-0" />
                <span>
                  Ces informations sont privées et ne sont visibles que par vous 
                  et les administrateurs autorisés.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}