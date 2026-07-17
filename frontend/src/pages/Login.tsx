import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiError, isValidEmail } from "@/lib/api";
import { AuthShell } from "@/components/AuthShell";
import { Field } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/ErrorBanner";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  // One-click entry for reviewers — logs into the seeded public demo account.
  async function loginAsDemo() {
    setError("");
    setEmailError("");
    setDemoLoading(true);
    try {
      await login("demo@ledger.app", "demo1234");
      navigate("/");
    } catch (err) {
      setError(apiError(err, "Demo account unavailable right now"));
    } finally {
      setDemoLoading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setEmailError("");
    // The form is noValidate (we own the UX), so check the email here instead of
    // round-tripping to the server for a generic "Validation failed".
    if (!isValidEmail(email)) {
      setEmailError("Enter a valid email address");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(apiError(err, "Could not sign in"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your ledger"
      footer={
        <>
          Don&rsquo;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <ErrorBanner message={error} />}
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          icon={<Mail className="size-4" />}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setEmailError("");
          }}
          error={emailError || undefined}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock className="size-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" size="lg" loading={loading} className="mt-2 w-full">
          Sign in
        </Button>

        {/* Reviewer fast-path: one click into the seeded demo account */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="h-px flex-1 bg-line" />
          just looking around?
          <span className="h-px flex-1 bg-line" />
        </div>
        <Button
          type="button"
          variant="secondary"
          loading={demoLoading}
          onClick={loginAsDemo}
          className="w-full"
        >
          <Sparkles className="size-4 text-primary" />
          Explore the demo account
        </Button>
        <p className="tnum -mt-2 text-center text-xs text-muted/70">
          demo@ledger.app · demo1234 — 2 months of data, ready to poke at
        </p>
      </form>
    </AuthShell>
  );
}
