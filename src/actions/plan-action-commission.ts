// actions/plan-action-commission.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'
import { getCommissionUnite, ensureCommissionUniteExists } from './unite-organisation'

export interface PlanActionCommission {
  id: number
  unite_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  activites_count?: number
  budget_total?: number
}

// ============================================
// FONCTIONS UTILITAIRES
// ============================================

async function getConferenceFromParoisse(paroisseId: number): Promise<number | null> {
  try {
    const { data: paroisse } = await supabase
      .from('paroisse')
      .select(`
        district:district_id (
          conference:conference_id (id)
        )
      `)
      .eq('id', paroisseId)
      .single()

    if (paroisse?.district) {
      const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
      if (district?.conference) {
        const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
        return conference?.id || null
      }
    }
    return null
  } catch (error) {
    console.error('Erreur getConferenceFromParoisse:', error)
    return null
  }
}

async function getUserParoisseId(userId: string): Promise<number | null> {
  try {
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', userId)
      .single()
    return fidele?.paroisse_id || null
  } catch (error) {
    console.error('Erreur getUserParoisseId:', error)
    return null
  }
}

async function userHasAccessToCommission(
  userId: string,
  commissionId: number
): Promise<{ hasAccess: boolean; paroisseId: number | null; error?: string }> {
  try {
    const userParoisseId = await getUserParoisseId(userId)
    if (!userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Utilisateur sans paroisse' }
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id, departement_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      return { hasAccess: false, paroisseId: null, error: 'Commission non trouvée' }
    }

    if (commission.paroisse_id !== userParoisseId) {
      return { hasAccess: false, paroisseId: null, error: 'Accès non autorisé à cette commission' }
    }

    return { hasAccess: true, paroisseId: userParoisseId }
  } catch (error) {
    console.error('Erreur userHasAccessToCommission:', error)
    return { hasAccess: false, paroisseId: null, error: 'Erreur de vérification des droits' }
  }
}

async function getOrCreateCommissionUnite(
  commissionId: number,
  paroisseId: number
): Promise<{ id: number } | null> {
  try {
    let unite = await getCommissionUnite(commissionId, paroisseId)
    
    if (unite) {
      return unite
    }

    const { data: commission, error } = await supabase
      .from('commission')
      .select('departement_id, nom')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      console.error('Commission non trouvée:', error)
      return null
    }

    const result = await ensureCommissionUniteExists(
      commissionId,
      commission.departement_id,
      paroisseId
    )

    if (!result.success || !result.unite) {
      console.error('Impossible de créer l\'unité de la commission:', result.error)
      return null
    }

    return result.unite
  } catch (error) {
    console.error('Erreur getOrCreateCommissionUnite:', error)
    return null
  }
}

// ============================================
// RÉCUPÉRATION DES DONNÉES
// ============================================

export async function getAnneesConferenceForCommissionPlan(commissionId: number) {
  try {
    const { data: commission, error } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (error || !commission) {
      return []
    }

    const conferenceId = await getConferenceFromParoisse(commission.paroisse_id)
    if (!conferenceId) {
      return []
    }

    const annees = await getAnneesConferenceByConference(conferenceId)
    return annees || []
  } catch (error) {
    console.error('Erreur getAnneesConferenceForCommissionPlan:', error)
    return []
  }
}

export async function getPlansActionByCommission(
  commissionId: number,
  anneeConferenceId?: number
): Promise<PlanActionCommission[]> {
  try {
    console.log('🔍 getPlansActionByCommission - Début', { commissionId, anneeConferenceId })

    const { data: commission, error: commError } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (commError || !commission) {
      console.error('❌ Commission non trouvée:', commError)
      return []
    }

    const unite = await getOrCreateCommissionUnite(commissionId, commission.paroisse_id)
    
    if (!unite) {
      console.error('❌ Impossible de récupérer l\'unité de la commission')
      return []
    }

    let query = supabase
      .from('plan_action')
      .select('*')
      .eq('unite_id', unite.id)
      .order('created_at', { ascending: false })

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data: plans, error } = await query

    if (error) {
      console.error('❌ Erreur getPlansActionByCommission:', error)
      return []
    }

    if (!plans || plans.length === 0) {
      return []
    }

    // Ajouter les statistiques
    const plansWithStats = await Promise.all(
      plans.map(async (plan) => {
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

        return {
          ...plan,
          activites_count: activitesCount || 0,
          budget_total: budgetTotal
        }
      })
    )

    console.log(`✅ ${plansWithStats.length} plans d'action trouvés`)
    return plansWithStats
  } catch (error) {
    console.error('❌ Erreur inattendue getPlansActionByCommission:', error)
    return []
  }
}

