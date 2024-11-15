import { useState, useEffect } from 'react'
import { 
  collection, 
  query, 
  onSnapshot,
  where,
  orderBy 
} from 'firebase/firestore'
import { projectFirestore } from '../firebase/config'

export const useCollection = (collectionName, _query, _orderBy) => {
  const [documents, setDocuments] = useState(null)
  const [error, setError] = useState(null)

  // If we don't use a ref, infinite loop in useEffect
  // _query is an array and is "different" on every function call
  useEffect(() => {
    let collectionRef = collection(projectFirestore, collectionName)

    if (_query) {
      collectionRef = query(collectionRef, where(..._query))
    }

    if (_orderBy) {
      collectionRef = query(collectionRef, orderBy(..._orderBy))
    }

    const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
      const results = []
      snapshot.docs.forEach(doc => {
        results.push({ ...doc.data(), id: doc.id })
      })
      
      // update state
      setDocuments(results)
      setError(null)
    }, (error) => {
      console.log(error)
      setError('could not fetch the data')
    })

    // unsubscribe on unmount
    return () => unsubscribe()
  }, [collectionName, _query, _orderBy])

  return { documents, error }
}