import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link to="/" className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-sm shadow-brand-600/20">
            SD
          </span>
          <span className="truncate text-base font-semibold text-slate-950 sm:text-lg">
            SmartDoc Analyzer
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm font-medium text-slate-600">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `rounded-lg px-3 py-2 transition ${
                isActive ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50 hover:text-brand-700"
              }`
            }
          >
            Documents
          </NavLink>
          {isAuthenticated ? (
            <button
              onClick={logout}
              className="rounded-lg px-3 py-2 transition hover:bg-slate-50 hover:text-brand-700"
            >
              Log out
            </button>
          ) : (
            <NavLink
              to="/login"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 transition ${
                  isActive ? "bg-slate-100 text-slate-950" : "hover:bg-slate-50 hover:text-brand-700"
                }`
              }
            >
              Log in
            </NavLink>
          )}
        </nav>
      </div>
    </header>
  );
}
