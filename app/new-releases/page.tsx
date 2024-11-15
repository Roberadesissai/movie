// app/new-releases/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Film, Tv2, CalendarDays, Filter, Loader2 } from "lucide-react";
import MovieGrid from "@/components/movies/MovieGrid";
import FilterPanel from "@/components/movies/FilterPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc } from 'firebase/firestore';
import { projectFirestore } from '@/firebase/config';
import { cn } from "@/lib/utils";
import Image from "next/image";

const sections = [
  { 
    id: "now_playing", 
    label: "In Theaters", 
    type: "movie" as const,
    icon: Film,
    description: "Latest movies in theaters now"
  },
  { 
    id: "airing_today", 
    label: "On TV Today", 
    type: "tv" as const,
    icon: Tv2,
    description: "Latest episodes airing today"
  },
  { 
    id: "upcoming", 
    label: "Coming Soon", 
    type: "movie" as const,
    icon: CalendarDays,
    description: "Upcoming releases to watch out for"
  },
];

const defaultFilters = {
  genres: [],
  rating: 0,
  year: null,
  sortBy: 'popularity',
  sortOrder: 'desc' as const,
  language: '',
  adult: false,
};

interface BackgroundImage {
  backdrop_path: string;
  title: string;
}

export default function NewReleasesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(defaultFilters);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);

  // Check online status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;

      try {
        const userRef = doc(projectFirestore, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setUserPreferences(userSnap.data());
        }
      } catch (error: any) {
        console.error("Error loading user preferences:", error);
        
        // Only show error toast if we're online and there's an error
        if (!isOffline) {
          toast({
            title: "Error",
            description: "Failed to load preferences. Please try again.",
            variant: "destructive",
          });
        }
      }
    };

    loadUserPreferences();
  }, [user, isOffline, toast]);

  useEffect(() => {
    const fetchBackgroundImage = async () => {
      setIsLoadingBackground(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${activeSection.type}/${activeSection.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();
        const results = data.results || [];
        if (results.length > 0) {
          // Get a random movie/show from the first few results
          const randomIndex = Math.floor(Math.random() * Math.min(5, results.length));
          setBackgroundImage(results[randomIndex]);
        }
      } catch (error) {
        console.error('Error fetching background image:', error);
      } finally {
        setIsLoadingBackground(false);
      }
    };

    fetchBackgroundImage();
  }, [activeSection.id, activeSection.type]);

  const handleSectionChange = (sectionId: string) => {
    setIsLoading(true);
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      setActiveSection(section);
      // Reset filters when changing sections
      setFilters(prev => ({
        ...defaultFilters,
        sortBy: prev.sortBy,
        sortOrder: prev.sortOrder
      }));
    }
    setTimeout(() => setIsLoading(false), 300);
  };

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
  };

  // Offline banner
  const OfflineBanner = () => (
    <div className="bg-yellow-500/10 border-l-4 border-yellow-500 p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-yellow-500">
            You're currently offline. Some features may be limited.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-black">
      {isOffline && <OfflineBanner />}

      {/* Header Section */}
      <div 
        className="relative w-full bg-gradient-to-b from-black via-black/95 to-black"
        style={{ height: 'max(45vh, 400px)' }}
      >
        {/* Background Image */}
        {backgroundImage && (
          <div className="absolute inset-0">
            <Image
              src={`https://image.tmdb.org/t/p/original${backgroundImage.backdrop_path}`}
              alt={backgroundImage.title || "Background"}
              fill
              className={cn(
                "object-cover object-center",
                isLoadingBackground && "animate-pulse"
              )}
              priority
              onLoadingComplete={() => setIsLoadingBackground(false)}
            />
            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/30" />
            <div className="absolute inset-0 bg-black/50" />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection.id}
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="text-center space-y-6 px-4 relative z-10">
              <motion.div 
                className="inline-flex items-center justify-center gap-4"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
              >
                <activeSection.icon className="w-12 h-12 text-indigo-500" />
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
                  {activeSection.label}
                </h1>
              </motion.div>
              
              <motion.p 
                className="text-xl text-gray-400 max-w-2xl mx-auto"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {activeSection.description}
              </motion.p>

              {userPreferences && !isOffline && (
                <motion.div
                  className="flex justify-center gap-8 mt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* <div className="px-6 py-3 bg-white/5 rounded-xl backdrop-blur-sm">
                    <p className="text-sm text-gray-400">Watchlist</p>
                    <p className="text-2xl font-bold text-indigo-400">
                      {userPreferences.watchlist?.length || 0}
                    </p>
                  </div>
                  <div className="px-6 py-3 bg-white/5 rounded-xl backdrop-blur-sm">
                    <p className="text-sm text-gray-400">Liked</p>
                    <p className="text-2xl font-bold text-indigo-400">
                      {userPreferences.likes?.length || 0}
                    </p>
                  </div> */}
                </motion.div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls Section */}
      <div className="relative -mt-20 z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div className="flex gap-2">
              {sections.map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection.id === section.id ? "default" : "outline"}
                  onClick={() => handleSectionChange(section.id)}
                  className={cn(
                    "gap-2",
                    activeSection.id === section.id && "bg-indigo-500 hover:bg-indigo-600"
                  )}
                  disabled={isOffline}
                >
                  <section.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{section.label}</span>
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2",
                showFilters && "bg-indigo-500 hover:bg-indigo-600 text-white"
              )}
              disabled={isOffline}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && !isOffline && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-8"
              >
                <FilterPanel
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onReset={handleFilterReset}
                  mediaType={activeSection.type}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content Grid */}
          <div className="relative min-h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <MovieGrid
                section={activeSection.id}
                mediaType={activeSection.type}
                filters={filters}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                isOffline={isOffline}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}