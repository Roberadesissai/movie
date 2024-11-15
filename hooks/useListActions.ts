// hooks/useListActions.ts
import { useCallback } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { projectFirestore } from '@/firebase/config';
import type { SavedMedia, UserList } from '@/types/user';

export const useListActions = () => {
  const addToList = useCallback(async (
    userId: string,
    listName: keyof UserList,
    media: SavedMedia
  ) => {
    const userRef = doc(projectFirestore, 'users', userId);
    await updateDoc(userRef, {
      [listName]: arrayUnion({
        ...media,
        addedAt: new Date().toISOString()
      })
    });
  }, []);

  const removeFromList = useCallback(async (
    userId: string,
    listName: keyof UserList,
    mediaId: number
  ) => {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const list = userDoc.data()?.[listName] || [];
    const itemToRemove = list.find((item: SavedMedia) => item.id === mediaId);
    
    if (itemToRemove) {
      await updateDoc(userRef, {
        [listName]: arrayRemove(itemToRemove)
      });
    }
  }, []);

  const moveToList = useCallback(async (
    userId: string,
    fromList: keyof UserList,
    toList: keyof UserList,
    media: SavedMedia
  ) => {
    await removeFromList(userId, fromList, media.id);
    await addToList(userId, toList, media);
  }, [addToList, removeFromList]);

  const isInList = useCallback(async (
    userId: string,
    listName: keyof UserList,
    mediaId: number
  ) => {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const list = userDoc.data()?.[listName] || [];
    return list.some((item: SavedMedia) => item.id === mediaId);
  }, []);

  return {
    addToList,
    removeFromList,
    moveToList,
    isInList
  };
};