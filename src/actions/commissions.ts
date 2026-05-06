

// actions/commissions.ts
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { ensureCommissionUniteExists, deleteCommissionUnite } from './unite-organisation'

export interface Commission {
  id: number
  nom: string
  description: string | null
  departement_id: number
  paroisse_id: number
  created_at: string
  updated_at: string
  departement?: {
    id: number
    nom: string
    type: string
  }
  paroisse?: {
    id: number
    nom: string
    district?: {
      id: number
      nom: string
      conference?: {
        id: number
        nom: string
        region?: {
          id: number
          nom: string
        }
      }
    }
  }
  stats?: {
    total_membres: number
    membres_actifs: number
  }
}

// Récupérer toutes les commissions d'un département pour une paroisse donnée
export async function getCommissionsByDepartementAndParoisse(departementId: number, paroisseId: number) {
  const { data: commissions, error } = await supabase
    .from('commission')
    .select('*')
    .eq('departement_id', departementId)
    .eq('paroisse_id', paroisseId)
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des commissions:', error)
    return []
  }

  return commissions
}

// Récupérer toutes les commissions d'une paroisse
export async function getCommissionsByParoisse(paroisseId: number) {
  const { data: commissions, error } = await supabase
    .from('commission')
    .select(`
      *,
      departement:departement_id(id, nom, type)
    `)
    .eq('paroisse_id', paroisseId)
    .order('nom', { ascending: true })

  if (error) {
    console.error('Erreur lors de la récupération des commissions:', error)
    return []
  }

  // Ajouter les stats
  const commissionsWithStats = await Promise.all(
    commissions.map(async (commission) => {
      const { count: totalMembres } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('commission_id', commission.id)

      const { count: membresActifs } = await supabase
        .from('fidele_departement')
        .select('*', { count: 'exact', head: true })
        .eq('commission_id', commission.id)
        .eq('est_actif', true)

      return {
        ...commission,
        stats: {
          total_membres: totalMembres || 0,
          membres_actifs: membresActifs || 0
        }
      }
    })
  )

  return commissionsWithStats
}

