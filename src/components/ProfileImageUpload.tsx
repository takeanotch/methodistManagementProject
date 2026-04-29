'use client'

import { useState } from 'react'
import { uploadProfileImage } from '@/actions/auth'
import toast from 'react-hot-toast'
import { PiImage } from 'react-icons/pi'

interface ProfileImageUploadProps {
  currentImage?: string | null
  onUploadSuccess: (imageUrl: string) => void
}

export default function ProfileImageUpload({ currentImage, onUploadSuccess }: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('image', file)

    const result = await uploadProfileImage(formData)

    if (result.error) {
      toast.error(result.error)
    } else if (result.success && result.imageUrl) {
      toast.success('Image uploadée avec succès')
      onUploadSuccess(result.imageUrl)
    }

    setUploading(false)
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {currentImage && (
        <img
          src={currentImage}
          alt="Profile"
          className="w-24 h-24 border rounded-full object-cover"
        />
      )}
      
      <label className="cursor-pointer bg-blue-500 text-sm text-white px-4 py-2  hover:bg-blue-600">
        {uploading ? 'Upload...' : 'Changer la photo'}

        <input
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>
    </div>
  )
}