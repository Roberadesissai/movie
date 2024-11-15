// components/layout/Hero.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Info, Star, Clock, Calendar } from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface Movie {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  vote_average: number;
  release_date: string;
  runtime?: number;
  genres?: Array<{ id: number; name: string }>;
  adult?: boolean;
}

export default function Hero() {
  const router = useRouter();
  const [movie, setMovie] = useState<Movie | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        // Fetch initial movie data
        const response = await fetch(
          'https://api.themoviedb.org/3/trending/movie/day',
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );
        const data = await response.json();
        
        // Fetch additional movie details
        const movieDetails = await fetch(
          `https://api.themoviedb.org/3/movie/${data.results[0].id}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );
        const detailedMovie = await movieDetails.json();
        setMovie(detailedMovie);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching movie:', error);
        setIsLoading(false);
      }
    };

    fetchMovie();
  }, []);

  useEffect(() => {
    const fetchTrailer = async () => {
      if (!movie) return;
      
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/videos`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );
        const data = await response.json();
        const trailer = data.results?.find(
          (video: any) => video.type === "Trailer" && video.site === "YouTube"
        );
        if (trailer) {
          setTrailerKey(trailer.key);
        }
      } catch (error) {
        console.error('Error fetching trailer:', error);
      }
    };

    fetchTrailer();
  }, [movie?.id]);

  const handleMoreInfo = () => {
    if (movie) {
      router.push(`/movies/${movie.id}`);
    }
  };

  if (isLoading || !movie) {
    return (
      <div className="h-[85vh] bg-gradient-to-r from-gray-900 to-black animate-pulse" />
    );
  }

  return (
    <>
      <div className="relative h-[80vh] md:h-[85vh] w-full overflow-hidden">
        {/* Background Image with Ken Burns effect */}
        <AnimatePresence>
          <motion.div 
            className="absolute inset-0"
            initial={{ scale: 1 }}
            animate={{ 
              scale: imageLoaded ? 1.05 : 1,
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
          >
            <Image
              src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
              alt={movie.title}
              fill
              priority
              className="object-cover"
              onLoadingComplete={() => setImageLoaded(true)}
            />
            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 h-[50%] bg-gradient-to-t from-black to-transparent" />
          </motion.div>
        </AnimatePresence>

        {/* Adjusted content positioning for better mobile display */}
        <div className="absolute inset-0 flex items-start sm:items-center pt-[20vh] sm:pt-[20vh]">
          <motion.div 
            className="px-4 md:px-8 w-full md:max-w-3xl space-y-4 sm:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mb-2 sm:mb-6"
            >
              <Badge 
                className={cn(
                  "bg-purple-500/20 text-purple-400 rounded-full",
                  "px-3 py-1 text-xs font-medium",
                  "backdrop-blur-sm border border-purple-500/20"
                )}
              >
                Featured
              </Badge>
            </motion.div>

            {/* Title - Adjusted spacing */}
            <motion.h1 
              className={cn(
                "text-2xl sm:text-4xl md:text-6xl font-bold mb-4 sm:mb-12",
                "leading-normal",
                "pt-2 pb-2",
                "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                "bg-clip-text text-transparent",
                "drop-shadow-lg"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {movie.title}
            </motion.h1>

            {/* Movie Info - Keeps its existing styling */}
            <motion.div 
              className="flex flex-wrap items-center gap-3 mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 px-3 py-1">
                <Star className="w-4 h-4 mr-1" />
                {movie.vote_average.toFixed(1)}
              </Badge>

              {movie.runtime && (
                <Badge variant="secondary" className="bg-white/10 px-3 py-1">
                  <Clock className="w-4 h-4 mr-1" />
                  {movie.runtime} min
                </Badge>
              )}

              <Badge variant="secondary" className="bg-white/10 px-3 py-1">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(movie.release_date).getFullYear()}
              </Badge>
            </motion.div>

            {/* Genres */}
            {movie.genres && (
              <motion.div 
                className="flex flex-wrap gap-2 mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
              >
                {movie.genres.map((genre) => (
                  <span
                    key={genre.id}
                    className="px-3 py-1 bg-white/10 rounded-full text-sm font-medium
                             hover:bg-white/20 transition-colors cursor-pointer"
                  >
                    {genre.name}
                  </span>
                ))}
              </motion.div>
            )}

            {/* Overview - Adjusted line clamp for mobile */}
            <motion.p 
              className={cn(
                "text-base mb-4 sm:mb-6 leading-relaxed",
                "max-w-xl line-clamp-2 sm:line-clamp-3",
                "font-normal text-gray-400",
                "font-sans",
                "drop-shadow-lg"
              )}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              {movie.overview}
            </motion.p>

            {/* Buttons - Adjusted spacing and padding */}
            <motion.div 
              className="flex flex-col sm:flex-row items-center gap-4 pt-4 sm:pt-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 
                         hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600
                         text-white font-medium px-8
                         transform transition-transform hover:scale-105"
                onClick={() => setTrailerOpen(true)}
              >
                <Play className="mr-2 h-5 w-5" /> 
                Watch Trailer
              </Button>

              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-white/20 bg-black/30 backdrop-blur-sm
                         hover:bg-white/20 transition-colors
                         font-medium px-8"
                onClick={handleMoreInfo}
              >
                <Info className="mr-2 h-5 w-5" /> 
                More Info
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Updated Trailer Modal */}
      <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
        <DialogContent className="sm:max-w-[900px] p-0 bg-black">
          <DialogTitle className="sr-only">
            {movie?.title ? `${movie.title} Trailer` : 'Movie Trailer'}
          </DialogTitle>
          
          {trailerKey ? (
            <div className="aspect-video">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="rounded-lg"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-gray-400">No trailer available</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}