// Récupérer une commission par son ID
export async function getCommissionById(id: number) {
  console.log('🔍 getCommissionById - ID reçu:', id)
  
  const { data: commission, error } = await supabase
    .from('commission')
    .select(`
      *,
      departement:departement_id(id, nom, type, roles_config),
      paroisse:paroisse_id(id, nom)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('❌ Erreur commission:', error)
    return null
  }

  console.log('✅ Commission trouvée:', commission.id, commission.nom)

  // Vérifier s'il y a des membres avec ce commission_id
  const { count, error: countError } = await supabase
    .from('fidele_departement')
    .select('*', { count: 'exact', head: true })
    .eq('commission_id', id)

  console.log(`🔍 Vérification: ${count || 0} membres ont commission_id = ${id}`)
  if (countError) console.error('❌ Erreur count:', countError)

  // Récupérer les membres
  const { data: membres, error: membresError } = await supabase
    .from('fidele_departement')
    .select(`
      id,
      est_actif,
      role_id,
      annee_id,
      annee_conference_id,
      fidele:fidele_id(
        id,
        nom,
        post_nom,
        prenom,
        profile_img,
        contact,
        email
      )
    `)
    .eq('commission_id', id)
    .order('created_at', { ascending: false })

  if (membresError) {
    console.error('❌ Erreur lors du chargement des membres:', membresError)
  } else {
    console.log(`📊 ${membres?.length || 0} membres trouvés pour la commission ${id}`)
    if (membres && membres.length > 0) {
      console.log('📝 Premier membre:', JSON.stringify(membres[0], null, 2))
    } else {
      console.log('⚠️ AUCUN membre trouvé avec commission_id =', id)
      
      // Vérifier quels commission_id existent dans la table
      const { data: allCommissions } = await supabase
        .from('fidele_departement')
        .select('commission_id')
        .not('commission_id', 'is', null)
        .limit(10)
      
      console.log('📋 Quelques commission_id existants:', allCommissions)
    }
  }

  return {
    ...commission,
    membres: membres || [],
    stats: {
      total: membres?.length || 0,
      actifs: membres?.filter((m: any) => m.est_actif).length || 0
    }
  }
}

// Créer une commission
export async function createCommission(formData: FormData) {
  const nom = formData.get('nom') as string
  const description = formData.get('description') as string
  const departementId = parseInt(formData.get('departement_id') as string)
  const paroisseId = parseInt(formData.get('paroisse_id') as string)

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  if (!departementId) {
    return { error: 'Le département est requis' }
  }

  if (!paroisseId) {
    return { error: 'La paroisse est requise' }
  }

  // Vérifier si une commission avec le même nom existe déjà
  const { data: existing } = await supabase
    .from('commission')
    .select('id')
    .eq('departement_id', departementId)
    .eq('paroisse_id', paroisseId)
    .eq('nom', nom.trim())
    .maybeSingle()

  if (existing) {
    return { error: 'Une commission avec ce nom existe déjà dans ce département pour cette paroisse' }
  }

  // Créer la commission
  const { data: commission, error } = await supabase
    .from('commission')
    .insert([{
      nom: nom.trim(),
      description: description || null,
      departement_id: departementId,
      paroisse_id: paroisseId
    }])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création de la commission:', error)
    return { error: 'Erreur lors de la création' }
  }

  // 🔥 CRÉER L'UNITÉ D'ORGANISATION POUR LA COMMISSION
  const uniteResult = await ensureCommissionUniteExists(
    commission.id,
    departementId,
    paroisseId
  )

  if (!uniteResult.success) {
    console.warn('⚠️ Commission créée mais unité non créée:', uniteResult.error)
    // On ne bloque pas la création de la commission si l'unité échoue
  } else {
    console.log('✅ Unité d\'organisation créée pour la commission:', uniteResult.unite?.id)
  }

  revalidatePath(`/admin/commissions/${commission.id}`)
  revalidatePath(`/admin/departements/${departementId}`)
  revalidatePath(`/paroisse/commissions`)
  
  return { success: true, commission }
}

// Mettre à jour une commission
export async function updateCommission(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const description = formData.get('description') as string

  if (!nom || nom.trim() === '') {
    return { error: 'Le nom est requis' }
  }

  // Récupérer la commission avant mise à jour pour avoir les infos
  const { data: oldCommission } = await supabase
    .from('commission')
    .select('nom, departement_id, paroisse_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('commission')
    .update({
      nom: nom.trim(),
      description: description || null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return { error: 'Erreur lors de la mise à jour' }
  }

  // Mettre à jour l'unité d'organisation si le nom a changé
  if (oldCommission && nom.trim() !== oldCommission.nom) {
    // Optionnel: mettre à jour le nom dans unite_organisation
    // Pour l'instant on recrée simplement l'unité
    await ensureCommissionUniteExists(
      id,
      oldCommission.departement_id,
      oldCommission.paroisse_id
    )
  }

  revalidatePath(`/admin/commissions/${id}`)
  revalidatePath(`/paroisse/commissions`)
  
  return { success: true }
}

// Supprimer une commission
export async function deleteCommission(id: number, departementId: number) {
  // Récupérer la commission pour connaître sa paroisse
  const { data: commission } = await supabase
    .from('commission')
    .select('paroisse_id')
    .eq('id', id)
    .single()

  // Vérifier si des membres sont affectés
  const { count } = await supabase
    .from('fidele_departement')
    .select('*', { count: 'exact', head: true })
    .eq('commission_id', id)

  if (count && count > 0) {
    return { error: `Impossible de supprimer : ${count} membre(s) sont encore affectés à cette commission` }
  }

  // Supprimer la commission
  const { error } = await supabase
    .from('commission')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression:', error)
    return { error: 'Erreur lors de la suppression' }
  }

  // 🔥 SUPPRIMER L'UNITÉ D'ORGANISATION DE LA COMMISSION
  if (commission) {
    const deleteResult = await deleteCommissionUnite(id, commission.paroisse_id)
    if (!deleteResult.success) {
      console.warn('⚠️ Commission supprimée mais unité non supprimée:', deleteResult.error)
    } else {
      console.log('✅ Unité d\'organisation supprimée pour la commission:', id)
    }
  }

  revalidatePath(`/admin/departements/${departementId}`)
  revalidatePath(`/paroisse/commissions`)
  
  return { success: true }
}

// Ajouter un membre à une commission
export async function addMemberToCommission(formData: FormData) {
  const commissionId = parseInt(formData.get('commission_id') as string)
  const fideleId = parseInt(formData.get('fidele_id') as string)
  const roleId = parseInt(formData.get('role_id') as string)
  const anneeId = parseInt(formData.get('annee_id') as string)

  // Récupérer la commission pour avoir departement_id et paroisse_id
  const { data: commission } = await supabase
    .from('commission')
    .select('departement_id, paroisse_id')
    .eq('id', commissionId)
    .single()

  if (!commission) {
    return { error: 'Commission non trouvée' }
  }

  // Vérifier si le membre existe déjà
  const { data: existing } = await supabase
    .from('fidele_departement')
    .select('id')
    .eq('fidele_id', fideleId)
    .eq('departement_id', commission.departement_id)
    .eq('commission_id', commissionId)
    .eq('annee_id', anneeId)
    .maybeSingle()

  if (existing) {
    return { error: 'Ce membre est déjà dans cette commission pour cette année' }
  }

  const { error } = await supabase
    .from('fidele_departement')
    .insert([{
      fidele_id: fideleId,
      departement_id: commission.departement_id,
      commission_id: commissionId,
      paroisse_id: commission.paroisse_id,
      role_id: roleId,
      annee_id: anneeId,
      est_actif: true
    }])

  if (error) {
    console.error('Erreur lors de l\'ajout:', error)
    return { error: 'Erreur lors de l\'ajout' }
  }

  revalidatePath(`/admin/commissions/${commissionId}`)
  revalidatePath(`/paroisse/commissions/${commissionId}`)
  
  return { success: true }
}

// Retirer un membre d'une commission
export async function removeMemberFromCommission(memberId: number, commissionId: number) {
  const { error } = await supabase
    .from('fidele_departement')
    .delete()
    .eq('id', memberId)

  if (error) {
    console.error('Erreur lors du retrait:', error)
    return { error: 'Erreur lors du retrait' }
  }

  revalidatePath(`/admin/commissions/${commissionId}`)
  revalidatePath(`/paroisse/commissions/${commissionId}`)
  
  return { success: true }
}