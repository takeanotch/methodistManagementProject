
// actions/projet.ts - Version corrigée
'use server'

import { supabase } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { getUser } from './auth'
import { getCurrentAnneeConference } from './annee-conference'

export interface Projet {
    id: number
    unite_id: number
    annee_conference_id: number
    nom: string
    description: string | null
    type: 'court_terme' | 'moyen_terme' | 'long_terme'
    statut: 'en_cours' | 'termine'
    date_debut: string
    date_fin: string | null
    plan_action_id: number | null
    budget_id: number | null
    created_at: string
    updated_at: string
    unite?: {
        id: number
        nom: string
        niveau: string
    }
    plan_action?: {
        id: number
        titre: string
    }
    budget?: {
        id: number
        libelle: string
        montant: number
        type: string
        currency: string
    }
}

export interface CreateProjetInput {
    nom: string
    description?: string | null
    type: 'court_terme' | 'moyen_terme' | 'long_terme'
    date_debut?: Date
    date_fin?: Date | null
    plan_action_id?: number | null
    budget_id?: number | null
}

// Récupérer les projets d'une unité
export async function getProjetsByUnite(
    uniteId: number,
    anneeConferenceId?: number,
    statut?: 'en_cours' | 'termine'
): Promise<Projet[]> {
    try {
        let query = supabase
            .from('projet')
            .select(`
                *,
                unite:unite_id (id, nom, niveau),
                plan_action:plan_action_id (id, titre),
                budget:budget_id (id, libelle, montant, type, currency)
            `)
            .eq('unite_id', uniteId)
            .order('created_at', { ascending: false })

        if (anneeConferenceId) {
            query = query.eq('annee_conference_id', anneeConferenceId)
        }

        if (statut) {
            query = query.eq('statut', statut)
        }

        const { data, error } = await query

        if (error) {
            console.error('Erreur getProjetsByUnite:', error)
            return []
        }

        return (data || []).map((projet: any) => ({
            ...projet,
            unite: Array.isArray(projet.unite) ? projet.unite[0] : projet.unite,
            plan_action: Array.isArray(projet.plan_action) ? projet.plan_action[0] : projet.plan_action,
            budget: Array.isArray(projet.budget) ? projet.budget[0] : projet.budget
        }))
    } catch (error) {
        console.error('Erreur getProjetsByUnite:', error)
        return []
    }
}

// Récupérer un projet par son ID
export async function getProjetById(id: number): Promise<Projet | null> {
    try {
        const { data, error } = await supabase
            .from('projet')
            .select(`
                *,
                unite:unite_id (id, nom, niveau),
                plan_action:plan_action_id (id, titre),
                budget:budget_id (id, libelle, montant, type, currency)
            `)
            .eq('id', id)
            .single()

        if (error) {
            console.error('Erreur getProjetById:', error)
            return null
        }

        return {
            ...data,
            unite: Array.isArray(data.unite) ? data.unite[0] : data.unite,
            plan_action: Array.isArray(data.plan_action) ? data.plan_action[0] : data.plan_action,
            budget: Array.isArray(data.budget) ? data.budget[0] : data.budget
        }
    } catch (error) {
        console.error('Erreur getProjetById:', error)
        return null
    }
}



// Mettre à jour un projet
export async function updateProjet(
    projetId: number,
    updates: Partial<CreateProjetInput & { statut?: 'en_cours' | 'termine' }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user?.fidele_id) {
            return { success: false, error: 'Utilisateur non connecté' }
        }

        const projet = await getProjetById(projetId)
        if (!projet) {
            return { success: false, error: 'Projet non trouvé' }
        }

        const updateData: any = {
            updated_at: new Date().toISOString()
        }

        if (updates.nom !== undefined) updateData.nom = updates.nom.trim()
        if (updates.description !== undefined) updateData.description = updates.description?.trim() || null
        if (updates.type !== undefined) updateData.type = updates.type
        if (updates.statut !== undefined) updateData.statut = updates.statut
        if (updates.date_debut !== undefined) updateData.date_debut = updates.date_debut?.toISOString().split('T')[0]
        if (updates.date_fin !== undefined) updateData.date_fin = updates.date_fin?.toISOString().split('T')[0] || null
        if (updates.plan_action_id !== undefined) updateData.plan_action_id = updates.plan_action_id || null
        if (updates.budget_id !== undefined) updateData.budget_id = updates.budget_id || null

        const { error } = await supabase
            .from('projet')
            .update(updateData)
            .eq('id', projetId)

        if (error) {
            console.error('Erreur mise à jour projet:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/projets')
        revalidatePath(`/projets/${projetId}`)

        return { success: true }
    } catch (error) {
        console.error('Erreur updateProjet:', error)
        return { success: false, error: 'Une erreur est survenue' }
    }
}