export async function getPlanActionByIdForCommission(
  id: number,
  commissionId: number
): Promise<PlanActionCommission | null> {
  try {
    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commissionId)
      .single()

    if (!commission) {
      return null
    }

    const unite = await getCommissionUnite(commissionId, commission.paroisse_id)
    
    if (!unite) {
      return null
    }

    const { data: plan, error } = await supabase
      .from('plan_action')
      .select('*')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (error || !plan) {
      console.error('Erreur getPlanActionByIdForCommission:', error)
      return null
    }

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

    return {
      ...plan,
      activites_count: activitesCount || 0,
      budget_total: budgetTotal
    }
  } catch (error) {
    console.error('Erreur inattendue getPlanActionByIdForCommission:', error)
    return null
  }
}

// ============================================
// CRUD PLAN D'ACTION
// ============================================

export async function createPlanActionForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commissionId = parseInt(formData.get('commission_id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)

    if (!commissionId || isNaN(commissionId)) {
      return { error: 'Commission invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'Année de conférence invalide' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getOrCreateCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Impossible de créer l\'unité d\'organisation pour cette commission' }
    }

    const { data: newPlan, error } = await supabase
      .from('plan_action')
      .insert([{
        unite_id: unite.id,
        annee_conference_id,
        titre: titre.trim(),
        description
      }])
      .select()
      .single()

    if (error) {
      console.error('Erreur createPlanActionForCommission:', error)
      return { error: 'Erreur lors de la création du plan d\'action' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/plans-action`)
    revalidatePath(`/paroisse/commissions/${commissionId}`)

    return { success: true, plan: newPlan, id: newPlan.id }
  } catch (error) {
    console.error('Erreur inattendue createPlanActionForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function updatePlanActionForCommission(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const id = parseInt(formData.get('id') as string)
    const commissionId = parseInt(formData.get('commission_id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null

    if (!id || isNaN(id)) {
      return { error: 'ID invalide' }
    }

    if (!commissionId || isNaN(commissionId)) {
      return { error: 'Commission invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé ou accès non autorisé' }
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
      console.error('Erreur updatePlanActionForCommission:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/plans-action`)
    revalidatePath(`/paroisse/commissions/${commissionId}/plans-action/${id}`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue updatePlanActionForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function deletePlanActionForCommission(id: number, commissionId: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const access = await userHasAccessToCommission(user.fidele_id, commissionId)
    if (!access.hasAccess || !access.paroisseId) {
      return { error: access.error || 'Accès non autorisé' }
    }

    const unite = await getCommissionUnite(commissionId, access.paroisseId)
    if (!unite) {
      return { error: 'Unité d\'organisation non trouvée' }
    }

    const { data: plan, error: planError } = await supabase
      .from('plan_action')
      .select('id')
      .eq('id', id)
      .eq('unite_id', unite.id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé ou accès non autorisé' }
    }

    const { count } = await supabase
      .from('activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    if (count && count > 0) {
      return { error: 'Impossible de supprimer ce plan car il contient des activités' }
    }

    const { error } = await supabase
      .from('plan_action')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erreur deletePlanActionForCommission:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${commissionId}/plans-action`)

    return { success: true }
  } catch (error) {
    console.error('Erreur inattendue deletePlanActionForCommission:', error)
    return { error: 'Une erreur est survenue' }
  }
}

export async function getPlansActionStatsForCommission(
  commissionId: number,
  anneeConferenceId?: number
) {
  try {
    const plans = await getPlansActionByCommission(commissionId, anneeConferenceId)
    
    const total = plans.length
    const totalActivites = plans.reduce((sum, p) => sum + (p.activites_count || 0), 0)
    const totalBudget = plans.reduce((sum, p) => sum + (p.budget_total || 0), 0)
    const plansAvecActivites = plans.filter(p => (p.activites_count || 0) > 0).length

    return {
      total,
      totalActivites,
      totalBudget,
      plansAvecActivites,
      plansSansActivites: total - plansAvecActivites,
      moyenneActivitesParPlan: total > 0 ? totalActivites / total : 0,
      budgetMoyenParPlan: total > 0 ? totalBudget / total : 0
    }
  } catch (error) {
    console.error('Erreur getPlansActionStatsForCommission:', error)
    return null
  }
}