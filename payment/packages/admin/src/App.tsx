import { Routes, Route, Navigate } from "react-router-dom";
import { AdminLayout } from "./layouts";
import { UserLayout } from "./layouts/UserLayout";
import { LoginPage } from "./pages/Login";
import { useAuthStore } from "./stores/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RoleLayout() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === "student" || user?.role === "parent") {
    return <UserLayout />;
  }
  return <AdminLayout />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <RoleLayout />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
