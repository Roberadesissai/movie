/* eslint-disable @typescript-eslint/no-explicit-any */
// components/layout/Navbar.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  Bell,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Heart,
  History,
  UserCircle,
  Menu,
  Loader2,
} from "lucide-react";
import { projectAuth } from "@/firebase/config";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
// import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { useUserStats } from '@/hooks/useUserStats';
import { doc, onSnapshot } from 'firebase/firestore';
import { projectFirestore as db } from '@/firebase/config';
import { updateProfile } from 'firebase/auth';

const publicRoutes = ["/auth/login", "/auth/signup"];

interface SearchResult {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path?: string;
  release_date?: string;
  type: 'movie' | 'tv'; // This property will determine the content type
}

interface QuickStatsProps {
  stats: {
    watchlistCount: number;
    reviewsCount: number;
    likesCount: number;
    lastUpdated?: string;
  };
  statsLoading: boolean;
  router: any; // You could use Router type from next/router if needed
}

const QuickStats = ({ stats, statsLoading, router }: QuickStatsProps) => (
  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => router.push('/user/my-list')}
    >
      {statsLoading ? (
        <Loader2 className="w-4 h-4 mx-auto animate-spin text-gray-400" />
      ) : (
        <>
          <div className="font-semibold text-indigo-400">{stats.watchlistCount}</div>
          <div className="text-xs text-gray-400">Watchlist</div>
        </>
      )}
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => router.push('/user/reviews')}
    >
      {statsLoading ? (
        <Loader2 className="w-4 h-4 mx-auto animate-spin text-gray-400" />
      ) : (
        <>
          <div className="font-semibold text-purple-400">{stats.reviewsCount}</div>
          <div className="text-xs text-gray-400">Reviews</div>
        </>
      )}
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
      onClick={() => router.push('/user/likes')}
    >
      {statsLoading ? (
        <Loader2 className="w-4 h-4 mx-auto animate-spin text-gray-400" />
      ) : (
        <>
          <div className="font-semibold text-pink-400">{stats.likesCount}</div>
          <div className="text-xs text-gray-400">Liked</div>
        </>
      )}
    </motion.div>

    {stats.lastUpdated && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="col-span-3 text-xs text-gray-500 text-center mt-2"
      >
        Updated {new Date(stats.lastUpdated).toLocaleTimeString()}
      </motion.div>
    )}
  </div>
);

