"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowser();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback?redirect=/results`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // If user is immediately confirmed (email confirmation disabled), redirect
    if (data.session) {
      router.push("/results");
      router.refresh();
      return;
    }

    // Otherwise show email confirmation message
    setEmailSent(true);
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    const supabase = createSupabaseBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirect=/results`,
      },
    });
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 border border-[#C5933A] flex items-center justify-center">
              <span className="text-[#C5933A] text-xs font-semibold">E</span>
            </div>
            <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
          </Link>
        </div>
        <div className="flex-1 flex items-center justify-center px-6">
          <div className="max-w-sm text-center">
            <CheckCircle size={40} className="text-[#3D8B5E] mx-auto mb-4" />
            <h2 className="font-display text-2xl text-[#F9F7F3] mb-3">Check your email</h2>
            <p className="text-[#9CA3AF] text-sm leading-relaxed mb-6">
              We sent a confirmation link to <strong className="text-[#F9F7F3]">{email}</strong>.
              Click the link to activate your account and view your results.
            </p>
            <Link
              href="/login"
              className="text-[#C5933A] text-sm hover:underline"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1A2B] flex flex-col">
      {/* Nav */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#2A3F5F]">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 border border-[#C5933A] flex items-center justify-center">
            <span className="text-[#C5933A] text-xs font-semibold">E</span>
          </div>
          <span className="text-[#F9F7F3] text-sm font-medium tracking-wider">EBRB</span>
        </Link>
      </div>

      {/* Signup form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-3xl font-light text-[#F9F7F3] text-center mb-2">
            Create your account
          </h1>
          <p className="text-[#6B7280] text-sm text-center mb-8">
            Unlock your full resume, cover letter, and exports
          </p>

          {error && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 mb-6">
              <AlertCircle size={14} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleSignup}
            className="w-full flex items-center justify-center gap-2 border border-[#2A3F5F] hover:border-[#C5933A]/40 text-[#F9F7F3] py-3 text-sm transition-colors mb-6"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#2A3F5F]" />
            <span className="text-[#6B7280] text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-[#2A3F5F]" />
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm px-3 py-2.5 outline-none transition-colors"
                placeholder="Alex Morgan"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm px-3 py-2.5 outline-none transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-[#152338] border border-[#2A3F5F] focus:border-[#C5933A]/60 text-[#F9F7F3] text-sm px-3 py-2.5 outline-none transition-colors"
                placeholder="6+ characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#C5933A] hover:bg-[#A67C2E] disabled:opacity-50 text-[#0E1A2B] font-semibold py-3 text-sm transition-colors"
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-[#6B7280] text-xs mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#C5933A] hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
