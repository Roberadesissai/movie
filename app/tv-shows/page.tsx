// app/tv-shows/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Tv2, 
  Broadcast, 
  Star, 
  TrendingUp,
  Calendar,
  Filter,
  ChevronDown,
  Loader2,
  LucideIcon 
} from "lucide-react";
import { doc, getDoc } from 'firebase/firestore';
import { projectFirestore as db, projectAuth, projectStorage } from '@/firebase/config';
import MovieGrid from "@/components/movies/MovieGrid";
import FilterPanel from "@/components/movies/FilterPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Section {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
}

const sections: Section[] = [
  { 
    id: "popular", 
    label: "Popular Shows",
    description: "Currently trending TV shows",
    icon: TrendingUp,
    gradient: "from-pink-500 via-purple-500 to-indigo-500"
  },
  { 
    id: "on_the_air", 
    label: "On TV",
    description: "Shows currently airing",
    icon: Broadcast,
    gradient: "from-blue-500 via-cyan-500 to-teal-500"
  },
  { 
    id: "airing_today", 
    label: "Airing Today",
    description: "New episodes today",
    icon: Calendar,
    gradient: "from-green-500 via-emerald-500 to-lime-500"
  },
  { 
    id: "top_rated", 
    label: "Top Rated",
    description: "Highest rated TV shows",
    icon: Star,
    gradient: "from-orange-500 via-amber-500 to-yellow-500"
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

export default function TVShowsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState(sections[0]);
  const [filters, setFilters] = useState(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userPreferences, setUserPreferences] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [featured, setFeatured] = useState<any>(null);

  // Load user preferences
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setUserPreferences(userSnap.data());
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };
    loadUserPreferences();
  }, [user]);

  // Fetch featured show
  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await fetch(
          'https://api.themoviedb.org/3/tv/popular?language=en-US&page=1',
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );
        const data = await response.json();
        if (data.results?.length > 0) {
          // Get full details of the first show
          const showResponse = await fetch(
            `https://api.themoviedb.org/3/tv/${data.results[0].id}?append_to_response=credits,videos`,
            {
              headers: {
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
              },
            }
          );
          const showData = await showResponse.json();
          setFeatured(showData);
        }
      } catch (error) {
        console.error("Error fetching featured show:", error);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative h-[60vh] overflow-hidden">
        <AnimatePresence mode="wait">
          {featured && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <img
                  src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
                  alt={featured.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="container mx-auto px-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="max-w-2xl space-y-6"
                  >
                    <Badge 
                      className="bg-white/10 backdrop-blur-sm text-white px-3 py-1"
                    >
                      Featured Show
                    </Badge>

                    <h1 className="text-5xl md:text-6xl font-bold">
                      {featured.name}
                    </h1>

                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                        <Star className="w-4 h-4 mr-1" />
                        {featured.vote_average.toFixed(1)}
                      </Badge>
                      
                      {featured.first_air_date && (
                        <Badge variant="secondary" className="bg-white/10">
                          {new Date(featured.first_air_date).getFullYear()}
                        </Badge>
                      )}
                      
                      {featured.genres?.slice(0, 2).map((genre: any) => (
                        <Badge 
                          key={genre.id}
                          variant="secondary" 
                          className="bg-white/10"
                        >
                          {genre.name}
                        </Badge>
                      ))}
                    </div>

                    <p className="text-lg text-gray-300 line-clamp-3">
                      {featured.overview}
                    </p>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative -mt-32 z-10">
        <div className="container mx-auto px-4">
          {/* Controls Section */}
          <div className="flex items-center justify-between mb-8">
            {/* Mobile Menu */}
            <div className="lg:hidden relative w-full">
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
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 
                             bg-black/50 backdrop-blur-sm border border-white/10 
                             rounded-xl overflow-hidden"
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
                              `bg-gradient-to-r ${section.gradient}`
                          )}
                        >
                          {Icon && <Icon className="w-5 h-5" />}
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
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{section.label}</span>
                  </Button>
                );
              })}
            </div>

            {/* Filter Toggle */}
            <Button
              variant={"outline"}
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
                  onFilterChange={setFilters}
                  mediaType="tv"
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
                mediaType="tv"
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