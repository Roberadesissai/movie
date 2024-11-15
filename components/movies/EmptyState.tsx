// components/movies/EmptyState.tsx
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Film, Tv2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center space-y-6"
    >
      <div className="relative mx-auto w-24 h-24">
        <motion.div
          className="absolute inset-0 bg-indigo-500/20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [1, 0.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <div className="relative bg-indigo-500/20 rounded-full p-6">
          <Plus className="w-12 h-12 text-indigo-500" />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Your Collections Are Empty</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Start building your personal collections by adding movies and TV shows that you want to watch, love, or have already seen.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Button
          onClick={() => router.push('/movies')}
          className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600"
        >
          <Film className="w-4 h-4 mr-2" />
          Browse Movies
        </Button>
        <Button
          onClick={() => router.push('/tv-shows')}
          className="w-full sm:w-auto bg-indigo-500 hover:bg-indigo-600"
        >
          <Tv2 className="w-4 h-4 mr-2" />
          Browse TV Shows
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
        {['Watchlist', 'Favorites', 'Watched', 'Want to Watch'].map((collection) => (
          <div
            key={collection}
            className="p-6 rounded-lg border border-white/10 bg-black/20"
          >
            <h3 className="font-semibold mb-2">{collection}</h3>
            <p className="text-sm text-gray-400">
              Add titles to your {collection.toLowerCase()} to keep track of what you want to watch.
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}