import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { FullScreenLoader } from "@/components/FullScreenLoader";

// Route-level code splitting: each page loads on demand, so heavyweight deps
// (recharts lives only in Dashboard) stay out of the entry chunk.
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const Timeline = lazy(() => import("@/pages/Timeline"));
const CalendarPage = lazy(() => import("@/pages/Calendar"));
const Settings = lazy(() => import("@/pages/Settings"));

function Protected({ children }: { children: ReactNode }) {
  const { user, loading, bootFailed, retryBoot } = useAuth();
  if (loading) return <FullScreenLoader />;
  // Session restore failed on a network error (not a rejected token): the user is
  // still logged in — offer a retry instead of dumping them on /login.
  if (!user && bootFailed) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas px-4 text-center">
        <div>
          <p className="text-sm font-medium text-ink">Can&rsquo;t reach the server</p>
          <p className="mt-1 text-sm text-muted">Check your connection and try again.</p>
          <button
            type="button"
            onClick={retryBoot}
            className="mt-4 rounded-btn bg-white/5 px-4 py-2 text-sm font-semibold text-ink border border-line hover:bg-white/10"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicOnly>
              <Signup />
            </PublicOnly>
          }
        />
        <Route
          path="/"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />
        <Route
          path="/timeline"
          element={
            <Protected>
              <Timeline />
            </Protected>
          }
        />
        <Route
          path="/calendar"
          element={
            <Protected>
              <CalendarPage />
            </Protected>
          }
        />
        <Route
          path="/settings"
          element={
            <Protected>
              <Settings />
            </Protected>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
