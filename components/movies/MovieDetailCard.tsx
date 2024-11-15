// components/movies/MovieDetailCard.tsx
"use client";

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Star, Clock, Calendar } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { MovieDetails } from '@/lib/movieUtils';
import { cn } from "@/lib/utils";

interface MovieDetailCardProps {
  movie: MovieDetails;
  onClick: () => void;
}

const MovieDetailCard = ({ movie, onClick }: MovieDetailCardProps) => {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      className="relative group cursor-pointer rounded-lg overflow-hidden"
      whileHover={{ scale: 1.03 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <div className="relative aspect-[2/3]">
        <Image
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          fill
          className={cn(
            "object-cover transition-transform duration-300",
            "group-hover:scale-105"
          )}
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          onError={() => setImageError(true)}
        />

        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t",
          "from-black via-black/60 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        )}>
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
            {/* Title */}
            <h3 className="text-base font-bold line-clamp-2">
              {movie.title}
            </h3>

            {/* Info Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="secondary" 
                className="bg-yellow-500/20 text-yellow-500"
              >
                <Star className="w-3 h-3 mr-1" />
                {movie.vote_average.toFixed(1)}
              </Badge>

              {movie.runtime > 0 && (
                <Badge 
                  variant="secondary" 
                  className="bg-white/10"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m
                </Badge>
              )}
              
              <Badge 
                variant="secondary" 
                className="bg-white/10"
              >
                <Calendar className="w-3 h-3 mr-1" />
                {new Date(movie.release_date).getFullYear()}
              </Badge>
            </div>

            {/* Cast & Director */}
            {movie.director && (
              <p className="text-sm text-gray-300 line-clamp-1">
                Dir: {movie.director}
              </p>
            )}
            
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-gray-400">Starring:</p>
                <p className="text-sm text-gray-300 line-clamp-2">
                  {movie.cast.map(actor => actor.name).join(', ')}
                </p>
              </div>
            )}

            {/* Genres */}
            {movie.genres && (
              <div className="flex flex-wrap gap-1">
                {movie.genres.slice(0, 3).map(genre => (
                  <span 
                    key={genre.id}
                    className="text-xs px-2 py-1 rounded-full bg-white/10"
                  >
                    {genre.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MovieDetailCard;