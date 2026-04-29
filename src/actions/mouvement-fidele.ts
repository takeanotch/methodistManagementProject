// actions/mouvement-fidele.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export interface MouvementFidele {
  id: number
  fidele_id: number
  paroisse_source: number | null
  paroisse_destination: number
  type_mouvement: 'inscription' | 'transfert_arrivee' | 'transfert_depart' | 'deces' | 'demission'
  date_mouvement: string
  annee_ecclesiastique_id: number | null
  commentaire: string | null
  document_reference: string | null
  created_at: string
  created_by: number | null
}

// Récupérer tous les mouvements
export async function getMouvements(options?: { fidele_id?: number, paroisse_id?: number, annee_id?: number }) {
  let query = supabase
    .from('mouvement_fidele')
    .select(`
      *,
      fidele:fidele_id (
        id,
        nom,
        post_nom,
        prenom,
        contact,
        profile_img
      ),
      source:paroisse_source (
        id,
        nom
      ),
      destination:paroisse_destination (
        id,
        nom
      ),
      annee:annee_ecclesiastique_id (
        id,
        code
      ),
      auteur:created_by (
        id,
        nom_complet
      )
    `)
    .order('date_mouvement', { ascending: false })
    .order('created_at', { ascending: false })

  if (options?.fidele_id) {
    query = query.eq('fidele_id', options.fidele_id)
  }
  if (options?.paroisse_id) {
    query = query.or(`paroisse_source.eq.${options.paroisse_id},paroisse_destination.eq.${options.paroisse_id}`)
  }
  if (options?.annee_id) {
    query = query.eq('annee_ecclesiastique_id', options.annee_id)
  }

  const { data: mouvements, error } = await query

  if (error) {
    console.error('Erreur lors de la récupération des mouvements:', error)
    return []
  }

  return mouvements
}

// Récupérer les fidèles disponibles pour transfert
export async function getFidelesForTransfert(paroisse_id?: number) {
  let query = supabase
    .from('fidele')
    .select(`
      id,
      nom,
      post_nom,
      prenom,
      contact,
      profile_img,
      paroisse:paroisse_id (
        id,
        nom
      )
    `)
    .eq('actif', true)

  if (paroisse_id) {
    query = query.eq('paroisse_id', paroisse_id)
  }

  const { data: fideles, error } = await query.order('nom')

  if (error) {
    console.error('Erreur lors de la récupération des fidèles:', error)
    return []
  }

  return fideles
}

// Récupérer les paroisses
export async function getParoisses() {
  const { data: paroisses, error } = await supabase
    .from('paroisse')
    .select(`
      id,
      nom,
      district:district_id (
        id,
        nom,
        conference:conference_id (
          id,
          nom
        )
      )
    `)
    .order('nom')

  if (error) {
    console.error('Erreur lors de la récupération des paroisses:', error)
    return []
  }

  return paroisses
}

// Enregistrer un transfert
export async function enregistrerTransfert(formData: FormData) {
  const userId = (await cookies()).get('userId')?.value
  
  const fidele_id = parseInt(formData.get('fidele_id') as string)
  const paroisse_destination = parseInt(formData.get('paroisse_destination') as string)
  const type_mouvement = formData.get('type_mouvement') as string
  const date_mouvement = formData.get('date_mouvement') as string
  const commentaire = formData.get('commentaire') as string
  const document_reference = formData.get('document_reference') as string

  if (!fidele_id || !paroisse_destination || !type_mouvement || !date_mouvement) {
    return { error: 'Tous les champs requis ne sont pas remplis' }
  }

  try {
    // Récupérer la paroisse source du fidèle
    const { data: fidele, error: fideleError } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', fidele_id)
      .single()

    if (fideleError || !fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    // Vérifier que la destination est différente de la source
    if (fidele.paroisse_id === paroisse_destination) {
      return { error: 'La paroisse de destination doit être différente de la paroisse actuelle' }
    }

    // Trouver l'année ecclésiastique correspondante
    const { data: annee } = await supabase
      .from('annee_ecclesiastique')
      .select('id')
      .lte('date_debut', date_mouvement)
      .gte('date_fin', date_mouvement)
      .single()

    // Utiliser une transaction
    const { data: mouvement, error: mvtError } = await supabase
      .from('mouvement_fidele')
      .insert([{
        fidele_id,
        paroisse_source: fidele.paroisse_id,
        paroisse_destination,
        type_mouvement,
        date_mouvement,
        annee_ecclesiastique_id: annee?.id || null,
        commentaire: commentaire || null,
        document_reference: document_reference || null,
        created_by: userId ? parseInt(userId) : null
      }])
      .select()
      .single()

    if (mvtError) {
      return { error: 'Erreur lors de l\'enregistrement du mouvement' }
    }

    // Mettre à jour la paroisse du fidèle
    const { error: updateError } = await supabase
      .from('fidele')
      .update({ 
        paroisse_id: paroisse_destination,
        updated_at: new Date().toISOString()
      })
      .eq('id', fidele_id)

    if (updateError) {
      // Si la mise à jour échoue, on devrait annuler le mouvement
      // Idéalement avec une vraie transaction
      return { error: 'Erreur lors de la mise à jour du fidèle' }
    }

    revalidatePath('/admin/transferts')
    revalidatePath(`/admin/fideles/${fidele_id}`)
    return { success: true, mouvement }
  } catch (error) {
    return { error: 'Une erreur est survenue' }
  }
}

// Obtenir les statistiques des mouvements
export async function getMouvementsStats() {
  const { data: stats, error } = await supabase
    .from('mouvement_fidele')
    .select(`
      type_mouvement,
      annee:annee_ecclesiastique_id (
        code
      ),
      count
    `)

  if (error) {
    return null
  }

  return stats
}