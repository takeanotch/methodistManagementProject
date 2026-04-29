
// app/visibilite/page.tsx
import { getCurrentFidele } from '@/actions/auth'
import { redirect } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getConfiguration } from '@/actions/configurations'
import { VisibiliteClient } from './VisibiliteClient'

// Types
type UserLevel = 'conference' | 'district' | 'paroisse' | 'none'
type NiveauType = 'region' | 'conference' | 'district' | 'paroisse' | 'departement'

interface UniteOrganisation {
  id: number
  id_niveau: number
  nom: string
  niveau: NiveauType
  parent_id: number | null
  reference_id: number
  reference_table: string
  created_at: string
  updated_at: string
}

interface StructureNames {
  conference?: string
  district?: string
  paroisse?: string
  departement?: string
  region?: string
}

// Fonction pour récupérer le nom d'une structure par son ID et sa table
async function getStructureName(table: string, id: number): Promise<string | null> {
  try {
    let result = null
    
    switch (table) {
      case 'region':
        result = await supabase.from('region').select('nom').eq('id', id).single()
        break
      case 'conference':
        result = await supabase.from('conference').select('nom').eq('id', id).single()
        break
      case 'district':
        result = await supabase.from('district').select('nom').eq('id', id).single()
        break
      case 'paroisse':
        result = await supabase.from('paroisse').select('nom').eq('id', id).single()
        break
      case 'departement':
        result = await supabase.from('departement').select('nom').eq('id', id).single()
        break
    }
    
    if (result && !result.error && result.data) {
      return result.data.nom
    }
    
    return null
  } catch (error) {
    console.error(`Erreur getStructureName pour ${table} ${id}:`, error)
    return null
  }
}

