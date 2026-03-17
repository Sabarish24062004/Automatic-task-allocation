import { Routes, Route } from "react-router-dom";
import ModuleSelection from "./pages/ModuleSelection";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import MarketingDashboard from "./pages/MarketingDashboard";
import WritingDashboard from "./pages/WritingDashboard";
import SubmissionDashboard from "./pages/SubmissionDashboard";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ModuleSelection />} />
      <Route path="/login/:role" element={<Login />} />

      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/marketing" element={<MarketingDashboard />} />
      <Route path="/writing" element={<WritingDashboard />} />
      <Route path="/submission" element={<SubmissionDashboard />} />
    </Routes>
  );
}

export default App;