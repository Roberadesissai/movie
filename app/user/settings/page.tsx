// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { projectFirestore as db, projectAuth, projectStorage } from '@/firebase/config';
import { motion } from "framer-motion";
import {
  Bell,
  User,
  Mail,
  Lock,
  Moon,
  Sun,
  Globe,
  Eye,
  Shield,
  Save,
  Loader2,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";

interface UserSettings {
  username: string;
  email: string;
  notifications: {
    email: boolean;
    push: boolean;
    newReleases: boolean;
    recommendations: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    autoplay: boolean;
    adultContent: boolean;
  };
  privacy: {
    showWatchlist: boolean;
    showLikedMovies: boolean;
    showActivity: boolean;
  };
}

const defaultSettings: UserSettings = {
  username: '',
  email: '',
  notifications: {
    email: true,
    push: true,
    newReleases: true,
    recommendations: true,
  },
  preferences: {
    theme: 'system',
    language: 'en',
    autoplay: true,
    adultContent: false,
  },
  privacy: {
    showWatchlist: true,
    showLikedMovies: true,
    showActivity: true,
  },
};

const languages = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    const loadSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setSettings({
            ...defaultSettings,
            ...userData,
            username: user.displayName || '',
            email: user.email || '',
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        toast({
          title: "Error",
          description: "Failed to load settings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, [user, router, toast]);

  const saveSettings = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update Firebase Auth profile
      if (user.displayName !== settings.username) {
        await updateProfile(user, {
          displayName: settings.username
        });
      }

      // Update Firestore settings
      await updateDoc(doc(db, 'users', user.uid), {
        notifications: settings.notifications,
        preferences: settings.preferences,
        privacy: settings.privacy,
        updatedAt: new Date(),
      });

      toast({
        title: "Settings saved",
        description: "Your preferences have been updated successfully.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    // Implement account deletion logic
  };

  if (loading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 pt-24">
        <div className="flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8 pt-24">
      <h1 className="text-3xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Settings
      </h1>

      <div className="space-y-8">
        {/* Account Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={settings.username}
                onChange={(e) => setSettings({
                  ...settings,
                  username: e.target.value
                })}
                className="bg-white/5"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                disabled
                className="bg-white/5 text-gray-400"
              />
              <p className="text-sm text-gray-400">
                Contact support to change your email address
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notification Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Notification Preferences</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      notifications: {
                        ...settings.notifications,
                        [key]: checked,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* App Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">App Preferences</h2>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label>Theme</Label>
              <Select
                value={settings.preferences.theme}
                onValueChange={(value: 'light' | 'dark' | 'system') =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      theme: value,
                    },
                  })
                }
              >
                <SelectTrigger className="bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Language</Label>
              <Select
                value={settings.preferences.language}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      language: value,
                    },
                  })
                }
              >
                <SelectTrigger className="bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="autoplay">Autoplay Trailers</Label>
              <Switch
                id="autoplay"
                checked={settings.preferences.autoplay}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      autoplay: checked,
                    },
                  })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="adultContent">Show Adult Content</Label>
              <Switch
                id="adultContent"
                checked={settings.preferences.adultContent}
                onCheckedChange={(checked) =>
                  setSettings({
                    ...settings,
                    preferences: {
                      ...settings.preferences,
                      adultContent: checked,
                    },
                  })
                }
              />
            </div>
          </div>
        </motion.div>

        {/* Privacy Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-black/20 backdrop-blur-sm rounded-xl p-6 border border-white/10"
        >
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Privacy Settings</h2>
          </div>

          <div className="space-y-4">
            {Object.entries(settings.privacy).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label htmlFor={key} className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  id={key}
                  checked={value}
                  onCheckedChange={(checked) =>
                    setSettings({
                      ...settings,
                      privacy: {
                        ...settings.privacy,
                        [key]: checked,
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-red-500/10 backdrop-blur-sm rounded-xl p-6 border border-red-500/20"
        >
          <h2 className="text-xl font-semibold text-red-400 mb-4">Danger Zone</h2>
          <p className="text-gray-400 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete your
                  account and remove your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="gap-2 bg-purple-500 hover:bg-purple-600"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}