// Supprimer un projet
export async function deleteProjet(projetId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user?.fidele_id) {
            return { success: false, error: 'Utilisateur non connecté' }
        }

        const { error } = await supabase
            .from('projet')
            .delete()
            .eq('id', projetId)

        if (error) {
            console.error('Erreur suppression projet:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/projets')

        return { success: true }
    } catch (error) {
        console.error('Erreur deleteProjet:', error)
        return { success: false, error: 'Une erreur est survenue' }
    }
}

// Récupérer les plans d'action disponibles pour une unité
export async function getPlansActionForProjet(uniteId: number): Promise<{ id: number; titre: string }[]> {
    try {
        const { data, error } = await supabase
            .from('plan_action')
            .select('id, titre')
            .eq('unite_id', uniteId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erreur getPlansActionForProjet:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Erreur getPlansActionForProjet:', error)
        return []
    }
}

// Récupérer les budgets disponibles pour une unité
export async function getBudgetsForProjet(uniteId: number): Promise<{ id: number; libelle: string; montant: number; type: string; currency: string }[]> {
    try {
        const { data, error } = await supabase
            .from('budget')
            .select('id, libelle, montant, type, currency')
            .eq('unite_id', uniteId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Erreur getBudgetsForProjet:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Erreur getBudgetsForProjet:', error)
        return []
    }
}

// Récupérer les projets de l'utilisateur connecté
export async function getMyProjets(statut?: 'en_cours' | 'termine'): Promise<Projet[]> {
    try {
        const user = await getUser()
        if (!user?.fidele_id) {
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

        // Récupérer l'unité de la paroisse
        const { data: unite } = await supabase
            .from('unite_organisation')
            .select('id')
            .eq('reference_table', 'paroisse')
            .eq('reference_id', fidele.paroisse_id)
            .eq('niveau', 'paroisse')
            .single()

        if (!unite) {
            return []
        }

        return getProjetsByUnite(unite.id, undefined, statut)
    } catch (error) {
        console.error('Erreur getMyProjets:', error)
        return []
    }
}


// Statistiques des projets - CORRIGÉE avec filtre année
export async function getProjetsStats(
    uniteId: number, 
    anneeConferenceId?: number
): Promise<{
    total: number
    enCours: number
    termines: number
    
    parType: Record<string, number>
}> {
    try {
        // Passer anneeConferenceId à getProjetsByUnite
        const projets = await getProjetsByUnite(uniteId, anneeConferenceId)
        
        const total = projets.length
        const enCours = projets.filter(p => p.statut === 'en_cours').length
        const termines = projets.filter(p => p.statut === 'termine').length
        
        const parType: Record<string, number> = {
            court_terme: 0,
            moyen_terme: 0,
            long_terme: 0
        }
        
        projets.forEach(p => {
            parType[p.type] = (parType[p.type] || 0) + 1
        })
        
        return { total, enCours, termines, parType }
    } catch (error) {
        console.error('Erreur getProjetsStats:', error)
        return { 
            total: 0, 
            enCours: 0, 
            termines: 0, 
        
            parType: { court_terme: 0, moyen_terme: 0, long_terme: 0 } 
        }
    }
}

// actions/projet.ts - Version corrigée avec gestion des multiples paroisses

// Fonction helper pour obtenir la conférence à partir d'une unité de type département
async function getConferenceFromDepartementUnite(uniteId: number, referenceId: number, niveau: string): Promise<number | null> {
    console.log('getConferenceFromDepartementUnite appelé:', { uniteId, referenceId, niveau })
    
    try {
        // Si l'unité est de niveau 'paroisse' (c'est le cas pour les départements dans une paroisse)
        if (niveau === 'paroisse') {
            // referenceId ici est l'ID du département
            // Récupérer TOUTES les unités pour ce département
            const { data: unitesDept, error: uniteError } = await supabase
                .from('unite_organisation')
                .select('id_niveau, id')
                .eq('reference_table', 'departement')
                .eq('reference_id', referenceId)
                .eq('niveau', 'paroisse')
            
            if (uniteError) {
                console.error('Erreur récupération unités département:', uniteError)
                return null
            }
            
            if (!unitesDept || unitesDept.length === 0) {
                console.error('Aucune unité département trouvée pour reference_id:', referenceId)
                return null
            }
            
            console.log(`Trouvé ${unitesDept.length} unités pour ce département:`, unitesDept.map(u => u.id_niveau))
            
            // Trouver l'unité qui correspond à l'unité courante
            const currentUnite = unitesDept.find(u => u.id === uniteId)
            
            if (!currentUnite) {
                console.error('Unité courante non trouvée dans la liste')
                return null
            }
            
            const paroisseId = currentUnite.id_niveau
            console.log('Paroisse ID trouvé:', paroisseId)
            
            // Maintenant, récupérer la conférence via la paroisse
            const { data: paroisse, error: paroisseError } = await supabase
                .from('paroisse')
                .select(`
                    district_id,
                    district:district_id (
                        conference_id,
                        conference:conference_id (id)
                    )
                `)
                .eq('id', paroisseId)
                .single()
            
            if (paroisseError) {
                console.error('Erreur récupération paroisse:', paroisseError)
                return null
            }
            
            if (paroisse?.district) {
                const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
                if (district?.conference) {
                    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
                    return conference?.id || null
                }
                return district?.conference_id || null
            }
        }
        
        // Si l'unité est de niveau 'district'
        if (niveau === 'district') {
            const { data: district, error: districtError } = await supabase
                .from('district')
                .select('conference_id')
                .eq('id', referenceId)
                .single()
            
            if (districtError) {
                console.error('Erreur récupération district:', districtError)
                return null
            }
            
            return district?.conference_id || null
        }
        
        // Si l'unité est de niveau 'conference'
        if (niveau === 'conference') {
            return referenceId
        }
        
        return null
    } catch (error) {
        console.error('Erreur getConferenceFromDepartementUnite:', error)
        return null
    }
}


// actions/projet.ts - CORRECTION pour la fonction createProjet

// Remplacer la fonction createProjet existante par celle-ci :

// Créer un projet - VERSION CORRIGÉE POUR TOUS LES NIVEAUX
// export async function createProjet(
//     uniteId: number,
//     input: CreateProjetInput
// ): Promise<{ success: boolean; projet?: Projet; error?: string }> {
//     try {
//         console.log('createProjet - Début:', { uniteId, input })
        
//         // Validation
//         if (!input.nom?.trim()) {
//             return { success: false, error: 'Le nom du projet est requis' }
//         }

//         const user = await getUser()
//         if (!user?.fidele_id) {
//             return { success: false, error: 'Utilisateur non connecté' }
//         }

//         // Récupérer l'unité avec ses infos
//         const { data: unite, error: uniteError } = await supabase
//             .from('unite_organisation')
//             .select('id, reference_id, niveau, id_niveau, reference_table')
//             .eq('id', uniteId)
//             .single()

//         if (uniteError || !unite) {
//             console.error('Unité non trouvée:', uniteError)
//             return { success: false, error: 'Unité non trouvée' }
//         }

//         console.log('Unité trouvée:', unite)

//         // Déterminer la conférence selon le niveau de l'unité
//         let conferenceId: number | null = null

//         if (unite.niveau === 'paroisse') {
//             // Pour une paroisse (ou département dans une paroisse)
//             const paroisseId = unite.id_niveau || unite.reference_id
            
//             const { data: paroisse, error: paroisseError } = await supabase
//                 .from('paroisse')
//                 .select(`
//                     district_id,
//                     district:district_id (
//                         conference_id
//                     )
//                 `)
//                 .eq('id', paroisseId)
//                 .single()
            
//             if (paroisseError) {
//                 console.error('Erreur récupération paroisse:', paroisseError)
//                 return { success: false, error: 'Impossible de trouver la paroisse associée' }
//             }
            
//             if (paroisse?.district) {
//                 const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
//                 conferenceId = district?.conference_id || null
//             }
            
//         } else if (unite.niveau === 'district') {
//             // Pour un district - id_niveau contient l'ID du district
//             const districtId = unite.id_niveau || unite.reference_id
            
//             const { data: district, error: districtError } = await supabase
//                 .from('district')
//                 .select('conference_id')
//                 .eq('id', districtId)
//                 .single()
            
//             if (districtError) {
//                 console.error('Erreur récupération district:', districtError)
//                 return { success: false, error: 'Impossible de trouver le district associé' }
//             }
            
//             conferenceId = district?.conference_id || null
            
//         } else if (unite.niveau === 'conference') {
//             // Pour une conférence - id_niveau contient l'ID de la conférence
//             conferenceId = unite.id_niveau || unite.reference_id
            
//         } else if (unite.niveau === 'region') {
//             // Pour une région
//             conferenceId = null // Une région peut avoir plusieurs conférences, à gérer différemment
//         }

//         console.log('Conférence déterminée:', conferenceId)

//         if (!conferenceId) {
//             return { success: false, error: `Impossible de déterminer la conférence pour ce niveau (${unite.niveau})` }
//         }

//         // Récupérer l'année en cours pour cette conférence
//         const currentAnnee = await getCurrentAnneeConference(conferenceId)
//         if (!currentAnnee) {
//             return { success: false, error: 'Aucune année en cours pour cette conférence' }
//         }

//         console.log('Année en cours:', currentAnnee)

//         // Vérifier les liens optionnels
//         if (input.plan_action_id) {
//             const { data: plan, error: planError } = await supabase
//                 .from('plan_action')
//                 .select('id')
//                 .eq('id', input.plan_action_id)
//                 .eq('unite_id', uniteId)
//                 .maybeSingle()
            
//             if (planError || !plan) {
//                 console.error('Plan non trouvé:', planError)
//                 return { success: false, error: 'Plan d\'action non trouvé ou non lié à cette unité' }
//             }
//         }

//         if (input.budget_id) {
//             const { data: budget, error: budgetError } = await supabase
//                 .from('budget')
//                 .select('id')
//                 .eq('id', input.budget_id)
//                 .eq('unite_id', uniteId)
//                 .maybeSingle()
            
//             if (budgetError || !budget) {
//                 console.error('Budget non trouvé:', budgetError)
//                 return { success: false, error: 'Budget non trouvé ou non lié à cette unité' }
//             }
//         }

//         // Créer le projet
//         const projetData = {
//             unite_id: uniteId,
//             annee_conference_id: currentAnnee.id,
//             nom: input.nom.trim(),
//             description: input.description?.trim() || null,
//             type: input.type,
//             date_debut: input.date_debut?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
//             date_fin: input.date_fin?.toISOString().split('T')[0] || null,
//             plan_action_id: input.plan_action_id || null,
//             budget_id: input.budget_id || null,
//             statut: 'en_cours',
//             created_at: new Date().toISOString(),
//             updated_at: new Date().toISOString()
//         }

//         console.log('Création projet avec données:', projetData)

//         const { data: projet, error } = await supabase
//             .from('projet')
//             .insert([projetData])
//             .select()
//             .single()

//         if (error) {
//             console.error('Erreur création projet:', error)
//             return { success: false, error: error.message }
//         }

//         console.log('Projet créé avec succès:', projet)

//         // Revalidation selon le niveau
//         if (unite.niveau === 'paroisse') {
//             revalidatePath('/paroisse/departements')
//         } else if (unite.niveau === 'district') {
//             revalidatePath('/district/projets')
//             revalidatePath('/district')
//         } else if (unite.niveau === 'conference') {
//             revalidatePath('/conference/projets')
//             revalidatePath('/conference')
//         }
//         revalidatePath('/projets')
        
//         return { success: true, projet }
//     } catch (error) {
//         console.error('Erreur createProjet:', error)
//         return { success: false, error: 'Une erreur est survenue lors de la création du projet' }
//     }
// }




// actions/projet.ts - Ajouts pour les fichiers

export interface ProjetFichier {
    id: number
    projet_id: number
    nom_fichier: string
    chemin_fichier: string
    type_fichier: string
    taille_fichier: number | null
    uploaded_at: string
    uploaded_by: number | null
}

// Récupérer les fichiers d'un projet
export async function getProjetFichiers(projetId: number): Promise<ProjetFichier[]> {
    try {
        const { data, error } = await supabase
            .from('projet_fichier')
            .select('*')
            .eq('projet_id', projetId)
            .order('uploaded_at', { ascending: false })

        if (error) {
            console.error('Erreur getProjetFichiers:', error)
            return []
        }

        return data || []
    } catch (error) {
        console.error('Erreur getProjetFichiers:', error)
        return []
    }
}

// Uploader un fichier
export async function uploadProjetFichier(
    projetId: number,
    file: File
): Promise<{ success: boolean; fichier?: ProjetFichier; error?: string }> {
    try {
        const user = await getUser()
        if (!user?.fidele_id) {
            return { success: false, error: 'Utilisateur non connecté' }
        }

        // Vérifier que le projet existe
        const { data: projet, error: projetError } = await supabase
            .from('projet')
            .select('id')
            .eq('id', projetId)
            .single()

        if (projetError || !projet) {
            return { success: false, error: 'Projet non trouvé' }
        }

        // Valider la taille (10 MB max)
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, error: 'Fichier trop volumineux (max 10 MB)' }
        }

        // Générer un nom unique
        const timestamp = Date.now()
        const safeFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
        const fileName = `${projetId}/${timestamp}_${safeFileName}`

        // Upload vers Storage
        const { error: uploadError } = await supabase.storage
            .from('projets')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            })

        if (uploadError) {
            console.error('Erreur upload:', uploadError)
            return { success: false, error: 'Erreur lors de l\'upload' }
        }

        // Obtenir l'URL publique
        const { data: urlData } = supabase.storage
            .from('projets')
            .getPublicUrl(fileName)

        // Sauvegarder en base
        const { data: fichier, error: dbError } = await supabase
            .from('projet_fichier')
            .insert({
                projet_id: projetId,
                nom_fichier: file.name,
                chemin_fichier: urlData.publicUrl,
                type_fichier: file.type,
                taille_fichier: file.size,
                uploaded_by: user.fidele_id
            })
            .select()
            .single()

        if (dbError) {
            console.error('Erreur DB:', dbError)
            await supabase.storage.from('projets').remove([fileName])
            return { success: false, error: 'Erreur lors de l\'enregistrement' }
        }

        return { success: true, fichier }
    } catch (error) {
        console.error('Erreur uploadProjetFichier:', error)
        return { success: false, error: 'Une erreur est survenue' }
    }
}

