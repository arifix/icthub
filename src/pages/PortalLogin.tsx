import React, { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { usePortalAccess } from "../context/PortalAccessContext";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-hot-toast";
import { Lock, User } from "lucide-react";
import logo from "../assets/logo.png";

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
    <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center px-4">
      {/* Branding */}
      <div className="mb-8 text-center">
        <div className="flex flex-col items-center">
          <img src={logo} alt="ICTHub Logo" className="w-[200px]" />
          <p className="text-xs text-gray-600 leading-none -mt-1 ml-[112px]">
            M.Sc. Eng. in ICT Study Portal
          </p>
        </div>
        <p className="text-lg font-semibold text-gray-500 mt-3">
          Institute of IICT, KUET &mdash; M.Sc. Eng. in ICT Study Portal
        </p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-8 shadow-xl">
        <div className="flex items-center gap-2 mb-6">
          <Lock className="h-4 w-4 text-[#0066ff]" />
          <span className="text-sm font-semibold text-[#0066ff] uppercase tracking-wider">
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
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] transition-all bg-white"
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
                         placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0066ff] focus:border-[#0066ff] transition-all bg-white"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#0066ff] text-white text-sm font-semibold rounded-xl
                       hover:bg-[#0052cc] transition-all disabled:opacity-60"
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
