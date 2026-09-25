import { Navigate, Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { usesBackend } from "./lib/mode";
import { BrowserHomePage } from "./pages/BrowserHomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { LoginPage } from "./pages/LoginPage";
import { ResultsPage } from "./pages/ResultsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <Navbar />
      <Routes>
        <Route path="/" element={usesBackend ? <DashboardPage /> : <BrowserHomePage />} />
        <Route path="/results" element={<ResultsPage />} />
        {usesBackend && (
          <>
            <Route path="/documents/:id" element={<DocumentDetailPage />} />
            <Route path="/login" element={<LoginPage />} />
          </>
        )}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
