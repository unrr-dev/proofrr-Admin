import { NavLink } from "react-router-dom";

const navLinks = [
  { to: "/dashboard", label: "Overview" },
  { to: "/login-activity", label: "Login Activity" },
];

export default function AdminLayout({ user, onLogout, children }) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Admin";
  const accessRoleLabel = user?.accessRole || "admin";

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Proofrr Admin</p>
          <h1 className="topbar-title">Dashboard</h1>
        </div>

        <div className="topbar-actions">
          <div className="user-chip" title={user?.email || ""}>
            <span className="user-name">{fullName}</span>
            <span className="user-role">{String(accessRoleLabel).toLowerCase()}</span>
          </div>
          <button type="button" className="btn btn-secondary" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      <nav className="main-nav" aria-label="Main">
        {navLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `nav-link ${isActive ? "nav-link-active" : ""}`.trim()
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <section className="content-shell">{children}</section>
    </div>
  );
}
