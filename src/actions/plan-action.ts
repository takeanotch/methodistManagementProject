
// actions/plan-action.ts (version corrigée)
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference } from './annee-conference'

export interface PlanAction {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  unite?: {
    id: number
    nom: string
    niveau: string
    reference_id?: number
  }
  annee_conference?: {
    id: number
    annee_id: number
    annee?: {
      id: number
      label: string
    }
  }
  activites_count: number
  budget_total: number
}

// Récupérer les plans d'action pour l'utilisateur connecté (basé sur son unité)
export async function getMyPlansAction(): Promise<PlanAction[]> {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return []
    }

    // Récupérer la paroisse du fidèle
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele?.paroisse_id) {
      return []
    }

    // Récupérer l'année en cours pour la conférence de cette paroisse
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', fidele.paroisse_id)
      .single()

    let conferenceId = null
    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
      if (district?.conference) {
        const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        conferenceId = conference?.id
      }
    }

    const currentAnnee = conferenceId ? await getCurrentAnneeConference(conferenceId) : null
    
    // Récupérer les plans d'action pour la paroisse
    return getPlansActionByUnite(fidele.paroisse_id, currentAnnee?.id)
  } catch (error) {
    console.error('Erreur getMyPlansAction:', error)
    return []
  }
}

// Récupérer les plans d'action pour une conférence (toutes les unités en dessous)
export async function getPlansActionByConference(
  conferenceId: number,
  anneeConferenceId?: number
): Promise<PlanAction[]> {
  try {
    // Récupérer toutes les unités sous cette conférence
    const { data: unites, error: unitesError } = await supabase
      .from('unite_organisation')
      .select('id')
      .or(`niveau.eq.conference,id.eq.${conferenceId}`)
      .eq('reference_id', conferenceId)

    if (unitesError) {
      console.error('Erreur récupération unités:', unitesError)
      return []
    }

    const uniteIds = unites?.map(u => u.id) || []

    if (uniteIds.length === 0) {
      return []
    }

    let query = supabase
      .from('plan_action')
      .select(`
        *,
        unite:unite_id (
          id,
          nom,
          niveau
        ),
        annee_conference:annee_conference_id (
          id,
          annee_id,
          annee:annee_id (id, label)
        )
      `)
      .in('unite_id', uniteIds)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erreur getPlansActionByConference:', error)
      return []
    }

    // Ajouter les statistiques
    const plansAvecStats = await Promise.all(
      (data || []).map(async (plan: any) => {
        const { count: activitesCount } = await supabase
          .from('activite')
          .select('*', { count: 'exact', head: true })
          .eq('plan_action_id', plan.id)

        const { data: budgetData } = await supabase
          .from('budget')
          .select('montant')
          .eq('plan_action_id', plan.id)
          .eq('type', 'depense')

        const budgetTotal = budgetData?.reduce((sum, b) => sum + (b.montant || 0), 0) || 0

        const unite = Array.isArray(plan.unite) ? plan.unite[0] : plan.unite
        const anneeConference = Array.isArray(plan.annee_conference) 
          ? plan.annee_conference[0] 
          : plan.annee_conference
        const annee = anneeConference?.annee 
          ? (Array.isArray(anneeConference.annee) ? anneeConference.annee[0] : anneeConference.annee)
          : null

        return {
          ...plan,
          unite,
          annee_conference: anneeConference ? {
            ...anneeConference,
            annee
          } : null,
          activites_count: activitesCount || 0,
          budget_total: budgetTotal
        }
      })
    )

    return plansAvecStats
  } catch (error) {
    console.error('Erreur inattendue getPlansActionByConference:', error)
    return []
  }
}

