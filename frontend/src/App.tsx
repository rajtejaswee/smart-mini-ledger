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
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
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
