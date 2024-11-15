// components/movies/MovieRecommendation.tsx
import { motion } from "framer-motion";
import { Star, Plus, Check, Info } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toggleMediaInWatchlist } from "@/lib/firebase/userUtils";
import { cn } from "@/lib/utils";

interface MovieRecommendationProps {
 movie: {
   id: number;
   title: string;
   poster_path: string;
   release_date: string;
   vote_average: number;
   overview: string;
 };
 onClick?: () => void;
 inWatchlist?: boolean;
}

export default function MovieRecommendation({ 
 movie, 
 onClick,
 inWatchlist = false 
}: MovieRecommendationProps) {
 const { user } = useAuth();
 const [isInWatchlist, setIsInWatchlist] = useState(inWatchlist);
 const [isHovered, setIsHovered] = useState(false);

 const handleWatchlistToggle = async (e: React.MouseEvent) => {
   e.stopPropagation();
   if (!user) return;

   try {
     const mediaItem = {
       ...movie,
       type: 'movie' as const,
       genre_ids: [] // Add actual genre_ids if available
     };
     const result = await toggleMediaInWatchlist(user.uid, mediaItem);
     setIsInWatchlist(result);
   } catch (error) {
     console.error('Error toggling watchlist:', error);
   }
 };

 return (
   <div className="flex gap-4 items-start p-2 rounded-lg hover:bg-white/5 transition-colors">
     {movie.poster_path && (
       <Image
         src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
         alt={movie.title}
         width={92}
         height={138}
         className="rounded-md w-16 h-24 object-cover"
         priority
       />
     )}
     <div className="flex-1">
       <h3 className="font-medium bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
         {movie.title} ({movie.release_date.split('-')[0]})
       </h3>
       <p className="text-sm text-gray-400 mt-1">{movie.overview}</p>
     </div>
   </div>
 );
}