// Fonction pour récupérer tous les noms des structures liées à une unité
async function getAllStructureNames(unite: UniteOrganisation): Promise<StructureNames> {
  const names: StructureNames = {}
  
  try {
    console.log(`\n🔍 Traitement unité: ${unite.nom} (niveau: ${unite.niveau}, ref_table: ${unite.reference_table}, ref_id: ${unite.reference_id}, id_niveau: ${unite.id_niveau})`)
    
    // 1. Récupérer le nom de la structure directement liée
    const directName = await getStructureName(unite.reference_table, unite.reference_id)
    if (directName) {
      // Si c'est un département, on le stocke dans departement
      if (unite.reference_table === 'departement') {
        names.departement = directName
      } else {
        names[unite.reference_table as keyof StructureNames] = directName
      }
      console.log(`   ✅ Nom direct (${unite.reference_table}): ${directName}`)
    }
    
    // 2. Récupérer le nom de la structure parente via id_niveau
    // id_niveau contient l'ID de la paroisse, du district ou de la conférence selon le niveau
    if (unite.id_niveau > 0) {
      let niveauTable = ''
      let niveauNom = ''
      
      // Déterminer la table en fonction du niveau de l'unité
      if (unite.niveau === 'paroisse' || unite.niveau === 'departement') {
        niveauTable = 'paroisse'
        niveauNom = 'Paroisse'
      } else if (unite.niveau === 'district') {
        niveauTable = 'district'
        niveauNom = 'District'
      } else if (unite.niveau === 'conference') {
        niveauTable = 'conference'
        niveauNom = 'Conférence'
      } else if (unite.niveau === 'region') {
        niveauTable = 'region'
        niveauNom = 'Région'
      }
      
      if (niveauTable) {
        const parentName = await getStructureName(niveauTable, unite.id_niveau)
        if (parentName) {
          names[niveauTable as keyof StructureNames] = parentName
          console.log(`   ✅ ${niveauNom} (via id_niveau): ${parentName}`)
          
          // Si c'est une paroisse, récupérer aussi son district
          if (niveauTable === 'paroisse') {
            const { data: paroisse } = await supabase
              .from('paroisse')
              .select('district_id')
              .eq('id', unite.id_niveau)
              .single()
            
            if (paroisse?.district_id) {
              const districtName = await getStructureName('district', paroisse.district_id)
              if (districtName) {
                names.district = districtName
                console.log(`   ✅ District (via paroisse): ${districtName}`)
                
                // Récupérer la conférence du district
                const { data: district } = await supabase
                  .from('district')
                  .select('conference_id')
                  .eq('id', paroisse.district_id)
                  .single()
                
                if (district?.conference_id) {
                  const conferenceName = await getStructureName('conference', district.conference_id)
                  if (conferenceName) {
                    names.conference = conferenceName
                    console.log(`   ✅ Conférence (via district): ${conferenceName}`)
                    
                    // Récupérer la région
                    const { data: conference } = await supabase
                      .from('conference')
                      .select('region_id')
                      .eq('id', district.conference_id)
                      .single()
                    
                    if (conference?.region_id) {
                      const regionName = await getStructureName('region', conference.region_id)
                      if (regionName) {
                        names.region = regionName
                        console.log(`   ✅ Région (via conférence): ${regionName}`)
                      }
                    }
                  }
                }
              }
            }
          }
          
          // Si c'est un district, récupérer sa conférence
          if (niveauTable === 'district') {
            const { data: district } = await supabase
              .from('district')
              .select('conference_id')
              .eq('id', unite.id_niveau)
              .single()
            
            if (district?.conference_id) {
              const conferenceName = await getStructureName('conference', district.conference_id)
              if (conferenceName) {
                names.conference = conferenceName
                console.log(`   ✅ Conférence (via district): ${conferenceName}`)
                
                // Récupérer la région
                const { data: conference } = await supabase
                  .from('conference')
                  .select('region_id')
                  .eq('id', district.conference_id)
                  .single()
                
                if (conference?.region_id) {
                  const regionName = await getStructureName('region', conference.region_id)
                  if (regionName) {
                    names.region = regionName
                    console.log(`   ✅ Région (via conférence): ${regionName}`)
                  }
                }
              }
            }
          }
          
          // Si c'est une conférence, récupérer sa région
          if (niveauTable === 'conference') {
            const { data: conference } = await supabase
              .from('conference')
              .select('region_id')
              .eq('id', unite.id_niveau)
              .single()
            
            if (conference?.region_id) {
              const regionName = await getStructureName('region', conference.region_id)
              if (regionName) {
                names.region = regionName
                console.log(`   ✅ Région (via conférence): ${regionName}`)
              }
            }
          }
        }
      }
    }
    
    console.log(`   📋 Noms finaux:`, names)
    
  } catch (error) {
    console.error('Erreur getAllStructureNames:', error)
  }
  
  return names
}

