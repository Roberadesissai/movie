// app/movies/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Film, 
  Clapperboard, 
  Calendar, 
  Award, 
  ChevronDown,
  Filter,
  Loader2 
} from "lucide-react";
import { doc, getDoc, collection } from 'firebase/firestore';
import { projectFirestore as db, projectAuth, projectStorage } from '@/firebase/config';
import MovieGrid from "@/components/movies/MovieGrid";
import FilterPanel from "@/components/movies/FilterPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import Image from "next/image";

const sections = [
  { 
    id: "popular", 
    label: "Popular", 
    icon: Film,
    description: "Most watched movies right now",
    gradient: "from-red-500 via-orange-500 to-yellow-500"
  },
  { 
    id: "now_playing", 
    label: "Now Playing", 
    icon: Clapperboard,
    description: "Currently in theaters",
    gradient: "from-blue-500 via-indigo-500 to-purple-500"
  },
  { 
    id: "upcoming", 
    label: "Upcoming", 
    icon: Calendar,
    description: "Coming soon to theaters",
    gradient: "from-green-500 via-emerald-500 to-teal-500"
  },
  { 
    id: "top_rated", 
    label: "Top Rated", 
    icon: Award,
    description: "Highest rated of all time",
    gradient: "from-purple-500 via-pink-500 to-rose-500"
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

export default function MoviesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImage | null>(null);
  const [isLoadingBackground, setIsLoadingBackground] = useState(false);

  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          setUserPreferences(userSnap.data());
        }
      } catch (error: any) {
        console.error("Error loading user preferences:", error);
        toast({
          title: "Error",
          description: "Failed to load preferences",
          variant: "destructive",
        });
      }
    };

    loadUserPreferences();
  }, [user, toast]);

  useEffect(() => {
    const fetchBackgroundImage = async () => {
      setIsLoadingBackground(true);
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${activeSection.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();
        const results = data.results || [];
        if (results.length > 0) {
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
  }, [activeSection.id]);

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
  };

  const handleFilterReset = () => {
    setFilters(defaultFilters);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[45vh] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Background Image */}
            {backgroundImage && (
              <div className="absolute inset-0">
                <Image
                  src={`https://image.tmdb.org/t/p/original${backgroundImage.backdrop_path}`}
                  alt={backgroundImage.title}
                  fill
                  className={cn(
                    "object-cover object-center",
                    isLoadingBackground && "animate-pulse"
                  )}
                  priority
                  onLoadingComplete={() => setIsLoadingBackground(false)}
                />
              </div>
            )}

            {/* Gradient Overlay */}
            <div 
              className={cn(
                "absolute inset-0 bg-gradient-to-br opacity-20",
                activeSection.gradient
              )} 
            />
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Animated Background Patterns */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white to-transparent animate-scan" />
                <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-white to-transparent animate-scan-vertical" />
              </div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl space-y-6"
              >
                <div className="flex items-center justify-center gap-4">
                  <activeSection.icon className={cn(
                    "w-12 h-12",
                    `text-gradient-${activeSection.gradient}`
                  )} />
                  <h1 className={cn(
                    "text-5xl md:text-6xl lg:text-7xl font-bold",
                    "bg-clip-text text-transparent bg-gradient-to-r",
                    activeSection.gradient
                  )}>
                    {activeSection.label}
                  </h1>
                </div>
                
                <p className="text-xl text-gray-300">
                  {activeSection.description}
                </p>

                {/* Stats Section */}
                {userPreferences && (
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
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative -mt-20 z-10">
        <div className="container mx-auto px-4">
          {/* Controls Section */}
          <div className="flex items-center justify-between mb-8">
            {/* Mobile Menu */}
            <div className="lg:hidden relative w-full z-50">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full p-4 flex items-center justify-between 
                         bg-black/50 backdrop-blur-sm border border-white/10 
                         rounded-xl hover:bg-white/5 transition-all"
              >
                <div className="flex items-center gap-2">
                  {activeSection.icon && <activeSection.icon className="w-5 h-5" />}
                  <span>{activeSection.label}</span>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 transition-transform duration-200",
                  isMobileMenuOpen && "rotate-180"
                )} />
              </button>

              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: 8 }}
                    exit={{ opacity: 0, y: 0 }}
                    className="absolute top-full left-0 right-0
                             bg-black/95 backdrop-blur-sm border border-white/10 
                             rounded-xl overflow-hidden shadow-xl"
                    style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}
                  >
                    {sections.map((section) => {
                      const Icon = section.icon;
                      return (
                        <button
                          key={section.id}
                          onClick={() => {
                            setActiveSection(section);
                            setIsMobileMenuOpen(false);
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 transition-all",
                            "hover:bg-white/5",
                            activeSection.id === section.id && 
                              "bg-gradient-to-r from-indigo-500/20 to-purple-500/20"
                          )}
                        >
                          <Icon className="w-5 h-5" />
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{section.label}</span>
                            <span className="text-sm text-gray-400">
                              {section.description}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex gap-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <Button
                    key={section.id}
                    variant={activeSection.id === section.id ? "default" : "outline"}
                    onClick={() => setActiveSection(section)}
                    className={cn(
                      "gap-2",
                      activeSection.id === section.id && 
                        `bg-gradient-to-r ${section.gradient}`
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{section.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "gap-2",
                showFilters && "bg-indigo-500 hover:bg-indigo-600 text-white"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
          </div>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
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
                  mediaType="movie"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <MovieGrid
                section={activeSection.id}
                mediaType="movie"
                filters={filters}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}