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
        .upsert(
          { key: "portal_password", value: newPassword.trim() },
          { onConflict: "key" },
        );
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0a0a0a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-6 py-7">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0a0a0a] tracking-tight">
            Settings
          </h1>
          <p className="text-sm text-[#6b7280] mt-1">
            Manage portal access and configuration
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Portal Password Card */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] max-w-xl">
          <div className="bg-[#f9fafb] border-b border-[#e5e7eb] px-6 py-4 flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-[#374151]" />
            <span className="text-sm font-bold text-[#0a0a0a]">
              Portal Access Password
            </span>
          </div>
          <div className="p-6 space-y-5">
            <p className="text-xs text-[#6b7280]">
              Anyone with this password can view the study portal. Changing it
              invalidates existing sessions.
            </p>

            {/* Current password */}
            <div>
              <label className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={portalPassword}
                  readOnly
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm bg-[#f9fafb] text-[#374151] pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label
                  htmlFor="newPw"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPw"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] pr-10 text-[#374151]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-[#6b7280]"
                  >
                    {showNew ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPw"
                  className="block text-xs font-semibold text-[#6b7280] uppercase tracking-wide mb-1.5"
                >
                  Confirm New Password
                </label>
                <input
                  id="confirmPw"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0a0a0a] focus:border-[#0a0a0a] text-[#374151]"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] text-white text-sm font-semibold rounded-lg hover:bg-[#374151] transition-colors disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
