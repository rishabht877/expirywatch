import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import AssetsPage from "./pages/AssetsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RenewalsPage from "./pages/RenewalsPage.jsx";

function App() {
  const { loadError } = useAuth();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <NavBar />
      <main id="main" className="app-main" tabIndex={-1}>
        {loadError && (
          <p className="alert alert-error" role="alert">
            {loadError}
          </p>
        )}
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/assets" element={<AssetsPage />} />
            <Route path="/renewals" element={<RenewalsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </>
  );
}

App.propTypes = {};

export default App;
