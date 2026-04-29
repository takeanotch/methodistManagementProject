'use client'

import { register } from '@/actions/auth'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  async function handleSubmit(formData: FormData) {
    const result = await register(formData)
    if (result?.error) {
      toast.error(result.error)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Inscription</h1>
      
      <form action={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nom_complet" className="block mb-1">
            Nom complet
          </label>
          <input
            type="text"
            id="nom_complet"
            name="nom_complet"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="numero" className="block mb-1">
            Numéro de téléphone
          </label>
          <input
            type="tel"
            id="numero"
            name="numero"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="adresse" className="block mb-1">
            Adresse
          </label>
          <textarea
            id="adresse"
            name="adresse"
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="mot_de_passe" className="block mb-1">
            Mot de passe
          </label>
          <input
            type="password"
            id="mot_de_passe"
            name="mot_de_passe"
            required
            minLength={6}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600"
        >
          S'inscrire
        </button>
      </form>
    </div>
  )
}