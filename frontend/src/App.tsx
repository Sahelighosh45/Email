// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Compose from "./pages/Compose";
import EmailDetail from "./pages/EmailDetail";

import Protected from "./components/Protected";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <Protected>
                <Dashboard />
              </Protected>
            }
          />

          <Route
            path="/compose"
            element={
              <Protected>
                <Compose />
              </Protected>
            }
          />

          <Route
            path="/email/:id"
            element={
              <Protected>
                <EmailDetail />
              </Protected>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
