// actions/finance.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { type Currency } from '@/lib/currency'

export interface MouvementFinance {
    id: number
    budget_id: number
    type: 'recette' | 'depense'
    montant: number
    currency: Currency
    date_mouvement: string
    description: string | null
    created_at: string
}

export interface MouvementWithBudget extends MouvementFinance {
    budget_libelle: string
    budget_type: 'recette' | 'depense'
}

/**
 * Récupérer les mouvements d'un budget spécifique
 */
export async function getMouvementsByBudget(budgetId: number): Promise<MouvementFinance[]> {
    try {
        const { data, error } = await supabase
            .from('mouvement_finance')
            .select('*')
            .eq('budget_id', budgetId)
            .order('date_mouvement', { ascending: false })

        if (error) throw error
        return data || []
    } catch (error) {
        console.error('Erreur getMouvementsByBudget:', error)
        return []
    }
}

/**
 * Récupérer les mouvements d'une unité (pour paroisse)
 */
export async function getMouvementsByUnite(uniteId: number, anneeConferenceId?: number): Promise<MouvementWithBudget[]> {
    try {
        let query = supabase
            .from('mouvement_finance')
            .select(`
                *,
                budget:budget_id (
                    id, 
                    libelle, 
                    type, 
                    unite_id, 
                    annee_conference_id
                )
            `)
            .eq('budget.unite_id', uniteId)

        if (anneeConferenceId) {
            query = query.eq('budget.annee_conference_id', anneeConferenceId)
        }

        const { data, error } = await query.order('date_mouvement', { ascending: false })

        if (error) throw error
        
        return (data || []).map((item: any) => ({
            ...item,
            budget_libelle: item.budget?.libelle || 'Budget inconnu',
            budget_type: item.budget?.type || 'depense'
        }))
    } catch (error) {
        console.error('Erreur getMouvementsByUnite:', error)
        return []
    }
}

/**
 * Récupérer les mouvements pour le district
 */
export async function getMouvementsByDistrict(districtId: number, anneeConferenceId?: number): Promise<MouvementWithBudget[]> {
    try {
        let query = supabase
            .from('mouvement_finance')
            .select(`
                *,
                budget:budget_id (
                    id, 
                    libelle, 
                    type, 
                    unite_id,
                    unite:unite_id (
                        id_niveau
                    ),
                    annee_conference_id
                )
            `)
            .eq('budget.unite.id_niveau', districtId)
            .eq('budget.unite.niveau', 'district')

        if (anneeConferenceId) {
            query = query.eq('budget.annee_conference_id', anneeConferenceId)
        }

        const { data, error } = await query.order('date_mouvement', { ascending: false })

        if (error) throw error
        
        return (data || []).map((item: any) => ({
            ...item,
            budget_libelle: item.budget?.libelle || 'Budget inconnu',
            budget_type: item.budget?.type || 'depense'
        }))
    } catch (error) {
        console.error('Erreur getMouvementsByDistrict:', error)
        return []
    }
}

/**
 * Récupérer les mouvements pour la conférence
 */
export async function getMouvementsByConference(conferenceId: number, anneeConferenceId?: number): Promise<MouvementWithBudget[]> {
    try {
        let query = supabase
            .from('mouvement_finance')
            .select(`
                *,
                budget:budget_id (
                    id, 
                    libelle, 
                    type, 
                    unite_id,
                    unite:unite_id (
                        id_niveau
                    ),
                    annee_conference_id
                )
            `)
            .eq('budget.unite.id_niveau', conferenceId)
            .eq('budget.unite.niveau', 'conference')

        if (anneeConferenceId) {
            query = query.eq('budget.annee_conference_id', anneeConferenceId)
        }

        const { data, error } = await query.order('date_mouvement', { ascending: false })

        if (error) throw error
        
        return (data || []).map((item: any) => ({
            ...item,
            budget_libelle: item.budget?.libelle || 'Budget inconnu',
            budget_type: item.budget?.type || 'depense'
        }))
    } catch (error) {
        console.error('Erreur getMouvementsByConference:', error)
        return []
    }
}

/**
 * Créer un mouvement financier
 */
export async function createMouvementFinance(formData: FormData) {
    try {
        const user = await getUser()
        if (!user || !user.fidele_id) {
            return { error: 'Vous devez être connecté' }
        }

        const budget_id = parseInt(formData.get('budget_id') as string)
        const type = formData.get('type') as string
        const montant = parseFloat(formData.get('montant') as string)
        const currency = formData.get('currency') as Currency
        const date_mouvement = formData.get('date_mouvement') as string
        const description = formData.get('description') as string

        if (!budget_id || isNaN(budget_id)) {
            return { error: 'Budget invalide' }
        }

        if (type !== 'recette' && type !== 'depense') {
            return { error: 'Type invalide' }
        }

        if (!montant || isNaN(montant) || montant <= 0) {
            return { error: 'Le montant doit être supérieur à 0' }
        }

        if (!currency || !['USD', 'CDF', 'EUR'].includes(currency)) {
            return { error: 'Devise invalide' }
        }

        if (!date_mouvement) {
            return { error: 'La date est requise' }
        }

        // Vérifier que le budget existe et que le type correspond
        const { data: budget, error: budgetError } = await supabase
            .from('budget')
            .select('id, type, unite_id')
            .eq('id', budget_id)
            .single()

        if (budgetError || !budget) {
            return { error: 'Budget non trouvé' }
        }

        if (budget.type !== type) {
            return { error: `Le type du mouvement (${type}) ne correspond pas au type du budget (${budget.type})` }
        }

        // Créer le mouvement
        const { data, error } = await supabase
            .from('mouvement_finance')
            .insert([{
                budget_id,
                type,
                montant,
                currency,
                date_mouvement,
                description: description || null,
                created_at: new Date().toISOString()
            }])
            .select()
            .single()

        if (error) {
            console.error('Erreur createMouvementFinance:', error)
            return { error: 'Erreur lors de la création' }
        }

        // Revalider les chemins
        revalidatePath('/paroisse/budget')
        revalidatePath('/district/budget')
        revalidatePath('/conference/budget')
        revalidatePath('/paroisse/departements/[id]/budget')
        revalidatePath('/paroisse/departements/[id]/plans-action/[planId]')
        revalidatePath('/district/plans-action/[planId]')
        revalidatePath('/conference/plans-action/[planId]')

        return { success: true, mouvement: data }
    } catch (error) {
        console.error('Erreur inattendue createMouvementFinance:', error)
        return { error: 'Une erreur est survenue' }
    }
}

