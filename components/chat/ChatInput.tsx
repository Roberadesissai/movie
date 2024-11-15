// components/chat/ChatInput.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, SendHorizontal } from "lucide-react";

interface ChatInputProps {
    onSendMessage: (message: string) => Promise<void>;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!message.trim()) return;

        setIsLoading(true);
        try {
            await onSendMessage(message);
            setMessage(''); // Clear the input after sending
        } catch (error) {
            console.error('Failed to send message:', error);
            // Optionally handle the error (e.g., show an alert or notification)
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 bg-black/50 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
                <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 bg-white/10 rounded-lg px-4 py-2 border border-transparent focus:border-purple-500 
                               focus:ring-1 focus:ring-purple-500 outline-none transition-colors"
                    disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !message.trim()} className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500
                           hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 px-4 py-2 rounded-lg">
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <SendHorizontal className="w-5 h-5" />
                    )}
                </Button>
            </form>
        </div>
    );
}
