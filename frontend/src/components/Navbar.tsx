import { Link } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            SD
          </span>
          <span className="text-lg font-semibold text-slate-900">SmartDoc Analyzer</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <Link to="/" className="hover:text-brand-600">
            Documents
          </Link>
          {isAuthenticated ? (
            <button onClick={logout} className="hover:text-brand-600">
              Log out
            </button>
          ) : (
            <Link to="/login" className="hover:text-brand-600">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
