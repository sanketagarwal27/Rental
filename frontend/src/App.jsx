import Home from "./pages/Home";
import { Routes, Route } from "react-router-dom";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import { ProtectedRoute, PublicRoute } from "./components/RouteGuards";
function App() {
  return (
    <>
      <Routes>
        {/* Public: redirect to /home if already logged in */}
        <Route
          path="/"
          element={
            <PublicRoute>
              <Home />
            </PublicRoute>
          }
        />

        {/* Always public */}
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected: redirect to / if not logged in */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
