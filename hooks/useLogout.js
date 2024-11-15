import { useState } from 'react'
import { signOut } from 'firebase/auth'
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { useAuthContext } from './useAuthContext'
import { projectAuth, projectFirestore } from '../firebase/config'

export const useLogout = () => {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState(null)
  const { dispatch, user } = useAuthContext()

  const logout = async () => {
    setError(null)
    setIsPending(true)

    try {
      // update online status
      const { uid } = user
      const userDocRef = doc(projectFirestore, 'users', uid)
      await updateDoc(userDocRef, { 
        online: false,
        lastActive: serverTimestamp()
      })

      // sign out
      await signOut(projectAuth)
      
      // dispatch logout action
      dispatch({ type: 'LOGOUT' })

      setIsPending(false)
      setError(null)
    } 
    catch (err) {
      setError(err.message)
      setIsPending(false)
    }
  }

  return { logout, error, isPending }
}