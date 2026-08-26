import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { usePortalAccess } from "../context/PortalAccessContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Lock, User, School } from "lucide-react";

const PortalLogin: React.FC = () => {
  const [studentName, setStudentName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, isAuthenticated } = usePortalAccess();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "ICTHub — IICT, KUET";
  }, []);

  const redirectPath =
    (location.state as { from?: string } | null)?.from || "/";
  if (isAuthenticated) return <Navigate to={redirectPath} replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    if (!isAdmin && !studentName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    if (studentName.trim().toLowerCase().includes("arif")) {
      toast.error("You're not Arif, please enter your correct name!");
      return;
    }

    setLoading(true);
    try {
      await signIn(password.trim(), studentName.trim());
      navigate(redirectPath, { replace: true });
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
        <div className="inline-flex items-center justify-center w-16 h-16">
          <School className="h-12 w-12 text-gray-800" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">
          ICTHub
        </h1>
        <p className="text-gray-500 mt-1.5">
          Institute of IICT, KUET &mdash; M.Sc. Eng. in ICT Study Portal
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-blue-600" />
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">
            Portal Access
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isAdmin && (
            <div>
              <label
                htmlFor="studentName"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Your Name (just type your first name or full name)
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="studentName"
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                />
              </div>
            </div>
          )}
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
              autoFocus={isAdmin}
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

        <p className="text-sm text-gray-400 text-center mt-6">
          Contact your portal administrator if you don&apos;t have the password
        </p>
      </div>
    </div>
  );
};

export default PortalLogin;
