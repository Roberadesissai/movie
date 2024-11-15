import { AuthContext } from '../context/AuthContext'
import { useContext, useEffect } from 'react'
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { projectFirestore } from '../firebase/config'

export const useAuthContext = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuthContext must be used inside an AuthContextProvider')
  }

  // Add this to track active users
  useEffect(() => {
    if (context.user) {
      const userRef = doc(projectFirestore, 'users', context.user.uid);
      const interval = setInterval(() => {
        updateDoc(userRef, {
          lastActive: serverTimestamp()
        });
      }, 300000); // Update every 5 minutes

      return () => clearInterval(interval);
    }
  }, [context.user]);

  return context
}