// app/paroisse/commissions/[id]/projets/CommissionProjetsClient.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { 
    Loader2, 
    Plus, 
    Edit2, 
    Trash2, 
    Target, 
    Calendar, 
    CheckCircle, 
    Clock,
    FileText,
    X,
    Upload,
    Download,
    Eye,
    MoreVertical,
    Search,
    Filter,
    DollarSign
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
    getProjetsByUnite, 
    deleteProjet, 
    updateProjet,
    createProjet,
    getProjetFichiers,
    uploadProjetFichier,
    deleteProjetFichier,
    getPlansActionForProjet,
    getBudgetsForProjet,
    type Projet,
    type ProjetFichier,
    type CreateProjetInput
} from '@/actions/projet'
import { formatCurrency } from '@/lib/currency'

interface CommissionProjetsClientProps {
    uniteId: number
    anneeConferenceId?: number
    commissionNom: string
}

const TYPES_PROJET = [
    { value: 'court_terme', label: 'Court terme', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { value: 'moyen_terme', label: 'Moyen terme', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
    { value: 'long_terme', label: 'Long terme', color: 'bg-purple-50 text-purple-700 border-purple-200' }
]

const STATUTS = [
    { value: 'en_cours', label: 'En cours', color: 'bg-green-50 text-green-700 border-green-200', icon: Clock },
    { value: 'termine', label: 'Terminé', color: 'bg-gray-50 text-gray-700 border-gray-200', icon: CheckCircle }
]

export function CommissionProjetsClient({ uniteId, anneeConferenceId, commissionNom }: CommissionProjetsClientProps) {
    const [projets, setProjets] = useState<Projet[]>([])
    const [filteredProjets, setFilteredProjets] = useState<Projet[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatut, setFilterStatut] = useState<string>('')
    const [filterType, setFilterType] = useState<string>('')
    const [showFilters, setShowFilters] = useState(false)
    
    // Modal projet
    const [showModal, setShowModal] = useState(false)
    const [editingProjet, setEditingProjet] = useState<Projet | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // État pour les fichiers
    const [selectedProjet, setSelectedProjet] = useState<Projet | null>(null)
    const [fichiers, setFichiers] = useState<ProjetFichier[]>([])
    const [showFichiersModal, setShowFichiersModal] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    
    // Form data
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        type: 'court_terme' as 'court_terme' | 'moyen_terme' | 'long_terme',
        date_debut: new Date().toISOString().split('T')[0],
        date_fin: '',
        plan_action_id: '',
        budget_id: ''
    })
    
    // Options pour les selects
    const [plansAction, setPlansAction] = useState<any[]>([])
    const [budgets, setBudgets] = useState<any[]>([])
    
    // Menu contextuel
    const [menuOpen, setMenuOpen] = useState<number | null>(null)
    const [actionLoading, setActionLoading] = useState<number | null>(null)

    useEffect(() => {
        loadProjets()
    }, [uniteId, anneeConferenceId])

    useEffect(() => {
        filterProjets()
    }, [projets, searchTerm, filterStatut, filterType])

    async function loadProjets() {
        setLoading(true)
        try {
            const data = await getProjetsByUnite(uniteId, anneeConferenceId)
            setProjets(data)
        } catch (error) {
            console.error('Erreur chargement projets:', error)
            toast.error('Erreur lors du chargement des projets')
        } finally {
            setLoading(false)
        }
    }

    async function loadOptions() {
        try {
            const [plans, budgetsList] = await Promise.all([
                getPlansActionForProjet(uniteId),
                getBudgetsForProjet(uniteId)
            ])
            setPlansAction(plans)
            setBudgets(budgetsList)
        } catch (error) {
            console.error('Erreur chargement options:', error)
        }
    }

    async function loadFichiers(projetId: number) {
        try {
            const data = await getProjetFichiers(projetId)
            setFichiers(data)
        } catch (error) {
            console.error('Erreur chargement fichiers:', error)
        }
    }

    function filterProjets() {
        let filtered = [...projets]
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase()
            filtered = filtered.filter(p => 
                p.nom.toLowerCase().includes(term) ||
                (p.description || '').toLowerCase().includes(term)
            )
        }
        
        if (filterStatut) {
            filtered = filtered.filter(p => p.statut === filterStatut)
        }
        
        if (filterType) {
            filtered = filtered.filter(p => p.type === filterType)
        }
        
        setFilteredProjets(filtered)
    }

    function openCreateModal() {
        setEditingProjet(null)
        setFormData({
            nom: '',
            description: '',
            type: 'court_terme',
            date_debut: new Date().toISOString().split('T')[0],
            date_fin: '',
            plan_action_id: '',
            budget_id: ''
        })
        loadOptions()
        setShowModal(true)
    }

    function openEditModal(projet: Projet) {
        setEditingProjet(projet)
        setFormData({
            nom: projet.nom,
            description: projet.description || '',
            type: projet.type,
            date_debut: projet.date_debut,
            date_fin: projet.date_fin || '',
            plan_action_id: projet.plan_action_id?.toString() || '',
            budget_id: projet.budget_id?.toString() || ''
        })
        loadOptions()
        setShowModal(true)
        setMenuOpen(null)
    }

    function openFichiersModal(projet: Projet) {
        setSelectedProjet(projet)
        setShowFichiersModal(true)
        loadFichiers(projet.id)
        setMenuOpen(null)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        
        if (!formData.nom.trim()) {
            toast.error('Le nom du projet est requis')
            return
        }
        
        setIsSubmitting(true)
        
        const input: CreateProjetInput = {
            nom: formData.nom,
            description: formData.description || null,
            type: formData.type,
            date_debut: new Date(formData.date_debut),
            date_fin: formData.date_fin ? new Date(formData.date_fin) : null,
            plan_action_id: formData.plan_action_id ? parseInt(formData.plan_action_id) : null,
            budget_id: formData.budget_id ? parseInt(formData.budget_id) : null
        }
        
        if (editingProjet) {
            const result = await updateProjet(editingProjet.id, input)
            if (result.success) {
                toast.success('Projet modifié')
                setShowModal(false)
                loadProjets()
            } else {
                toast.error(result.error || 'Erreur lors de la modification')
            }
        } else {
            const result = await createProjet(uniteId, input)
            if (result.success) {
                toast.success('Projet créé')
                setShowModal(false)
                loadProjets()
            } else {
                toast.error(result.error || 'Erreur lors de la création')
            }
        }
        
        setIsSubmitting(false)
    }

    async function handleDelete(projet: Projet) {
        if (!confirm(`Supprimer le projet "${projet.nom}" ?`)) return
        
        setActionLoading(projet.id)
        const result = await deleteProjet(projet.id)
        
        if (result.success) {
            toast.success('Projet supprimé')
            loadProjets()
        } else {
            toast.error(result.error || 'Erreur lors de la suppression')
        }
        
        setActionLoading(null)
        setMenuOpen(null)
    }

    async function handleToggleStatut(projet: Projet) {
        const newStatut = projet.statut === 'en_cours' ? 'termine' : 'en_cours'
        const result = await updateProjet(projet.id, { statut: newStatut })
        
        if (result.success) {
            toast.success(newStatut === 'termine' ? 'Projet terminé' : 'Projet réactivé')
            loadProjets()
        } else {
            toast.error(result.error || 'Erreur')
        }
        
        setMenuOpen(null)
    }

    async function handleFileUpload(projetId: number, files: FileList | null) {
        if (!files || files.length === 0) return

        setUploading(true)
        let success = 0
        let errors = 0

        for (const file of Array.from(files)) {
            const result = await uploadProjetFichier(projetId, file)
            if (result.success) {
                success++
            } else {
                errors++
            }
        }

        if (success > 0) {
            toast.success(`${success} fichier(s) uploadé(s)`)
            loadFichiers(projetId)
        }
        if (errors > 0) {
            toast.error(`${errors} erreur(s) lors de l'upload`)
        }

        setUploading(false)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    async function handleDeleteFichier(fichierId: number, projetId: number) {
        if (!confirm('Supprimer ce fichier ?')) return

        const result = await deleteProjetFichier(fichierId)
        if (result.success) {
            toast.success('Fichier supprimé')
            loadFichiers(projetId)
        } else {
            toast.error(result.error || 'Erreur lors de la suppression')
        }
    }

    function formatDate(date: string) {
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    function formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B'
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
    }

    function getTypeInfo(type: string) {
        return TYPES_PROJET.find(t => t.value === type) || TYPES_PROJET[0]
    }

    function getStatutInfo(statut: string) {
        return STATUTS.find(s => s.value === statut) || STATUTS[0]
    }

    if (loading) {
        return (
            <div className="py-16 text-center">
                <Loader2 size={32} className="animate-spin mx-auto text-gray-400" />
            </div>
        )
    }

    return (
        <>
            {/* Barre d'outils */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-3 py-2 border border-gray-300 text-sm w-64 focus:outline-none focus:border-black"
                        />
                    </div>

                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border ${showFilters || filterStatut || filterType ? 'border-black bg-gray-50' : 'border-gray-300'} hover:border-black`}
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
                >
                    <Plus size={16} />
                    Nouveau projet
                </button>
            </div>

            {/* Filtres étendus */}
            {showFilters && (
                <div className="mb-6 p-4 border border-gray-200 bg-gray-50">
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600">Statut :</label>
                            <select
                                value={filterStatut}
                                onChange={(e) => setFilterStatut(e.target.value)}
                                className="border border-gray-300 px-3 py-1.5 text-sm bg-white"
                            >
                                <option value="">Tous</option>
                                {STATUTS.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm text-gray-600">Type :</label>
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                className="border border-gray-300 px-3 py-1.5 text-sm bg-white"
                            >
                                <option value="">Tous</option>
                                {TYPES_PROJET.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => {
                                setFilterStatut('')
                                setFilterType('')
                            }}
                            className="text-sm text-gray-500 hover:text-black"
                        >
                            Réinitialiser
                        </button>
                        <button
                            onClick={() => setShowFilters(false)}
                            className="ml-auto text-sm text-gray-500 hover:text-black"
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            )}

            {/* Liste des projets */}
            {filteredProjets.length === 0 ? (
                <div className="border border-gray-200 py-16 text-center bg-white">
                    <Target size={48} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-400 mb-4">Aucun projet</p>
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm hover:bg-gray-800"
                    >
                        <Plus size={16} />
                        Créer un projet
                    </button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2">
                    {filteredProjets.map(projet => {
                        const typeInfo = getTypeInfo(projet.type)
                        const statutInfo = getStatutInfo(projet.statut)
                        const StatutIcon = statutInfo.icon
                        
                        return (
                            <div
                                key={projet.id}
                                className="bg-white border border-gray-200 p-4 hover:border-gray-300 transition-colors group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="font-medium text-gray-900">
                                                {projet.nom}
                                            </h3>
                                            <span className={`text-xs px-2 py-0.5 border ${typeInfo.color}`}>
                                                {typeInfo.label}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 border ${statutInfo.color} flex items-center gap-1`}>
                                                <StatutIcon size={12} />
                                                {statutInfo.label}
                                            </span>
                                        </div>
                                        
                                        {projet.description && (
                                            <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                                                {projet.description}
                                            </p>
                                        )}
                                        
                                        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>
                                                    Début: {formatDate(projet.date_debut)}
                                                </span>
                                            </div>
                                            {projet.date_fin && (
                                                <div className="flex items-center gap-1">
                                                    <Target size={12} />
                                                    <span>
                                                        Fin: {formatDate(projet.date_fin)}
                                                    </span>
                                                </div>
                                            )}
                                            {projet.budget && (
                                                <div className="flex items-center gap-1">
                                                    <DollarSign size={12} />
                                                    <span>
                                                        {formatCurrency(projet.budget.montant, projet.budget.currency as any)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {projet.plan_action && (
                                            <p className="text-xs text-gray-400 mt-2">
                                                Plan: {projet.plan_action.titre}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="relative">
                                        <button
                                            onClick={() => setMenuOpen(menuOpen === projet.id ? null : projet.id)}
                                            className="p-1 text-gray-400 hover:text-black opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        
                                        {menuOpen === projet.id && (
                                            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg z-10 min-w-[150px]">
                                                <button
                                                    onClick={() => openFichiersModal(projet)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <FileText size={14} /> Fichiers
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(projet)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    <Edit2 size={14} /> Modifier
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatut(projet)}
                                                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                                >
                                                    {projet.statut === 'en_cours' ? (
                                                        <>
                                                            <CheckCircle size={14} /> Marquer terminé
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Clock size={14} /> Réactiver
                                                        </>
                                                    )}
                                                </button>
                                                <div className="border-t border-gray-100 my-1"></div>
                                                <button
                                                    onClick={() => handleDelete(projet)}
                                                    disabled={actionLoading === projet.id}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                                >
                                                    {actionLoading === projet.id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={14} />
                                                    )}
                                                    Supprimer
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal création/édition de projet */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <div>
                                <h3 className="text-lg font-light">
                                    {editingProjet ? 'Modifier le projet' : 'Nouveau projet'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">Commission : {commissionNom}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-black"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nom *</label>
                                <input
                                    type="text"
                                    value={formData.nom}
                                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                    required
                                    placeholder="Nom du projet"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                    rows={3}
                                    placeholder="Description du projet..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Type *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                    required
                                >
                                    {TYPES_PROJET.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date de début</label>
                                    <input
                                        type="date"
                                        value={formData.date_debut}
                                        onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Date de fin</label>
                                    <input
                                        type="date"
                                        value={formData.date_fin}
                                        onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                                        className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Plan d'action (optionnel)</label>
                                <select
                                    value={formData.plan_action_id}
                                    onChange={(e) => setFormData({ ...formData, plan_action_id: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                >
                                    <option value="">Aucun</option>
                                    {plansAction.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.titre}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Budget (optionnel)</label>
                                <select
                                    value={formData.budget_id}
                                    onChange={(e) => setFormData({ ...formData, budget_id: e.target.value })}
                                    className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-black"
                                >
                                    <option value="">Aucun</option>
                                    {budgets.map(budget => (
                                        <option key={budget.id} value={budget.id}>
                                            {budget.libelle} - {formatCurrency(budget.montant, budget.currency as any)} ({budget.type === 'recette' ? 'Recette' : 'Dépense'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-200 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 hover:border-black"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="flex-1 px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : editingProjet ? (
                                    'Modifier'
                                ) : (
                                    'Créer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal des fichiers */}
            {showFichiersModal && selectedProjet && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white w-full max-w-2xl max-h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b border-gray-200">
                            <div>
                                <h3 className="font-medium text-gray-900">{selectedProjet.nom}</h3>
                                <p className="text-sm text-gray-500">Fichiers attachés</p>
                            </div>
                            <button
                                onClick={() => {
                                    setShowFichiersModal(false)
                                    setSelectedProjet(null)
                                    setFichiers([])
                                }}
                                className="text-gray-400 hover:text-black"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 border-b border-gray-200 bg-gray-50">
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                onChange={(e) => handleFileUpload(selectedProjet.id, e.target.files)}
                                className="hidden"
                                id="file-upload-commission"
                                disabled={uploading}
                            />
                            <label
                                htmlFor="file-upload-commission"
                                className={`
                                    flex items-center justify-center gap-2 p-4 border-2 border-dashed 
                                    border-gray-300 cursor-pointer transition-colors
                                    ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400'}
                                `}
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        <span className="text-sm text-gray-600">Upload en cours...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} className="text-gray-400" />
                                        <span className="text-sm text-gray-600">
                                            Cliquez ou glissez-déposez des fichiers
                                        </span>
                                    </>
                                )}
                            </label>
                            <p className="text-xs text-gray-500 mt-2">
                                PDF, Images, Documents - Max 10 MB par fichier
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4">
                            {fichiers.length === 0 ? (
                                <div className="py-8 text-center">
                                    <FileText size={32} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-sm text-gray-500">Aucun fichier attaché</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {fichiers.map((fichier) => (
                                        <div
                                            key={fichier.id}
                                            className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <FileText size={18} className="text-gray-400 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {fichier.nom_fichier}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {fichier.taille_fichier && formatFileSize(fichier.taille_fichier)}
                                                        {' • '}
                                                        {new Date(fichier.uploaded_at).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <a
                                                    href={fichier.chemin_fichier}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <Eye size={16} />
                                                </a>
                                                <a
                                                    href={fichier.chemin_fichier}
                                                    download={fichier.nom_fichier}
                                                    className="p-2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <Download size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleDeleteFichier(fichier.id, selectedProjet.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {menuOpen && (
                <div className="fixed inset-0 z-0" onClick={() => setMenuOpen(null)} />
            )}
        </>
    )
}