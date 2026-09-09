"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { TrainFront, Eye, EyeOff, Loader2, AlertCircle, Shield, Key } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("admin@vasp.com");
  const [password, setPassword] = useState("Happy123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  const fillCredentials = (em: string, pw: string) => {
    setEmail(em);
    setPassword(pw);
    setError("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/30 mb-3">
            <TrainFront className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Smart Coach</h1>
          <p className="text-xs text-blue-200/70 mt-0.5">Railway Telemetry & Dynamic Console</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-7 border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Railway Personnel Sign in</h2>
          <p className="text-xs text-slate-500 mb-5">Enter your credentials to access your assigned console</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3 mb-4 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-slate-700 mb-1.5">
                Username / Email
              </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 mt-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Console</span>
              )}
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Quick Role-Based Credentials:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => fillCredentials("admin@vasp.com", "Happy123")}
                className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-left transition-colors"
              >
                <div className="font-bold text-purple-900 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <span>Admin</span>
                </div>
                <div className="text-[10px] text-purple-700 font-mono truncate">admin@vasp.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("sse.howrah@railnet.gov.in", "Rail@123")}
                className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-left transition-colors"
              >
                <div className="font-bold text-blue-900 truncate">Howrah Supervisor</div>
                <div className="text-[10px] text-blue-700 font-mono truncate">sse.howrah@...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("den.jaipur@railnet.gov.in", "Rail@123")}
                className="p-2 rounded-xl bg-sky-50 hover:bg-sky-100 border border-sky-200 text-left transition-colors"
              >
                <div className="font-bold text-sky-900 truncate">Jaipur Engineer</div>
                <div className="text-[10px] text-sky-700 font-mono truncate">den.jaipur@...</div>
              </button>

              <button
                type="button"
                onClick={() => fillCredentials("axle.nagpur@railnet.gov.in", "Rail@123")}
                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-left transition-colors"
              >
                <div className="font-bold text-amber-900 truncate">Nagpur Axle Depot</div>
                <div className="text-[10px] text-amber-700 font-mono truncate">axle.nagpur@...</div>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-slate-400 text-[11px] mt-6 font-medium">
          Indian Railways • Smart Coach Condition Monitoring
        </p>
      </div>
    </div>
  );
}
