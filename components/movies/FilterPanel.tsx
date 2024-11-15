/* eslint-disable @typescript-eslint/no-explicit-any */
// components/movies/FilterPanel.tsx
"use client";

import { useState, useEffect } from "react";
import { motion} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  X,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FilterPanelProps {
  filters: {
    genres: number[];
    rating: number;
    year: number | null;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  };
  onFilterChange: (filters: any) => void;
  mediaType: 'movie' | 'tv';
}

export default function FilterPanel({
  filters,
  onFilterChange,
  mediaType
}: FilterPanelProps) {
  const [genres, setGenres] = useState<Array<{ id: number; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/genre/${mediaType}/list`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );
        if (!response.ok) throw new Error('Failed to fetch genres');
        const data = await response.json();
        setGenres(data.genres);
      } catch (err) {
        setError('Failed to load genres');
        console.error('Error fetching genres:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGenres();
  }, [mediaType]);

  const yearsRange = Array.from(
    { length: 50 },
    (_, i) => new Date().getFullYear() - i
  );

  const handleGenreToggle = (genreId: number) => {
    const newGenres = filters.genres.includes(genreId)
      ? filters.genres.filter(id => id !== genreId)
      : [...filters.genres, genreId];
    
    onFilterChange({
      ...filters,
      genres: newGenres
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-white/10 rounded w-1/4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-8 bg-white/10 rounded"></div>
            <div className="h-8 bg-white/10 rounded"></div>
            <div className="h-8 bg-white/10 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6">
        <div className="text-center text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="w-full bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl"
    >
      <div className="p-6 space-y-6">
        {/* Genres */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">Genres</h3>
            {filters.genres.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ ...filters, genres: [] })}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
          <ScrollArea className="h-[180px]">
            <div className="grid grid-cols-2 gap-2 pr-4">
              {genres.map((genre) => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreToggle(genre.id)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm text-left transition-colors",
                    filters.genres.includes(genre.id)
                      ? "bg-indigo-500 text-white"
                      : "hover:bg-white/5 text-gray-400 hover:text-white"
                  )}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Rating Slider */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">
              Minimum Rating: {filters.rating}
            </h3>
            {filters.rating > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ ...filters, rating: 0 })}
                className="text-xs text-gray-400 hover:text-white"
              >
                Reset
              </Button>
            )}
          </div>
          <Slider
            defaultValue={[filters.rating]}
            max={10}
            step={0.5}
            onValueChange={([value]) => 
              onFilterChange({ ...filters, rating: value })
            }
          />
        </div>

        {/* Year Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">Release Year</h3>
            {filters.year && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onFilterChange({ ...filters, year: null })}
                className="text-xs text-gray-400 hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
          <Select
            value={filters.year?.toString() || ""}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                year: value === "all" ? null : parseInt(value)
              })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="All Years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {yearsRange.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">Sort By</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                onFilterChange({
                  ...filters,
                  sortOrder: filters.sortOrder === "asc" ? "desc" : "asc"
                })
              }
              className="text-xs"
            >
              {filters.sortOrder === "asc" ? (
                <SortAsc className="h-4 w-4" />
              ) : (
                <SortDesc className="h-4 w-4" />
              )}
            </Button>
          </div>
          <Select
            value={filters.sortBy}
            onValueChange={(value) =>
              onFilterChange({ ...filters, sortBy: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popularity">Popularity</SelectItem>
              <SelectItem value="vote_average">Rating</SelectItem>
              <SelectItem value="release_date">Release Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters */}
        {(filters.genres.length > 0 || filters.rating > 0 || filters.year) && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex flex-wrap gap-2">
              {filters.genres.map((genreId) => {
                const genre = genres.find((g) => g.id === genreId);
                return genre ? (
                  <Badge
                    key={genreId}
                    variant="outline"
                    className="group cursor-pointer hover:bg-white/10"
                    onClick={() => handleGenreToggle(genreId)}
                  >
                    {genre.name}
                    <X className="w-3 h-3 ml-1 opacity-0 group-hover:opacity-100" />
                  </Badge>
                ) : null;
              })}
              {filters.rating > 0 && (
                <Badge variant="outline">
                  {filters.rating}+ Rating
                </Badge>
              )}
              {filters.year && (
                <Badge variant="outline">
                  Year: {filters.year}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}