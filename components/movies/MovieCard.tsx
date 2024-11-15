// components/movies/MovieCard.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useListActions } from "@/hooks/useListActions";
import {
  Heart,
  Eye,
  Plus,
  MoreHorizontal,
  Trash2,
  Info,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { SavedMedia, UserList } from "@/types/user";
import StarRating from "./StarRating";
import Link from "next/link";

interface MovieCardProps {
  movie: SavedMedia;
  viewMode?: 'grid' | 'list';
  currentList?: keyof UserList;
  showActions?: boolean;
}

export default function MovieCard({
  movie,
  viewMode = 'grid',
  currentList,
  showActions = true
}: MovieCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { addToList, removeFromList, isInList } = useListActions();
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async (action: string) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    setIsLoading(true);
    try {
      switch (action) {
        case 'watchlist':
          if (await isInList(user.uid, 'watchlist', movie.id)) {
            await removeFromList(user.uid, 'watchlist', movie.id);
            toast({
              title: "Removed from watchlist",
              description: `${movie.title} has been removed from your watchlist`,
            });
          } else {
            await addToList(user.uid, 'watchlist', movie);
            toast({
              title: "Added to watchlist",
              description: `${movie.title} has been added to your watchlist`,
            });
          }
          break;
          
        case 'favorites':
          if (await isInList(user.uid, 'favorites', movie.id)) {
            await removeFromList(user.uid, 'favorites', movie.id);
            toast({
              title: "Removed from favorites",
              description: `${movie.title} has been removed from your favorites`,
            });
          } else {
            await addToList(user.uid, 'favorites', movie);
            toast({
              title: "Added to favorites",
              description: `${movie.title} has been added to your favorites`,
            });
          }
          break;

        case 'watched':
          await addToList(user.uid, 'watched', movie);
          if (currentList === 'watchlist') {
            await removeFromList(user.uid, 'watchlist', movie.id);
          }
          toast({
            title: "Marked as watched",
            description: `${movie.title} has been marked as watched`,
          });
          break;

        case 'remove':
          if (currentList) {
            await removeFromList(user.uid, currentList, movie.id);
            toast({
              title: "Removed",
              description: `${movie.title} has been removed from ${currentList}`,
            });
          }
          break;

        default:
          break;
      }
    } catch (error) {
      console.error('Error handling action:', error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = () => {
    const routeType = movie.media_type === 'tv' ? 'tv' : 'movie';
    router.push(`/${routeType}/${movie.id}`);
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        className="group relative bg-black/20 rounded-lg overflow-hidden hover:bg-black/40 transition-colors"
      >
        <div className="flex items-center gap-4 p-4">
          {/* Poster */}
          <div className="relative h-[150px] w-[100px] shrink-0">
            <Image
              src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
              alt={movie.title}
              fill
              className="rounded object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{movie.title}</h3>
            <p className="text-sm text-gray-400 mt-1">
              {new Date(movie.release_date || movie.first_air_date || '').getFullYear()}
            </p>
            <p className="text-sm text-gray-400 line-clamp-2 mt-2">
              {movie.overview}
            </p>
          </div>

          {/* Actions */}
          {showActions && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleAction('favorites')}
                disabled={isLoading}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleAction('watched')}
                disabled={isLoading}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={isLoading}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/movies/${movie.id}`)}>
                    <Info className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-500"
                    onClick={() => handleAction('remove')}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <Link 
      href={`/${movie.media_type === 'tv' ? 'tv' : 'movies'}/${movie.id}`}
      className="block"
    >
      <motion.div
        layout
        className="group relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer"
        onClick={handleClick}
      >
        {/* Poster */}
        <Image
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-semibold line-clamp-2 mb-2">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
              <span>
                {new Date(movie.release_date || movie.first_air_date || '').getFullYear()}
              </span>
              <span>•</span>
              <StarRating rating={movie.vote_average} />
            </div>

            {/* Actions */}
            {showActions && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full bg-white/20 hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('watchlist');
                  }}
                  disabled={isLoading}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Watchlist
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAction('favorites');
                  }}
                  disabled={isLoading}
                >
                  <Heart className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}