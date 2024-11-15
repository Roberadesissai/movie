/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/Sidebar.tsx
"use client";

import { useState } from "react";
import { 
  TrendingUp, 
  Star, 
  Tv, 
  Calendar,
  Clock, 
  Award,
  Heart,
  History,
  BookMarked,
  Download,
  Settings,
  HelpCircle,
  ChevronDown,
  PlayCircle,
  Popcorn,
  Clapperboard,
  Film as FilmIcon,
  Tv2,
  Library,
  Compass,
  Gamepad2,
  Users
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";

interface SidebarProps {
  currentSection: {
    mediaType: 'movie' | 'tv' | 'anime';
    section: string;
  };
  onSectionChange: ({ mediaType, section }: { mediaType: 'movie' | 'tv' | 'anime', section: string }) => void;
  isOpen: boolean;
  onToggle: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

interface CategorySection {
  id: string;
  label: string;
  icon: any;
  items: NavItem[];
}

const categories: CategorySection[] = [
  {
    id: "movies",
    label: "Movies",
    icon: FilmIcon,
    items: [
      { id: "trending_movies", label: "Trending Now", icon: TrendingUp },
      { id: "popular_movies", label: "Popular", icon: Star },
      { id: "top_rated_movies", label: "Top Rated", icon: Award },
      { id: "upcoming_movies", label: "Upcoming", icon: Calendar },
      { id: "now_playing", label: "Now Playing", icon: PlayCircle },
      { id: "movie_genres", label: "Browse by Genre", icon: Compass },
    ]
  },
  {
    id: "tv",
    label: "TV Shows",
    icon: Tv2,
    items: [
      { id: "trending_tv", label: "Trending Shows", icon: TrendingUp },
      { id: "popular_tv", label: "Popular Shows", icon: Star },
      { id: "top_rated_tv", label: "Top Rated", icon: Award },
      { id: "airing_today", label: "Airing Today", icon: Clock },
      { id: "tv_genres", label: "Browse by Genre", icon: Compass },
    ]
  },
  {
    id: "anime",
    label: "Anime",
    icon: Popcorn,
    items: [
      { id: "trending_anime", label: "Trending Anime", icon: TrendingUp },
      { id: "popular_anime", label: "Popular Anime", icon: Star },
      { id: "upcoming_anime", label: "Upcoming", icon: Calendar },
      { id: "anime_movies", label: "Anime Movies", icon: Clapperboard },
    ]
  },
  {
    id: "gaming",
    label: "Gaming",
    icon: Gamepad2,
    items: [
      { id: "game_trailers", label: "Game Trailers", icon: PlayCircle },
      { id: "gaming_shows", label: "Gaming Shows", icon: Tv },
      { id: "esports", label: "Esports", icon: Users },
    ]
  },
  {
    id: "library",
    label: "My Library",
    icon: Library,
    items: [
      { id: "watchlist", label: "Watchlist", icon: BookMarked, badge: "New" },
      { id: "favorites", label: "Favorites", icon: Heart },
      { id: "history", label: "Watch History", icon: History },
      { id: "downloads", label: "Downloads", icon: Download, badge: "3" },
    ]
  }
];

const Sidebar = ({ currentSection, onSectionChange, isOpen,}: SidebarProps) => {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(["movies"]);
  const router = useRouter();

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleItemClick = (categoryId: string, itemId: string) => {
    // Special routes for user pages
    if (categoryId === "library") {
      switch (itemId) {
        case "watchlist":
          router.push('/user/my-list');
          return;
        case "favorites":
          router.push('/user/my-list');
          return;
        case "history":
          router.push('/user/watch-history');
          return;
        case "downloads":
          // You can add downloads route later if needed
          return;
      }
    }

    // Special routes for settings and help
    if (itemId === "settings") {
      router.push('/user/settings');
      return;
    }
    if (itemId === "help_center") {
      router.push('/ai-chat');
      return;
    }

    // Regular section navigation
    let mediaType: 'movie' | 'tv' | 'anime' = 'movie';
    let section = itemId;

    // Handle different categories
    if (categoryId === "tv") {
      mediaType = 'tv';
      section = itemId.replace('_tv', '');
    } else if (categoryId === "movies") {
      mediaType = 'movie';
      section = itemId.replace('_movies', '');
    } else if (categoryId === "anime") {
      mediaType = 'anime';
      section = itemId.replace('_anime', '');
    }

    // Pass both mediaType and section to parent
    onSectionChange({ mediaType, section });
  };

  const NavSection = ({ section }: { section: CategorySection }) => {
    const isExpanded = expandedCategories.includes(section.id);
    const Icon = section.icon;

    return (
      <div className="mb-2">
        <button
          onClick={() => toggleCategory(section.id)}
          className={cn(
            "flex items-center justify-between w-full px-4 py-3",
            "text-sm font-medium transition-colors rounded-lg",
            "hover:bg-white/5",
            isExpanded ? "text-white" : "text-gray-400"
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-5 w-5" />
            <span>{section.label}</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform duration-200",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="space-y-1 py-2">
                {section.items.map((item) => (
                  <TooltipProvider key={item.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => handleItemClick(section.id, item.id)}
                          className={cn(
                            "w-full flex items-center justify-between px-6 py-2 text-sm",
                            "transition-all duration-200 rounded-lg mx-2",
                            "group relative",
                            currentSection.section === item.id
                              ? "bg-red-500/10 text-red-500"
                              : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <item.icon className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              "group-hover:scale-110"
                            )} />
                            <span>{item.label}</span>
                          </div>
                          
                          {item.badge && (
                            <span className="px-2 py-1 text-xs bg-red-500/20 text-red-500 rounded-full">
                              {item.badge}
                            </span>
                          )}

                          {currentSection.section === item.id && (
                            <motion.div
                              layoutId="sidebar-active-indicator"
                              className="absolute left-0 w-1 h-full bg-red-500 rounded-r-full"
                              transition={{ type: "spring", bounce: 0.2 }}
                            />
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <aside className={cn(
        "fixed top-0 left-0 h-screen bg-black/50 backdrop-blur-xl",
        "border-r border-white/10 transition-all duration-300 z-40",
        "hidden lg:block lg:w-72",
        !isOpen && "lg:w-0"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex-1 py-4 overflow-y-auto scrollbar-hide">
            {categories.map((section) => (
              <NavSection key={section.id} section={section} />
            ))}
          </div>

          <Separator className="bg-white/10" />

          <div className="p-4 space-y-2">
            <button 
              onClick={() => handleItemClick("settings", "settings")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <Settings className="h-5 w-5" />
              Settings
            </button>
            <button 
              onClick={() => handleItemClick("help", "help_center")}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
              Help Center
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;