// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { projectFirestore as db, projectAuth, projectStorage } from '@/firebase/config';
import { Camera, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfileData(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      }
    };

    fetchProfileData();
  }, [user, toast]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || !e.target.files[0]) return;

    const file = e.target.files[0];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      toast({
        title: "Error",
        description: "Image size should be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);
      
      // Get storage instance and create reference
      const storage = getStorage();
      const storageRef = ref(storage, `profile-pictures/${user.uid}`);
      
      // Upload the file
      await uploadBytes(storageRef, file);
      
      // Get the download URL
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update user profile
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: downloadURL,
        updatedAt: new Date(),
      });

      // Update local state
      setProfileData(prev => ({
        ...prev,
        photoURL: downloadURL,
      }));

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to update profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-black pt-20">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Profile Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Profile</h1>
          </div>

          {/* Profile Content */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-8">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <Avatar className="w-32 h-32">
                  <AvatarImage
                    src={profileData?.photoURL || user.photoURL}
                    alt={user.displayName || 'Profile'}
                  />
                  <AvatarFallback className="bg-gray-800 text-2xl">
                    {user.displayName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>

                <label
                  className={cn(
                    "absolute inset-0 flex items-center justify-center",
                    "bg-black/60 rounded-full opacity-0 group-hover:opacity-100",
                    "transition-opacity cursor-pointer"
                  )}
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              <p className="text-sm text-gray-400">
                Click to upload new profile picture
              </p>
            </div>

            {/* Profile Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Display Name</label>
                <p className="font-medium">{user.displayName || 'Not set'}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Email</label>
                <p className="font-medium">{user.email}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Account Created</label>
                <p className="font-medium">
                  {user.metadata.creationTime 
                    ? new Date(user.metadata.creationTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-400">Last Sign In</label>
                <p className="font-medium">
                  {user.metadata.lastSignInTime
                    ? new Date(user.metadata.lastSignInTime).toLocaleDateString()
                    : 'Unknown'
                  }
                </p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 border-t border-white/10">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-400">
                  {profileData?.watchlist?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Watchlist</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-pink-400">
                  {profileData?.favorites?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Favorites</p>
              </div>

              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-400">
                  {profileData?.watched?.length || 0}
                </p>
                <p className="text-sm text-gray-400">Watched</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}