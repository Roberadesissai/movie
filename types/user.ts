// types/user.ts
export interface UserList {
    watchlist: SavedMedia[];
    favorites: SavedMedia[];
    watched: SavedMedia[];
    wantToWatch: SavedMedia[];
    recentlyViewed: SavedMedia[];
  }
  
  export interface SavedMedia {
    id: number;
    title: string;
    type: 'movie' | 'tv';
    poster_path: string;
    backdrop_path: string;
    overview: string;
    vote_average: number;
    release_date?: string;
    first_air_date?: string;
    addedAt: string;
    genres?: { id: number; name: string; }[];
    media_type: 'movie' | 'tv';
  }
  
  export interface StreamingHistory {
    mediaId: string;
    mediaType: string;
    title: string;
    provider: string;
    timestamp: Date;
  }
  
  export interface UserData {
    // ... other user data types
    streamingHistory?: StreamingHistory[];
  }
  
  // lib/firebase/userLists.ts
  import { doc, updateDoc, arrayUnion, arrayRemove, getDoc, setDoc } from 'firebase/firestore';
  import { projectFirestore, timestamp } from '@/firebase/config';
  import { UserList, SavedMedia } from '@/types/user';
  
  export const getUserLists = async (userId: string) => {
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
  
  export const addToList = async (
    userId: string, 
    listName: keyof UserList, 
    media: Omit<SavedMedia, 'addedAt'>
  ) => {
    try {
      const userRef = doc(projectFirestore, 'users', userId);
      await updateDoc(userRef, {
        [listName]: arrayUnion({
          ...media,
          addedAt: timestamp.now()
        })
      });
    } catch (error) {
      console.error(`Error adding to ${listName}:`, error);
      throw error;
    }
  };
  
  export const removeFromList = async (
    userId: string, 
    listName: keyof UserList, 
    mediaId: number
  ) => {
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
  
  export const moveToList = async (
    userId: string,
    fromList: keyof UserList,
    toList: keyof UserList,
    media: SavedMedia
  ) => {
    try {
      await removeFromList(userId, fromList, media.id);
      await addToList(userId, toList, media);
    } catch (error) {
      console.error('Error moving item between lists:', error);
      throw error;
    }
  };