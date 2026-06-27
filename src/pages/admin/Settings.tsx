import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toast } from "react-hot-toast";
import { KeyRound, Save, Eye, EyeOff } from "lucide-react";

const AdminSettings: React.FC = () => {
  const [portalPassword, setPortalPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Settings — ICTHub Admin";
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from("portal_settings")
        .select("value")
        .eq("key", "portal_password")
        .single();
      if (data) setPortalPassword(data.value);
    } catch {
      // Row may not exist yet
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("portal_settings")
        .upsert({ key: "portal_password", value: newPassword.trim() }, { onConflict: "key" });
      if (error) throw error;
      setPortalPassword(newPassword.trim());
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Portal password updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage portal access and configuration.</p>
      </div>

      {/* Portal Password Card */}
      <div className="border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2.5 pb-4 border-b border-gray-100">
          <div className="p-2 bg-green-50 rounded-lg">
            <KeyRound className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Portal Access Password</h2>
            <p className=" text-gray-500">
              Anyone with this password can view the study portal. Changing it invalidates existing sessions.
            </p>
          </div>
        </div>

        {/* Current password (read-only display) */}
        <div>
          <label className="block  font-medium text-gray-600 mb-1.5">Current Password</label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={portalPassword}
              readOnly
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label htmlFor="newPw" className="block  font-medium text-gray-600 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPw"
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPw" className="block  font-medium text-gray-600 mb-1.5">
              Confirm New Password
            </label>
            <input
              id="confirmPw"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-700 text-white text-sm font-semibold
                       rounded-lg hover:bg-green-800 transition-colors disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving…" : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSettings;
