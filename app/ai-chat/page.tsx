// app/ai-chat/page.tsx
"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Sparkles, 
  SendHorizontal,
  Star,
  Calendar,
  Film,
  List
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { projectFirestore } from '@/firebase/config';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import OpenAI from 'openai';

// Initialize OpenAI with streaming
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  movies?: Movie[];
  timestamp: Date;
}

interface Movie {
  id: number;
  title: string;
  poster_path: string;
  overview: string;
  vote_average: number;
  release_date: string;
  media_type: 'movie' | 'tv';
  genres?: { id: number; name: string }[];
}

interface UserPreferences {
  watchlist: Movie[];
  favorites: Movie[];
  recentlyViewed: Movie[];
  genres: { id: number; name: string }[];
}

// Helper function to format the watchlist into a readable format
const formatWatchlist = (watchlist: Movie[]) => {
  return watchlist.map(movie => (
    `• ${movie.title} (${new Date(movie.release_date).getFullYear()})`
  )).join('\n');
};

// Get current date in readable format
const getCurrentDate = () => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Add new helper function at the top level
const extractAndFetchMovies = async (text: string): Promise<Movie[]> => {
  const movieTitles = text.match(/"([^"]+)"/g)?.map(t => t.replace(/"/g, '')) || [];
  if (movieTitles.length === 0) return [];

  const moviePromises = movieTitles.map(async (title) => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(title)}&page=1`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      const movie = data.results.find((m: any) => 
        m.poster_path && 
        (m.title.toLowerCase() === title.toLowerCase() ||
         m.title.toLowerCase().includes(title.toLowerCase()))
      );
      return movie ? { ...movie, media_type: 'movie' } : null;
    } catch (error) {
      console.error('Error fetching movie:', error);
      return null;
    }
  });

  const movies = await Promise.all(moviePromises);
  return movies.filter((movie): movie is Movie => movie !== null);
};

// Update MovieGrid component with combined improvements
const MovieGrid = ({ movies, isWatchlist = false }: { movies: Movie[], isWatchlist?: boolean }) => {
  const router = useRouter();
  return (
    <div className={cn(
      "mt-4 space-y-3",
      // Make container larger for watchlist
      isWatchlist && "my-8"
    )}>
      <div className="flex items-center gap-2 text-sm text-gray-400">
        {isWatchlist ? <List className="w-5 h-5" /> : <Film className="w-4 h-4" />}
        <span className={cn(
          isWatchlist && "text-lg font-medium"
        )}>
          {isWatchlist ? "Your Watchlist" : "Movies"}
        </span>
        <span className={cn(
          "text-gray-500",
          isWatchlist ? "text-sm" : "text-xs"
        )}>
          ({movies.length} items)
        </span>
      </div>
      <div className={cn(
        "grid gap-4",
        // Adjust grid columns and size for watchlist
        isWatchlist 
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7"
          : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
      )}>
        {movies.map((movie) => (
          <motion.div
            key={movie.id}
            className="group relative cursor-pointer"
            whileHover={{ scale: 1.05 }}
            onClick={() => router.push(`/movies/${movie.id}`)}
          >
            <div className={cn(
              "relative aspect-[2/3] rounded-lg overflow-hidden",
              // Make images larger for watchlist
              isWatchlist && "shadow-lg shadow-black/50"
            )}>
              <Image
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                fill
                className="object-cover transition-all duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent 
                           opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 p-3 space-y-1">
                  <h3 className={cn(
                    "font-semibold line-clamp-2",
                    isWatchlist ? "text-base" : "text-sm"
                  )}>
                    {movie.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-gray-300">
                    <Star className="w-3 h-3 text-yellow-500" />
                    {movie.vote_average.toFixed(1)}
                    <Calendar className="w-3 h-3 ml-1" />
                    {new Date(movie.release_date).getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// Add helper function for gradient title formatting
const formatMessageWithGradientTitles = (content: string) => {
  return content.replace(
    /"([^"]+)"/g,
    '<span class="font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">$1</span>'
  );
};

export default function AIChatPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userPrefs, setUserPrefs] = useState<UserPreferences | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial setup
  useEffect(() => {
    const fetchUserPrefsAndInitialize = async () => {
      // Fetch user preferences
      if (user) {
        const userDoc = await getDoc(doc(projectFirestore, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserPrefs({
            watchlist: userData.watchlist || [],
            favorites: userData.favorites || [],
            recentlyViewed: userData.recentlyViewed || [],
            genres: userData.preferredGenres || [],
          });
        }
      }

      // Set initial greeting
      const initialMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `👋 Hello${user?.displayName ? ` ${user.displayName}` : ''}! I'm your CineAI assistant.

I can help you with:
• Movie recommendations based on your preferences
• Information about your watchlist
• Finding similar movies
• Answering movie-related questions
• Details about actors and directors

