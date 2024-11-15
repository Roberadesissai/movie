// components/ai/FloatingAIButton.tsx
"use client";

import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function FloatingAIButton() {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <motion.div
      className={cn(
        "fixed bottom-6 right-6 z-50",
        // Only hide on mobile/tablet when on AI chat page
        pathname === '/ai-chat' ? 'hidden md:block' : 'block'
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", bounce: 0.5 }}
    >
      <motion.button
        onClick={() => router.push('/ai-chat')}
        className="relative group"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {/* Animated rings */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 blur-lg opacity-75 group-hover:opacity-100 animate-pulse" />
        
        {/* Button */}
        <div className="relative bg-black hover:bg-black/80 rounded-full p-4 border border-white/20 backdrop-blur-sm">
          <Sparkles className="w-6 h-6 text-white" />
        </div>

        {/* Tooltip */}
        <div className="absolute top-0 right-full mr-4 px-3 py-1 bg-black/90 rounded-lg
                     text-sm whitespace-nowrap opacity-0 group-hover:opacity-100
                     transform translate-y-1/2 pointer-events-none transition-all">
          Ask CineAI
        </div>
      </motion.button>
    </motion.div>
  );
}