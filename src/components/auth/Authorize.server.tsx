// components/auth/Authorize.server.tsx
import { ReactNode } from 'react'
import { getUserRole, getUserNiveau } from '@/actions/auth'
import AuthorizeClient from './Authorize.client'

export type RoleCondition = {
  // Conditions par nom de rôle
  roles?: string[]
  // Conditions par ID de rôle
  roleIds?: number[]
  // Conditions par niveau hiérarchique
  niveaux?: ('region' | 'conference' | 'district' | 'paroisse')[]
  // Niveau minimum requis
  minNiveau?: 'region' | 'conference' | 'district' | 'paroisse'
  // Mode : 'all' = doit avoir tous les rôles, 'any' = doit avoir au moins un rôle
  mode?: 'all' | 'any'
}

interface AuthorizeProps {
  children: ReactNode
  // Conditions d'autorisation
  condition: RoleCondition
  // Contenu à afficher si non autorisé (optionnel)
  fallback?: ReactNode
  // Rediriger vers une page si non autorisé (optionnel)
  redirectTo?: string
  // Afficher une page "Non autorisé" stylisée
  showUnauthorized?: boolean
  // Classe CSS pour le wrapper
  className?: string
}

export default async function Authorize({
  children,
  condition,
  fallback = null,
  redirectTo,
  showUnauthorized = false,
  className = ''
}: AuthorizeProps) {
  // Récupérer les informations de l'utilisateur
  const userRole = await getUserRole()
  const userNiveau = await getUserNiveau()

  // Si pas d'utilisateur connecté
  if (!userRole) {
    if (redirectTo) {
      return <AuthorizeClient redirectTo={redirectTo} />
    }
    return showUnauthorized ? (
      <AuthorizeClient 
        showUnauthorized={true} 
        message="Vous devez être connecté pour accéder à cette page."
      />
    ) : fallback
  }

  // Vérifier les conditions
  let isAuthorized = false

  // 1. Vérification par noms de rôles
  if (condition.roles && condition.roles.length > 0) {
    const hasRole = condition.roles.includes(userRole.nom)
    isAuthorized = condition.mode === 'all' 
      ? condition.roles.every(role => role === userRole.nom)
      : hasRole
  }

  // 2. Vérification par IDs de rôles
  if (condition.roleIds && condition.roleIds.length > 0) {
    const hasRoleId = condition.roleIds.includes(userRole.id)
    const roleIdMatch = condition.mode === 'all'
      ? condition.roleIds.every(id => id === userRole.id)
      : hasRoleId
    isAuthorized = isAuthorized || roleIdMatch
  }

  // 3. Vérification par niveaux
  if (condition.niveaux && condition.niveaux.length > 0 && userNiveau) {
    const hasNiveau = condition.niveaux.includes(userNiveau)
    isAuthorized = isAuthorized || hasNiveau
  }

  // 4. Vérification du niveau minimum
  if (condition.minNiveau && userNiveau) {
    const niveaux = ['paroisse', 'district', 'conference', 'region']
    const userNiveauIndex = niveaux.indexOf(userNiveau)
    const minNiveauIndex = niveaux.indexOf(condition.minNiveau)
    const hasMinNiveau = userNiveauIndex >= minNiveauIndex
    isAuthorized = isAuthorized || hasMinNiveau
  }

  // Si aucune condition n'est spécifiée, autoriser par défaut
  if (!condition.roles && !condition.roleIds && !condition.niveaux && !condition.minNiveau) {
    isAuthorized = true
  }

  // Gérer le cas non autorisé
  if (!isAuthorized) {
    if (redirectTo) {
      return <AuthorizeClient redirectTo={redirectTo} />
    }
    
    if (showUnauthorized) {
      return (
        <AuthorizeClient 
          showUnauthorized={true}
          userRole={userRole.nom}
          requiredRoles={condition.roles}
          requiredNiveaux={condition.niveaux}
          minNiveau={condition.minNiveau}
        />
      )
    }
    
    return <>{fallback}</>
  }

  // Autorisé : afficher le contenu
  return <div className={className}>{children}</div>
}