// Supprimer un fichier
export async function deleteProjetFichier(fichierId: number): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await getUser()
        if (!user?.fidele_id) {
            return { success: false, error: 'Utilisateur non connecté' }
        }

        // Récupérer le fichier
        const { data: fichier, error: fetchError } = await supabase
            .from('projet_fichier')
            .select('chemin_fichier, projet_id')
            .eq('id', fichierId)
            .single()

        if (fetchError || !fichier) {
            return { success: false, error: 'Fichier non trouvé' }
        }

        // Extraire le chemin du storage
        const urlParts = fichier.chemin_fichier.split('/')
        const storagePath = urlParts.slice(-2).join('/')

        // Supprimer du storage
        const { error: storageError } = await supabase.storage
            .from('projets')
            .remove([storagePath])

        if (storageError) {
            console.error('Erreur suppression storage:', storageError)
        }

        // Supprimer de la DB
        const { error: dbError } = await supabase
            .from('projet_fichier')
            .delete()
            .eq('id', fichierId)

        if (dbError) {
            console.error('Erreur suppression DB:', dbError)
            return { success: false, error: 'Erreur lors de la suppression' }
        }

        return { success: true }
    } catch (error) {
        console.error('Erreur deleteProjetFichier:', error)
        return { success: false, error: 'Une erreur est survenue' }
    }
}

