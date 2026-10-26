import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, KeyRound, LogOut, RefreshCw, Save, Search, ShieldAlert, Users } from "lucide-react";
import { errorMessage, supabase } from "../../lib/supabase";
import { timeAgo } from "../../lib/format";
import { useAdminConfirm } from "../../components/AdminConfirm";
import { AdminFormSection, AdminPageHeader, AdminPanel, AdminTable } from "../../components/AdminUI";
import type { PortalOverview, Tables } from "../../types/supabase";

type Member = Tables<"portal_members">;

const MIN_LENGTH = 8;

const strength = (pw: string) => {
  let score = 0;
  if (pw.length >= MIN_LENGTH) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
};

const STRENGTH_LABELS = ["Too short", "Weak", "Fair", "Good", "Strong"];
const STRENGTH_COLORS = ["bg-red-400", "bg-red-400", "bg-amber-400", "bg-blue-500", "bg-emerald-500"];

const AdminSettings: React.FC = () => {
  const confirm = useAdminConfirm();
  const [overview, setOverview] = useState<PortalOverview | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [overviewRes, membersRes] = await Promise.all([
      supabase.rpc("portal_overview"),
      supabase.from("portal_members").select("*").order("last_seen_at", { ascending: false }).limit(500),
    ]);
    if (overviewRes.error) {
      toast.error("Couldn't load portal settings. Has the security migration been applied?");
    } else {
      setOverview(overviewRes.data as PortalOverview);
    }
    setMembers(membersRes.data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    document.title = "Settings — ICTHub Admin";
    void load();
  }, [load]);

  const score = strength(newPassword);
  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < MIN_LENGTH) {
      toast.error(`Password must be at least ${MIN_LENGTH} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    const ok = await confirm({
      title: "Change portal password?",
      message: "Every student will be signed out and will need the new password to get back in.",
      confirmLabel: "Change password",
      tone: "primary",
    });
    if (!ok) return;

    setSaving(true);
    const { error } = await supabase.rpc("set_portal_password", { p_new_password: newPassword });
    setSaving(false);
    if (error) {
      toast.error(errorMessage(error, "Failed to update password"));
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Portal password changed. All students were signed out.");
    void load();
  };

  const revokeAll = async () => {
    const ok = await confirm({
      title: "Sign out all students?",
      message: "Everyone will need to enter the portal password again. The password itself stays the same.",
      confirmLabel: "Sign everyone out",
    });
    if (!ok) return;
    const { error } = await supabase.rpc("revoke_all_portal_sessions");
    if (error) toast.error(errorMessage(error, "Failed to revoke sessions"));
    else {
      toast.success("All student sessions revoked");
      void load();
    }
  };

  const revokeOne = async (member: Member) => {
    const ok = await confirm({
      title: `Sign out ${member.student_name}?`,
      message: "They'll need to enter the portal password again on that device.",
      confirmLabel: "Sign out",
    });
    if (!ok) return;
    const { error } = await supabase.from("portal_members").delete().eq("user_id", member.user_id);
    if (error) toast.error(errorMessage(error, "Failed to revoke session"));
    else {
      setMembers((list) => list.filter((m) => m.user_id !== member.user_id));
      setOverview((o) => (o ? { ...o, active_sessions: Math.max(0, o.active_sessions - 1) } : o));
      toast.success("Session revoked");
    }
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? members.filter((m) => m.student_name.toLowerCase().includes(q)) : members;
  }, [members, query]);

  const now = Date.now();

  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <AdminPageHeader
        title="Settings"
        description="Portal access and student sessions"
        action={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
        }
      />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { label: "Active student sessions", value: overview?.active_sessions ?? "—" },
            { label: "Failed sign-ins (24h)", value: overview?.failed_attempts_24h ?? "—" },
            {
              label: "Password last changed",
              value: overview ? timeAgo(overview.password_updated_at) : "—",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "…" : stat.value}</p>
            </div>
          ))}
        </div>

        {overview && overview.failed_attempts_24h >= 20 && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              There have been {overview.failed_attempts_24h} failed sign-in attempts in the last 24 hours. If you think the password is
              being guessed, change it below. Attempts are rate-limited per device and IP.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AdminFormSection
            title="Portal password"
            description="Students use this shared password to enter the portal. It is stored hashed, so it can't be displayed — only replaced."
            icon={KeyRound}
          >
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="newPw">New password</label>
                <div className="relative">
                  <input
                    id="newPw"
                    type={showNew ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={`At least ${MIN_LENGTH} characters`}
                    className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm pr-10 text-[#374151]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    aria-label={showNew ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex flex-1 gap-1">
                      {[0, 1, 2, 3].map((i) => (
                        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < score ? STRENGTH_COLORS[score] : "bg-slate-200"}`} />
                      ))}
                    </div>
                    <span className="text-xs text-slate-500">{STRENGTH_LABELS[score]}</span>
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="confirmPw">Confirm new password</label>
                <input
                  id="confirmPw"
                  type={showNew ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  aria-invalid={mismatch}
                  className="w-full px-3 py-2.5 border border-[#e5e7eb] rounded-xl text-sm text-[#374151]"
                />
                {mismatch && <p className="mt-1 text-xs text-red-600">Passwords don't match</p>}
              </div>
              <p className="text-xs text-slate-500">Changing the password signs every student out immediately.</p>
              <button
                type="submit"
                disabled={saving || newPassword.length < MIN_LENGTH || newPassword !== confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-semibold rounded-lg disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving…" : "Change password"}
              </button>
            </form>
          </AdminFormSection>

          <AdminFormSection
            title="Sessions"
            description={`Students stay signed in for ${overview?.session_days ?? 120} days on a device, or until the password changes.`}
            icon={LogOut}
          >
            <div className="space-y-4 text-sm text-slate-600">
              <p>
                Use this if the password leaked but you don't want to change it yet, or at the end of a semester to make everyone sign in
                again.
              </p>
              <button
                type="button"
                onClick={() => void revokeAll()}
                className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" /> Sign out all students
              </button>
            </div>
          </AdminFormSection>
        </div>

        <AdminPanel
          title="Signed-in students"
          icon={Users}
          count={members.length}
          actions={
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name…"
                aria-label="Search students"
                className="pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm w-48"
              />
            </div>
          }
        >
          {shown.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              {members.length ? "No students match your search." : "No students are signed in."}
            </p>
          ) : (
            <AdminTable label="Signed-in students">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5">Name</th>
                    <th className="px-5">Signed in</th>
                    <th className="px-5">Last seen</th>
                    <th className="px-5">Status</th>
                    <th className="px-5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((m) => {
                    const expired = new Date(m.expires_at).getTime() < now;
                    return (
                      <tr key={m.user_id} className="border-b border-slate-100">
                        <td className="px-5 font-medium">{m.student_name}</td>
                        <td className="px-5" title={new Date(m.created_at).toLocaleString()}>
                          {timeAgo(m.created_at)}
                        </td>
                        <td className="px-5" title={new Date(m.last_seen_at).toLocaleString()}>
                          {timeAgo(m.last_seen_at)}
                        </td>
                        <td className="px-5">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              expired ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {expired ? "Expired" : "Active"}
                          </span>
                        </td>
                        <td className="px-5 text-right">
                          <button
                            type="button"
                            onClick={() => void revokeOne(m)}
                            aria-label={`Sign out ${m.student_name}`}
                            className="text-red-500 hover:bg-red-50"
                          >
                            <LogOut className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </AdminTable>
          )}
        </AdminPanel>
      </div>
    </div>
  );
};

export default AdminSettings;
