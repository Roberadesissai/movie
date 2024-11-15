import { useState, useEffect } from 'react'
import { projectAuth, projectFirestore, timestamp } from '../firebase/config'
import { useAuthContext } from './useAuthContext'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

export const useSignup = () => {
  const [isCancelled, setIsCancelled] = useState(false)
  const [error, setError] = useState(null)
  const [isPending, setIsPending] = useState(false)
  const { dispatch } = useAuthContext()

  const signup = async (email, password, username) => {
    setError(null)
    setIsPending(true)
  
    try {
      // 1. First create the auth user
      const res = await createUserWithEmailAndPassword(projectAuth, email, password)

      if (!res) {
        throw new Error('Could not complete signup')
      }

      // 2. Update auth profile
      await updateProfile(res.user, { 
        displayName: username
      })

      // 3. Create user document AFTER auth is set up
      await setDoc(doc(projectFirestore, 'users', res.user.uid), {
        username,
        email,
        createdAt: timestamp.now(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      })

      // 4. Dispatch login action
      dispatch({ type: 'LOGIN', payload: res.user })

      if (!isCancelled) {
        setIsPending(false)
        setError(null)
      }
    } 
    catch(err) {
      if (!isCancelled) {
        let errorMessage = 'Signup failed - please try again'
        
        // Handle specific Firebase auth errors
        switch (err.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already registered'
            break
          case 'auth/invalid-email':
            errorMessage = 'Invalid email address'
            break
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled. Please contact support.'
            break
          case 'auth/weak-password':
            errorMessage = 'Password should be at least 6 characters'
            break
          case 'permission-denied':
            errorMessage = 'Permission denied - please try again'
            break
        }
        
        setError(errorMessage)
        setIsPending(false)
      }
    }
  }

  useEffect(() => {
    return () => setIsCancelled(true)
  }, [])

  return { signup, error, isPending }
}