import { Route, Routes } from "react-router-dom";

import { Navbar } from "./components/Navbar";
import { DashboardPage } from "./pages/DashboardPage";
import { DocumentDetailPage } from "./pages/DocumentDetailPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <Navbar />
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/documents/:id" element={<DocumentDetailPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </div>
  );
}
