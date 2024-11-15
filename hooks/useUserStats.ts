import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { projectFirestore } from '@/firebase/config';

interface UserStats {
  watchlistCount: number;
  reviewsCount: number;
  likesCount: number;
  lastUpdated?: string;
}

export const useUserStats = (userId: string | undefined) => {
  const [stats, setStats] = useState<UserStats>({
    watchlistCount: 0,
    reviewsCount: 0,
    likesCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(projectFirestore, 'users', userId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setStats({
            watchlistCount: data.watchlist?.length || 0,
            reviewsCount: data.reviews?.length || 0,
            likesCount: data.likes?.length || 0,
            lastUpdated: new Date().toISOString()
          });
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching user stats:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { stats, loading };
}; 