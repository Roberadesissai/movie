// components/auth/ProtectedRoute.tsx
"use client";

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const PUBLIC_PATHS = ['/auth/login', '/auth/signup'];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (!loading) {  // Only run after initial auth check
      if (!user && !isPublicPath) {
        // No user and trying to access protected route
        router.push('/auth/login');
      } else if (user && isPublicPath) {
        // User is logged in but trying to access login/signup
        router.push('/');
      }
    }
  }, [user, loading, pathname, router, isPublicPath]);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!user && !isPublicPath) {
    return null;
  }

  return children;
}