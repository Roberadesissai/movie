// app/movie/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, 
  Play, 
  Star, 
  Clock, 
  Calendar,
  Heart,
  Plus,
  Eye,
  Share2,
  X,
  ExternalLink,
  Film
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserLists, addToList, removeFromList, type SavedMedia } from "@/lib/firebase/userLists";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { WatchProvidersDialog } from "@/components/WatchProvidersDialog";

export const dynamic = 'force-dynamic';

interface MovieDetails {
  id: number;
  title: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  release_date: string;
  runtime: number;
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  credits?: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
    }>;
  };
  videos?: {
    results: Array<{
      id: string;
      key: string;
      name: string;
      type: string;
      site: string;
    }>;
  };
  similar?: {
    results: Array<{
      id: number;
      title: string;
      poster_path: string;
    }>;
  };
}

interface UserLists {
  watchlist: SavedMedia[];
  favorites: SavedMedia[];
  watched: SavedMedia[];
  wantToWatch: SavedMedia[];
  recentlyViewed: SavedMedia[];
}

interface CastMovies {
  id: number;
  cast: Array<{
    id: number;
    title: string;
    poster_path: string;
    character: string;
  }>;
}

export default function MoviePage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedActor, setSelectedActor] = useState<number | null>(null);
  const [actorMovies, setActorMovies] = useState<CastMovies | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);
  const [watchProvidersOpen, setWatchProvidersOpen] = useState(false);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${params.id}?append_to_response=credits,videos,similar`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );

        if (!response.ok) throw new Error("Movie not found");

        const data = await response.json();
        setMovie(data);

        // Check user lists if logged in
        if (user) {
          try {
            const userLists = await getUserLists(user.uid);
            setIsInWatchlist(userLists.watchlist.some(m => m.id === data.id));
            setIsLiked(userLists.favorites.some(m => m.id === data.id));
            setIsWatched(userLists.watched.some(m => m.id === data.id));
          } catch (error) {
            console.error('Error fetching user lists:', error);
            toast({
              title: "Error",
              description: "Failed to load your lists. Some features may be limited.",
              variant: "destructive",
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch movie details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchMovieDetails();
    }
  }, [params.id, user]);

  const handleListAction = async (action: 'watchlist' | 'favorites' | 'watched') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!movie) return;

    try {
      const mediaItem: Omit<SavedMedia, 'addedAt'> = {
        id: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        media_type: 'movie',
        overview: movie.overview,
        vote_average: movie.vote_average,
        release_date: movie.release_date
      };

      const updateState = {
        watchlist: setIsInWatchlist,
        favorites: setIsLiked,
        watched: setIsWatched,
      };

      const currentState = {
        watchlist: isInWatchlist,
        favorites: isLiked,
        watched: isWatched,
      };

      if (currentState[action]) {
        await removeFromList(user.uid, action, movie.id);
        updateState[action](false);
        toast({
          title: `Removed from ${action}`,
          description: `"${movie.title}" has been removed from your ${action}.`
        });
      } else {
        await addToList(user.uid, action, mediaItem);
        updateState[action](true);
        toast({
          title: `Added to ${action}`,
          description: `"${movie.title}" has been added to your ${action}.`
        });
      }
    } catch (error) {
      console.error('Error updating list:', error);
      toast({
        title: "Error",
        description: "Failed to update list. Please try again.",
        variant: "destructive",
      });
    }
  };

  const fetchActorMovies = async (actorId: number) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/person/${actorId}/movie_credits`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
          },
        }
      );
      
      if (!response.ok) throw new Error("Failed to fetch actor movies");
      
      const data = await response.json();
      setActorMovies(data);
    } catch (error) {
      console.error('Error fetching actor movies:', error);
      toast({
        title: "Error",
        description: "Failed to load actor's movies",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Movie link has been copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not copy to clipboard. Please copy the URL manually.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Loading Skeleton */}
        <div className="relative h-[70vh]">
          <Skeleton className="absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto">
              <div className="flex gap-8">
                <Skeleton className="w-64 h-96 shrink-0" />
                <div className="space-y-4 flex-1">
                  <Skeleton className="h-12 w-3/4" />
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-2xl font-bold text-red-500">
            {error || "Something went wrong"}
          </h1>
          <Button 
            onClick={() => router.back()} 
            variant="outline"
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </Button>
        </motion.div>
      </div>
    );
  }

  const trailer = movie.videos?.results.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  );

  const director = movie.credits?.crew.find(
    (person) => person.job === "Director"
  );

  return (
    <>
      <div className="min-h-screen">
        {/* Movie Details Section */}
        <div className="min-h-screen">
          {/* Hero Section with adjusted heights and spacing */}
          <div className="relative min-h-[100vh] md:h-[85vh]">
            {/* Background Image */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0"
            >
              <Image
                src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
                alt={movie.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
            </motion.div>

            {/* Content Container */}
            <div className="relative h-full flex flex-col justify-end pb-6 md:pb-12">
              <div className="container mx-auto px-4 md:px-8">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-[70px] md:mt-0">
                  {/* Poster */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="hidden md:block shrink-0"
                  >
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      width={256}
                      height={384}
                      className="rounded-lg shadow-2xl"
                    />
                  </motion.div>

                  {/* Details */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 md:space-y-6"
                  >
                    {/* Title */}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                      {movie.title}
                    </h1>

                    {/* Metadata Badges */}
                    <div className="flex flex-wrap gap-2 md:gap-4">
                      <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                        <Star className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {movie.vote_average.toFixed(1)}
                      </Badge>
                      
                      <Badge variant="secondary" className="bg-white/10">
                        <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {movie.runtime} min
                      </Badge>
                      
                      <Badge variant="secondary" className="bg-white/10">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                        {new Date(movie.release_date).getFullYear()}
                      </Badge>
                    </div>

                    {/* Genres */}
                    <div className="flex flex-wrap gap-2">
                      {movie.genres.map((genre) => (
                        <Badge
                          key={genre.id}
                          className="bg-white/10 hover:bg-white/20 text-white border border-white/20 
                                   transition-colors cursor-pointer hover:border-white/40
                                   text-xs md:text-sm"
                          onClick={() => router.push(`/genre/${genre.id}`)}
                        >
                          {genre.name}
                        </Badge>
                      ))}
                    </div>

                    {/* Director */}
                    {director && (
                      <p className="text-sm md:text-base text-gray-400">
                        Directed by{" "}
                        <span className="text-white">{director.name}</span>
                      </p>
                    )}

                    {/* Overview */}
                    <p className="text-sm md:text-lg text-gray-200 max-w-2xl 
                               line-clamp-3 md:line-clamp-none">
                      {movie.overview}
                    </p>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 md:gap-4 pt-4">
                      {trailer && (
                        <Button 
                          size="lg"
                          onClick={() => setTrailerOpen(true)}
                          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white 
                                   gap-2 transition-colors text-sm md:text-base"
                        >
                          <Play className="w-4 h-4 md:w-5 md:h-5" />
                          Watch Trailer
                        </Button>
                      )}

                      <Button
                        size="lg"
                        variant={isInWatchlist ? "secondary" : "outline"}
                        onClick={() => handleListAction('watchlist')}
                        className={cn(
                          "w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10 text-sm md:text-base",
                          isInWatchlist && "bg-white/10 border-white/40"
                        )}
                      >
                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                        {isInWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => handleListAction('favorites')}
                        className={cn(
                          "w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10 text-sm md:text-base",
                          isLiked && "text-red-500 border-red-500/50 bg-red-500/10"
                        )}
                      >
                        <Heart className={cn("w-4 h-4 md:w-5 md:h-5", isLiked && "fill-red-500 stroke-red-500")} />
                        {isLiked ? 'Liked' : 'Like'}
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleShare}
                        className="w-full sm:w-auto gap-2 border-white/20 text-white 
                                 hover:bg-white/10 text-sm md:text-base"
                      >
                        <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                        Share
                      </Button>

                      <Button
                        size="lg"
                        variant="outline"
                        onClick={() => setWatchProvidersOpen(true)}
                        className="w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
                      >
                        <ExternalLink className="w-4 h-4 md:w-5 md:h-5" />
                        Where to Watch
                      </Button>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Cast Section */}
          {movie.credits?.cast && movie.credits.cast.length > 0 && (
            <section className="py-16 bg-black/50">
              <div className="container mx-auto px-8">
                <h2 className="text-2xl font-bold mb-8">Featured Cast</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {movie.credits.cast.slice(0, 12).map((actor) => (
                    <motion.div
                      key={actor.id}
                      whileHover={{ scale: 1.05 }}
                      className="relative group cursor-pointer"
                      onClick={() => {
                        setSelectedActor(actor.id);
                        fetchActorMovies(actor.id);
                      }}
                    >
                      {actor.profile_path ? (
                        <Image
                          src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                          alt={actor.name}
                          width={185}
                          height={278}
                          className="rounded-lg transition-transform duration-300 group-hover:brightness-75"
                        />
                      ) : (
                        <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                          <Film className="w-8 h-8 text-gray-500" />
                        </div>
                      )}
                      <div className="mt-2">
                        <h3 className="font-medium text-sm">{actor.name}</h3>
                        <p className="text-sm text-gray-400 truncate">
                          {actor.character}
                        </p>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View More
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Similar Movies */}
          {movie.similar?.results.length > 0 && (
            <section className="py-16">
              <div className="container mx-auto px-8">
                <h2 className="text-2xl font-bold mb-8">Similar Movies</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {movie.similar.results.slice(0, 6).map((similar) => (
                    <motion.div
                      key={similar.id}
                      whileHover={{ scale: 1.05 }}
                      className="cursor-pointer"
                      onClick={() => router.push(`/movies/${similar.id}`)}
                    >
                      <Image
                        src={`https://image.tmdb.org/t/p/w500${similar.poster_path}`}
                        alt={similar.title}
                        width={185}
                        height={278}
                        className="rounded-lg"
                      />
                      <h3 className="mt-2 text-sm font-medium truncate">
                        {similar.title}
                      </h3>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Trailer Modal */}
        <Dialog open={trailerOpen} onOpenChange={setTrailerOpen}>
          <DialogContent className="max-w-5xl bg-black/90 border-white/10">
            <DialogHeader>
              <DialogTitle>Official Trailer</DialogTitle>
            </DialogHeader>
            {trailer && (
              <div className="relative aspect-video">
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?autoplay=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full rounded-lg"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Actor Movies Modal */}
        <Dialog 
          open={selectedActor !== null} 
          onOpenChange={() => setSelectedActor(null)}
        >
          <DialogContent className="max-w-4xl bg-black/90 border-white/10">
            <DialogHeader>
              <DialogTitle>
                {actorMovies?.cast[0]?.character} - Filmography
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto">
              {actorMovies?.cast.map((movie) => (
                <motion.div
                  key={movie.id}
                  whileHover={{ scale: 1.05 }}
                  className="cursor-pointer"
                  onClick={() => {
                    router.push(`/movies/${movie.id}`);
                    setSelectedActor(null);
                  }}
                >
                  {movie.poster_path ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                      alt={movie.title}
                      width={185}
                      height={278}
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center">
                      <Film className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                  <h3 className="mt-2 text-sm font-medium">{movie.title}</h3>
                  <p className="text-xs text-gray-400">as {movie.character}</p>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>

        <WatchProvidersDialog
          isOpen={watchProvidersOpen}
          onOpenChange={setWatchProvidersOpen}
          mediaType="movie"
          mediaId={params.id as string}
          title={movie?.title || ''}
        />
      </div>
    </>
  );
}