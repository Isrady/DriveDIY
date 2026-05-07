"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  async function handleGoogleSignup() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  if (success) {
    return (
      <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h2 className="font-display text-3xl text-chrome mb-3">Check your email</h2>
          <p className="font-body text-chrome/60">
            We sent a confirmation link to <span className="text-ember">{email}</span>.
            Click it to activate your account.
          </p>
          <Link href="/auth/login" className="inline-block mt-6 text-ember hover:underline font-body text-sm">
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-midnight flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl text-chrome tracking-wider">
            DRIVE<span className="text-ember">DIY</span>
          </h1>
          <p className="font-label text-xs text-chrome/50 tracking-widest mt-2 uppercase">
            Your Bay. Your Tools. Your Build.
          </p>
        </div>

        <div className="bg-carbon border border-steel rounded-xl p-8">
          <h2 className="font-display text-3xl text-chrome mb-6">Create Account</h2>

          {error && (
            <div className="bg-race-red/10 border border-race-red text-race-red rounded-lg p-3 mb-4 text-sm font-body">
              {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="font-label text-xs text-chrome/60 uppercase tracking-widest block mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-steel border border-steel/50 rounded-lg px-4 py-3 text-chrome font-body text-sm focus:outline-none focus:border-ember transition-colors"
                placeholder="Mohammed Al Rashid"
              />
            </div>
            <div>
              <label className="font-label text-xs text-chrome/60 uppercase tracking-widest block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-steel border border-steel/50 rounded-lg px-4 py-3 text-chrome font-body text-sm focus:outline-none focus:border-ember transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="font-label text-xs text-chrome/60 uppercase tracking-widest block mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full bg-steel border border-steel/50 rounded-lg px-4 py-3 text-chrome font-body text-sm focus:outline-none focus:border-ember transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ember hover:bg-race-red text-white font-label text-sm uppercase tracking-widest py-3 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-steel" />
            <span className="mx-4 font-label text-xs text-chrome/30 uppercase">or</span>
            <div className="flex-1 border-t border-steel" />
          </div>

          <button
            onClick={handleGoogleSignup}
            className="w-full bg-steel hover:bg-steel/70 border border-steel/50 text-chrome font-body text-sm py-3 rounded-lg transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="text-center font-body text-sm text-chrome/50 mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-ember hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
