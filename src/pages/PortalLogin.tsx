import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePortalAccess } from "../context/PortalAccessContext";
import { toast } from "react-hot-toast";
import { Lock, BookOpen } from "lucide-react";

const PortalLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = usePortalAccess();

  useEffect(() => { document.title = "ICTHub — IICT, KUET"; }, []);
  if (isAuthenticated) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try { await signIn(password.trim()); }
    catch (err: any) { toast.error(err.message || "Incorrect password"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-kuet-dark flex flex-col items-center justify-center px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-700 rounded-xl mb-4 border border-primary-600">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">ICTHub</h1>
        <p className="text-sm text-gray-400 mt-1.5">
          Institute of ICT, KUET &mdash; M.Sc. ICT Study Portal
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-accent-500" />
          <span className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Portal Access</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1.5">
              Access Password
            </label>
            <input
              id="password" type="password" value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter portal password" required autoFocus
              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white
                         placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full py-2.5 bg-primary-700 text-white text-sm font-semibold rounded-lg
                       hover:bg-primary-800 transition-colors disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Enter Portal"}
          </button>
        </form>

        <p className=" text-gray-500 text-center mt-6">
          Contact your administrator if you don&apos;t have the password.
        </p>
      </div>

      <p className="mt-8  text-gray-500">
        Admin?{" "}
        <a href="/admin/login" className="text-accent-500 hover:text-accent-400 transition-colors font-medium">
          Sign in here
        </a>
      </p>
    </div>
  );
};

export default PortalLogin;

