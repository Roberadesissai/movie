// components/chat/ChatSidebar.tsx
import { useEffect, useState } from 'react';
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, Menu } from "lucide-react";
import { projectFirestore } from "@/firebase/config";
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

interface Message {
  id: string;
  content: string;
  timestamp: Date | number;  // Ensure that timestamps are consistently handled
  role: 'user' | 'assistant';
}

interface ChatSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user?: { displayName?: string; uid: string }; // Ensure user has a UID for fetching chats
}

export function ChatSidebar({ isOpen, onClose, user }: ChatSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      const messagesRef = collection(projectFirestore, "chats");
      const q = query(messagesRef, orderBy("timestamp", "desc"));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Message[];
        setMessages(newMessages);
        setError(null);
      }, (error) => {
        console.error("Error fetching chat messages:", error);
        setError("Failed to load chat messages.");
      });

      return () => unsubscribe(); // Clean up listener on unmount
    }
  }, [user?.uid]);

  return (
    <>
      {/* Toggle Button - Visible when sidebar is closed */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? -100 : 0 }}
        className="fixed top-24 left-4 z-50"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="bg-black/50 backdrop-blur-sm hover:bg-white/10"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </motion.div>

      {/* Sidebar Panel */}
      <motion.div
        initial={{ x: "-100%" }}
        animate={{ x: isOpen ? 0 : "-100%" }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="fixed left-0 top-0 bottom-0 w-80 bg-black/95 
                  border-r border-white/10 backdrop-blur-sm z-50"
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-semibold">Chat History</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            {error && <div className="text-red-500">{error}</div>}
            {messages.map((message) => (
              <div key={message.id} className="space-y-2 mb-4">
                <div className="text-sm text-gray-500">{new Date(message.timestamp).toLocaleDateString()}</div>
                <button
                  className="w-full text-left p-3 rounded-lg bg-white/5 
                            hover:bg-white/10 transition-colors"
                >
                  <p className="text-sm line-clamp-2">{message.content}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </button>
              </div>
            ))}
          </ScrollArea>

          <div className="p-4 border-t border-white/10">
            <Button
              onClick={() => setMessages([])}
              variant="ghost"
              className="flex items-center gap-2 text-red-500 hover:text-red-600 hover:bg-red-500/10"
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
