
// actions/fidele-par-annee.ts
'use server'

import { supabase } from '@/lib/supabase'

// Récupérer toutes les années
export async function getAnnees() {
  const { data: annees, error } = await supabase
    .from('annee')
    .select('id, label')
    .order('label', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des années:', error)
    return []
  }

  return annees
}

// Récupérer une année par son label
export async function getAnneeByLabel(label: string) {
  const { data: annee, error } = await supabase
    .from('annee')
    .select('id, label')
    .eq('label', label)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de l\'année:', error)
    return null
  }

  return annee
}

export async function getFidelesParAnnee(anneeLabel: string) {
  try {
    // 1. Récupérer l'ID de l'année
    const annee = await getAnneeByLabel(anneeLabel)

    if (!annee) {
      return { error: 'Année non trouvée', fideles: [] }
    }

    // 2. Récupérer tous les fidèles avec leur paroisse pour cette année
    const { data: affectations, error: affectationsError } = await supabase
      .from('fidele_paroisse')
      .select(`
        id,
        fidele_id,
        paroisse_id,
        created_at,
        fidele:fidele_id (
          id,
          nom,
          post_nom,
          prenom,
          contact,
          adresse,
          annee_naissance,
          sexe,
          actif,
          profile_img,
          paroisse:paroisse_id (
            id,
            nom
          )
        ),
        paroisse:paroisse_id (
          id,
          nom
        )
      `)
      .eq('annee_id', annee.id)
      .order('created_at', { ascending: false })

    if (affectationsError) {
      console.error('Erreur lors de la récupération des affectations:', affectationsError)
      return { error: 'Erreur lors de la récupération des fidèles', fideles: [] }
    }

    // 3. Formater les données
    const fidelesAvecParoisse = affectations.map((aff: any) => {
      const fidele = aff.fidele
      return {
        ...fidele,
        paroisse_annee: aff.paroisse,
        date_affectation: aff.created_at,
        age: fidele.annee_naissance ? 
          new Date().getFullYear() - fidele.annee_naissance : null,
        nom_complet: `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`.trim()
      }
    })

    // 4. Trier par nom
    fidelesAvecParoisse.sort((a, b) => a.nom_complet.localeCompare(b.nom_complet))

    return { 
      success: true, 
      annee: annee.label,
      total: fidelesAvecParoisse.length,
      fideles: fidelesAvecParoisse 
    }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur est survenue', fideles: [] }
  }
}