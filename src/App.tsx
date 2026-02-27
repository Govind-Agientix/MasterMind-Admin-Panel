import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import VideoManagement from "./pages/VideoManagement";
import QuestionManagement from "./pages/QuestionManagement";
import RoleManagement from "./pages/RoleManagement";
import ManagerDashboard from "./pages/ManagerDashboard";
import LearnerReport from "./pages/LearnerReport";
import { Toaster } from "sonner";

const App = () => (
  <BrowserRouter>
    <Toaster position="top-right" richColors />
    <Routes>
      <Route
        path="/login"
        element={
          <ProtectedRoute requireAuth={false}>
            <Login />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <UserManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/videos"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <VideoManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/questions"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <QuestionManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/roles"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <RoleManagement />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ManagerDashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/learners/:learnerId"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <LearnerReport />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);

export default App;