const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // Updated type here
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { stats, loading: statsLoading } = useUserStats(user?.uid);
  const [profilePicture, setProfilePicture] = useState(user?.photoURL || "");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (searchQuery.trim()) {
        const searchBoth = async (type: 'movie' | 'tv') => {
          const url = `https://api.themoviedb.org/3/search/${type}?query=${encodeURIComponent(
            searchQuery
          )}&language=en-US&page=1`;
          const response = await fetch(url, {
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
            },
          });
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          return data.results.slice(0, 3).map((item: any) => ({
            id: item.id,
            title: item.title || item.name, // Normalize title and name
            overview: item.overview,
            poster_path: item.poster_path,
            release_date: item.release_date,
            type: type, // Add the type to each result
          }));
        };

        try {
          const movieResults = await searchBoth('movie');
          const tvResults = await searchBoth('tv');
          setSearchResults([...movieResults, ...tvResults]); // Combine results
        } catch (error) {
          console.error('Search error:', error);
        }
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(searchTimer);
  }, [searchQuery]);
  

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleSignOut = async () => {
    try {
      await projectAuth.signOut();
      toast({
        title: "Signed out successfully",
        description: "See you next time!",
      });
      router.push("/auth/login");
    } catch (error) {
      toast({
        title: "Error signing out",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        ?.split(" ")
        .map((word) => word[0])
        .join("")
        .toUpperCase() || "U"
    );
  };

  const navLinks = [
    { title: "Movies", href: "/movies" },
    { title: "TV Shows", href: "/tv-shows" },
    { title: "New Releases", href: "/new-releases" },
    { title: "My List", href: "/user/my-list" },
  ];

  // Add useEffect for click outside handling
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the mobile menu
      const nav = document.querySelector('nav');
      if (nav && !nav.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
    };

    // Add event listener if menu is open
    if (isMobileMenuOpen || searchOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, searchOpen]);

  // Add this useEffect to listen for profile picture changes
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (doc) => {
      if (doc.exists() && doc.data().photoURL) {
        const newPhotoURL = doc.data().photoURL;
        setProfilePicture(newPhotoURL);
        
        // Update auth profile
        if (projectAuth.currentUser) {
          try {
            updateProfile(projectAuth.currentUser, {
              photoURL: newPhotoURL
            }).catch(error => 
              console.error("Error updating auth profile:", error)
            );
          } catch (error) {
            console.error("Error updating profile:", error);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  if (publicRoutes.includes(pathname)) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-0 z-50",
      "md:ml-80",
      "w-full md:w-[calc(100%-320px)]",
      "px-4 md:px-6 lg:px-8",
      pathname === '/ai-chat' ? 'hidden 2xl:block' : 'block',
    )}>
      <nav className={cn(
        "px-4 md:px-6",
        "rounded-full transition-all duration-300",
        isScrolled 
          ? "bg-black/80 backdrop-blur-sm border border-white/10 my-2" 
          : "bg-transparent my-4"
      )}>
        {/* Mobile Layout */}
        <div className="flex 2xl:hidden items-center justify-between px-3 py-2">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Arcaureus Stream
            </span>
          </Link>

          {/* Mobile Actions */}
          <div className="flex items-center gap-2">
            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-full hover:bg-white/10" title="Profile">
                  <Avatar className="w-7 h-7 border border-white/20">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xs">
                      {getInitials(user?.displayName || user?.email || 'User')}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-72 bg-black/95 border-white/10 rounded-xl shadow-xl mt-2"
              >
                {/* Profile Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-white/20">
                      <AvatarImage src={profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xl">
                        {getInitials(user?.displayName || user?.email || "User")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {user?.displayName || "User"}
                      </h3>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <QuickStats stats={stats} statsLoading={statsLoading} router={router} />
                </div>

                {/* Menu Items */}
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/profile')}
                  >
                    <UserCircle className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/settings')}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/my-list')}
                  >
                    <Heart className="w-4 h-4 mr-3" />
                    My List
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/watch-history')}
                  >
                    <History className="w-4 h-4 mr-3" />
                    Watch History
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/ai-chat')}
                  >
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Help Center
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  className="focus:bg-white/5 px-4 py-3 text-red-500"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-full hover:bg-white/10"
              title={isMobileMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Layout - With proper spacing */}
        <div className="hidden 2xl:flex items-center justify-between w-full px-6 py-3">
          {/* Logo with proper spacing */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Arcaureus Stream
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden 2xl:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
              >
                {link.title}
              </Link>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Search Bar */}
            <div className="relative">
              {searchOpen ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-72">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies & shows..."
                      className={cn(
                        "w-full pl-4 pr-10 py-2 rounded-full",
                        "bg-black/60 border border-white/20",
                        "text-sm text-white placeholder-gray-400",
                        "focus:outline-none focus:border-purple-500",
                        "transition-all duration-300"
                      )}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      aria-label="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>

                  {/* Search Results Dropdown */}
                  {searchResults.length > 0 && (
                    <div className="absolute top-12 w-full bg-black/95 rounded-2xl border border-white/10 shadow-xl overflow-hidden">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/${result.type}/${result.id}`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors"
                        >
                          {result.poster_path ? (
                            <div className="relative w-10 h-14">
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                alt={result.title || result.name || 'Media content'}
                                fill
                                sizes="40px"
                                className="object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">
                              {result.title || result.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {result.release_date
                                ? new Date(result.release_date).getFullYear()
                                : "N/A"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  className={cn(
                    "p-2 rounded-full",
                    "hover:bg-white/10 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500"
                  )}
                  title="Open Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Notifications"
                  className={cn(
                    "relative p-2 rounded-full",
                    "hover:bg-white/10 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500"
                  )}
                >
                  <Bell className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 bg-black/95 border-white/10 rounded-2xl shadow-xl"
              >
                <DropdownMenuLabel className="px-4 py-3 border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                  </div>
                </DropdownMenuLabel>
                <div className="py-2">
                  <div className="px-4 py-6 text-center text-sm text-gray-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-500" />
                    <p>No new notifications</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Profile */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Open profile menu"
                  className={cn(
                    "flex items-center gap-2 p-1.5 rounded-full",
                    "hover:bg-white/10 transition-colors",
                    "focus:outline-none focus:ring-2 focus:ring-purple-500"
                  )}
                >
                  <Avatar className="w-8 h-8 border border-white/20">
                    <AvatarImage src={profilePicture} />
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500">
                      {getInitials(
                        user?.displayName || user?.email || "User"
                      )}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-80 bg-black/95 border-white/10 rounded-2xl shadow-xl mt-2"
              >
                {/* Profile Header */}
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <Avatar className="w-16 h-16 border-2 border-white/20">
                      <AvatarImage src={profilePicture} />
                      <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-xl">
                        {getInitials(
                          user?.displayName || user?.email || "User"
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">
                        {user?.displayName || "User"}
                      </h3>
                      <p className="text-sm text-gray-400">{user?.email}</p>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <QuickStats stats={stats} statsLoading={statsLoading} router={router} />
                </div>

                {/* Menu Items */}
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/profile')}
                  >
                    <UserCircle className="w-4 h-4 mr-3" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/settings')}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/my-list')}
                  >
                    <Heart className="w-4 h-4 mr-3" />
                    My List
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/user/watch-history')}
                  >
                    <History className="w-4 h-4 mr-3" />
                    Watch History
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="focus:bg-white/5 px-4 py-3"
                    onClick={() => router.push('/ai-chat')}
                  >
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Help Center
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator className="bg-white/10" />

                <DropdownMenuItem
                  className="focus:bg-white/5 px-4 py-3 text-red-500"
                  onClick={handleSignOut}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="2xl:hidden border-t border-white/10 bg-black/70 backdrop-blur-sm rounded-b-2xl"
            >
              <div className="p-3 space-y-2">
                {/* Search Bar */}
                <div className="relative px-2">
                  <form onSubmit={handleSearch} className="relative">
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search movies & shows..."
                      className={cn(
                        "w-full pl-9 pr-3 py-2 rounded-lg",
                        "bg-white/10 border border-white/10",
                        "text-sm text-white placeholder-gray-400",
                        "focus:outline-none focus:border-purple-500",
                        "transition-all duration-300"
                      )}
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </form>

                  {searchResults.length > 0 && (
                    <div className="absolute top-12 left-0 right-0 bg-black/95 rounded-lg border border-white/10 shadow-xl overflow-hidden mx-2">
                      {searchResults.map((result) => (
                        <Link
                          key={result.id}
                          href={`/${result.type}/${result.id}`}
                          onClick={() => {
                            setIsMobileMenuOpen(false);
                            setSearchQuery("");
                            setSearchResults([]);
                          }}
                          className="flex items-center gap-3 p-2.5 hover:bg-white/5 transition-colors"
                        >
                          {result.poster_path ? (
                            <div className="relative w-10 h-14">
                              <Image
                                src={`https://image.tmdb.org/t/p/w92${result.poster_path}`}
                                alt={result.title || result.name || 'Media content'}
                                fill
                                sizes="40px"
                                className="object-cover rounded"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-14 bg-gray-800 rounded flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium line-clamp-1">
                              {result.title || result.name}
                            </p>
                            <p className="text-sm text-gray-400">
                              {result.release_date
                                ? new Date(result.release_date).getFullYear()
                                : "N/A"}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                {/* Navigation Links */}
                <div className="px-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.title}
                      href={link.href}
                      className="block px-3 py-2 text-sm font-medium text-gray-200 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {link.title}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </div>
  );
};

export default Navbar;
