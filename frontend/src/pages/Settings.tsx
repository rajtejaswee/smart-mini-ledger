import { useState } from "react";
import type { FormEvent } from "react";
import { LogOut, User as UserIcon, Lock, IndianRupee } from "lucide-react";
import { AppLayout } from "@/components/AppLayout";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { ErrorBanner } from "@/components/ui/ErrorBanner";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api, apiError } from "@/lib/api";
import type { User } from "@/lib/types";
import { formatDateLong } from "@/lib/format";

export default function Settings() {
  const { user, logout } = useAuth();

  return (
    <AppLayout>
      <div className="mb-6 animate-rise">
        <h1 className="text-2xl font-bold tracking-tight text-ink">Settings</h1>
        <p className="text-sm text-muted">Your profile and account</p>
      </div>

      <div className="stagger grid max-w-2xl grid-cols-1 gap-5">
        <ProfileCard />
        <NotificationsCard />
        <PasswordCard />

        <Card>
          <p className="eyebrow">Account</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-ink">{user?.email}</p>
              {user?.createdAt && (
                <p className="text-xs text-muted">
                  Member since {formatDateLong(user.createdAt)}
                </p>
              )}
            </div>
            <Button variant="secondary" onClick={logout}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}

function ProfileCard() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();

  const [name, setName] = useState(user?.name ?? "");
  const [income, setIncome] = useState(
    user?.monthlyIncome != null ? String(user.monthlyIncome) : ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const trimmed = name.trim();
  // Empty input means "no figure on file" → send null to clear it.
  const parsedIncome = income.trim() === "" ? null : Number(income);
  const incomeInvalid = parsedIncome != null && (!Number.isFinite(parsedIncome) || parsedIncome < 0);

  const dirty =
    trimmed !== (user?.name ?? "") || parsedIncome !== (user?.monthlyIncome ?? null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!trimmed) return setError("Name is required");
    if (incomeInvalid) return setError("Monthly income must be a number of 0 or more");

    setSaving(true);
    try {
      const res = await api.patch<{ user: User }>("/auth/me", {
        name: trimmed,
        monthlyIncome: parsedIncome,
      });
      updateUser(res.data.user);
      show({ title: "Profile updated" });
    } catch (err) {
      setError(apiError(err, "Could not save your profile"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="eyebrow">Profile</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="Name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<UserIcon className="size-4" />}
          maxLength={80}
          autoComplete="name"
        />

        <div>
          <Field
            label="Monthly income"
            name="monthlyIncome"
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="Optional"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            icon={<IndianRupee className="size-4" />}
          />
          <p className="mt-1.5 text-xs text-muted">
            Used to sharpen your burn-rate projection. Leave blank to skip.
          </p>
        </div>

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!dirty}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function NotificationsCard() {
  const { user, updateUser } = useAuth();
  const { show } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Toggles save on flip (no Save button); on failure we roll the switch back.
  async function onChange(next: boolean) {
    setError("");
    setSaving(true);
    try {
      const res = await api.patch<{ user: User }>("/auth/me", { emailAlerts: next });
      updateUser(res.data.user);
      show({ title: next ? "High-spend alerts on" : "High-spend alerts off" });
    } catch (err) {
      setError(apiError(err, "Could not update your alert preference"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <p className="eyebrow">Notifications</p>
      <div className="mt-4 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}
        <Toggle
          checked={user?.emailAlerts ?? true}
          onChange={onChange}
          disabled={saving}
          label="High-spend email alerts"
          description="Email me when an expense is unusually large for its category."
        />
      </div>
    </Card>
  );
}

function PasswordCard() {
  const { show } = useToast();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 8) return setError("New password must be at least 8 characters");
    if (newPassword !== confirm) return setError("New passwords do not match");

    setSaving(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
      show({ title: "Password changed", description: "Use it next time you sign in." });
    } catch (err) {
      setError(apiError(err, "Could not change your password"));
    } finally {
      setSaving(false);
    }
  }

  const filled = currentPassword && newPassword && confirm;

  return (
    <Card>
      <p className="eyebrow">Password</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-4">
        {error && <ErrorBanner message={error} />}

        <Field
          label="Current password"
          name="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          icon={<Lock className="size-4" />}
          autoComplete="current-password"
        />
        <Field
          label="New password"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          icon={<Lock className="size-4" />}
          autoComplete="new-password"
        />
        <Field
          label="Confirm new password"
          name="confirmPassword"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          icon={<Lock className="size-4" />}
          autoComplete="new-password"
        />

        <div className="flex justify-end">
          <Button type="submit" loading={saving} disabled={!filled}>
            Change password
          </Button>
        </div>
      </form>
    </Card>
  );
}
