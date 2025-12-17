import { BrowserRouter as Router, Routes, Route } from "react-router";
import Navbar from "./components/layout/Navbar";
import Home from "./pages/Home";
import CreateMoonshot from "./pages/CreateMoonshot";
import Explore from "./pages/Explore";
import Query from "./pages/Query";
import Dashboard from "./pages/Dashboard";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import MoonshotCreatorPage from "./pages/MoonshotCreatorPage";
import CreateAngorProject from "./pages/CreateAngorProject";

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Router>
          <div className="min-h-screen bg-blackish">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateMoonshot />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/moonshot/:id" element={<Query />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboard/:id" element={<MoonshotCreatorPage />} />
              <Route path="/create-angor-project" element={<CreateAngorProject />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
