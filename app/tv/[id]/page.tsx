// app/tv/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Play, Star, Clock, Calendar, Plus, User, Heart, Share2, Eye } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { getUserLists, addToList, removeFromList, type SavedMedia } from "@/lib/firebase/userLists";
import { cn } from "@/lib/utils";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TVShowDetails {
  id: number;
  name: string;
  overview: string;
  backdrop_path: string;
  poster_path: string;
  first_air_date: string;
  last_air_date: string;
  episode_run_time: number[];
  vote_average: number;
  genres: Array<{ id: number; name: string }>;
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
  networks: Array<{
    id: number;
    name: string;
    logo_path: string;
  }>;
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
      profile_path: string | null;
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
      name: string;
      poster_path: string;
      vote_average: number;
    }>;
  };
}

export default function TVShowPage() {
  const params = useParams();
  const router = useRouter();
  const [show, setShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const { user } = useAuth();
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isWatched, setIsWatched] = useState(false);

  useEffect(() => {
    const fetchTVDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `https://api.themoviedb.org/3/tv/${params.id}?append_to_response=credits,videos,similar`,
          {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          }
        );

        if (!response.ok) throw new Error("TV show not found");

        const data = await response.json();
        setShow(data);

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
        setError(err instanceof Error ? err.message : "Failed to fetch TV show details");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchTVDetails();
    }
  }, [params.id, user]);

  const trailer = show?.videos?.results.find(
    (video) => video.type === "Trailer" && video.site === "YouTube"
  );

  const handleListAction = async (action: 'watchlist' | 'favorites' | 'watched') => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (!show) return;

    try {
      const mediaItem: Omit<SavedMedia, 'addedAt'> = {
        id: show.id,
        title: show.name,
        poster_path: show.poster_path,
        media_type: 'tv',
        overview: show.overview,
        vote_average: show.vote_average,
        first_air_date: show.first_air_date
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
        await removeFromList(user.uid, action, show.id);
        updateState[action](false);
        toast({
          title: `Removed from ${action}`,
          description: `"${show.name}" has been removed from your ${action}.`
        });
      } else {
        await addToList(user.uid, action, mediaItem);
        updateState[action](true);
        toast({
          title: `Added to ${action}`,
          description: `"${show.name}" has been added to your ${action}.`
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

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: show!.name,
          text: show!.overview,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "TV show link has been copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error",
        description: "Failed to share. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-black">
        <h1 className="text-2xl font-bold mb-4 text-white">
          {error || "Something went wrong"}
        </h1>
        <Button 
          onClick={() => router.back()} 
          variant="outline"
          className="text-white border-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-[100vh] md:h-[85vh]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={`https://image.tmdb.org/t/p/original${show.backdrop_path}`}
            alt={show.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
        </div>

        {/* Content Container */}
        <div className="relative h-full flex flex-col justify-end">
          <div className="container mx-auto px-4 md:px-8 pb-8 md:pb-12">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 mt-[70px] md:mt-0">
              {/* Poster - Hidden on mobile */}
              <div className="hidden md:block shrink-0">
                <Image
                  src={`https://image.tmdb.org/t/p/w500${show.poster_path}`}
                  alt={show.name}
                  width={256}
                  height={384}
                  className="rounded-lg shadow-2xl border-2 border-white/10"
                />
              </div>

              {/* Details */}
              <div className="space-y-4 md:space-y-6">
                {/* Title */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                  {show.name}
                </h1>

                {/* Metadata Badges */}
                <div className="flex flex-wrap gap-2 md:gap-4">
                  <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500">
                    <Star className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    {show.vote_average.toFixed(1)}
                  </Badge>

                  {show.episode_run_time[0] && (
                    <Badge variant="secondary" className="bg-white/10">
                      <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                      {show.episode_run_time[0]} min
                    </Badge>
                  )}

                  <Badge variant="secondary" className="bg-white/10">
                    <Calendar className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                    {new Date(show.first_air_date).getFullYear()}
                  </Badge>

                  <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                    {show.status}
                  </Badge>
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2">
                  {show.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 bg-white/10 rounded-full text-xs md:text-sm 
                               hover:bg-white/20 cursor-pointer transition"
                      onClick={() => router.push(`/genre/${genre.id}`)}
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>

                {/* Overview */}
                <div className="space-y-2">
                  <p className={`text-sm md:text-lg text-gray-200 max-w-2xl 
                             ${!showFullOverview && 'line-clamp-3 md:line-clamp-4'}`}>
                    {show.overview}
                  </p>
                  {show.overview.length > 200 && (
                    <button
                      onClick={() => setShowFullOverview(!showFullOverview)}
                      className="text-xs md:text-sm text-purple-400 hover:text-purple-300"
                    >
                      {showFullOverview ? 'Show Less' : 'Read More'}
                    </button>
                  )}
                </div>

                {/* Show Info */}
                <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-base">
                  <div>
                    <span className="text-gray-400 block text-xs md:text-sm">Seasons</span>
                    <span className="font-medium">{show.number_of_seasons}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-xs md:text-sm">Episodes</span>
                    <span className="font-medium">{show.number_of_episodes}</span>
                  </div>
                  {show.networks[0] && (
                    <div>
                      <span className="text-gray-400 block text-xs md:text-sm">Network</span>
                      <span className="font-medium">{show.networks[0].name}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 md:gap-4 pt-4">
                  {trailer && (
                    <Button 
                      size="lg"
                      onClick={() => setTrailerOpen(true)}
                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white gap-2"
                    >
                      <Play className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                      Watch Trailer
                    </Button>
                  )}

                  <Button
                    size="lg"
                    variant={isInWatchlist ? "secondary" : "outline"}
                    onClick={() => handleListAction('watchlist')}
                    className={cn(
                      "w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10",
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
                      "w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10",
                      isLiked && "text-red-500 border-red-500/50 bg-red-500/10"
                    )}
                  >
                    <Heart className={cn("w-4 h-4 md:w-5 md:h-5", isLiked && "fill-red-500 stroke-red-500")} />
                    {isLiked ? 'Liked' : 'Like'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleListAction('watched')}
                    className={cn(
                      "w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10",
                      isWatched && "bg-green-500/10 border-green-500/50 text-green-500"
                    )}
                  >
                    <Eye className={cn("w-4 h-4 md:w-5 md:h-5", isWatched && "stroke-green-500")} />
                    {isWatched ? 'Watched' : 'Mark as Watched'}
                  </Button>

                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleShare}
                    className="w-full sm:w-auto gap-2 border-white/20 text-white hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cast Section */}
      {show.credits?.cast && show.credits.cast.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Featured Cast</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
              {show.credits.cast.slice(0, 12).map((actor) => (
                <div 
                  key={actor.id} 
                  className="bg-white/5 rounded-lg overflow-hidden group transition-transform 
                           hover:scale-105"
                >
                  {actor.profile_path ? (
                    <div className="aspect-[2/3] relative">
                      <Image
                        src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                        alt={actor.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[2/3] bg-gray-800 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  <div className="p-2 md:p-3">
                    <h3 className="font-medium text-sm md:text-base line-clamp-1">{actor.name}</h3>
                    <p className="text-xs md:text-sm text-gray-400 line-clamp-1">{actor.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Similar Shows */}
      {show.similar?.results.length > 0 && (
        <section className="py-8 md:py-12">
          <div className="container mx-auto px-4 md:px-8">
            <h2 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Similar Shows</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
              {show.similar.results.slice(0, 6).map((similar) => (
                <div
                  key={similar.id}
                  className="bg-white/5 rounded-lg overflow-hidden cursor-pointer 
                           transition-transform hover:scale-105"
                  onClick={() => router.push(`/tv/${similar.id}`)}
                >
                  <div className="aspect-[2/3] relative">
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${similar.poster_path}`}
                      alt={similar.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-2 md:p-3">
                    <h3 className="font-medium text-sm md:text-base line-clamp-2">{similar.name}</h3>
                    <div className="flex items-center mt-1">
                      <Star className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 mr-1" />
                      <span className="text-xs md:text-sm">{similar.vote_average.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
    </div>
  );
}