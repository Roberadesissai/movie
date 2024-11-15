import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
import { projectFirestore } from '@/firebase/config';

export interface SavedMedia {
  id: number;
  title: string;
  poster_path: string;
  media_type: 'movie' | 'tv';
  addedAt?: any;
  overview?: string;
  vote_average?: number;
  release_date?: string;
  first_air_date?: string;
}

export interface UserList {
  watchlist: SavedMedia[];
  favorites: SavedMedia[];
  watched: SavedMedia[];
  wantToWatch: SavedMedia[];
  recentlyViewed: SavedMedia[];
}

// Get all user lists
export const getUserLists = async (userId: string): Promise<UserList> => {
  if (!userId) throw new Error('User ID is required');

  try {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      // Create default structure if user document doesn't exist
      const defaultLists: UserList = {
        watchlist: [],
        favorites: [],
        watched: [],
        wantToWatch: [],
        recentlyViewed: []
      };
      await setDoc(userRef, defaultLists);
      return defaultLists;
    }

    return userDoc.data() as UserList;
  } catch (error) {
    console.error('Error getting user lists:', error);
    throw error;
  }
};

// Add media to a specific list
export const addToList = async (
  userId: string,
  listName: keyof UserList,
  media: Omit<SavedMedia, 'addedAt'>
) => {
  if (!userId) throw new Error('User ID is required');

  try {
    const userRef = doc(projectFirestore, 'users', userId);
    
    // Check if item already exists in the list
    const userDoc = await getDoc(userRef);
    const currentList = userDoc.data()?.[listName] || [];
    const exists = currentList.some((item: SavedMedia) => item.id === media.id);
    
    if (!exists) {
      await updateDoc(userRef, {
        [listName]: arrayUnion({
          ...media,
          addedAt: new Date().toISOString()
        })
      });
    }
  } catch (error) {
    console.error(`Error adding to ${listName}:`, error);
    throw error;
  }
};

// Remove media from a specific list
export const removeFromList = async (
  userId: string,
  listName: keyof UserList,
  mediaId: number
) => {
  if (!userId) throw new Error('User ID is required');

  try {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentList = userDoc.data()?.[listName] || [];
    
    const itemToRemove = currentList.find((item: SavedMedia) => item.id === mediaId);
    if (itemToRemove) {
      await updateDoc(userRef, {
        [listName]: arrayRemove(itemToRemove)
      });
    }
  } catch (error) {
    console.error(`Error removing from ${listName}:`, error);
    throw error;
  }
};

// Move media from one list to another
export const moveToList = async (
  userId: string,
  fromList: keyof UserList,
  toList: keyof UserList,
  media: SavedMedia
) => {
  if (!userId) throw new Error('User ID is required');

  try {
    await removeFromList(userId, fromList, media.id);
    const { addedAt, ...mediaWithoutAddedAt } = media;
    await addToList(userId, toList, mediaWithoutAddedAt);
  } catch (error) {
    console.error('Error moving item between lists:', error);
    throw error;
  }
};

// Check if media exists in a specific list
export const isInList = async (
  userId: string,
  listName: keyof UserList,
  mediaId: number
): Promise<boolean> => {
  if (!userId) return false;

  try {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    const currentList = userDoc.data()?.[listName] || [];
    
    return currentList.some((item: SavedMedia) => item.id === mediaId);
  } catch (error) {
    console.error(`Error checking if item is in ${listName}:`, error);
    return false;
  }
};

// Get a specific list
export const getList = async (
  userId: string,
  listName: keyof UserList
): Promise<SavedMedia[]> => {
  if (!userId) return [];

  try {
    const userRef = doc(projectFirestore, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    return userDoc.data()?.[listName] || [];
  } catch (error) {
    console.error(`Error getting ${listName}:`, error);
    return [];
  }
};

// Fetch user watchlist (legacy support)
export const fetchUserWatchList = async (userId: string): Promise<SavedMedia[]> => {
  return getList(userId, 'watchlist');
}; 