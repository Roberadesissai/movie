import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;  // Rating out of 10
  className?: string;
}

export default function StarRating({ rating, className }: StarRatingProps) {
  // Convert rating from 0-10 scale to 0-5 scale
  const starRating = Math.round(rating / 2);
  
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= starRating
              ? "fill-yellow-400 text-yellow-400" // Filled star
              : "fill-transparent text-gray-500" // Empty star
          )}
        />
      ))}
      <span className="ml-1 text-sm text-gray-400">
        {(rating / 2).toFixed(1)}
      </span>
    </div>
  );
} 