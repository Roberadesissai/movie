/* eslint-disable @typescript-eslint/no-explicit-any */
// app/auth/signup/page.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Lock, 
  User,
  Eye, 
  EyeOff,
  Github,
  Loader2,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  GithubAuthProvider,
  updateProfile
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { projectAuth, projectFirestore, timestamp } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
// import { Toaster } from "@/components/ui/toaster";
// import {
//   Tooltip,
//   TooltipContent,
//   TooltipProvider,
//   TooltipTrigger,
// } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [backdropPath, setBackdropPath] = useState<string>("");
  const [movieDetails, setMovieDetails] = useState<{ title: string; overview: string } | null>(null);

  // Password validation states
  const validations = {
    length: formData.password.length >= 8,
    number: /\d/.test(formData.password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
    capital: /[A-Z]/.test(formData.password),
    match: formData.password === formData.confirmPassword && formData.password !== ""
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!Object.values(validations).every(Boolean)) {
      toast({
        title: "Invalid form",
        description: "Please check all password requirements",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create user
      const { user } = await createUserWithEmailAndPassword(
        projectAuth,
        formData.email,
        formData.password
      );

      // Update profile
      await updateProfile(user, {
        displayName: formData.username
      });

      // Create user document
      await setDoc(doc(projectFirestore, 'users', user.uid), {
        username: formData.username,
        email: formData.email,
        createdAt: timestamp.now(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      });

      toast({
        title: "Welcome to MovieVerse!",
        description: "Your account has been created successfully.",
      });

      router.push("/");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    try {
      const authProvider = provider === 'google' 
        ? new GoogleAuthProvider()
        : new GithubAuthProvider();

      const { user } = await signInWithPopup(projectAuth, authProvider);

      // Check if user document exists
      const userDoc = doc(projectFirestore, 'users', user.uid);
      await setDoc(userDoc, {
        username: user.displayName,
        email: user.email,
        createdAt: timestamp.now(),
        watchlist: [],
        settings: {
          emailNotifications: true,
          darkMode: true
        }
      }, { merge: true });

      router.push("/");
    } catch (error: any) {
      toast({
        title: `${provider} signup failed`,
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const fetchRandomMovie = async () => {
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&language=en-US&page=1`
        );
        const data = await response.json();
        const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
        setBackdropPath(`https://image.tmdb.org/t/p/original${randomMovie.backdrop_path}`);
        setMovieDetails({
          title: randomMovie.title,
          overview: randomMovie.overview
        });
      } catch (error) {
        console.error("Failed to fetch movie backdrop:", error);
      }
    };

    fetchRandomMovie();
  }, []);

  return (
    <div className="min-h-screen w-full flex">
      {/* Left Panel - Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Create Account
            </h2>
            <p className="mt-2 text-gray-400">
              Join the MovieVerse community
            </p>
          </div>

          {/* Signup Form */}
          <form onSubmit={handleEmailSignup} className="space-y-6">
            <div className="space-y-4">
              {/* Username */}
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={formData.username}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                  minLength={3}
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-400"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              <div className="space-y-2 text-sm">
                <p className="text-gray-400">Password requirements:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'length', label: 'At least 8 characters' },
                    { key: 'capital', label: 'One capital letter' },
                    { key: 'number', label: 'One number' },
                    { key: 'special', label: 'One special character' },
                    { key: 'match', label: 'Passwords match' },
                  ].map(({ key, label }) => (
                    <div 
                      key={key}
                      className="flex items-center gap-2 text-sm"
                    >
                      {validations[key as keyof typeof validations] ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <XCircle className="w-4 h-4 text-gray-500" />
                      )}
                      <span className={cn(
                        validations[key as keyof typeof validations]
                          ? "text-green-500"
                          : "text-gray-400"
                      )}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600"
              disabled={isLoading || !Object.values(validations).every(Boolean)}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          {/* Social Signup */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignup('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSocialSignup('github')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2"
            >
              <Github className="w-5 h-5" />
              Github
            </Button>
          </div>

          {/* Login Link */}
          <p className="text-center text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-indigo-500 hover:text-indigo-400 font-medium"
            >
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Panel - Movie Backdrop */}
      <div className="hidden md:block md:w-1/2 relative overflow-hidden">
        {backdropPath && (
          <>
            <motion.div
              initial={{ scale: 1.1 }}
              animate={{ scale: 1.2 }}
              transition={{ 
                duration: 10, 
                ease: "linear",
                repeat: Infinity, 
                repeatType: "reverse" 
              }}
              className="absolute inset-0"
            >
              <Image
                src={backdropPath}
                alt="Movie backdrop"
                fill
                className="object-cover"
                priority
                quality={100}
              />
            </motion.div>
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
            
            {/* Movie Title Overlay */}
            {movieDetails && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="absolute inset-x-0 bottom-0 p-8 space-y-4"
              >
                <h2 className="text-4xl font-bold text-white drop-shadow-lg">
                  {movieDetails.title}
                </h2>
                <p className="text-gray-200 line-clamp-2 max-w-lg text-sm">
                  {movieDetails.overview}
                </p>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}