// Télécharger un fichier (obtenir l'URL signée pour téléchargement)
export async function getProjetFichierDownloadUrl(fichierId: number): Promise<{ success: boolean; url?: string; nom_fichier?: string; error?: string }> {
    try {
        // Récupérer le fichier depuis la base de données
        const { data: fichier, error: fetchError } = await supabase
            .from('projet_fichier')
            .select('chemin_fichier, nom_fichier')
            .eq('id', fichierId)
            .single()

        if (fetchError || !fichier) {
            console.error('Fichier non trouvé:', fetchError)
            return { success: false, error: 'Fichier non trouvé' }
        }

        // Extraire le chemin du storage depuis l'URL publique
        // L'URL est de la forme: https://xxx.supabase.co/storage/v1/object/public/projets/123/1234567890_fichier.pdf
        const urlParts = fichier.chemin_fichier.split('/')
        // Récupérer les deux dernières parties: "projetId/timestamp_nomfichier"
        const storagePath = urlParts.slice(-2).join('/')

        console.log('Tentative de création URL signée pour:', storagePath)

        // Créer une URL signée valide pendant 60 secondes
        const { data, error } = await supabase.storage
            .from('projets')
            .createSignedUrl(storagePath, 60) // 60 secondes de validité

        if (error || !data?.signedUrl) {
            console.error('Erreur création URL signée:', error)
            
            // Fallback: utiliser l'URL publique si la création d'URL signée échoue
            // Note: cela nécessite que le bucket soit public
            console.log('Fallback: utilisation de l\'URL publique')
            return { 
                success: true, 
                url: fichier.chemin_fichier, 
                nom_fichier: fichier.nom_fichier 
            }
        }

        return { 
            success: true, 
            url: data.signedUrl, 
            nom_fichier: fichier.nom_fichier 
        }
    } catch (error) {
        console.error('Erreur getProjetFichierDownloadUrl:', error)
        return { success: false, error: 'Une erreur est survenue lors de la génération du lien de téléchargement' }
    }
}



