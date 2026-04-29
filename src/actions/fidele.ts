

// actions/fidele.ts
'use server'

import { supabase } from '@/lib/supabase'
import bcrypt from 'bcryptjs'
import { getCurrentAnneeConference, getConferenceIdByParoisse } from './annee-conference'

// ============================================
// FONCTIONS DE RÉCUPÉRATION
// ============================================

// Récupérer tous les fidèles
export async function getFideles() {
  const { data: fideles, error } = await supabase
    .from('fidele')
    .select(`
      *,
      paroisse:paroisse_id (
        id, 
        nom
      ),
      compte:compte (
        id,
        role_id,
        role:role_id (
          id,
          nom,
          niveau
        )
      )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des fidèles:', error)
    return []
  }

  // Transformer les données pour s'assurer que compte est un objet ou null
  const fidelesTransformes = fideles.map((fidele: any) => {
    const compte = Array.isArray(fidele.compte) 
      ? (fidele.compte.length > 0 ? fidele.compte[0] : null)
      : fidele.compte

    return {
      ...fidele,
      compte: compte
    }
  })

  return fidelesTransformes
}

// Récupérer un fidèle par son ID
export async function getFideleById(id: number) {
  const { data: fidele, error } = await supabase
    .from('fidele')
    .select('*, paroisse:paroisse_id(id, nom)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Erreur lors de la récupération du fidèle:', error)
    return null
  }

  return fidele
}

// Récupérer les fidèles sans compte
export async function getFidelesSansCompte() {
  try {
    const { data: comptes, error: comptesError } = await supabase
      .from('compte')
      .select('fidele_id')
      .not('fidele_id', 'is', null)

    if (comptesError) {
      console.error('Erreur lors de la récupération des comptes:', comptesError)
      return []
    }

    const idsAvecCompte = comptes?.map(c => c.fidele_id).filter(id => id !== null) || []

    let query = supabase
      .from('fidele')
      .select('*, paroisse:paroisse_id(id, nom)')
      .order('created_at', { ascending: false })

    if (idsAvecCompte.length > 0) {
      query = query.not('id', 'in', `(${idsAvecCompte.join(',')})`)
    }

    const { data: fideles, error } = await query

    if (error) {
      console.error('Erreur lors de la récupération des fidèles sans compte:', error)
      return []
    }

    return fideles || []
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}

// Récupérer les fidèles par paroisse ET année de conférence
export async function getFidelesByParoisseAndAnnee(paroisseId: number, anneeConferenceId?: number) {
  try {
    let finalAnneeConferenceId = anneeConferenceId
    
    // Si aucune année de conférence n'est fournie, récupérer l'année en cours
    if (!finalAnneeConferenceId) {
      const conferenceId = await getConferenceIdByParoisse(paroisseId)
      if (conferenceId) {
        const currentAnneeConf = await getCurrentAnneeConference(conferenceId)
        if (currentAnneeConf) {
          finalAnneeConferenceId = currentAnneeConf.id
        }
      }
    }

    if (!finalAnneeConferenceId) {
      console.log('Aucune année de conférence trouvée pour paroisseId:', paroisseId)
      return []
    }

    // Récupérer les fidèles via fidele_paroisse pour l'année de conférence spécifiée
    const { data: fideleParoisse, error } = await supabase
      .from('fidele_paroisse')
      .select(`
        fidele_id,
        annee_conference_id,
        created_at,
        fidele:fidele_id (
          *,
          paroisse:paroisse_id (id, nom),
          compte:compte!left (
            id,
            role_id,
            role:role_id (
              id,
              nom,
              niveau
            )
          )
        )
      `)
      .eq('paroisse_id', paroisseId)
      .eq('annee_conference_id', finalAnneeConferenceId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des fidèles:', error)
      return []
    }

    // Transformer les données
    const fideles = (fideleParoisse || [])
      .map(item => {
        const fidele = Array.isArray(item.fidele) ? item.fidele[0] : item.fidele
        if (!fidele) return null
        
        let compte = null
        if (fidele.compte) {
          compte = Array.isArray(fidele.compte) ? fidele.compte[0] : fidele.compte
        }
        
        return {
          ...fidele,
          compte,
          inscription_annee_conference: item.annee_conference_id,
          date_inscription_paroisse: item.created_at
        }
      })
      .filter(Boolean)

    return fideles
  } catch (error) {
    console.error('Erreur inattendue dans getFidelesByParoisseAndAnnee:', error)
    return []
  }
}

// Récupérer les fidèles sans compte pour une paroisse et une année de conférence
export async function getFidelesSansCompteByParoisseAndAnnee(paroisseId: number, anneeConferenceId?: number) {
  try {
    const { data: comptes, error: comptesError } = await supabase
      .from('compte')
      .select('fidele_id')
      .not('fidele_id', 'is', null)

    if (comptesError) {
      console.error('Erreur lors de la récupération des comptes:', comptesError)
      return []
    }

    const idsAvecCompte = comptes?.map(c => c.fidele_id).filter(id => id !== null) || []
    const fideles = await getFidelesByParoisseAndAnnee(paroisseId, anneeConferenceId)
    
    return fideles.filter(fidele => !idsAvecCompte.includes(fidele.id))
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return []
  }
}

// Versions simplifiées pour la rétrocompatibilité
export async function getFidelesByParoisse(paroisseId: number, anneeConferenceId?: number) {
  return getFidelesByParoisseAndAnnee(paroisseId, anneeConferenceId)
}

export async function getFidelesSansCompteByParoisse(paroisseId: number, anneeConferenceId?: number) {
  return getFidelesSansCompteByParoisseAndAnnee(paroisseId, anneeConferenceId)
}

// Récupérer l'historique des paroisses d'un fidèle
export async function getHistoriqueParoissesFidele(fideleId: number) {
  try {
    const { data, error } = await supabase
      .from('fidele_paroisse')
      .select(`
        *,
        paroisse:paroisse_id (id, nom),
        annee_conference:annee_conference_id (
          id,
          is_current,
          annee:annee_id (id, label)
        )
      `)
      .eq('fidele_id', fideleId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error)
    return []
  }
}

// Récupérer les statistiques des fidèles
// export async function getFidelesStats() {
//   const { data: stats, error } = await supabase
//     .from('fidele')
//     .select('actif, sexe, annee_naissance')

//   if (error) {
//     console.error('Erreur lors de la récupération des statistiques:', error)
//     return null
//   }

//   const total = stats.length
//   const actifs = stats.filter(f => f.actif).length
//   const inactifs = total - actifs
//   const hommes = stats.filter(f => f.sexe === 'M').length
//   const femmes = stats.filter(f => f.sexe === 'F').length
//   const nonRenseigne = stats.filter(f => !f.sexe).length

//   const currentYear = new Date().getFullYear()
//   const ages = stats
//     .filter(f => f.annee_naissance)
//     .map(f => currentYear - f.annee_naissance)
//   const ageMoyen = ages.length > 0 
//     ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
//     : null

//   return {
//     total,
//     actifs,
//     inactifs,
//     hommes,
//     femmes,
//     nonRenseigne,
//     ageMoyen
//   }
// }

// ============================================
// FONCTIONS DE CRÉATION / MODIFICATION
// ============================================

// Créer un fidèle
// export async function createFidele(formData: FormData, annee_conference_id?: number) {
//   const nom = formData.get('nom') as string
//   const post_nom = formData.get('post_nom') as string
//   const prenom = formData.get('prenom') as string
//   const contact = formData.get('contact') as string
//   const adresse = formData.get('adresse') as string
//   const annee_naissance = formData.get('annee_naissance') 
//     ? parseInt(formData.get('annee_naissance') as string)
//     : null
//   const sexe = formData.get('sexe') as string || null
//   const actif = formData.get('actif') === 'on' || formData.get('actif') === 'true'
//   const paroisse_id = formData.get('paroisse_id') 
//     ? parseInt(formData.get('paroisse_id') as string)
//     : null

//   console.log('📌 createFidele - Paramètres:', { annee_conference_id, paroisse_id })

//   // Vérifier si le contact existe déjà
//   const { data: existingFidele } = await supabase
//     .from('fidele')
//     .select('id')
//     .eq('contact', contact)
//     .single()

//   if (existingFidele) {
//     return { error: 'Ce contact est déjà utilisé' }
//   }

//   // Créer le fidèle
//   const { data: newFidele, error } = await supabase
//     .from('fidele')
//     .insert([
//       {
//         nom,
//         post_nom,
//         prenom,
//         contact,
//         adresse,
//         annee_naissance,
//         sexe,
//         actif,
//         paroisse_id
//       }
//     ])
//     .select()
//     .single()

//   if (error) {
//     console.error('❌ Erreur création fidèle:', error)
//     return { error: 'Erreur lors de la création du fidèle' }
//   }

//   console.log('✅ Fidèle créé:', newFidele.id)

//   // Si une paroisse et une année de conférence sont fournies, ajouter dans fidele_paroisse
//   if (paroisse_id && newFidele && annee_conference_id) {
//     const { error: fpError } = await supabase
//       .from('fidele_paroisse')
//       .insert([
//         {
//           fidele_id: newFidele.id,
//           paroisse_id: paroisse_id,
//           annee_conference_id: annee_conference_id
//         }
//       ])

//     if (fpError) {
//       console.error('❌ Erreur insertion fidele_paroisse:', fpError)
//     } else {
//       console.log('✅ fidele_paroisse créé avec succès')
//     }
//   }

//   return { success: true, fidele: newFidele }
// }

// Mettre à jour un fidèle
// export async function updateFidele(formData: FormData) {
//   const id = parseInt(formData.get('id') as string)
//   const nom = formData.get('nom') as string
//   const post_nom = formData.get('post_nom') as string
//   const prenom = formData.get('prenom') as string
//   const contact = formData.get('contact') as string
//   const adresse = formData.get('adresse') as string
//   const annee_naissance = formData.get('annee_naissance') 
//     ? parseInt(formData.get('annee_naissance') as string)
//     : null
//   const sexe = formData.get('sexe') as string || null
//   const actif = formData.get('actif') === 'on' || formData.get('actif') === 'true'
//   const nouvelleParoisseId = formData.get('paroisse_id') 
//     ? parseInt(formData.get('paroisse_id') as string)
//     : null

//   // Récupérer l'ancienne paroisse
//   const { data: oldFidele } = await supabase
//     .from('fidele')
//     .select('paroisse_id')
//     .eq('id', id)
//     .single()

//   const ancienneParoisseId = oldFidele?.paroisse_id

//   // Mettre à jour le fidèle
//   const { error: updateError } = await supabase
//     .from('fidele')
//     .update({
//       nom,
//       post_nom,
//       prenom,
//       contact,
//       adresse,
//       annee_naissance,
//       sexe,
//       actif,
//       paroisse_id: nouvelleParoisseId,
//       updated_at: new Date().toISOString()
//     })
//     .eq('id', id)

//   if (updateError) {
//     console.error('Erreur lors de la mise à jour du fidèle:', updateError)
//     return { error: 'Erreur lors de la mise à jour du fidèle' }
//   }

//   // Si la paroisse a changé, ajouter une entrée dans fidele_paroisse
//   if (ancienneParoisseId !== nouvelleParoisseId && nouvelleParoisseId) {
//     const conferenceId = await getConferenceIdByParoisse(nouvelleParoisseId)

//     if (conferenceId) {
//       const currentAnneeConf = await getCurrentAnneeConference(conferenceId)
//       if (currentAnneeConf) {
//         // Vérifier si une association existe déjà pour cette année
//         const { data: existing } = await supabase
//           .from('fidele_paroisse')
//           .select('id')
//           .eq('fidele_id', id)
//           .eq('annee_conference_id', currentAnneeConf.id)
//           .maybeSingle()

//         if (!existing) {
//           await supabase
//             .from('fidele_paroisse')
//             .insert([{
//               fidele_id: id,
//               paroisse_id: nouvelleParoisseId,
//               annee_conference_id: currentAnneeConf.id
//             }])
//         }
//       }
//     }
//   }

//   // Mettre à jour le compte lié
//   await supabase
//     .from('compte')
//     .update({
//       nom_complet: `${nom} ${post_nom} ${prenom}`,
//       numero: contact,
//       adresse: adresse,
//       updated_at: new Date().toISOString()
//     })
//     .eq('fidele_id', id)

//   return { success: true }
// }

// Supprimer un fidèle
export async function deleteFidele(id: number) {
  // Vérifier si le fidèle a un compte lié
  const { data: compte } = await supabase
    .from('compte')
    .select('id')
    .eq('fidele_id', id)
    .single()

  if (compte) {
    return { error: 'Impossible de supprimer ce fidèle car il a un compte associé' }
  }

  const { error } = await supabase
    .from('fidele')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Erreur lors de la suppression du fidèle:', error)
    return { error: 'Erreur lors de la suppression du fidèle' }
  }

  return { success: true }
}

// Ajouter un fidèle à une paroisse pour une année de conférence
export async function ajouterFideleAParoisse(fideleId: number, paroisseId: number, anneeConferenceId: number) {
  try {
    // Vérifier si l'association existe déjà
    const { data: existing } = await supabase
      .from('fidele_paroisse')
      .select('id')
      .eq('fidele_id', fideleId)
      .eq('paroisse_id', paroisseId)
      .eq('annee_conference_id', anneeConferenceId)
      .maybeSingle()

    if (existing) {
      return { success: true, message: 'Déjà associé' }
    }

    // Créer l'association
    const { error } = await supabase
      .from('fidele_paroisse')
      .insert([{
        fidele_id: fideleId,
        paroisse_id: paroisseId,
        annee_conference_id: anneeConferenceId
      }])

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Erreur lors de l\'association:', error)
    return { error: 'Erreur lors de l\'association' }
  }
}

// ============================================
// FONCTIONS DE COMPTE
// ============================================

// Créer un compte à partir d'un fidèle
export async function creerCompteFidele(formData: FormData) {
  const fidele_id = parseInt(formData.get('fidele_id') as string)
  const mot_de_passe = formData.get('mot_de_passe') as string
  const role_id = parseInt(formData.get('role_id') as string)

  // Récupérer les informations du fidèle
  const { data: fidele, error: fideleError } = await supabase
    .from('fidele')
    .select('*')
    .eq('id', fidele_id)
    .single()

  if (fideleError || !fidele) {
    return { error: 'Fidèle non trouvé' }
  }

  // Vérifier si un compte existe déjà
  const { data: compteExistant } = await supabase
    .from('compte')
    .select('id')
    .eq('fidele_id', fidele_id)
    .single()

  if (compteExistant) {
    return { error: 'Un compte existe déjà pour ce fidèle' }
  }

  // Hasher le mot de passe
  const hashedPassword = await bcrypt.hash(mot_de_passe, 10)

  // Créer le nom complet
  const nom_complet = `${fidele.nom} ${fidele.post_nom} ${fidele.prenom}`

  // Créer le compte
  const { data: newCompte, error } = await supabase
    .from('compte')
    .insert([
      {
        nom_complet,
        numero: fidele.contact,
        adresse: fidele.adresse,
        profile_img: fidele.profile_img,
        mot_de_passe: hashedPassword,
        role_id,
        fidele_id
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Erreur lors de la création du compte:', error)
    return { error: 'Erreur lors de la création du compte' }
  }

  return { success: true, compte: newCompte }
}

// ============================================
// FONCTIONS D'UPLOAD
// ============================================

// Upload d'image pour un fidèle
export async function uploadFideleImage(formData: FormData) {
  try {
    const file = formData.get('image') as File
    const fideleId = formData.get('fidele_id') as string

    if (!fideleId || !file) {
      return { error: 'Fidèle non identifié ou fichier manquant' }
    }

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      return { error: 'Le fichier doit être une image' }
    }

    // Vérifier la taille (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { error: 'L\'image ne doit pas dépasser 5MB' }
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop()
    const fileName = `fidele-${fideleId}-${Date.now()}.${fileExt}`
    const filePath = fileName

    // Upload de l'image
    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { error: 'Erreur lors de l\'upload' }
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath)

    // Mettre à jour le fidèle
    const { error: updateError } = await supabase
      .from('fidele')
      .update({ profile_img: publicUrl })
      .eq('id', fideleId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { error: 'Erreur lors de la mise à jour du profil' }
    }

    // Mettre à jour le compte lié si existant
    await supabase
      .from('compte')
      .update({ profile_img: publicUrl })
      .eq('fidele_id', fideleId)

    return { success: true, imageUrl: publicUrl }
  } catch (error) {
    console.error('Erreur inattendue:', error)
    return { error: 'Une erreur inattendue est survenue' }
  }
}




// actions/fidele.ts - Mise à jour de la fonction createFidele

export async function createFidele(formData: FormData, annee_conference_id?: number) {
  const nom = formData.get('nom') as string
  const post_nom = formData.get('post_nom') as string
  const prenom = formData.get('prenom') as string
  const contact = formData.get('contact') as string
  const adresse = formData.get('adresse') as string
  const annee_naissance = formData.get('annee_naissance') 
    ? parseInt(formData.get('annee_naissance') as string)
    : null
  const sexe = formData.get('sexe') as string || null
  const fidele_type = formData.get('fidele_type') as string || null // Nouveau champ
  const actif = formData.get('actif') === 'on' || formData.get('actif') === 'true'
  const paroisse_id = formData.get('paroisse_id') 
    ? parseInt(formData.get('paroisse_id') as string)
    : null

  console.log('📌 createFidele - Paramètres:', { annee_conference_id, paroisse_id, fidele_type })

  // Vérifier si le contact existe déjà
  const { data: existingFidele } = await supabase
    .from('fidele')
    .select('id')
    .eq('contact', contact)
    .single()

  if (existingFidele) {
    return { error: 'Ce contact est déjà utilisé' }
  }

  // Créer le fidèle avec le nouveau champ fidele_type
  const { data: newFidele, error } = await supabase
    .from('fidele')
    .insert([
      {
        nom,
        post_nom,
        prenom,
        contact,
        adresse,
        annee_naissance,
        sexe,
        fidele_type, // Ajout du nouveau champ
        actif,
        paroisse_id
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('❌ Erreur création fidèle:', error)
    return { error: 'Erreur lors de la création du fidèle' }
  }

  console.log('✅ Fidèle créé:', newFidele.id)

  // Si une paroisse et une année de conférence sont fournies, ajouter dans fidele_paroisse
  if (paroisse_id && newFidele && annee_conference_id) {
    const { error: fpError } = await supabase
      .from('fidele_paroisse')
      .insert([
        {
          fidele_id: newFidele.id,
          paroisse_id: paroisse_id,
          annee_conference_id: annee_conference_id
        }
      ])

    if (fpError) {
      console.error('❌ Erreur insertion fidele_paroisse:', fpError)
    } else {
      console.log('✅ fidele_paroisse créé avec succès')
    }
  }

  return { success: true, fidele: newFidele }
}

// actions/fidele.ts - Mise à jour de la fonction updateFidele

export async function updateFidele(formData: FormData) {
  const id = parseInt(formData.get('id') as string)
  const nom = formData.get('nom') as string
  const post_nom = formData.get('post_nom') as string
  const prenom = formData.get('prenom') as string
  const contact = formData.get('contact') as string
  const adresse = formData.get('adresse') as string
  const annee_naissance = formData.get('annee_naissance') 
    ? parseInt(formData.get('annee_naissance') as string)
    : null
  const sexe = formData.get('sexe') as string || null
  const fidele_type = formData.get('fidele_type') as string || null // Nouveau champ
  const actif = formData.get('actif') === 'on' || formData.get('actif') === 'true'
  const nouvelleParoisseId = formData.get('paroisse_id') 
    ? parseInt(formData.get('paroisse_id') as string)
    : null

  // Récupérer l'ancienne paroisse
  const { data: oldFidele } = await supabase
    .from('fidele')
    .select('paroisse_id')
    .eq('id', id)
    .single()

  const ancienneParoisseId = oldFidele?.paroisse_id

  // Mettre à jour le fidèle avec le nouveau champ
  const { error: updateError } = await supabase
    .from('fidele')
    .update({
      nom,
      post_nom,
      prenom,
      contact,
      adresse,
      annee_naissance,
      sexe,
      fidele_type, // Ajout du nouveau champ
      actif,
      paroisse_id: nouvelleParoisseId,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (updateError) {
    console.error('Erreur lors de la mise à jour du fidèle:', updateError)
    return { error: 'Erreur lors de la mise à jour du fidèle' }
  }

  // Si la paroisse a changé, ajouter une entrée dans fidele_paroisse
  if (ancienneParoisseId !== nouvelleParoisseId && nouvelleParoisseId) {
    const conferenceId = await getConferenceIdByParoisse(nouvelleParoisseId)

    if (conferenceId) {
      const currentAnneeConf = await getCurrentAnneeConference(conferenceId)
      if (currentAnneeConf) {
        // Vérifier si une association existe déjà pour cette année
        const { data: existing } = await supabase
          .from('fidele_paroisse')
          .select('id')
          .eq('fidele_id', id)
          .eq('annee_conference_id', currentAnneeConf.id)
          .maybeSingle()

        if (!existing) {
          await supabase
            .from('fidele_paroisse')
            .insert([{
              fidele_id: id,
              paroisse_id: nouvelleParoisseId,
              annee_conference_id: currentAnneeConf.id
            }])
        }
      }
    }
  }

  // Mettre à jour le compte lié
  await supabase
    .from('compte')
    .update({
      nom_complet: `${nom} ${post_nom} ${prenom}`,
      numero: contact,
      adresse: adresse,
      updated_at: new Date().toISOString()
    })
    .eq('fidele_id', id)

  return { success: true }
}



// actions/fidele.ts - Mise à jour de getFidelesStats

export async function getFidelesStats() {
  const { data: stats, error } = await supabase
    .from('fidele')
    .select('actif, sexe, annee_naissance, fidele_type') // Ajout de fidele_type

  if (error) {
    console.error('Erreur lors de la récupération des statistiques:', error)
    return null
  }

  const total = stats.length
  const actifs = stats.filter(f => f.actif).length
  const inactifs = total - actifs
  const hommes = stats.filter(f => f.sexe === 'M').length
  const femmes = stats.filter(f => f.sexe === 'F').length
  const nonRenseigne = stats.filter(f => !f.sexe).length

  // Statistiques par type de fidèle
  const enfants = stats.filter(f => f.fidele_type === 'enfant').length
  const jeunes = stats.filter(f => f.fidele_type === 'jeune').length
  const adultes = stats.filter(f => f.fidele_type === 'adulte').length
  const vieillards = stats.filter(f => f.fidele_type === 'vieillard').length

  const currentYear = new Date().getFullYear()
  const ages = stats
    .filter(f => f.annee_naissance)
    .map(f => currentYear - f.annee_naissance)
  const ageMoyen = ages.length > 0 
    ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length)
    : null

  return {
    total,
    actifs,
    inactifs,
    hommes,
    femmes,
    nonRenseigne,
    ageMoyen,
    // Nouvelles statistiques par catégorie
    categories: {
      enfants,
      jeunes,
      adultes,
      vieillards
    }
  }
}

// actions/fidele.ts - Fonction pour filtrer par type

export async function getFidelesByType(fideleType: string) {
  const { data: fideles, error } = await supabase
    .from('fidele')
    .select(`
      *,
      paroisse:paroisse_id (
        id, 
        nom
      ),
      compte:compte (
        id,
        role_id,
        role:role_id (
          id,
          nom,
          niveau
        )
      )
    `)
    .eq('fidele_type', fideleType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erreur lors de la récupération des fidèles par type:', error)
    return []
  }

  const fidelesTransformes = fideles.map((fidele: any) => {
    const compte = Array.isArray(fidele.compte) 
      ? (fidele.compte.length > 0 ? fidele.compte[0] : null)
      : fidele.compte

    return {
      ...fidele,
      compte: compte
    }
  })

  return fidelesTransformes
}


// actions/fidele.ts - Récupérer les fidèles par paroisse (sans filtre d'année)
// NOTE: Cette fonction est différente de getFidelesByParoisse qui elle filtre aussi par année
export async function getFidelesByParoisseSimple(paroisseId: number) {
  try {
    const { data: fideles, error } = await supabase
      .from('fidele')
      .select(`
        *,
        paroisse:paroisse_id (
          id, 
          nom
        ),
        compte:compte (
          id,
          role_id,
          role:role_id (
            id,
            nom,
            niveau
          )
        )
      `)
      .eq('paroisse_id', paroisseId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erreur lors de la récupération des fidèles par paroisse:', error)
      return []
    }

    // Transformer les données pour s'assurer que compte est un objet ou null
    const fidelesTransformes = fideles.map((fidele: any) => {
      const compte = Array.isArray(fidele.compte) 
        ? (fidele.compte.length > 0 ? fidele.compte[0] : null)
        : fidele.compte

      return {
        ...fidele,
        compte: compte
      }
    })

    return fidelesTransformes
  } catch (error) {
    console.error('Erreur inattendue dans getFidelesByParoisseSimple:', error)
    return []
  }
}