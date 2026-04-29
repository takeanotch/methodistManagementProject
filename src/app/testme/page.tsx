export const dynamic = 'force-dynamic';
// Exemple 1 : Autoriser seulement les admins
import { Authorize } from '@/components/auth'

export default function AdminPage() {
  return (
    <Authorize 
      condition={{ roles: ['admin'] }}
      showUnauthorized
    >
      <div>Contenu réservé aux administrateurs</div>
    </Authorize>
  )
}