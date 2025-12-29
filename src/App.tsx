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
import { ExportedMoonshotsProvider } from "./context/ExportedMoonshotContext";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ToastProvider>
          <ExportedMoonshotsProvider>
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
          </ExportedMoonshotsProvider>
        </ToastProvider>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
