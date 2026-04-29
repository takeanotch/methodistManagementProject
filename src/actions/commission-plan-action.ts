// actions/commission-plan-action.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference, getAnneesConferenceByConference } from './annee-conference'

export interface CommissionPlanAction {
  id: number
  commission_id: number
  annee_conference_id: number
  titre: string
  description: string | null
  created_at: string
  updated_at: string
  commission?: {
    id: number
    nom: string
    departement_id: number
    paroisse_id: number
  }
  annee_conference?: {
    id: number
    annee_id: number
    conference_id: number
    is_current: boolean
    annee?: {
      id: number
      label: string
    }
  }
  activites_count: number
  budget_total: number
  budget_recettes: number
  budget_depenses: number
}

// Récupérer la conférence d'une paroisse
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

// Récupérer les plans d'action d'une commission
export async function getPlansActionByCommission(
  commissionId: number,
  anneeConferenceId?: number
): Promise<CommissionPlanAction[]> {
  try {
    console.log('🔍 getPlansActionByCommission:', { commissionId, anneeConferenceId })
    
    let query = supabase
      .from('commission_plan_action')
      .select('*')
      .eq('commission_id', commissionId)

    if (anneeConferenceId) {
      query = query.eq('annee_conference_id', anneeConferenceId)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Erreur getPlansActionByCommission:', error)
      return []
    }

    if (!data || data.length === 0) {
      return []
    }

    // Ajouter les statistiques pour chaque plan
    const plansAvecStats = await Promise.all(
      data.map(async (plan) => {
        // Compter les activités
        const { count: activitesCount } = await supabase
          .from('commission_activite')
          .select('*', { count: 'exact', head: true })
          .eq('plan_action_id', plan.id)

        // Calculer le budget
        const { data: budgetData } = await supabase
          .from('commission_budget')
          .select('montant, type')
          .eq('plan_action_id', plan.id)

        const budgetRecettes = budgetData?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
        const budgetDepenses = budgetData?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0

        return {
          ...plan,
          activites_count: activitesCount || 0,
          budget_total: budgetRecettes - budgetDepenses,
          budget_recettes: budgetRecettes,
          budget_depenses: budgetDepenses
        }
      })
    )

    console.log(`✅ ${plansAvecStats.length} plans d'action trouvés`)
    return plansAvecStats
  } catch (error) {
    console.error('❌ Erreur getPlansActionByCommission:', error)
    return []
  }
}

// Récupérer un plan d'action par son ID
export async function getCommissionPlanActionById(id: number): Promise<CommissionPlanAction | null> {
  try {
    const { data, error } = await supabase
      .from('commission_plan_action')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Erreur getCommissionPlanActionById:', error)
      return null
    }

    if (!data) return null

    // Récupérer les statistiques
    const { count: activitesCount } = await supabase
      .from('commission_activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    const { data: budgetData } = await supabase
      .from('commission_budget')
      .select('montant, type')
      .eq('plan_action_id', id)

    const budgetRecettes = budgetData?.filter(b => b.type === 'recette').reduce((sum, b) => sum + (b.montant || 0), 0) || 0
    const budgetDepenses = budgetData?.filter(b => b.type === 'depense').reduce((sum, b) => sum + (b.montant || 0), 0) || 0

    return {
      ...data,
      activites_count: activitesCount || 0,
      budget_total: budgetRecettes - budgetDepenses,
      budget_recettes: budgetRecettes,
      budget_depenses: budgetDepenses
    }
  } catch (error) {
    console.error('❌ Erreur getCommissionPlanActionById:', error)
    return null
  }
}

