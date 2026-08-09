import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { usePortalAccess } from "../context/PortalAccessContext";
import { toast } from "react-hot-toast";
import { Lock, BookOpen } from "lucide-react";

const PortalLogin: React.FC = () => {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = usePortalAccess();

  useEffect(() => {
    document.title = "ICTHub — IICT, KUET";
  }, []);
  if (isAuthenticated) return <Navigate to="/" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoading(true);
    try {
      await signIn(password.trim());
    } catch (err: any) {
      toast.error(err.message || "Incorrect password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col items-center justify-center px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          ICTHub
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Institute of IICT, KUET &mdash; M.Sc. Eng. in ICT Study Portal
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-blue-600" />
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Portal Access
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1.5"
            >
              Access Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter portal password"
              required
              autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl
                       hover:shadow-lg transition-all disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Enter Portal"}
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-6">
          Contact your portal administrator if you don&apos;t have the password
        </p>
      </div>
    </div>
  );
};

export default PortalLogin;
