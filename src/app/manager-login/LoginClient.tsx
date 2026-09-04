"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Coffee, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

export default function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success("Welcome back!");
      router.push("/manager");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#2B1B14] flex items-center justify-center px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-[#E86A2A] rounded-full blur-3xl opacity-10" />
        <div className="absolute bottom-20 right-20 w-48 h-48 bg-[#E86A2A] rounded-full blur-3xl opacity-10" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#E86A2A] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Coffee className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-[#2B1B14]">
              KOKO Manager
            </h1>
            <p className="text-[#8B5E44] text-sm mt-1">
              Sign in to manage your café
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5E44]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@kokocafe.in"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#FFF7ED] border border-[#E8D5C0] rounded-2xl text-sm text-[#2B1B14] placeholder:text-[#8B5E44] focus:outline-none focus:ring-2 focus:ring-[#E86A2A] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#2B1B14] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8B5E44]" />
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-[#FFF7ED] border border-[#E8D5C0] rounded-2xl text-sm text-[#2B1B14] placeholder:text-[#8B5E44] focus:outline-none focus:ring-2 focus:ring-[#E86A2A] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B5E44] hover:text-[#5C3D2E]"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E86A2A] text-white py-4 rounded-2xl font-semibold text-base hover:bg-[#C94F16] transition-colors shadow-sm active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[#8B5E44] mt-6">
            Manager access only. Contact your admin for credentials.
          </p>
        </div>
        <p className="text-center text-[#5C3D2E]/60 text-xs mt-4">
          © {new Date().getFullYear()} KOKO Café & Bakers
        </p>
      </div>
    </div>
  );
}
