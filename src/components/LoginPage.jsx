import { useState } from "react";

export default function LoginPage({
  onPasswordLogin,
  onGoogleLogin,
  isSubmitting,
  errorMessage,
  infoMessage,
}) {
  const [mode, setMode] = useState("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [idToken, setIdToken] = useState("");

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    await onPasswordLogin({
      identifier: identifier.trim(),
      password,
    });
  };

  const handleGoogleSubmit = async (event) => {
    event.preventDefault();
    await onGoogleLogin({
      idToken: idToken.trim(),
    });
  };

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <p className="eyebrow">Proofrr Admin</p>
        <h1>Sign in to admin dashboard</h1>
        <p className="muted">
          Access is restricted to users with <strong>accessRole: admin</strong>.
        </p>

        <div className="auth-mode-switch" role="tablist" aria-label="Auth mode">
          <button
            type="button"
            className={`tab-button ${mode === "password" ? "is-active" : ""}`}
            onClick={() => setMode("password")}
            disabled={isSubmitting}
          >
            Password Login
          </button>
          <button
            type="button"
            className={`tab-button ${mode === "google" ? "is-active" : ""}`}
            onClick={() => setMode("google")}
            disabled={isSubmitting}
          >
            Google Token
          </button>
        </div>

        {mode === "password" ? (
          <form className="auth-form" onSubmit={handlePasswordSubmit}>
            <label>
              Identifier (email)
              <input
                className="input"
                type="email"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="user@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label>
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                required
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleGoogleSubmit}>
            <label>
              Google `idToken`
              <textarea
                className="input textarea"
                value={idToken}
                onChange={(event) => setIdToken(event.target.value)}
                placeholder="Paste Google ID token"
                required
                rows={4}
              />
            </label>

            <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Login with Google token"}
            </button>
          </form>
        )}

        {infoMessage ? <p className="info-banner">{infoMessage}</p> : null}
        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}
      </section>
    </main>
  );
}