// Fonction pour construire la hiérarchie complète
async function getHierarchieUnite(unite: UniteOrganisation) {
  const hierarchie: any = {}
  
  try {
    // Si id_niveau correspond à une paroisse
    if (unite.id_niveau > 0) {
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('id, nom, district_id')
        .eq('id', unite.id_niveau)
        .single()
      
      if (paroisse) {
        hierarchie.paroisse = { id: paroisse.id, nom: paroisse.nom }
        
        if (paroisse.district_id) {
          const { data: district } = await supabase
            .from('district')
            .select('id, nom, conference_id')
            .eq('id', paroisse.district_id)
            .single()
          
          if (district) {
            hierarchie.district = { id: district.id, nom: district.nom }
            
            if (district.conference_id) {
              const { data: conference } = await supabase
                .from('conference')
                .select('id, nom, region_id')
                .eq('id', district.conference_id)
                .single()
              
              if (conference) {
                hierarchie.conference = { id: conference.id, nom: conference.nom }
                
                if (conference.region_id) {
                  const { data: region } = await supabase
                    .from('region')
                    .select('id, nom')
                    .eq('id', conference.region_id)
                    .single()
                  
                  if (region) {
                    hierarchie.region = { id: region.id, nom: region.nom }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Si l'unité elle-même est une paroisse
    if (unite.reference_table === 'paroisse') {
      const { data: paroisse } = await supabase
        .from('paroisse')
        .select('id, nom, district_id')
        .eq('id', unite.reference_id)
        .single()
      
      if (paroisse) {
        hierarchie.paroisse = { id: paroisse.id, nom: paroisse.nom }
        
        if (paroisse.district_id) {
          const { data: district } = await supabase
            .from('district')
            .select('id, nom, conference_id')
            .eq('id', paroisse.district_id)
            .single()
          
          if (district) {
            hierarchie.district = { id: district.id, nom: district.nom }
            
            if (district.conference_id) {
              const { data: conference } = await supabase
                .from('conference')
                .select('id, nom, region_id')
                .eq('id', district.conference_id)
                .single()
              
              if (conference) {
                hierarchie.conference = { id: conference.id, nom: conference.nom }
                
                if (conference.region_id) {
                  const { data: region } = await supabase
                    .from('region')
                    .select('id, nom')
                    .eq('id', conference.region_id)
                    .single()
                  
                  if (region) {
                    hierarchie.region = { id: region.id, nom: region.nom }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Si l'unité est un district
    if (unite.reference_table === 'district') {
      const { data: district } = await supabase
        .from('district')
        .select('id, nom, conference_id')
        .eq('id', unite.reference_id)
        .single()
      
      if (district) {
        hierarchie.district = { id: district.id, nom: district.nom }
        
        if (district.conference_id) {
          const { data: conference } = await supabase
            .from('conference')
            .select('id, nom, region_id')
            .eq('id', district.conference_id)
            .single()
          
          if (conference) {
            hierarchie.conference = { id: conference.id, nom: conference.nom }
            
            if (conference.region_id) {
              const { data: region } = await supabase
                .from('region')
                .select('id, nom')
                .eq('id', conference.region_id)
                .single()
              
              if (region) {
                hierarchie.region = { id: region.id, nom: region.nom }
              }
            }
          }
        }
      }
    }
    
    // Si l'unité est une conférence
    if (unite.reference_table === 'conference') {
      const { data: conference } = await supabase
        .from('conference')
        .select('id, nom, region_id')
        .eq('id', unite.reference_id)
        .single()
      
      if (conference) {
        hierarchie.conference = { id: conference.id, nom: conference.nom }
        
        if (conference.region_id) {
          const { data: region } = await supabase
            .from('region')
            .select('id, nom')
            .eq('id', conference.region_id)
            .single()
          
          if (region) {
            hierarchie.region = { id: region.id, nom: region.nom }
          }
        }
      }
    }
    
    // Si l'unité est une région
    if (unite.reference_table === 'region') {
      const { data: region } = await supabase
        .from('region')
        .select('id, nom')
        .eq('id', unite.reference_id)
        .single()
      
      if (region) {
        hierarchie.region = { id: region.id, nom: region.nom }
      }
    }
  } catch (error) {
    console.error('Erreur getHierarchieUnite:', error)
  }
  
  return hierarchie
}

function determineUserLevel(fidele: any): UserLevel {
  if (fidele.paroisse?.district?.conference_id) {
    return 'conference'
  }
  if (fidele.paroisse?.district_id) {
    return 'district'
  }
  if (fidele.paroisse_id) {
    return 'paroisse'
  }
  return 'none'
}

function calculateUserAccess(
  unite: UniteOrganisation, 
  userLevel: UserLevel, 
  fidele: any,
  hierarchie?: any
) {
  const canViewConference = userLevel === 'conference' || 
    (userLevel === 'district' && hierarchie?.conference?.id === fidele.paroisse?.district?.conference_id) ||
    (userLevel === 'paroisse' && hierarchie?.paroisse?.id === fidele.paroisse_id)

  const canViewDistrict = userLevel === 'conference' || 
    userLevel === 'district' ||
    (userLevel === 'paroisse' && hierarchie?.district?.id === fidele.paroisse?.district_id)

  const canViewParoisse = userLevel === 'conference' || 
    userLevel === 'district' || 
    userLevel === 'paroisse'

  return {
    canViewConference,
    canViewDistrict,
    canViewParoisse,
    userLevel
  }
}

function calculateVisibilityStatus(unite: UniteOrganisation, config: any, userLevel: UserLevel) {
  const defaultVisibilite = {
    conference: 'visible' as const,
    district: 'visible' as const,
    paroisse: 'visible' as const
  }

  const visibilite = config?.visibilite_budget || defaultVisibilite

  return {
    conference: {
      isVisible: visibilite.conference === 'visible',
      isBlocked: visibilite.conference === 'masque',
      reason: visibilite.conference === 'masque' ? 'Masqué par configuration' : ''
    },
    district: {
      isVisible: visibilite.district === 'visible',
      isBlocked: visibilite.district === 'masque',
      reason: visibilite.district === 'masque' ? 'Masqué par configuration' : ''
    },
    paroisse: {
      isVisible: visibilite.paroisse === 'visible',
      isBlocked: visibilite.paroisse === 'masque',
      reason: visibilite.paroisse === 'masque' ? 'Masqué par configuration' : ''
    }
  }
}

function calculateUserBlockageStats(unites: any[], fidele: any) {
  const stats = {
    conference: { total: 0, blockedCount: 0, blocked: false },
    district: { total: 0, blockedCount: 0, blocked: false },
    paroisse: { total: 0, blockedCount: 0, blocked: false },
    totalUnites: unites.length
  }

  unites.forEach(unite => {
    if (unite.niveau === 'conference') {
      stats.conference.total++
      if (unite.visibilite_status.conference.isBlocked) {
        stats.conference.blockedCount++
      }
    }
    if (unite.niveau === 'district') {
      stats.district.total++
      if (unite.visibilite_status.district.isBlocked) {
        stats.district.blockedCount++
      }
    }
    if (unite.niveau === 'paroisse' || unite.niveau === 'departement') {
      stats.paroisse.total++
      if (unite.visibilite_status.paroisse.isBlocked) {
        stats.paroisse.blockedCount++
      }
    }
  })

  const userUnite = unites.find(u => 
    (u.niveau === 'paroisse' || u.niveau === 'departement') && u.id_niveau === fidele.paroisse_id
  )

  if (userUnite) {
    stats.conference.blocked = userUnite.visibilite_status.conference.isBlocked
    stats.district.blocked = userUnite.visibilite_status.district.isBlocked
    stats.paroisse.blocked = userUnite.visibilite_status.paroisse.isBlocked
  }

  return stats
}

// Composant principal (Server Component)
export default async function VisibilitePage() {
  const currentFidele = await getCurrentFidele()
  
  if (!currentFidele) {
    redirect('/login')
  }

  const userLevel = determineUserLevel(currentFidele)
  
  // Récupérer toutes les unités
  const { data: unites, error } = await supabase
    .from('unite_organisation')
    .select('*')
    .order('niveau', { ascending: true })
    .order('nom', { ascending: true })

  if (error || !unites) {
    console.error('Erreur chargement unités:', error)
    return (
      <VisibiliteClient
        currentFidele={currentFidele}
        initialUnites={[]}
        userLevel={userLevel}
        userStats={{
          conference: { total: 0, blockedCount: 0, blocked: false },
          district: { total: 0, blockedCount: 0, blocked: false },
          paroisse: { total: 0, blockedCount: 0, blocked: false },
          totalUnites: 0
        }}
      />
    )
  }

  console.log(`\n📊 ${unites.length} unités trouvées`)
  
  const unitesWithConfig = await Promise.all(
    unites.map(async (unite: UniteOrganisation) => {
      const configuration = await getConfiguration(unite.id)
      const hierarchie = await getHierarchieUnite(unite)
      const structureNames = await getAllStructureNames(unite)
      
      return {
        ...unite,
        configuration,
        hierarchie_complete: hierarchie,
        structureNames,
        visibilite_status: calculateVisibilityStatus(unite, configuration, userLevel),
        userAccess: calculateUserAccess(unite, userLevel, currentFidele, hierarchie)
      }
    })
  )

  const userStats = calculateUserBlockageStats(unitesWithConfig, currentFidele)

  return (
    <VisibiliteClient
      currentFidele={currentFidele}
      initialUnites={unitesWithConfig}
      userLevel={userLevel}
      userStats={userStats}
    />
  )
}