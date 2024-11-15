// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion} from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import Hero from "@/components/layout/Hero";
import MovieTabs from "@/components/sections/MovieTabs";
import MovieGrid from "@/components/movies/MovieGrid";
import Sidebar from "@/components/layout/Sidebar";
import WelcomeSection from "@/components/sections/WelcomeSection";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState({
    mediaType: 'movie' as 'movie' | 'tv' | 'anime',
    section: 'trending'
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/auth/login');
      } else {
        setPageLoading(false);
      }
    }
  }, [user, loading, router]);

  if (loading || pageLoading) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center"
      >
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-gray-400">Loading your experience...</p>
        </div>
      </motion.div>
    );
  }

  if (!user) return null;

  const handleSectionChange = ({ mediaType, section }: { mediaType: 'movie' | 'tv' | 'anime', section: string }) => {
    setCurrentSection({
      mediaType,
      section
    });
  };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar
        currentSection={currentSection}
        onSectionChange={handleSectionChange}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className={cn(
        "min-h-screen transition-all duration-300",
        isSidebarOpen ? "lg:ml-72" : "ml-0"
      )}>
        <Hero />
        <div className="relative z-10">
          <WelcomeSection user={user} />
          <div className="mt-8">
            <MovieTabs 
              activeSection={currentSection.section}
              onSectionChange={(section: string) => handleSectionChange({
                mediaType: currentSection.mediaType,
                section
              })} 
            />
            <div className="px-4 md:px-8">
              <MovieGrid
                section={currentSection.section}
                mediaType={currentSection.mediaType}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6"
                filters={{
                  genres: [],
                  rating: 0,
                  year: null,
                  sortBy: "popularity",
                  sortOrder: "desc"
                }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}