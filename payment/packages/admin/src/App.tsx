import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layouts";
import { LoginPage } from "./pages/Login";
import { StudentListPage } from "./pages/Students";
import { useAuthStore } from "./stores/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AdminLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
