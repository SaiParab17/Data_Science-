// DataWatch — Main App Router
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import Datasets from "./pages/Datasets";
import DatasetWorkspace from "./pages/DatasetWorkspace";
import Upload from "./pages/Upload";
import Alerts from "./pages/Alerts";
import Pipelines from "./pages/Pipelines";
import History from "./pages/History";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing page — no AppShell (has its own header) */}
        <Route path="/" element={<Landing />} />

        {/* App routes — wrapped in AppShell (sidebar + header) */}
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/datasets" element={<Datasets />} />
          <Route path="/datasets/:id" element={<DatasetWorkspace />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/pipelines" element={<Pipelines />} />
          <Route path="/history" element={<History />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
