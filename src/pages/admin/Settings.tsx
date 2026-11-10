import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { AlertTriangle, Ban, Eye, EyeOff, KeyRound, LogOut, RefreshCw, Save, Search, ShieldAlert, ShieldOff, UserX, Users } from "lucide-react";
import { errorMessage, supabase } from "../../lib/supabase";
import { timeAgo } from "../../lib/format";
import { useAdminConfirm } from "../../components/AdminConfirm";
import { AdminFormSection, AdminPageHeader, AdminPanel, AdminTable } from "../../components/AdminUI";
import type { BlockIpResult, BlockNameResult, PortalOverview, Tables } from "../../types/supabase";

type Member = Tables<"portal_members">;
type BlockedIp = Tables<"blocked_ips">;
type BlockedName = Tables<"blocked_names">;

/** Same normalisation as public.name_key() in SQL. */
const nameKey = (name: string) => name.trim().replace(/\s+/g, " ").toLowerCase();

/**
 * Rough "keyboard mash" detector for names like "asbsdsd" or "xcvbn".
 * Only a hint for the admin — never used to block anyone automatically.
 */
const looksFake = (name: string) => {
  if (/\d/.test(name)) return true;
  const n = name.toLowerCase().replace(/[^a-z\s]/g, "");
  if (!n.trim()) return true;
  return n.split(/\s+/).filter(Boolean).some((w) =>
    (w.length >= 4 && !/[aeiouy]/.test(w)) ||   // no vowels: "sdfg" (but allows "Md", "Mst")
    /[^aeiouy]{5,}/.test(w) ||                  // long consonant run: "asbsdsd"
    /(.)\1\1/.test(w) ||                       // tripled letter: "aaab"
    /(..)\1\1/.test(w) ||                      // repeated pair: "sdsdsd"
    (w.length >= 5 && new Set(w).size <= 2),    // "ababa", "sdsss"
  );
};

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
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [blocked, setBlocked] = useState<BlockedIp[]>([]);
  const [manualIp, setManualIp] = useState("");
  const [manualReason, setManualReason] = useState("");
  const [blocking, setBlocking] = useState(false);
  const [blockedNames, setBlockedNames] = useState<BlockedName[]>([]);
  const [manualName, setManualName] = useState("");
  const [manualNameReason, setManualNameReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [overviewRes, membersRes, blockedRes, blockedNamesRes] = await Promise.all([
      supabase.rpc("portal_overview"),
      supabase.from("portal_members").select("*").order("last_seen_at", { ascending: false }).limit(500),
      supabase.from("blocked_ips").select("*").order("created_at", { ascending: false }),
      supabase.from("blocked_names").select("*").order("created_at", { ascending: false }),
    ]);
    if (overviewRes.error) {
      toast.error("Couldn't load portal settings. Has the security migration been applied?");
    } else {
      setOverview(overviewRes.data as PortalOverview);
    }
    // Fallback for students without a recorded IP: use the IP from their latest page visit.
    let memberList = membersRes.data ?? [];
    const missing = memberList.filter((m) => !m.ip_address).map((m) => m.user_id);
    if (missing.length) {
      const { data: visits } = await supabase
        .from("page_visits")
        .select("user_id, ip_address")
        .in("user_id", missing.slice(0, 200))
        .not("ip_address", "is", null)
        .order("created_at", { ascending: false })
        .limit(2000);
      const latest = new Map<string, string>();
      visits?.forEach((v) => v.user_id && v.ip_address && !latest.has(v.user_id) && latest.set(v.user_id, v.ip_address.toLowerCase()));
      memberList = memberList.map((m) => (m.ip_address ? m : { ...m, ip_address: latest.get(m.user_id) ?? null }));
    }
    setMembers(memberList);
    if (blockedRes.error) toast.error("Couldn't load blocked IPs. Has the IP blocking migration been applied?");
    else setBlocked(blockedRes.data ?? []);
    if (blockedNamesRes.error) toast.error("Couldn't load blocked names. Re-run the IP blocking migration.");
    else setBlockedNames(blockedNamesRes.data ?? []);
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

  // How many signed-in students share each IP (shared Wi-Fi / campus NAT).
  const ipCounts = useMemo(() => {
    const counts = new Map<string, number>();
    members.forEach((m) => m.ip_address && counts.set(m.ip_address, (counts.get(m.ip_address) ?? 0) + 1));
    return counts;
  }, [members]);

  const suspiciousCount = useMemo(() => members.filter((m) => looksFake(m.student_name)).length, [members]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter(
      (m) =>
        (!suspiciousOnly || looksFake(m.student_name)) &&
        (!q || m.student_name.toLowerCase().includes(q) || m.ip_address?.includes(q)),
    );
  }, [members, query, suspiciousOnly]);

  const blockIp = async (ip: string, reason: string | null, label: string) => {
    const others = members.filter((m) => m.ip_address === ip);
    const ok = await confirm({
      title: `Block ${ip}?`,
      message:
        (others.length > 1
          ? `${others.length} signed-in students share this IP (${others.map((m) => m.student_name).join(", ")}). ` +
            "They are probably on the same Wi-Fi or campus network, and ALL of them will be blocked. "
          : `${label} will be signed out. `) +
        "Nobody on this IP will be able to enter the portal until you unblock it.",
      confirmLabel: "Block IP",
    });
    if (!ok) return false;
    setBlocking(true);
    const { data, error } = await supabase.rpc("block_portal_ip", { p_ip: ip, p_reason: reason });
    setBlocking(false);
    if (error) {
      toast.error(errorMessage(error, "Failed to block IP"));
      return false;
    }
    const result = data as BlockIpResult;
    toast.success(`Blocked ${result.ip_address}${result.signed_out ? ` · ${result.signed_out} signed out` : ""}`);
    void load();
    return true;
  };

  const blockMember = (m: Member) => {
    if (!m.ip_address) {
      toast.error("No IP is known for this student yet. It is recorded on their next visit. You can sign them out meanwhile.");
      return;
    }
    void blockIp(m.ip_address, `Name used: ${m.student_name}`, m.student_name);
  };

  const blockManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const ip = manualIp.trim();
    if (!ip) return;
    if (await blockIp(ip, manualReason.trim() || null, "Anyone using it")) {
      setManualIp("");
      setManualReason("");
    }
  };

  const blockName = async (name: string, reason: string | null) => {
    const key = nameKey(name);
    if (!key) return false;
    const using = members.filter((m) => nameKey(m.student_name) === key).length;
    const ok = await confirm({
      title: `Block the name "${name.trim()}"?`,
      message:
        (using ? `${using} signed-in student${using > 1 ? "s" : ""} using this name will be signed out. ` : "") +
        "Nobody will be able to enter the portal with this name from any IP or device (capital letters and extra spaces are ignored).",
      confirmLabel: "Block name",
    });
    if (!ok) return false;
    setBlocking(true);
    const { data, error } = await supabase.rpc("block_portal_name", { p_name: name, p_reason: reason });
    setBlocking(false);
    if (error) {
      toast.error(errorMessage(error, "Failed to block name"));
      return false;
    }
    const result = data as BlockNameResult;
    toast.success(`Blocked "${name.trim()}"${result.signed_out ? ` · ${result.signed_out} signed out` : ""}`);
    void load();
    return true;
  };

  const blockNameManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await blockName(manualName, manualNameReason.trim() || null)) {
      setManualName("");
      setManualNameReason("");
    }
  };

  const unblockName = async (b: BlockedName) => {
    const ok = await confirm({
      title: `Unblock "${b.display_name}"?`,
      message: "Students will be able to sign in with this name again.",
      confirmLabel: "Unblock",
      tone: "primary",
    });
    if (!ok) return;
    const { error } = await supabase.from("blocked_names").delete().eq("name_key", b.name_key);
    if (error) toast.error(errorMessage(error, "Failed to unblock name"));
    else {
      setBlockedNames((list) => list.filter((x) => x.name_key !== b.name_key));
      toast.success(`Unblocked "${b.display_name}"`);
    }
  };

  const unblock = async (b: BlockedIp) => {
    const ok = await confirm({
      title: `Unblock ${b.ip_address}?`,
      message: "Students on this IP will be able to sign in to the portal again.",
      confirmLabel: "Unblock",
      tone: "primary",
    });
    if (!ok) return;
    const { error } = await supabase.from("blocked_ips").delete().eq("ip_address", b.ip_address);
    if (error) toast.error(errorMessage(error, "Failed to unblock IP"));
    else {
      setBlocked((list) => list.filter((x) => x.ip_address !== b.ip_address));
      toast.success(`Unblocked ${b.ip_address}`);
    }
  };

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
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSuspiciousOnly((v) => !v)}
                aria-pressed={suspiciousOnly}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                  suspiciousOnly ? "border-amber-300 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" /> Suspicious names ({suspiciousCount})
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search name or IP…"
                  aria-label="Search students"
                  className="pl-9 pr-3 py-2 border border-[#e5e7eb] rounded-xl text-sm w-48"
                />
              </div>
            </div>
          }
        >
          {shown.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-slate-500">
              {members.length ? "No students match your filters." : "No students are signed in."}
            </p>
          ) : (
            <AdminTable label="Signed-in students">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5">Name</th>
                    <th className="px-5">IP address</th>
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
                        <td className="px-5 font-medium">
                          <span className="inline-flex items-center gap-2">
                            {m.student_name}
                            {looksFake(m.student_name) && (
                              <span
                                className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700"
                                title="This name looks like random typing"
                              >
                                Suspicious
                              </span>
                            )}
                          </span>
                        </td>
                        <td className="px-5">
                          {m.ip_address ? (
                            <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-600">
                              {m.ip_address}
                              {(ipCounts.get(m.ip_address) ?? 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => setQuery(m.ip_address ?? "")}
                                  className="rounded-full bg-slate-100 px-2 py-0.5 font-sans text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                                  title="Students sharing this IP (same network). Click to show them."
                                >
                                  shared ×{ipCounts.get(m.ip_address)}
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400" title="Recorded on their next visit">—</span>
                          )}
                        </td>
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
                        <td className="px-5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            disabled={blocking}
                            onClick={() => void blockName(m.student_name, "Blocked from signed-in list")}
                            aria-label={`Block the name ${m.student_name}`}
                            title="Block this name (from any IP)"
                            className="text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <UserX className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            disabled={blocking}
                            onClick={() => blockMember(m)}
                            aria-label={`Block IP of ${m.student_name}`}
                            title="Block this student's IP"
                            className="text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void revokeOne(m)}
                            aria-label={`Sign out ${m.student_name}`}
                            title="Sign out"
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

        <AdminPanel title="Blocked names" icon={UserX} count={blockedNames.length}>
          <form onSubmit={blockNameManual} className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <input
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              maxLength={60}
              placeholder="Name, e.g. asdfg"
              aria-label="Name to block"
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm sm:w-60"
            />
            <input
              value={manualNameReason}
              onChange={(e) => setManualNameReason(e.target.value)}
              maxLength={200}
              placeholder="Reason (optional)"
              aria-label="Reason for blocking name"
              className="w-full flex-1 px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={blocking || !manualName.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <UserX className="h-4 w-4" /> Block name
            </button>
          </form>
          {blockedNames.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No names are blocked.</p>
          ) : (
            <AdminTable label="Blocked names">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5">Name</th>
                    <th className="px-5">Reason</th>
                    <th className="px-5">Blocked</th>
                    <th className="px-5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {blockedNames.map((b) => (
                    <tr key={b.name_key} className="border-b border-slate-100">
                      <td className="px-5 font-medium">{b.display_name}</td>
                      <td className="px-5 text-slate-600">{b.reason ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-5" title={new Date(b.created_at).toLocaleString()}>
                        {timeAgo(b.created_at)}
                      </td>
                      <td className="px-5 text-right">
                        <button
                          type="button"
                          onClick={() => void unblockName(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          <ShieldOff className="h-3.5 w-3.5" /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AdminTable>
          )}
        </AdminPanel>

        <AdminPanel title="Blocked IP addresses" icon={Ban} count={blocked.length}>
          <form onSubmit={blockManual} className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            <input
              value={manualIp}
              onChange={(e) => setManualIp(e.target.value)}
              placeholder="IP address, e.g. 103.84.12.7"
              aria-label="IP address to block"
              className="w-full px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm font-mono sm:w-60"
            />
            <input
              value={manualReason}
              onChange={(e) => setManualReason(e.target.value)}
              maxLength={200}
              placeholder="Reason (optional)"
              aria-label="Reason"
              className="w-full flex-1 px-3 py-2 border border-[#e5e7eb] rounded-xl text-sm"
            />
            <button
              type="submit"
              disabled={blocking || !manualIp.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" /> Block IP
            </button>
          </form>
          {blocked.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-slate-500">No IP addresses are blocked.</p>
          ) : (
            <AdminTable label="Blocked IP addresses">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-5">IP address</th>
                    <th className="px-5">Names seen</th>
                    <th className="px-5">Reason</th>
                    <th className="px-5">Blocked</th>
                    <th className="px-5 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {blocked.map((b) => (
                    <tr key={b.ip_address} className="border-b border-slate-100">
                      <td className="px-5 font-mono text-xs">{b.ip_address}</td>
                      <td className="px-5">{b.student_name ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-5 text-slate-600">{b.reason ?? <span className="text-slate-400">—</span>}</td>
                      <td className="px-5" title={new Date(b.created_at).toLocaleString()}>
                        {timeAgo(b.created_at)}
                      </td>
                      <td className="px-5 text-right">
                        <button
                          type="button"
                          onClick={() => void unblock(b)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          <ShieldOff className="h-3.5 w-3.5" /> Unblock
                        </button>
                      </td>
                    </tr>
                  ))}
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
