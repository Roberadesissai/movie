"use client";

import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { 
  Flame,
  Trophy,
  Sparkles,
  Clock,
} from "lucide-react";

interface MovieTabsProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export const movieSections = [
  { 
    id: "trending", 
    label: "Trending Today",
    description: "What's hot right now",
    icon: Flame,
    color: "from-orange-400 to-red-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    endpoint: "trending/movie/day"
  },
  { 
    id: "oscars2024", 
    label: "Oscar Contenders",
    description: "Award season favorites",
    icon: Trophy,
    color: "from-yellow-400 to-amber-500",
    bgColor: "bg-yellow-500/10",
    borderColor: "border-yellow-500/20",
    endpoint: "discover/movie?with_awards=true&primary_release_year=2023"
  },
  { 
    id: "mustwatch", 
    label: "Must Watch",
    description: "Essential viewing",
    icon: Sparkles,
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    endpoint: "movie/top_rated"
  },
  { 
    id: "comingsoon", 
    label: "Coming Soon",
    description: "Upcoming releases",
    icon: Clock,
    color: "from-purple-400 to-pink-500",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    endpoint: "movie/upcoming"
  },
];

export default function MovieTabs({ activeSection, onSectionChange }: MovieTabsProps) {
  return (
    <div className="relative mb-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AnimatePresence mode="wait">
            {movieSections.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => onSectionChange(tab.id)}
                  className={cn(
                    "relative p-4 rounded-xl transition-all duration-300",
                    "border backdrop-blur-xl",
                    "hover:scale-[1.02] hover:-translate-y-0.5",
                    "focus:outline-none focus:ring-2 focus:ring-white/20",
                    isActive 
                      ? `bg-gradient-to-br ${tab.color} border-transparent` 
                      : `${tab.bgColor} ${tab.borderColor}`
                  )}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        isActive ? "bg-white/20" : "bg-white/5"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          isActive ? "text-white" : "text-gray-400"
                        )} />
                      </div>
                      <div className="text-left">
                        <h3 className={cn(
                          "font-medium",
                          isActive ? "text-white" : "text-gray-300"
                        )}>
                          {tab.label}
                        </h3>
                        <p className={cn(
                          "text-xs",
                          isActive ? "text-white/80" : "text-gray-400"
                        )}>
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <motion.div
                      className={cn(
                        "absolute inset-0 rounded-xl opacity-20 blur-xl",
                        `bg-gradient-to-br ${tab.color}`
                      )}
                      layoutId="activeTabBg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.2 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}