'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser, getUserNiveau } from './auth'
import { getFullHierarchyFromParoisse } from './structures'

// Types
export interface Hebdo {
  id: number
  paroisse_id: number
  numero: string
  date_emission: string
  theme: string | null
  predicateur: string | null
  officiants: string | null
  activites_speciales: string | null
  created_at: string
  updated_at: string
  sections?: HebdoSection[]
  paroisse?: {
    id: number
    nom: string
  }
}

export interface HebdoSection {
  id: number
  hebdo_id: number
  titre: string
  description: string | null
  ordre: number
  created_at: string
}

// Récupérer la paroisse de l'utilisateur connecté
export async function getUserParoisse() {
  try {
    const user = await getUser()
    if (!user?.fidele_id) return null

    const { data: fidele, error } = await supabase
      .from('fidele')
      .select(`
        id,
        paroisse:paroisse_id (
          id,
          nom
        )
      `)
      .eq('id', user.fidele_id)
      .single()

    if (error || !fidele?.paroisse) return null

    const paroisse = Array.isArray(fidele.paroisse) ? fidele.paroisse[0] : fidele.paroisse
    return paroisse
  } catch (error) {
    console.error('Erreur getUserParoisse:', error)
    return null
  }
}

// Récupérer la hiérarchie complète pour l'en-tête
export async function getHierarchyForHeader(paroisseId: number) {
  return await getFullHierarchyFromParoisse(paroisseId)
}

// Générer le prochain numéro d'hebdo
export async function generateNextHebdoNumber(paroisseId: number): Promise<string> {
  try {
    // Compter le nombre d'hebdos existants pour cette paroisse
    const { count, error } = await supabase
      .from('hebdo')
      .select('*', { count: 'exact', head: true })
      .eq('paroisse_id', paroisseId)

    if (error) throw error

    const nextNumber = (count || 0) + 1
    return `N° ${nextNumber.toString().padStart(3, '0')}`
  } catch (error) {
    console.error('Erreur generateNextHebdoNumber:', error)
    const year = new Date().getFullYear()
    const random = Math.floor(Math.random() * 999) + 1
    return `N° ${random.toString().padStart(3, '0')}/${year}`
  }
}

// Récupérer tous les hebdos d'une paroisse
export async function getHebdosByParoisse(paroisseId: number): Promise<Hebdo[]> {
  try {
    const { data, error } = await supabase
      .from('hebdo')
      .select(`
        *,
        paroisse:paroisse_id (id, nom)
      `)
      .eq('paroisse_id', paroisseId)
      .order('date_emission', { ascending: false })

    if (error) throw error

    return (data || []).map(hebdo => ({
      ...hebdo,
      paroisse: Array.isArray(hebdo.paroisse) ? hebdo.paroisse[0] : hebdo.paroisse
    }))
  } catch (error) {
    console.error('Erreur getHebdosByParoisse:', error)
    return []
  }
}

// Récupérer un hebdo par ID avec ses sections
export async function getHebdoById(id: number): Promise<Hebdo | null> {
  try {
    // Récupérer l'hebdo
    const { data: hebdo, error: hebdoError } = await supabase
      .from('hebdo')
      .select(`
        *,
        paroisse:paroisse_id (id, nom)
      `)
      .eq('id', id)
      .single()

    if (hebdoError || !hebdo) return null

    // Récupérer les sections
    const { data: sections, error: sectionsError } = await supabase
      .from('hebdo_section')
      .select('*')
      .eq('hebdo_id', id)
      .order('ordre', { ascending: true })

    if (sectionsError) throw sectionsError

    return {
      ...hebdo,
      paroisse: Array.isArray(hebdo.paroisse) ? hebdo.paroisse[0] : hebdo.paroisse,
      sections: sections || []
    }
  } catch (error) {
    console.error('Erreur getHebdoById:', error)
    return null
  }
}

