// hooks/useFirestore.ts
import { useState } from 'react';
import { 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc,
  setDoc 
} from 'firebase/firestore';
import { projectFirestore, timestamp } from '@/firebase/config';

/**
 * @typedef {Object} MediaItem
 * @property {number} id
 * @property {string} title
 * @property {'movie' | 'tv'} type
 * @property {string} poster_path
 * @property {any} [addedAt]
 */

/**
 * @typedef {Object} UserPreferences
 * @property {MediaItem[]} likes
 * @property {MediaItem[]} watchlist
 * @property {MediaItem[]} recentlyViewed
 * @property {number[]} favoriteGenres
 */

export const useFirestore = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateUserPreferences = async (userId, data) => {
    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(projectFirestore, 'users', userId);
      await updateDoc(userRef, {
        ...data,
        updatedAt: timestamp(),
      });
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const addToWatchlist = async (userId, media) => {
    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(projectFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          watchlist: [{ ...media, addedAt: timestamp() }],
          likes: [],
          recentlyViewed: [],
          favoriteGenres: [],
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
      } else {
        // Update existing document
        await updateDoc(userRef, {
          watchlist: arrayUnion({ ...media, addedAt: timestamp() }),
          updatedAt: timestamp(),
        });
      }
    } catch (err) {
      console.error('Error adding to watchlist:', err);
      setError('Failed to add to watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromWatchlist = async (userId, mediaId) => {
    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(projectFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const watchlist = userDoc.data().watchlist || [];
        const itemToRemove = watchlist.find(item => item.id === mediaId);

        if (itemToRemove) {
          await updateDoc(userRef, {
            watchlist: arrayRemove(itemToRemove),
            updatedAt: timestamp(),
          });
        }
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove from watchlist');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLike = async (userId, media) => {
    setIsLoading(true);
    setError(null);

    try {
      const userRef = doc(projectFirestore, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        await setDoc(userRef, {
          likes: [{ ...media, addedAt: timestamp() }],
          watchlist: [],
          recentlyViewed: [],
          favoriteGenres: [],
          createdAt: timestamp(),
          updatedAt: timestamp(),
        });
      } else {
        const likes = userDoc.data().likes || [];
        const isLiked = likes.some(item => item.id === media.id);

        if (isLiked) {
          const itemToRemove = likes.find(item => item.id === media.id);
          await updateDoc(userRef, {
            likes: arrayRemove(itemToRemove),
            updatedAt: timestamp(),
          });
        } else {
          await updateDoc(userRef, {
            likes: arrayUnion({ ...media, addedAt: timestamp() }),
            updatedAt: timestamp(),
          });
        }
      }
    } catch (err) {
      console.error('Error toggling like:', err);
      setError('Failed to update like status');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    updateUserPreferences,
    addToWatchlist,
    removeFromWatchlist,
    toggleLike,
    isLoading,
    error,
  };
};