// Récupérer un plan d'action par son ID
export async function getPlanActionById(id: number): Promise<PlanAction | null> {
  try {
    const { data, error } = await supabase
      .from('plan_action')
      .select(`
        *,
        unite:unite_id (
          id,
          nom,
          niveau,
          reference_id
        ),
        annee_conference:annee_conference_id (
          id,
          annee_id,
          annee:annee_id (id, label)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erreur getPlanActionById:', error)
      return null
    }

    if (!data) return null

    const unite = Array.isArray(data.unite) ? data.unite[0] : data.unite
    const anneeConference = Array.isArray(data.annee_conference) 
      ? data.annee_conference[0] 
      : data.annee_conference
    const annee = anneeConference?.annee 
      ? (Array.isArray(anneeConference.annee) ? anneeConference.annee[0] : anneeConference.annee)
      : null

    // Récupérer les statistiques
    const { count: activitesCount } = await supabase
      .from('activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    const { data: budgetData } = await supabase
      .from('budget')
      .select('montant')
      .eq('plan_action_id', id)
      .eq('type', 'depense')

    const budgetTotal = budgetData?.reduce((sum, b) => sum + (b.montant || 0), 0) || 0

    return {
      ...data,
      unite,
      annee_conference: anneeConference ? {
        ...anneeConference,
        annee
      } : null,
      activites_count: activitesCount || 0,
      budget_total: budgetTotal
    }
  } catch (error) {
    console.error('Erreur inattendue getPlanActionById:', error)
    return null
  }
}

// Créer un plan d'action
export async function createPlanAction(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const unite_id = parseInt(formData.get('unite_id') as string)
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    if (!unite_id || isNaN(unite_id)) {
      return { error: 'Unité invalide' }
    }

    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'Année de conférence invalide' }
    }

    // Vérifier que l'utilisateur a le droit de créer un plan pour cette unité
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    // Vérifier que l'unité est bien celle du fidèle ou une unité parente
    const { data: unite } = await supabase
      .from('unite_organisation')
      .select('id, niveau, reference_id')
      .eq('id', unite_id)
      .single()

    if (!unite) {
      return { error: 'Unité non trouvée' }
    }

    // Si l'unité est une paroisse, vérifier que c'est celle du fidèle
    if (unite.niveau === 'paroisse') {
      if (unite.reference_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez créer un plan que pour votre paroisse' }
      }
    }

    const { data: newPlan, error } = await supabase
      .from('plan_action')
      .insert([{
        unite_id,
        annee_conference_id,
        titre: titre.trim(),
        description
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur createPlanAction:', error)
      return { error: 'Erreur lors de la création du plan d\'action' }
    }

    revalidatePath('/plans-action')
    revalidatePath(`/plans-action/${newPlan.id}`)
    
    return { success: true, plan: newPlan, id: newPlan.id }
  } catch (error) {
    console.error('Erreur inattendue createPlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour un plan d'action
export async function updatePlanAction(formData: FormData) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    // Vérifier que le plan existe et que l'utilisateur a le droit de le modifier
    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('unite_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    // Vérifier les droits (même logique que pour la création)
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: unite } = await supabase
        .from('unite_organisation')
        .select('niveau, reference_id')
        .eq('id', plan.unite_id)
        .single()

      if (unite?.niveau === 'paroisse' && unite.reference_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez modifier ce plan' }
      }
    }

    const { error } = await supabase
      .from('plan_action')
      .update({
        titre: titre.trim(),
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('Erreur updatePlanAction:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath('/plans-action')
    revalidatePath(`/plans-action/${id}`)
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updatePlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer un plan d'action
export async function deletePlanAction(id: number) {
  try {
    const user = await getUser()
    if (!user) {
      return { error: 'Vous devez être connecté' }
    }

    // Vérifier que le plan existe et que l'utilisateur a le droit de le supprimer
    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('unite_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    // Vérifier les droits
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: unite } = await supabase
        .from('unite_organisation')
        .select('niveau, reference_id')
        .eq('id', plan.unite_id)
        .single()

      if (unite?.niveau === 'paroisse' && unite.reference_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez supprimer ce plan' }
      }
    }

    // Vérifier s'il y a des activités associées
    const { count, error: countError } = await supabase
      .from('activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    if (countError) {
      console.error('Erreur vérification activités:', countError)
    }

    if (count && count > 0) {
      return { error: 'Impossible de supprimer ce plan car il contient des activités' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deletePlanAction:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath('/plans-action')
    
    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deletePlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Récupérer les statistiques des plans d'action
export async function getPlansActionStats(uniteId: number, anneeConferenceId?: number) {
  try {
    const plans = await getPlansActionByUnite(uniteId, anneeConferenceId)
    
    const total = plans.length
    const totalActivites = plans.reduce((sum, p) => sum + (p.activites_count || 0), 0)
    const totalBudget = plans.reduce((sum, p) => sum + (p.budget_total || 0), 0)
    const plansAvecActivites = plans.filter(p => (p.activites_count || 0) > 0).length
    const plansSansActivites = total - plansAvecActivites

    return {
      total,
      totalActivites,
      totalBudget,
      plansAvecActivites,
      plansSansActivites,
      moyenneActivitesParPlan: total > 0 ? totalActivites / total : 0,
      budgetMoyenParPlan: total > 0 ? totalBudget / total : 0
    }
  } catch (error) {
    console.error('Erreur getPlansActionStats:', error)
    return null
  }
}




/**
 * Récupérer les plans d'action d'une unité - Version corrigée sans relations
 */
export async function getPlansActionByUnite(
  uniteId: number, 
  anneeConferenceId?: number
): Promise<any[]> {
  try {
    console.log('🔍 getPlansActionByUnite - Début', { uniteId, anneeConferenceId })
    
    // Requête simple sans relations
    let query = supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', uniteId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur getPlansActionByUnite:', error)
      return []
    }

    console.log(`✅ getPlansActionByUnite - ${data?.length || 0} plans d'action trouvés`)
    return data || []
  } catch (error) {
    console.error('❌ Erreur inattendue getPlansActionByUnite:', error)
    return []
  }
}