// Créer un nouvel hebdo
export async function createHebdo(formData: FormData) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    // Récupérer la paroisse de l'utilisateur
    const paroisse = await getUserParoisse()
    if (!paroisse) {
      return { error: 'Paroisse non trouvée' }
    }

    const numero = formData.get('numero') as string
    const date_emission = formData.get('date_emission') as string
    const theme = formData.get('theme') as string || null
    const predicateur = formData.get('predicateur') as string || null
    const officiants = formData.get('officiants') as string || null
    const activites_speciales = formData.get('activites_speciales') as string || null

    if (!numero || !date_emission) {
      return { error: 'Le numéro et la date sont requis' }
    }

    // Créer l'hebdo
    const { data: newHebdo, error } = await supabase
      .from('hebdo')
      .insert([{
        paroisse_id: paroisse.id,
        numero: numero.trim(),
        date_emission,
        theme: theme?.trim() || null,
        predicateur: predicateur?.trim() || null,
        officiants: officiants?.trim() || null,
        activites_speciales: activites_speciales?.trim() || null
      }])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ce numéro existe déjà pour cette paroisse' }
      }
      console.error('Erreur createHebdo:', error)
      return { error: 'Erreur lors de la création' }
    }

    // Ajouter les sections additionnelles
    const sectionsData = formData.get('sections') as string
    if (sectionsData) {
      try {
        const sections = JSON.parse(sectionsData)
        if (Array.isArray(sections) && sections.length > 0) {
          const sectionsToInsert = sections.map((section: any, index: number) => ({
            hebdo_id: newHebdo.id,
            titre: section.titre,
            description: section.description || null,
            ordre: index
          }))

          await supabase.from('hebdo_section').insert(sectionsToInsert)
        }
      } catch (e) {
        console.error('Erreur parsing sections:', e)
      }
    }

    revalidatePath('/hebdo')
    return { success: true, hebdo: newHebdo, id: newHebdo.id }
  } catch (error) {
    console.error('Erreur inattendue createHebdo:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour un hebdo
export async function updateHebdo(formData: FormData) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const numero = formData.get('numero') as string
    const date_emission = formData.get('date_emission') as string
    const theme = formData.get('theme') as string || null
    const predicateur = formData.get('predicateur') as string || null
    const officiants = formData.get('officiants') as string || null
    const activites_speciales = formData.get('activites_speciales') as string || null

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    // Vérifier que l'hebdo appartient à la paroisse de l'utilisateur
    const paroisse = await getUserParoisse()
    if (!paroisse) {
      return { error: 'Paroisse non trouvée' }
    }

    const { data: existingHebdo } = await supabase
      .from('hebdo')
      .select('paroisse_id')
      .eq('id', id)
      .single()

    if (!existingHebdo || existingHebdo.paroisse_id !== paroisse.id) {
      return { error: 'Vous ne pouvez pas modifier cet hebdo' }
    }

    // Mettre à jour l'hebdo
    const { error } = await supabase
      .from('hebdo')
      .update({
        numero: numero.trim(),
        date_emission,
        theme: theme?.trim() || null,
        predicateur: predicateur?.trim() || null,
        officiants: officiants?.trim() || null,
        activites_speciales: activites_speciales?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      if (error.code === '23505') {
        return { error: 'Ce numéro existe déjà pour cette paroisse' }
      }
      console.error('Erreur updateHebdo:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    // Mettre à jour les sections (supprimer et recréer)
    await supabase.from('hebdo_section').delete().eq('hebdo_id', id)

    const sectionsData = formData.get('sections') as string
    if (sectionsData) {
      try {
        const sections = JSON.parse(sectionsData)
        if (Array.isArray(sections) && sections.length > 0) {
          const sectionsToInsert = sections.map((section: any, index: number) => ({
            hebdo_id: id,
            titre: section.titre,
            description: section.description || null,
            ordre: index
          }))

          await supabase.from('hebdo_section').insert(sectionsToInsert)
        }
      } catch (e) {
        console.error('Erreur parsing sections:', e)
      }
    }

    revalidatePath('/hebdo')
    revalidatePath(`/hebdo/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updateHebdo:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer un hebdo
export async function deleteHebdo(id: number) {
  try {
    const user = await getUser()
    if (!user?.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const paroisse = await getUserParoisse()
    if (!paroisse) {
      return { error: 'Paroisse non trouvée' }
    }

    const { data: existingHebdo } = await supabase
      .from('hebdo')
      .select('paroisse_id')
      .eq('id', id)
      .single()

    if (!existingHebdo || existingHebdo.paroisse_id !== paroisse.id) {
      return { error: 'Vous ne pouvez pas supprimer cet hebdo' }
    }

    const { error } = await supabase
      .from('hebdo')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deleteHebdo:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/hebdo')
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deleteHebdo:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Récupérer les activités de la paroisse (pour suggestion)
export async function getActivitesForHebdo(paroisseId: number) {
  try {
    // Récupérer les activités des 30 derniers jours et à venir
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)
    
    const { data, error } = await supabase
      .from('activite')
      .select(`
        id,
        titre,
        date,
        heure,
        description,
        unite_id,
        unite:unite_id (nom)
      `)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('date', { ascending: true })

    if (error) throw error

    // Filtrer pour ne garder que les activités de la paroisse
    // (nécessite de vérifier l'appartenance via l'unité)
    const activites = []
    for (const activite of data || []) {
      const unite = Array.isArray(activite.unite) ? activite.unite[0] : activite.unite
      if (unite) {
        // Vérifier si l'unité appartient à la paroisse
        const { data: uniteData } = await supabase
          .from('unite_organisation')
          .select('id_niveau')
          .eq('id', activite.unite_id)
          .single()
        
        if (uniteData?.id_niveau === paroisseId) {
          activites.push({
            ...activite,
            unite
          })
        }
      }
    }

    return activites
  } catch (error) {
    console.error('Erreur getActivitesForHebdo:', error)
    return []
  }
}