// actions/projet.ts - Ajout du support pour le niveau 'cabinet'

// Créer un projet - VERSION CORRIGÉE POUR TOUS LES NIVEAUX (incluant 'cabinet')
export async function createProjet(
    uniteId: number,
    input: CreateProjetInput
): Promise<{ success: boolean; projet?: Projet; error?: string }> {
    try {
        console.log('createProjet - Début:', { uniteId, input })
        
        // Validation
        if (!input.nom?.trim()) {
            return { success: false, error: 'Le nom du projet est requis' }
        }

        const user = await getUser()
        if (!user?.fidele_id) {
            return { success: false, error: 'Utilisateur non connecté' }
        }

        // Récupérer l'unité avec ses infos
        const { data: unite, error: uniteError } = await supabase
            .from('unite_organisation')
            .select('id, reference_id, niveau, id_niveau, reference_table')
            .eq('id', uniteId)
            .single()

        if (uniteError || !unite) {
            console.error('Unité non trouvée:', uniteError)
            return { success: false, error: 'Unité non trouvée' }
        }

        console.log('Unité trouvée:', unite)

        // Déterminer la conférence selon le niveau de l'unité
        let conferenceId: number | null = null

        // ============================================
        // NOUVEAU : Support du niveau 'cabinet'
        // ============================================
        if (unite.niveau === 'cabinet') {
            // Pour un cabinet pastoral, reference_id contient la paroisse_id
            const paroisseId = unite.reference_id
            
            console.log('📌 Niveau CABINET détecté, paroisse_id:', paroisseId)
            
            // Récupérer la conférence via la paroisse
            const { data: paroisse, error: paroisseError } = await supabase
                .from('paroisse')
                .select(`
                    district_id,
                    district:district_id (
                        conference_id,
                        conference:conference_id (id)
                    )
                `)
                .eq('id', paroisseId)
                .single()
            
            if (paroisseError) {
                console.error('Erreur récupération paroisse pour cabinet:', paroisseError)
                return { success: false, error: 'Impossible de trouver la paroisse associée au cabinet' }
            }
            
            if (paroisse?.district) {
                const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
                if (district?.conference) {
                    const conference = Array.isArray(district.conference) ? district.conference[0] : district.conference
                    conferenceId = conference?.id || null
                } else {
                    conferenceId = district?.conference_id || null
                }
            }
            
            console.log('Conférence trouvée pour cabinet:', conferenceId)
            
        } else if (unite.niveau === 'paroisse') {
            // Pour une paroisse (ou département dans une paroisse)
            const paroisseId = unite.id_niveau || unite.reference_id
            
            const { data: paroisse, error: paroisseError } = await supabase
                .from('paroisse')
                .select(`
                    district_id,
                    district:district_id (
                        conference_id
                    )
                `)
                .eq('id', paroisseId)
                .single()
            
            if (paroisseError) {
                console.error('Erreur récupération paroisse:', paroisseError)
                return { success: false, error: 'Impossible de trouver la paroisse associée' }
            }
            
            if (paroisse?.district) {
                const district = Array.isArray(paroisse.district) ? paroisse.district[0] : paroisse.district
                conferenceId = district?.conference_id || null
            }
            
        } else if (unite.niveau === 'district') {
            // Pour un district
            const districtId = unite.id_niveau || unite.reference_id
            
            const { data: district, error: districtError } = await supabase
                .from('district')
                .select('conference_id')
                .eq('id', districtId)
                .single()
            
            if (districtError) {
                console.error('Erreur récupération district:', districtError)
                return { success: false, error: 'Impossible de trouver le district associé' }
            }
            
            conferenceId = district?.conference_id || null
            
        } else if (unite.niveau === 'conference') {
            // Pour une conférence
            conferenceId = unite.id_niveau || unite.reference_id
            
        } else if (unite.niveau === 'region') {
            // Pour une région - on ne peut pas déterminer une seule conférence
            conferenceId = null
        }

        console.log('Conférence déterminée:', conferenceId)

        if (!conferenceId) {
            return { success: false, error: `Impossible de déterminer la conférence pour ce niveau (${unite.niveau})` }
        }

        // Récupérer l'année en cours pour cette conférence
        const currentAnnee = await getCurrentAnneeConference(conferenceId)
        if (!currentAnnee) {
            return { success: false, error: 'Aucune année en cours pour cette conférence' }
        }

        console.log('Année en cours:', currentAnnee)

        // Vérifier les liens optionnels
        if (input.plan_action_id) {
            const { data: plan, error: planError } = await supabase
                .from('plan_action')
                .select('id')
                .eq('id', input.plan_action_id)
                .eq('unite_id', uniteId)
                .maybeSingle()
            
            if (planError || !plan) {
                console.error('Plan non trouvé:', planError)
                return { success: false, error: 'Plan d\'action non trouvé ou non lié à cette unité' }
            }
        }

        if (input.budget_id) {
            const { data: budget, error: budgetError } = await supabase
                .from('budget')
                .select('id')
                .eq('id', input.budget_id)
                .eq('unite_id', uniteId)
                .maybeSingle()
            
            if (budgetError || !budget) {
                console.error('Budget non trouvé:', budgetError)
                return { success: false, error: 'Budget non trouvé ou non lié à cette unité' }
            }
        }

        // Créer le projet
        const projetData = {
            unite_id: uniteId,
            annee_conference_id: currentAnnee.id,
            nom: input.nom.trim(),
            description: input.description?.trim() || null,
            type: input.type,
            date_debut: input.date_debut?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
            date_fin: input.date_fin?.toISOString().split('T')[0] || null,
            plan_action_id: input.plan_action_id || null,
            budget_id: input.budget_id || null,
            statut: 'en_cours',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        }

        console.log('Création projet avec données:', projetData)

        const { data: projet, error } = await supabase
            .from('projet')
            .insert([projetData])
            .select()
            .single()

        if (error) {
            console.error('Erreur création projet:', error)
            return { success: false, error: error.message }
        }

        console.log('Projet créé avec succès:', projet)

        // Revalidation selon le niveau
        if (unite.niveau === 'paroisse' || unite.niveau === 'cabinet') {
            revalidatePath('/paroisse/departements')
            revalidatePath('/cabinet')
        } else if (unite.niveau === 'district') {
            revalidatePath('/district/projets')
            revalidatePath('/district')
        } else if (unite.niveau === 'conference') {
            revalidatePath('/conference/projets')
            revalidatePath('/conference')
        }
        revalidatePath('/projets')
        
        return { success: true, projet }
    } catch (error) {
        console.error('Erreur createProjet:', error)
        return { success: false, error: 'Une erreur est survenue lors de la création du projet' }
    }
}