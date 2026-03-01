import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AdminLayout from "./components/AdminLayout.jsx";
import DashboardPage from "./components/DashboardPage.jsx";
import LoginActivityPage from "./components/LoginActivityPage.jsx";
import LoginPage from "./components/LoginPage.jsx";
import {
  clearSession,
  hasAdminAccess,
  loginWithGoogle,
  loginWithPassword,
  persistSession,
  restoreSession,
  toSession,
} from "./services/authService.js";
import { isTokenExpired } from "./utils/token.js";

function RequireAuth({ session, children }) {
  if (!session?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  const [session, setSession] = useState(() => restoreSession());
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authMessage, setAuthMessage] = useState("");

  const logout = useCallback((message = "You have been logged out.") => {
    clearSession();
    setSession(null);
    setAuthError("");
    setAuthMessage(message);
  }, []);

  const applyLoginPayload = useCallback((payload) => {
    const nextSession = toSession(payload);

    if (!nextSession?.token || !nextSession?.user) {
      throw new Error(payload?.message || "Invalid credentials.");
    }

    if (!hasAdminAccess(nextSession.user)) {
      throw new Error("Forbidden (403): only admin users can access this dashboard.");
    }

    persistSession(nextSession);
    setSession(nextSession);
    setAuthError("");
    setAuthMessage("");
  }, []);

  const handlePasswordLogin = useCallback(
    async ({ identifier, password }) => {
      if (!identifier || !password) {
        setAuthError("Identifier and password are required.");
        return;
      }

      setAuthSubmitting(true);
      setAuthError("");
      setAuthMessage("");

      try {
        const payload = await loginWithPassword({
          identifier,
          password,
        });
        applyLoginPayload(payload);
      } catch (error) {
        clearSession();
        setSession(null);
        setAuthError(error?.message || "Unable to login. Please try again.");
      } finally {
        setAuthSubmitting(false);
      }
    },
    [applyLoginPayload]
  );

  const handleGoogleLogin = useCallback(
    async ({ idToken }) => {
      if (!idToken) {
        setAuthError("Google idToken is required.");
        return;
      }

      setAuthSubmitting(true);
      setAuthError("");
      setAuthMessage("");

      try {
        const payload = await loginWithGoogle({ idToken });
        applyLoginPayload(payload);
      } catch (error) {
        clearSession();
        setSession(null);
        setAuthError(error?.message || "Unable to login with Google token.");
      } finally {
        setAuthSubmitting(false);
      }
    },
    [applyLoginPayload]
  );

  const handleUnauthorized = useCallback(
    (message) => {
      logout(message || "Session expired. Please log in again.");
    },
    [logout]
  );

  useEffect(() => {
    if (!session?.token) return;

    if (!hasAdminAccess(session.user)) {
      logout("Forbidden (403): only admin users can access this dashboard.");
      return;
    }

    if (isTokenExpired(session.token, 10)) {
      logout("Session expired. Please log in again.");
      return;
    }

    const timer = setInterval(() => {
      if (isTokenExpired(session.token, 10)) {
        logout("Session expired. Please log in again.");
      }
    }, 60000);

    return () => clearInterval(timer);
  }, [session, logout]);

  return (
    <Routes>
      <Route
        path="/login"
        element={
          session?.token ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage
              onPasswordLogin={handlePasswordLogin}
              onGoogleLogin={handleGoogleLogin}
              isSubmitting={authSubmitting}
              errorMessage={authError}
              infoMessage={authMessage}
            />
          )
        }
      />

      <Route
        path="/dashboard"
        element={
          <RequireAuth session={session}>
            <AdminLayout user={session?.user} onLogout={() => logout("Signed out.")}>
              <DashboardPage token={session?.token} onUnauthorized={handleUnauthorized} />
            </AdminLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/login-activity"
        element={
          <RequireAuth session={session}>
            <AdminLayout user={session?.user} onLogout={() => logout("Signed out.")}>
              <LoginActivityPage token={session?.token} onUnauthorized={handleUnauthorized} />
            </AdminLayout>
          </RequireAuth>
        }
      />

      <Route
        path="/"
        element={<Navigate to={session?.token ? "/dashboard" : "/login"} replace />}
      />

      <Route
        path="*"
        element={<Navigate to={session?.token ? "/dashboard" : "/login"} replace />}
      />
    </Routes>
  );
}