// Créer un plan d'action pour une commission
export async function createCommissionPlanAction(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    const commission_id = parseInt(formData.get('commission_id') as string)
    const annee_conference_id = parseInt(formData.get('annee_conference_id') as string)
    const titre = formData.get('titre') as string
    const description = formData.get('description') as string || null

    if (!commission_id || isNaN(commission_id)) {
      return { error: 'Commission invalide' }
    }

    if (!annee_conference_id || isNaN(annee_conference_id)) {
      return { error: 'Année de conférence invalide' }
    }

    if (!titre || titre.trim() === '') {
      return { error: 'Le titre est requis' }
    }

    // Vérifier que la commission appartient à la paroisse de l'utilisateur
    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (!fidele) {
      return { error: 'Fidèle non trouvé' }
    }

    const { data: commission } = await supabase
      .from('commission')
      .select('paroisse_id')
      .eq('id', commission_id)
      .single()

    if (!commission || commission.paroisse_id !== fidele.paroisse_id) {
      return { error: 'Vous ne pouvez créer un plan que pour votre commission' }
    }

    // Créer le plan d'action
    const { data: newPlan, error } = await supabase
      .from('commission_plan_action')
      .insert([{
        commission_id,
        annee_conference_id,
        titre: titre.trim(),
        description
      }])
      .select()
      .single()

    if (error) {
      console.error('❌ Erreur createCommissionPlanAction:', error)
      return { error: 'Erreur lors de la création du plan d\'action' }
    }

    revalidatePath(`/paroisse/commissions/${commission_id}`)
    revalidatePath(`/paroisse/commissions/${commission_id}/plans-action`)
    
    return { success: true, plan: newPlan, id: newPlan.id }
  } catch (error) {
    console.error('❌ Erreur createCommissionPlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Mettre à jour un plan d'action
export async function updateCommissionPlanAction(formData: FormData) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
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

    // Vérifier les droits
    const { data: plan, error: planError } = await supabase
      .from('commission_plan_action')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', plan.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez modifier ce plan' }
      }
    }

    const { error } = await supabase
      .from('commission_plan_action')
      .update({
        titre: titre.trim(),
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur updateCommissionPlanAction:', error)
      return { error: 'Erreur lors de la mise à jour' }
    }

    const { data: commission } = await supabase
      .from('commission_plan_action')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (commission) {
      revalidatePath(`/paroisse/commissions/${commission.commission_id}`)
      revalidatePath(`/paroisse/commissions/${commission.commission_id}/plans-action`)
    }
    
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur updateCommissionPlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}

// Supprimer un plan d'action
export async function deleteCommissionPlanAction(id: number) {
  try {
    const user = await getUser()
    if (!user || !user.fidele_id) {
      return { error: 'Vous devez être connecté' }
    }

    // Vérifier les droits
    const { data: plan, error: planError } = await supabase
      .from('commission_plan_action')
      .select('commission_id')
      .eq('id', id)
      .single()

    if (planError || !plan) {
      return { error: 'Plan d\'action non trouvé' }
    }

    const { data: fidele } = await supabase
      .from('fidele')
      .select('paroisse_id')
      .eq('id', user.fidele_id)
      .single()

    if (fidele) {
      const { data: commission } = await supabase
        .from('commission')
        .select('paroisse_id')
        .eq('id', plan.commission_id)
        .single()

      if (commission && commission.paroisse_id !== fidele.paroisse_id) {
        return { error: 'Vous ne pouvez supprimer ce plan' }
      }
    }

    // Vérifier s'il y a des activités associées
    const { count, error: countError } = await supabase
      .from('commission_activite')
      .select('*', { count: 'exact', head: true })
      .eq('plan_action_id', id)

    if (countError) {
      console.error('Erreur vérification activités:', countError)
    }

    if (count && count > 0) {
      return { error: 'Impossible de supprimer ce plan car il contient des activités' }
    }

    // Supprimer les lignes budgétaires associées
    const { error: budgetError } = await supabase
      .from('commission_budget')
      .delete()
      .eq('plan_action_id', id)

    if (budgetError) {
      console.error('Erreur suppression budget:', budgetError)
    }

    // Supprimer le plan
    const { error } = await supabase
      .from('commission_plan_action')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('❌ Erreur deleteCommissionPlanAction:', error)
      return { error: 'Erreur lors de la suppression' }
    }

    revalidatePath(`/paroisse/commissions/${plan.commission_id}`)
    revalidatePath(`/paroisse/commissions/${plan.commission_id}/plans-action`)
    
    return { success: true }
  } catch (error) {
    console.error('❌ Erreur deleteCommissionPlanAction:', error)
    return { error: 'Une erreur est survenue' }
  }
}