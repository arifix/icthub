import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { BookOpen, Lock, Mail } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAdmin } = useAuth();

  useEffect(() => { document.title = "Admin Login — ICTHub"; }, []);
  if (isAdmin) return <Navigate to="/admin/dashboard" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error("Please fill in all fields"); return; }
    setLoading(true);
    try { await signIn(email, password); }
    catch (err: any) { toast.error(err.message || "Invalid credentials"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-kuet-dark flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-700 rounded-xl mb-4 border border-primary-600">
          <BookOpen className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white">ICTHub Admin</h1>
        <p className="text-sm text-gray-400 mt-1">IICT, KUET &middot; Management Panel</p>
      </div>

      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com" required autoFocus
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-gray-500
                           focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg
                       hover:bg-primary-800 transition-colors disabled:opacity-60 mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
        <p className=" text-gray-500 text-center mt-6">
          Portal visitor?{" "}
          <a href="/login" className="text-accent-500 hover:text-accent-400 transition-colors font-medium">
            Use portal access
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;

