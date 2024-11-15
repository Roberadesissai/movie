// components/movies/MovieGrid.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MovieCard from "./MovieCard";
import { cn } from "@/lib/utils";
// import MovieTabs, { movieSections } from '../sections/MovieTabs';

interface MovieGridProps {
  section: string;
  mediaType?: 'movie' | 'tv' | 'anime';
  filters?: {
    genres: number[];
    rating: number;
    year: number | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  className?: string;
}

interface Movie {
  id: number;
  title?: string;
  name?: string;
  poster_path: string;
  backdrop_path: string;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  overview: string;
  media_type?: 'movie' | 'tv';
}

const defaultFilters = {
  genres: [],
  rating: 0,
  year: null,
  sortBy: 'popularity',
  sortOrder: 'desc' as const
};

export default function MovieGrid({
  section,
  mediaType = 'movie',
  filters = defaultFilters,
  className
}: MovieGridProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalResults, setTotalResults] = useState(0);

  useEffect(() => {
    setMovies([]);
    setPage(1);
    setHasMore(true);
    fetchMovies(1, true);
  }, [section, mediaType, JSON.stringify(filters)]); // Added JSON.stringify for proper dependency tracking

  const getApiUrl = (pageNum: number) => {
    const baseUrl = 'https://api.themoviedb.org/3';
    const params = new URLSearchParams();
    params.append('page', pageNum.toString());
    params.append('language', 'en-US');

    // Add filter parameters
    if (filters.genres.length > 0) {
      params.append('with_genres', filters.genres.join(','));
    }
    
    // Add year filter
    if (filters.year) {
      if (mediaType === 'movie') {
        params.append('primary_release_year', filters.year.toString());
      } else {
        params.append('first_air_date_year', filters.year.toString());
      }
    }

    // Add sort parameters
    if (filters.sortBy) {
      params.append('sort_by', `${filters.sortBy}.${filters.sortOrder}`);
    }

    // Handle endpoints
    let endpoint = '';
    const isFilterMode = filters.genres.length > 0 || filters.year || filters.rating > 0;

    if (isFilterMode) {
      // Use discover endpoint when filters are active
      endpoint = `/discover/${mediaType}`;
    } else {
      // Use specific endpoints when no filters are active
      switch (section) {
        case 'trending':
        case 'trending_movies':
        case 'trending_tv':
          endpoint = `/trending/${mediaType}/week`;
          break;
        case 'now_playing':
          endpoint = mediaType === 'movie' ? '/movie/now_playing' : '/tv/on_the_air';
          break;
        case 'popular':
        case 'popular_movies':
        case 'popular_tv':
          endpoint = `/${mediaType}/popular`;
          break;
        case 'top_rated':
        case 'top_rated_movies':
        case 'top_rated_tv':
          endpoint = `/${mediaType}/top_rated`;
          break;
        case 'upcoming':
        case 'upcoming_movies':
          endpoint = mediaType === 'movie' ? '/movie/upcoming' : '/tv/airing_today';
          break;
        default:
          endpoint = `/discover/${mediaType}`;
      }
    }

    return `${baseUrl}${endpoint}?${params.toString()}`;
  };

  const fetchMovies = async (pageNum: number, isNewRequest: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        getApiUrl(pageNum),
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      // Filter results
      const filteredResults = data.results.filter((movie: Movie) => {
        const hasValidPoster = movie.poster_path != null;
        const meetsRatingCriteria = !filters.rating || movie.vote_average >= filters.rating;
        return hasValidPoster && meetsRatingCriteria;
      });

      setMovies(prev => isNewRequest ? filteredResults : [...prev, ...filteredResults]);
      setTotalResults(data.total_results);
      setHasMore(pageNum < data.total_pages);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchMovies(page + 1);
    }
  };

  if (loading && movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="mt-4 text-sm text-gray-400">Loading content...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-red-400 mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => fetchMovies(1, true)}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-gray-400 mb-2">No results found</p>
        <p className="text-sm text-gray-500">
          Try adjusting your filters or changing your search criteria
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6",
          className
        )}
      >
        {movies.map((movie, index) => (
          <motion.div
            key={`${movie.id}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <MovieCard
              movie={{
                ...movie,
                title: movie.title || movie.name || '',
                media_type: mediaType === 'anime' ? 'tv' : mediaType,
                type: mediaType === 'anime' ? 'tv' : mediaType,
                addedAt: new Date().toISOString()
              }}
            />
          </motion.div>
        ))}
      </motion.div>

      {hasMore && (
        <div className="flex justify-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading more...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}

      <div className="text-center text-sm text-gray-400">
        Showing {movies.length} of {totalResults} results
      </div>
    </div>
  );
}