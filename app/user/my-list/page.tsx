// app/user/my-list/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  ListPlus,
  Film, 
  Tv2,
  Heart,
  Eye,
  Clock,
  BookmarkPlus,
  Grid,
  LayoutList,
  Filter,
  CheckCircle,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/movies/MovieCard";
import { getUserLists } from "@/lib/firebase/userLists";
import { UserList, SavedMedia } from "@/types/user";
import { cn } from "@/lib/utils";
import { doc, getDoc } from 'firebase/firestore';
import { projectFirestore as db } from '@/firebase/config';
import { toast } from "@/components/ui/use-toast";

const listTypes = [
  { id: 'watchlist', label: 'Watchlist', icon: ListPlus },
  { id: 'favorites', label: 'Favorites', icon: Heart },
  { id: 'watched', label: 'Watched', icon: Eye },
  { id: 'wantToWatch', label: 'Want to Watch', icon: BookmarkPlus },
] as const;

function EmptyState() {
  const router = useRouter();
  
  return (
    <div className="text-center space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your collections are empty</h2>
        <p className="text-gray-400">
          Start building your movie and TV show collections by browsing our catalog
        </p>
      </div>
      
      <Button 
        onClick={() => router.push('/movies')}
        className="bg-indigo-500 hover:bg-indigo-600"
      >
        <Film className="w-4 h-4 mr-2" />
        Browse Movies
      </Button>
    </div>
  );
}

export default function MyListPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userLists, setUserLists] = useState<UserList>({
    watchlist: [],
    favorites: [],
    watched: [],
    wantToWatch: [],
    recentlyViewed: []
  });
  const [activeList, setActiveList] = useState<keyof UserList>('watchlist');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const fetchUserLists = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          
          setUserLists({
            watchlist: userData.watchlist || [],
            favorites: userData.favorites || [],
            watched: userData.watched || [],
            wantToWatch: userData.wantToWatch || [],
            recentlyViewed: userData.recentlyViewed || []
          });
        }
      } catch (error) {
        console.error('Error fetching user lists:', error);
        toast({
          title: "Error",
          description: "Failed to load your lists",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserLists();
  }, [user, router]);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!userLists || Object.values(userLists).every(list => list.length === 0)) {
    return (
      <div className="min-h-screen">
        <div className="max-w-4xl mx-auto px-4 py-20">
          <EmptyState />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8 sm:pt-24">
      <div className="bg-black/50 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-12">
            <div>
              <h1 className="text-3xl font-bold mb-4">
                My Collections
              </h1>
              {/* Stats - Mobile Optimized */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400
                            sm:flex-nowrap
                            [@media(max-width:640px)]:grid [@media(max-width:640px)]:grid-cols-2 [@media(max-width:640px)]:gap-2">
                {listTypes.map(({ id, label, icon: Icon }) => (
                  <div key={id} 
                       className="flex items-center gap-2
                                [@media(max-width:640px)]:bg-black/20 [@media(max-width:640px)]:p-3 
                                [@media(max-width:640px)]:rounded-lg [@media(max-width:640px)]:w-full">
                    <Icon className="w-4 h-4" />
                    <span className="whitespace-nowrap">
                      {userLists[id]?.length || 0} {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <Button 
              onClick={() => router.push('/movies')}
              className="bg-indigo-500 hover:bg-indigo-600
                       [@media(max-width:640px)]:w-full"
            >
              <Film className="w-4 h-4 mr-2" />
              Browse More
            </Button>
          </div>

          {/* Tabs Section */}
          <div className="pb-8">
            <Tabs
              defaultValue="watchlist"
              onValueChange={(value) => setActiveList(value as keyof UserList)}
            >
              <div className="flex items-center justify-between
                            [@media(max-width:640px)]:flex-col [@media(max-width:640px)]:gap-4">
                <TabsList className="bg-black/20 p-1 rounded-lg
                                  [@media(max-width:640px)]:w-full">
                  {listTypes.map(({ id, label, icon: Icon }) => (
                    <TabsTrigger
                      key={id}
                      value={id}
                      className="gap-2 data-[state=active]:bg-indigo-500
                               [@media(max-width:640px)]:flex-1"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{label}</span>
                      <span className="text-xs">({userLists[id]?.length || 0})</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                <div className="flex items-center gap-2
                              [@media(max-width:640px)]:self-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      viewMode === 'grid' && 'bg-white/10'
                    )}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setViewMode('list')}
                    className={cn(
                      viewMode === 'list' && 'bg-white/10'
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="mt-8">
                {listTypes.map(({ id }) => (
                  <TabsContent key={id} value={id}>
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${id}-${viewMode}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                          viewMode === 'grid'
                            ? "grid grid-cols-6 gap-6 [@media(max-width:1280px)]:grid-cols-5 [@media(max-width:1024px)]:grid-cols-4 [@media(max-width:768px)]:grid-cols-3 [@media(max-width:640px)]:grid-cols-2 [@media(max-width:640px)]:gap-3"
                            : "space-y-4 [@media(max-width:640px)]:space-y-3"
                        )}
                      >
                        {userLists[id]?.map((item) => (
                          <MovieCard
                            key={item.id}
                            movie={item}
                            viewMode={viewMode}
                            currentList={id}
                          />
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}