/**
 * Supprimer un mouvement financier
 */
export async function deleteMouvementFinance(id: number) {
    try {
        const user = await getUser()
        if (!user || !user.fidele_id) {
            return { error: 'Vous devez être connecté' }
        }

        const { error } = await supabase
            .from('mouvement_finance')
            .delete()
            .eq('id', id)

        if (error) {
            console.error('Erreur deleteMouvementFinance:', error)
            return { error: 'Erreur lors de la suppression' }
        }

        revalidatePath('/paroisse/budget')
        revalidatePath('/district/budget')
        revalidatePath('/conference/budget')
        revalidatePath('/paroisse/departements/[id]/budget')

        return { success: true }
    } catch (error) {
        console.error('Erreur inattendue deleteMouvementFinance:', error)
        return { error: 'Une erreur est survenue' }
    }
}

/**
 * Récupérer le résumé des mouvements pour un budget
 */
// export async function getBudgetMouvementSummary(budgetId: number) {
//     try {
//         const mouvements = await getMouvementsByBudget(budgetId)
        
//         const total = mouvements.reduce((sum, m) => sum + m.montant, 0)
//         const totalParDevise = new Map<Currency, number>()
        
//         mouvements.forEach(m => {
//             const current = totalParDevise.get(m.currency) || 0
//             totalParDevise.set(m.currency, current + m.montant)
//         })

//         // Récupérer le budget pour avoir le montant prévu
//         const { data: budget } = await supabase
//             .from('budget')
//             .select('montant, currency')
//             .eq('id', budgetId)
//             .single()

//         return {
//             total: total,
//             totalParDevise: Array.from(totalParDevise.entries()).map(([currency, montant]) => ({ currency, montant })),
//             nombreMouvements: mouvements.length,
//             mouvements,
//             prevu: budget?.montant || 0,
//             prevuCurrency: budget?.currency || 'USD',
//             reste: (budget?.montant || 0) - total
//         }
//     } catch (error) {
//         console.error('Erreur getBudgetMouvementSummary:', error)
//         return { total: 0, totalParDevise: [], nombreMouvements: 0, mouvements: [], prevu: 0, prevuCurrency: 'USD', reste: 0 }
//     }
// }





// actions/finance.ts - Remplacer getBudgetMouvementSummary

/**
 * Récupérer le résumé des mouvements pour un budget
 * Inclut les totaux par devise et le total en CDF
 */
export async function getBudgetMouvementSummary(budgetId: number) {
    try {
        const mouvements = await getMouvementsByBudget(budgetId)
        
        // Récupérer la configuration pour le taux
        const { data: budget } = await supabase
            .from('budget')
            .select('unite_id, montant, currency')
            .eq('id', budgetId)
            .single()
        
        let configTaux = 2800
        if (budget) {
            const { data: config } = await supabase
                .from('configuration')
                .select('taux')
                .eq('unite_id', budget.unite_id)
                .maybeSingle()
            configTaux = config?.taux || 2800
        }
        
        // Fonction de conversion en CDF
        const convertToCDF = (montant: number, currency: Currency): number => {
            if (currency === 'CDF') return montant
            if (currency === 'USD') return montant * configTaux
            if (currency === 'EUR') return montant * 1.08 * configTaux
            return montant
        }
        
        // Totaux par devise
        const totalParDeviseMap = new Map<Currency, number>()
        let totalCDF = 0
        
        mouvements.forEach(m => {
            // Par devise
            const current = totalParDeviseMap.get(m.currency) || 0
            totalParDeviseMap.set(m.currency, current + m.montant)
            
            // Total en CDF
            totalCDF += convertToCDF(m.montant, m.currency)
        })
        
        const totalParDevise = Array.from(totalParDeviseMap.entries()).map(([currency, montant]) => ({ 
            currency, 
            montant 
        }))
        
        // Calcul du reste en CDF
        const prevuCDF = budget ? convertToCDF(budget.montant, budget.currency) : 0
        const resteCDF = prevuCDF - totalCDF

        return {
            totalParDevise,
            totalCDF,
            nombreMouvements: mouvements.length,
            mouvements,
            prevu: budget?.montant || 0,
            prevuCurrency: budget?.currency || 'USD',
            prevuCDF,
            resteCDF
        }
    } catch (error) {
        console.error('Erreur getBudgetMouvementSummary:', error)
        return { 
            totalParDevise: [], 
            totalCDF: 0, 
            nombreMouvements: 0, 
            mouvements: [], 
            prevu: 0, 
            prevuCurrency: 'USD', 
            prevuCDF: 0,
            resteCDF: 0 
        }
    }
}