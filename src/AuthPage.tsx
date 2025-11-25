// src/AuthPage.tsx
import React, { useState } from "react";
import { supabase } from "./supabaseClient";
import { Loader2, Lock, Mail, User, Dumbbell, ArrowRight, MailCheck } from "lucide-react";

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [needsVerification, setNeedsVerification] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

      } else {
        // SIGNUP
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
              email: email, // ✅ FIX (store email in metadata)
            },
          },
        });

        if (error) throw error;

        // Email verification screen
        if (data.user && !data.session) {
          setNeedsVerification(true);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Email verification UI
  if (needsVerification) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-green-100 text-green-600 rounded-full">
              <MailCheck className="w-12 h-12" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h2>

          <p className="text-slate-600 mb-6">
            We've sent a verification link to <span className="font-bold">{email}</span>.
          </p>

          <p className="text-sm text-slate-500 mb-8">
            Verify your email, then come back and log in.
          </p>

          <button
            onClick={() => {
              setNeedsVerification(false);
              setIsLogin(true);
            }}
            className="w-full py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

        <div className="p-8 bg-slate-50 text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-sky-100 rounded-full text-sky-600">
              <Dumbbell className="w-8 h-8" />
            </div>
          </div>

          <h1 className="text-2xl font-black text-slate-800">TAPOUT-LAB</h1>
          <p className="text-slate-500 mt-2">
            {isLogin ? "Welcome back, athlete." : "Start your transformation."}
          </p>
        </div>

        <form onSubmit={handleAuth} className="p-8 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border">
              {error}
            </div>
          )}

          {!isLogin && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 p-3 bg-slate-50 border rounded-xl"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                required
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input
                required
                type="password"
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 p-3 bg-slate-50 border rounded-xl"
              />
            </div>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-4 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 disabled:opacity-70"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> :
              <>{isLogin ? "Sign In" : "Create Account"} <ArrowRight className="w-5 h-5 ml-2" /></>}
          </button>
        </form>

        <div className="p-4 text-center bg-slate-50 border-t">
          <p className="text-sm text-slate-600">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(null); }}
              className="text-sky-600 font-bold hover:underline"
            >
              {isLogin ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
