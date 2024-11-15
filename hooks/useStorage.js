import { useState } from 'react'
import { projectStorage } from '../firebase/config'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { useAuthContext } from './useAuthContext'

export const useStorage = () => {
  const [error, setError] = useState(null)
  const [isPending, setIsPending] = useState(false)
  const { user } = useAuthContext()

  // Upload file
  const uploadFile = async (file, path) => {
    setError(null)
    setIsPending(true)

    try {
      if (!user) {
        throw new Error('User must be logged in')
      }

      // Create reference
      const filePath = `${path}/${file.name}`
      const storageRef = ref(projectStorage, filePath)

      // Upload file
      await uploadBytes(storageRef, file)

      // Get download URL
      const downloadURL = await getDownloadURL(storageRef)

      setIsPending(false)
      return downloadURL

    } catch (err) {
      console.error('Error uploading file:', err)
      setError(err.message)
      setIsPending(false)
      throw err
    }
  }

  // Delete file
  const deleteFile = async (path) => {
    setError(null)
    setIsPending(true)

    try {
      const storageRef = ref(projectStorage, path)
      await deleteObject(storageRef)
      setIsPending(false)
    } catch (err) {
      console.error('Error deleting file:', err)
      setError(err.message)
      setIsPending(false)
      throw err
    }
  }

  return { uploadFile, deleteFile, isPending, error }
} 