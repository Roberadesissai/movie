import { doc, onSnapshot } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { projectFirestore } from '../firebase/config'

export const useDocument = (collection, id) => {
  const [document, setDocument] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!collection || !id) {
      setError('Invalid collection or document ID provided')
      return
    }

    const docRef = doc(projectFirestore, collection, id)
    
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        setDocument({ ...snapshot.data(), id: snapshot.id })
        setError(null)
      } else {
        setError(`The requested ${collection} document (ID: ${id}) does not exist`)
      }
    }, (err) => {
      console.log(err.message)
      let errorMessage = 'Failed to fetch the document'
      
      switch (err.code) {
        case 'permission-denied':
          errorMessage = 'You do not have permission to access this document'
          break
        case 'not-found':
          errorMessage = `The ${collection} collection or document does not exist`
          break
        case 'unavailable':
          errorMessage = 'The service is currently unavailable. Please try again later'
          break
        default:
          errorMessage = `Error accessing document: ${err.message}`
      }
      
      setError(errorMessage)
    })

    return () => unsubscribe()
  }, [collection, id])

  return { document, error }
} 