What would you like to know about today?`,
        timestamp: new Date(),
      };
      setMessages([initialMessage]);
    };

    fetchUserPrefsAndInitialize();
  }, [user]);

  // Auto-scroll to bottom
  useEffect(() => {
    const scrollToBottom = () => {
      const behavior = isStreaming ? 'auto' : 'smooth';
      messagesEndRef.current?.scrollIntoView({ behavior });
    };
    scrollToBottom();
  }, [messages, isStreaming]);

  // Function to search movies from TMDB
  const searchMovies = async (query: string): Promise<Movie[]> => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_TMDB_API_READ_ACCESS_TOKEN}`,
          },
        }
      );
      const data = await response.json();
      return data.results
        .filter((movie: any) => movie.poster_path)
        .slice(0, 4)
        .map((movie: any) => ({
          ...movie,
          media_type: 'movie'
        }));
    } catch (error) {
      console.error('Error searching movies:', error);
      return [];
    }
  };

  // Update handleSubmit function with combined improvements
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    // Update the generateUniqueId function to be more unique
    const generateUniqueId = () => {
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15);
      const random2 = Math.random().toString(36).substring(2, 15);
      return `${timestamp}-${random}-${random2}`;
    };

    const userMessage = {
      id: generateUniqueId(),
      role: 'user' as const,
      content: inputMessage,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsStreaming(true);

    try {
      let systemPrompt = `You are CineAI, a knowledgeable movie assistant with access to the user's watchlist and preferences. 
      
      Important instructions:
      1. You have full access to the user's watchlist and can provide details about it
      2. Never say you can't access the watchlist
      3. Always be confident about the user's data you have access to
      4. Format watchlist items clearly with bullets and year in parentheses
      5. When mentioning movies, always put titles in quotes for proper display
      
      Current user data:
      - Watchlist count: ${userPrefs?.watchlist.length || 0} movies
      - Recently added: ${userPrefs?.watchlist[0]?.title || 'None'}
      - Preferred genres: ${userPrefs?.genres.map(g => g.name).join(', ') || 'None'}
      `;

      // Handle direct watchlist queries
      if (inputMessage.toLowerCase().includes('watchlist')) {
        const watchlist = userPrefs?.watchlist || [];
        
        if (watchlist.length === 0) {
          const response = {
            id: generateUniqueId(),
            role: 'assistant' as const,
            content: "Your watchlist is currently empty. Would you like some movie recommendations to get started?",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, response]);
          setIsLoading(false);
          setIsStreaming(false);
          return;
        }

        const response = {
          id: generateUniqueId(),
          role: 'assistant' as const,
          content: "Here's your current watchlist:",
          movies: watchlist,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, response]);
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      // Start streaming response
      const stream = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          })),
          { role: "user", content: inputMessage }
        ],
        stream: true,
      });

      let newMessageId = generateUniqueId();
      let accumulatedContent = '';

      // Initialize streaming message
      setMessages(prev => [...prev, {
        id: newMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }]);

      // Process the stream
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        accumulatedContent += content;
        
        setMessages(prev => prev.map(msg =>
          msg.id === newMessageId
            ? { ...msg, content: accumulatedContent }
            : msg
        ));
      }

      // After streaming, handle movie detection and recommendations
      const mentionedMovies = await extractAndFetchMovies(accumulatedContent);
      
      if (mentionedMovies.length > 0) {
        setMessages(prev => prev.map(msg =>
          msg.id === newMessageId
            ? { ...msg, movies: mentionedMovies }
            : msg
        ));
      }

      // Handle recommendations
      if (inputMessage.toLowerCase().includes('recommend') || 
          inputMessage.toLowerCase().includes('suggest') ||
          inputMessage.toLowerCase().includes('similar')) {
        const recommendedMovies = await searchMovies(accumulatedContent);
        
        if (recommendedMovies.length > 0) {
          const allMovies = [...(mentionedMovies || []), ...recommendedMovies];
          const uniqueMovies = allMovies.filter((movie, index, self) =>
            index === self.findIndex((m) => m.id === movie.id)
          );
          
          setMessages(prev => prev.map(msg =>
            msg.id === newMessageId
              ? { ...msg, movies: uniqueMovies }
              : msg
          ));
        }
      }

    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: generateUniqueId(),
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };
  return (
    <div className="flex h-screen bg-black">
      {/* Main Chat Container */}
      <div className="flex-1 flex flex-col h-full">
        {/* Messages Area - Add top padding for navigation bar */}
        <div className="flex-1 overflow-y-auto px-4 py-6 mt-20">
          <div className="max-w-4xl mx-auto space-y-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={cn(
                    "flex",
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-6 py-4 space-y-4 backdrop-blur-md shadow-xl",
                      message.role === 'user'
                        ? "bg-indigo-500/10 border border-indigo-500/20 shadow-indigo-500/10"
                        : "bg-white/10 border border-white/20 shadow-white/10"
                    )}
                  >
                    {/* Message Header */}
                    {message.role === 'assistant' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg p-2">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium text-purple-400">CineAI</span>
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="space-y-4">
                      <div className="prose prose-invert max-w-none">
                        <p 
                          className="text-base leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ 
                            __html: formatMessageWithGradientTitles(message.content) 
                          }}
                        />
                      </div>
                      {message.movies && message.movies.length > 0 && (
                        <MovieGrid movies={message.movies} />
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className={cn(
                      "text-xs text-gray-500 mt-2",
                      message.role === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-3 text-purple-400 px-6"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span>CineAI is thinking...</span>
              </motion.div>
            )}

            {/* Scroll Anchor */}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Enhanced glassy styling */}
        <div className="border-t border-white/10 bg-black/20 backdrop-blur-xl p-6 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          <div className="max-w-4xl mx-auto relative">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <Input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about movies, get recommendations, or check your watchlist..."
                className="flex-1 h-14 px-6 
                 bg-white/10 backdrop-blur-xl
                 border-white/20 hover:border-white/30
                 focus:border-purple-500/50 focus:bg-white/15
                 text-base placeholder:text-gray-400
                 rounded-xl shadow-lg
                 transition-all duration-300
                 focus:ring-2 focus:ring-purple-500/20"
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "h-14 px-8 rounded-xl shadow-lg",
                  "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500",
                  "hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600",
                  "transition-all duration-300",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "backdrop-blur-xl"
                )}
              >
                <SendHorizontal className="w-6 h-6" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}