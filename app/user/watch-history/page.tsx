// app/watch-history/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { 
  Loader2, Film, Tv2, Clock, Calendar, Play,
  Grid, LayoutList, Filter, ArrowUpDown, Search, XCircle, MoreVertical, Share, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { doc, getDoc, updateDoc, arrayRemove } from 'firebase/firestore';
import { projectFirestore as db } from '@/firebase/config';
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { WatchProvidersDialog } from "@/components/WatchProvidersDialog";

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'name';
type FilterOption = 'all' | 'movies' | 'tv';

export default function WatchHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [watchedItems, setWatchedItems] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [watchProvidersOpen, setWatchProvidersOpen] = useState(false);

  useEffect(() => {
    const fetchWatchHistory = async () => {
      if (!user) {
        router.push('/auth/login');
        return;
      }

      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Get the watched array and sort by timestamp if it exists
          const watched = userData.watched || [];
          const sortedWatched = [...watched].sort((a, b) => 
            b.timestamp?.toMillis() - a.timestamp?.toMillis()
          );
          setWatchedItems(sortedWatched);
        }
      } catch (error) {
        console.error('Error fetching watch history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchHistory();
  }, [user, router]);

  // Helper function to safely get timestamp in milliseconds
  const getTimestamp = (item: any) => {
    if (!item.timestamp) return 0;
    if (item.timestamp.toMillis) return item.timestamp.toMillis();
    if (item.timestamp.seconds) return item.timestamp.seconds * 1000;
    return new Date(item.timestamp).getTime();
  };

  // Helper function to create unique keys
  const createUniqueKey = (item: any) => {
    const timestamp = getTimestamp(item);
    return `${item.id}-${item.media_type}-${timestamp}`;
  };

  // Update the filtering and sorting logic
  const filteredAndSortedItems = watchedItems
    .filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterBy === 'all' || 
        (filterBy === 'movies' && item.media_type === 'movie') || 
        (filterBy === 'tv' && item.media_type === 'tv');
      return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return getTimestamp(b) - getTimestamp(a);
        case 'oldest':
          return getTimestamp(a) - getTimestamp(b);
        case 'name':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });

  const handleDeleteFromHistory = async (item: any) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        watched: arrayRemove(item)
      });

      // Update local state
      setWatchedItems(prev => prev.filter(i => createUniqueKey(i) !== createUniqueKey(item)));

      toast({
        title: "Removed from history",
        description: `${item.title} has been removed from your watch history`,
      });
    } catch (error) {
      console.error('Error removing from history:', error);
      toast({
        title: "Error",
        description: "Failed to remove from history",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (item: any) => {
    const shareUrl = `${window.location.origin}/${item.media_type}/${item.id}`;
    
    try {
      // Try native share first
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: `Check out ${item.title} on MovieApp`,
          url: shareUrl
        });
        return;
      }

      // Fallback to clipboard
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "The link has been copied to your clipboard",
        });
      } else {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = shareUrl;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast({
            title: "Link copied",
            description: "The link has been copied to your clipboard",
          });
        } catch (err) {
          toast({
            title: "Error",
            description: "Failed to copy link",
            variant: "destructive",
          });
        }
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!watchedItems.length) {
    return (
      <div className="min-h-screen pt-24">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">No watch history yet</h2>
          <p className="text-gray-400 mb-8">
            Start watching movies and shows to build your history
          </p>
          <Button 
            onClick={() => router.push('/movies')}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            <Film className="w-4 h-4 mr-2" />
            Browse Movies
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Watch History</h1>
            <p className="text-gray-400">
              {watchedItems.length} items in your history
            </p>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search history..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFilterBy('all')}>
                  All Types
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('movies')}>
                  Movies Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterBy('tv')}>
                  TV Shows Only
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('oldest')}>
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('name')}>
                  By Name
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('grid')}
                className={cn(viewMode === 'grid' && 'bg-white/10')}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setViewMode('list')}
                className={cn(viewMode === 'list' && 'bg-white/10')}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {filteredAndSortedItems.length > 0 ? (
            <motion.div
              key={`${viewMode}-${filterBy}-${sortBy}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                viewMode === 'grid'
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  : "space-y-4"
              )}
            >
              {filteredAndSortedItems.map((item) => (
                <motion.div
                  key={createUniqueKey(item)}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "bg-black/20 rounded-xl overflow-hidden hover:bg-black/30 transition-all",
                    viewMode === 'grid' ? 'flex flex-col' : 'flex'
                  )}
                >
                  {/* Poster */}
                  <div className={cn(
                    "relative",
                    viewMode === 'grid' ? 'w-full aspect-[2/3]' : 'w-32 h-48 shrink-0'
                  )}>
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className={cn(
                    "flex flex-col flex-1",
                    viewMode === 'grid' ? 'p-4' : 'p-4'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      {item.media_type === 'tv' ? (
                        <Tv2 className="w-4 h-4 text-blue-400 shrink-0" />
                      ) : (
                        <Film className="w-4 h-4 text-purple-400 shrink-0" />
                      )}
                      <h3 className="font-semibold truncate">{item.title}</h3>
                    </div>

                    {item.overview && viewMode === 'list' && (
                      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                        {item.overview}
                      </p>
                    )}

                    <div className="mt-auto flex items-center justify-between">
                      <div className="text-sm text-gray-400">
                        <Clock className="w-4 h-4 inline mr-2" />
                        {item.timestamp ? 
                          formatDistanceToNow(
                            item.timestamp.toDate?.() || new Date(getTimestamp(item)), 
                            { addSuffix: true }
                          ) : 
                          'Recently watched'
                        }
                      </div>

                      <div className="flex items-center gap-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-white/10"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => {
                                if (navigator.share) {
                                  navigator.share({
                                    title: item.title,
                                    text: `Check out ${item.title} on MovieApp`,
                                    url: `${window.location.origin}/${item.media_type}/${item.id}`
                                  }).catch(console.error);
                                } else {
                                  navigator.clipboard.writeText(
                                    `${window.location.origin}/${item.media_type}/${item.id}`
                                  );
                                  toast({
                                    title: "Link copied",
                                    description: "The link has been copied to your clipboard",
                                  });
                                }
                              }}
                              className="cursor-pointer"
                            >
                              <Share className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                  onSelect={(e) => e.preventDefault()}
                                  className="text-red-500 cursor-pointer focus:text-red-500"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Remove from history
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remove from history?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove "{item.title}" from your watch history?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteFromHistory(item)}
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          onClick={() => {
                            setSelectedItem(item);
                            setWatchProvidersOpen(true);
                          }}
                        >
                          <Play className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              <div className="max-w-md mx-auto">
                {searchQuery ? (
                  <>
                    <SearchIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-xl font-semibold mb-2">No matches found</h3>
                    <p className="text-gray-400 mb-4">
                      No results found for "{searchQuery}" in {filterBy === 'all' ? 'your history' : `${filterBy} category`}
                    </p>
                  </>
                ) : (
                  <>
                    {filterBy === 'movies' ? (
                      <Film className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    ) : filterBy === 'tv' ? (
                      <Tv2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    ) : (
                      <XCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    )}
                    <h3 className="text-xl font-semibold mb-2">
                      {filterBy === 'all' 
                        ? 'Your watch history is empty'
                        : filterBy === 'movies'
                          ? 'No movies in your history'
                          : 'No TV shows in your history'
                      }
                    </h3>
                    <p className="text-gray-400 mb-4">
                      {filterBy === 'all'
                        ? 'Start watching to build your history'
                        : filterBy === 'movies'
                          ? 'Try watching some movies to see them here'
                          : 'Try watching some TV shows to see them here'
                      }
                    </p>
                  </>
                )}
                <Button 
                  onClick={() => {
                    setFilterBy('all');
                    setSearchQuery('');
                  }}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {selectedItem && (
          <WatchProvidersDialog
            isOpen={watchProvidersOpen}
            onOpenChange={setWatchProvidersOpen}
            mediaType={selectedItem.media_type}
            mediaId={selectedItem.id.toString()}
            title={selectedItem.title}
          />
        )}
      </div>
    </div>
  );
}